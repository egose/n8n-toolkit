import { afterEach, describe, expect, it, vi } from 'vitest';

import { signPayload } from '../src/shared/auth';
import { sendSyncEvent, SyncSendError } from '../src/shared/http';
import type { Logger } from '../src/shared/logger';
import type { SyncEvent } from '../src/shared/types';

const event: SyncEvent = {
  type: 'workflow.delete',
  at: '2026-01-01T00:00:00.000Z',
  sourceId: 'test',
  eventId: 'test:1',
  entityRevision: '1',
  workflowId: 'wf-1',
};

const hmacAuth = (secret: string) => ({ mode: 'hmac', secret }) as const;
const tokenAuth = (token: string) => ({ mode: 'token', token }) as const;

function jsonResponse(status: number): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(),
    body: null,
  } as Response;
}

function headersOf(fetchImpl: ReturnType<typeof vi.fn>, call: number): Record<string, string> {
  return fetchImpl.mock.calls[call][1].headers as Record<string, string>;
}

function responseWithHeaders(status: number, headers: Record<string, string>): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(headers),
    body: null,
  } as Response;
}

function responseWithBody(
  status: number,
  chunks: number[],
  options: { throwOnRead?: boolean } = {},
): {
  response: Response;
  reader: {
    read: ReturnType<typeof vi.fn>;
    cancel: ReturnType<typeof vi.fn>;
    releaseLock: ReturnType<typeof vi.fn>;
  };
} {
  let index = 0;
  const cancel = vi.fn().mockResolvedValue(undefined);
  const read = vi.fn().mockImplementation(async () => {
    if (options.throwOnRead) {
      throw new Error('stream failed');
    }

    const size = chunks[index++];
    if (size === undefined) {
      return { done: true, value: undefined };
    }

    return { done: false, value: new Uint8Array(size) };
  });
  const releaseLock = vi.fn();
  const reader = { read, cancel, releaseLock };

  return {
    response: {
      ok: false,
      status,
      headers: new Headers(),
      body: {
        getReader: () => reader,
      } as unknown as Response['body'],
    } as Response,
    reader,
  };
}

afterEach(() => {
  vi.useRealTimers();
});

