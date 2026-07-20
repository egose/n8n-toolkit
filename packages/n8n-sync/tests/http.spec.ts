import { describe, expect, it, vi } from 'vitest';

import { sendSyncEvent, SyncSendError } from '../src/shared/http';
import type { SyncEvent } from '../src/shared/types';

const event: SyncEvent = {
  type: 'workflow.delete',
  at: '2026-01-01T00:00:00.000Z',
  sourceId: 'test',
  workflowId: 'wf-1',
};

function jsonResponse(status: number): Response {
  return { ok: status >= 200 && status < 300, status } as Response;
}

describe('sendSyncEvent', () => {
  it('POSTs the event with the shared-secret header', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(200));

    await sendSyncEvent(event, { url: 'https://sub.example.com/rest/sync/v1/events', token: 'secret', fetchImpl });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://sub.example.com/rest/sync/v1/events');
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>)['x-sync-token']).toBe('secret');
    expect(JSON.parse(init.body as string)).toEqual(event);
  });

  it('retries retryable statuses with exponential backoff', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(500))
      .mockResolvedValueOnce(jsonResponse(503))
      .mockResolvedValue(jsonResponse(200));
    const sleep = vi.fn().mockResolvedValue(undefined);

    await sendSyncEvent(event, { url: 'u', token: 't', fetchImpl, sleep });

    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenNthCalledWith(1, 1000);
    expect(sleep).toHaveBeenNthCalledWith(2, 2000);
  });

  it('throws immediately on non-retryable statuses', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(401));
    const sleep = vi.fn().mockResolvedValue(undefined);

    await expect(sendSyncEvent(event, { url: 'u', token: 't', fetchImpl, sleep })).rejects.toThrow(SyncSendError);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it('retries network errors and throws after exhausting attempts', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));
    const sleep = vi.fn().mockResolvedValue(undefined);

    await expect(sendSyncEvent(event, { url: 'u', token: 't', fetchImpl, sleep, maxRetries: 3 })).rejects.toThrow(
      'ECONNREFUSED',
    );
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenCalledTimes(2);
  });

  it('throws a SyncSendError when retryable statuses persist', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(429));
    const sleep = vi.fn().mockResolvedValue(undefined);

    const promise = sendSyncEvent(event, { url: 'u', token: 't', fetchImpl, sleep, maxRetries: 2 });
    await expect(promise).rejects.toMatchObject({ name: 'SyncSendError', status: 429 });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
});