describe('sendSyncEvent', () => {
  it('POSTs the event with hmac signature headers by default', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(200));
    const nowMs = vi.fn().mockReturnValue(1_800_000_000_000);

    await sendSyncEvent(event, {
      url: 'https://sub.example.com/rest/sync/v1/events',
      auth: hmacAuth('secret'),
      fetchImpl,
      nowMs,
    });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://sub.example.com/rest/sync/v1/events');
    expect(init.method).toBe('POST');

    const headers = headersOf(fetchImpl, 0);
    expect(headers['x-sync-timestamp']).toBe('1800000000000');
    expect(headers['x-sync-signature']).toBe(signPayload('secret', '1800000000000', JSON.stringify(event)));
    expect(headers).not.toHaveProperty('x-sync-token');
    expect(JSON.parse(init.body as string)).toEqual(event);
  });

  it('sends the static bearer token in token mode', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(200));

    await sendSyncEvent(event, { url: 'u', auth: tokenAuth('secret'), fetchImpl });

    const headers = headersOf(fetchImpl, 0);
    expect(headers['x-sync-token']).toBe('secret');
    expect(headers).not.toHaveProperty('x-sync-signature');
    expect(headers).not.toHaveProperty('x-sync-timestamp');
  });

  it('re-signs with a fresh timestamp on every attempt', async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(jsonResponse(500)).mockResolvedValue(jsonResponse(200));
    const sleep = vi.fn().mockResolvedValue(undefined);
    const nowMs = vi.fn().mockReturnValueOnce(1000).mockReturnValue(2000);

    await sendSyncEvent(event, { url: 'u', auth: hmacAuth('secret'), fetchImpl, sleep, nowMs });

    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(headersOf(fetchImpl, 0)['x-sync-timestamp']).toBe('1000');
    expect(headersOf(fetchImpl, 1)['x-sync-timestamp']).toBe('2000');
    expect(headersOf(fetchImpl, 1)['x-sync-signature']).toBe(signPayload('secret', '2000', JSON.stringify(event)));
  });

  it('retries only the documented retryable HTTP statuses', async () => {
    for (const status of [408, 429, 500, 502, 503, 504]) {
      const fetchImpl = vi.fn().mockResolvedValueOnce(jsonResponse(status)).mockResolvedValue(jsonResponse(200));
      const sleep = vi.fn().mockResolvedValue(undefined);

      await sendSyncEvent(event, { url: 'u', auth: hmacAuth('t'), fetchImpl, sleep, random: () => 0, maxAttempts: 2 });

      expect(fetchImpl).toHaveBeenCalledTimes(2);
      expect(sleep).toHaveBeenCalledTimes(1);
      expect(sleep).toHaveBeenCalledWith(1000);
    }
  });

  it('adds bounded jitter to exponential backoff', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(500))
      .mockResolvedValueOnce(jsonResponse(503))
      .mockResolvedValue(jsonResponse(200));
    const sleep = vi.fn().mockResolvedValue(undefined);

    await sendSyncEvent(event, { url: 'u', auth: hmacAuth('t'), fetchImpl, sleep, random: () => 1 });

    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenNthCalledWith(1, 1250);
    expect(sleep).toHaveBeenNthCalledWith(2, 2500);
  });

  it('caps exponential backoff at 10 seconds', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(500))
      .mockResolvedValueOnce(jsonResponse(500))
      .mockResolvedValueOnce(jsonResponse(500))
      .mockResolvedValueOnce(jsonResponse(500))
      .mockResolvedValueOnce(jsonResponse(500))
      .mockResolvedValue(jsonResponse(200));
    const sleep = vi.fn().mockResolvedValue(undefined);

    await sendSyncEvent(event, { url: 'u', auth: hmacAuth('t'), fetchImpl, sleep, random: () => 0, maxAttempts: 6 });

    expect(sleep.mock.calls.map(([delay]) => delay)).toEqual([1000, 2000, 4000, 8000, 10_000]);
  });

  it.each([401, 404, 501])('throws immediately on non-retryable status %s', async (status) => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(status));
    const sleep = vi.fn().mockResolvedValue(undefined);

    await expect(sendSyncEvent(event, { url: 'u', auth: hmacAuth('t'), fetchImpl, sleep })).rejects.toThrow(
      SyncSendError,
    );
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it('retries network errors and throws after exhausting attempts', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));
    const sleep = vi.fn().mockResolvedValue(undefined);

    await expect(
      sendSyncEvent(event, { url: 'u', auth: hmacAuth('t'), fetchImpl, sleep, maxAttempts: 3, random: () => 0 }),
    ).rejects.toThrow('ECONNREFUSED');
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenCalledTimes(2);
  });

  it('throws a SyncSendError when retryable statuses persist', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(429));
    const sleep = vi.fn().mockResolvedValue(undefined);

    const promise = sendSyncEvent(event, { url: 'u', auth: hmacAuth('t'), fetchImpl, sleep, maxAttempts: 2 });
    await expect(promise).rejects.toMatchObject({ name: 'SyncSendError', status: 429 });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('honors bounded Retry-After for 429 and 503 responses', async () => {
    for (const status of [429, 503]) {
      const fetchImpl = vi
        .fn()
        .mockResolvedValueOnce(responseWithHeaders(status, { 'retry-after': '12' }))
        .mockResolvedValue(jsonResponse(200));
      const sleep = vi.fn().mockResolvedValue(undefined);

      await sendSyncEvent(event, { url: 'u', auth: hmacAuth('t'), fetchImpl, sleep, random: () => 0, maxAttempts: 2 });

      expect(sleep).toHaveBeenCalledWith(10_000);
    }
  });

  it('honors http-date Retry-After values', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(responseWithHeaders(503, { 'retry-after': 'Wed, 01 Jan 2026 00:00:02 GMT' }))
      .mockResolvedValue(jsonResponse(200));
    const sleep = vi.fn().mockResolvedValue(undefined);

    await sendSyncEvent(event, {
      url: 'u',
      auth: hmacAuth('t'),
      fetchImpl,
      sleep,
      nowMs: () => Date.parse('Wed, 01 Jan 2026 00:00:00 GMT'),
      maxAttempts: 2,
    });

    expect(sleep).toHaveBeenCalledWith(2000);
  });

  it('falls back to jittered backoff when Retry-After is invalid', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(responseWithHeaders(503, { 'retry-after': 'not-a-date' }))
      .mockResolvedValue(jsonResponse(200));
    const sleep = vi.fn().mockResolvedValue(undefined);

    await sendSyncEvent(event, { url: 'u', auth: hmacAuth('t'), fetchImpl, sleep, random: () => 1, maxAttempts: 2 });

    expect(sleep).toHaveBeenCalledWith(1250);
  });

  it('drains small failed response bodies before retrying', async () => {
    const { response, reader } = responseWithBody(500, [1024, 2048]);
    const fetchImpl = vi.fn().mockResolvedValueOnce(response).mockResolvedValue(jsonResponse(200));
    const sleep = vi.fn().mockResolvedValue(undefined);

    await sendSyncEvent(event, { url: 'u', auth: hmacAuth('t'), fetchImpl, sleep, maxAttempts: 2, random: () => 0 });

    expect(reader.cancel).not.toHaveBeenCalled();
    expect(reader.releaseLock).toHaveBeenCalled();
  });

  it('cancels oversized failed response bodies before retrying', async () => {
    const { response, reader } = responseWithBody(500, [48 * 1024, 32 * 1024]);
    const fetchImpl = vi.fn().mockResolvedValueOnce(response).mockResolvedValue(jsonResponse(200));
    const sleep = vi.fn().mockResolvedValue(undefined);

    await sendSyncEvent(event, { url: 'u', auth: hmacAuth('t'), fetchImpl, sleep, maxAttempts: 2, random: () => 0 });

    expect(reader.cancel).toHaveBeenCalledTimes(1);
    expect(reader.releaseLock).toHaveBeenCalled();
  });

  it('cancels failed response bodies when draining throws', async () => {
    const { response, reader } = responseWithBody(500, [], { throwOnRead: true });
    const fetchImpl = vi.fn().mockResolvedValueOnce(response).mockResolvedValue(jsonResponse(200));
    const sleep = vi.fn().mockResolvedValue(undefined);

    await sendSyncEvent(event, { url: 'u', auth: hmacAuth('t'), fetchImpl, sleep, maxAttempts: 2, random: () => 0 });

    expect(reader.cancel).toHaveBeenCalledTimes(1);
  });

  it('aborts timed out attempts and clears the timeout timer', async () => {
    vi.useFakeTimers();

    const fetchImpl = vi.fn().mockImplementation(((_url: string, init?: RequestInit) => {
      const signal = init?.signal as AbortSignal;
      return new Promise<Response>((_resolve, reject) => {
        signal.addEventListener('abort', () => {
          const error = new Error('Request timed out');
          (error as Error & { name: string }).name = 'AbortError';
          reject(error);
        });
      });
    }) as typeof fetch);

    const promise = sendSyncEvent(event, {
      url: 'u',
      auth: hmacAuth('t'),
      fetchImpl,
      timeoutMs: 50,
      maxAttempts: 1,
    });
    const rejection = expect(promise).rejects.toMatchObject({ name: 'AbortError' });

    await vi.advanceTimersByTimeAsync(50);
    await rejection;
    expect(vi.getTimerCount()).toBe(0);
  });

  it('does not log the secret or event body on failure', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));
    const warn = vi.fn();
    const log = { warn } as unknown as Logger;

    await expect(
      sendSyncEvent(event, {
        url: 'u',
        auth: hmacAuth('super-secret'),
        fetchImpl,
        log,
        maxAttempts: 1,
      }),
    ).rejects.toThrow('ECONNREFUSED');

    expect(warn).toHaveBeenCalledWith('Failed to deliver sync event', {
      type: event.type,
      attempt: 1,
      error: 'ECONNREFUSED',
    });
  });
});
