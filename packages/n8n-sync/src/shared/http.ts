import { signPayload, SYNC_SIGNATURE_HEADER, SYNC_TIMESTAMP_HEADER, SYNC_TOKEN_HEADER } from './auth';
import type { SyncAuthConfig } from './config';
import type { Logger } from './logger';
import type { SyncEvent } from './types';

const RETRYABLE_STATUSES = new Set([408, 429, 500, 502, 503, 504]);
const MAX_BACKOFF_MS = 10_000;
const MAX_DISCARD_BYTES = 64 * 1024;
const JITTER_RATIO = 0.25;

export class SyncSendError extends Error {
  readonly status: number | undefined;
  readonly retryable: boolean;
  readonly retryAfterMs: number | undefined;

  constructor(
    message: string,
    options?: { status?: number; retryable?: boolean; retryAfterMs?: number; cause?: unknown },
  ) {
    super(message);
    this.name = 'SyncSendError';
    this.status = options?.status;
    this.retryable = options?.retryable ?? false;
    this.retryAfterMs = options?.retryAfterMs;
    if (options?.cause !== undefined) {
      (this as Error & { cause?: unknown }).cause = options.cause;
    }
  }
}

export interface SendSyncEventOptions {
  url: string;
  auth: SyncAuthConfig;
  /** Per-attempt timeout in milliseconds (default: 10000). */
  timeoutMs?: number;
  /** Total attempts including the first one (default: 3). */
  maxAttempts?: number;
  log?: Logger;
  /** Injectable for tests. */
  fetchImpl?: typeof fetch;
  /** Injectable for tests. */
  sleep?: (ms: number) => Promise<void>;
  /** Injectable for tests — used to timestamp hmac signatures. */
  nowMs?: () => number;
  /** Injectable for tests — used to add bounded jitter to backoff delays. */
  random?: () => number;
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function backoffMs(attempt: number): number {
  return Math.min(1000 * 2 ** (attempt - 1), MAX_BACKOFF_MS);
}

function withJitter(delayMs: number, random: () => number): number {
  if (delayMs >= MAX_BACKOFF_MS) {
    return MAX_BACKOFF_MS;
  }

  const factor = 1 + Math.max(0, random()) * JITTER_RATIO;
  return Math.min(MAX_BACKOFF_MS, Math.round(delayMs * factor));
}

function parseRetryAfterMs(retryAfter: string | null, nowMs: () => number): number | undefined {
  if (!retryAfter) {
    return undefined;
  }

  const value = retryAfter.trim();
  if (!value) {
    return undefined;
  }

  if (/^\d+$/.test(value)) {
    return Math.min(Number(value) * 1000, MAX_BACKOFF_MS);
  }

  const parsedAt = Date.parse(value);
  if (Number.isNaN(parsedAt)) {
    return undefined;
  }

  return Math.min(Math.max(0, parsedAt - nowMs()), MAX_BACKOFF_MS);
}

function retryDelayMs(response: Response, attempt: number, random: () => number, nowMs: () => number): number {
  if (response.status === 429 || response.status === 503) {
    const retryAfterMs = parseRetryAfterMs(response.headers.get('retry-after'), nowMs);
    if (retryAfterMs !== undefined) {
      return retryAfterMs;
    }
  }

  return withJitter(backoffMs(attempt), random);
}

async function disposeResponseBody(response: Response): Promise<void> {
  const body = response.body;
  if (!body) {
    return;
  }

  const readableBody = body as ReadableStream<Uint8Array> & { cancel?: (reason?: unknown) => Promise<void> };
  if (typeof readableBody.getReader !== 'function') {
    if (typeof readableBody.cancel === 'function') {
      try {
        await readableBody.cancel();
      } catch {
        // Best effort only; retry behavior should not depend on body disposal.
      }
    }
    return;
  }

  const reader = readableBody.getReader();
  let discardedBytes = 0;

  try {
    while (discardedBytes <= MAX_DISCARD_BYTES) {
      const { done, value } = await reader.read();
      if (done) {
        return;
      }

      discardedBytes += value?.byteLength ?? 0;
      if (discardedBytes > MAX_DISCARD_BYTES) {
        await reader.cancel();
        return;
      }
    }
  } catch {
    try {
      await reader.cancel();
    } catch {
      // Best effort only; retry behavior should not depend on body disposal.
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {
      // Ignore already-released locks.
    }
  }
}

/**
 * POST a sync event to the subscriber with exponential backoff
 * (1s, 2s, 4s, … capped at 10s). Network errors, timeouts, and HTTP
 * 408/429/500/502/503/504 responses are retried; every other HTTP status
 * throws immediately. 429/503 honor bounded Retry-After values when present.
 *
 * In hmac mode every attempt re-signs the body with a fresh timestamp so
 * long retry chains never trip the subscriber's signature tolerance window.
 */
export async function sendSyncEvent(event: SyncEvent, options: SendSyncEventOptions): Promise<void> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const sleep = options.sleep ?? defaultSleep;
  const timeoutMs = options.timeoutMs ?? 10_000;
  const attempts = Math.max(1, options.maxAttempts ?? 3);
  const nowMs = options.nowMs ?? (() => Date.now());
  const random = options.random ?? Math.random;
  const body = JSON.stringify(event);

  const buildHeaders = (): Record<string, string> => {
    if (options.auth.mode === 'token') {
      return {
        'content-type': 'application/json',
        [SYNC_TOKEN_HEADER]: options.auth.token,
      };
    }
    const timestamp = String(nowMs());
    return {
      'content-type': 'application/json',
      [SYNC_TIMESTAMP_HEADER]: timestamp,
      [SYNC_SIGNATURE_HEADER]: signPayload(options.auth.secret, timestamp, body),
    };
  };

  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      let response: Response;
      try {
        response = await fetchImpl(options.url, {
          method: 'POST',
          headers: buildHeaders(),
          body,
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timer);
      }

      if (response.ok) return;

      await disposeResponseBody(response);

      const retryable = RETRYABLE_STATUSES.has(response.status);
      throw new SyncSendError(`Subscriber responded with status ${response.status}`, {
        status: response.status,
        retryable,
        retryAfterMs: retryDelayMs(response, attempt, random, nowMs),
      });
    } catch (error) {
      if (error instanceof SyncSendError && !error.retryable) throw error;

      lastError = error;
      options.log?.warn('Failed to deliver sync event', {
        type: event.type,
        attempt,
        error: error instanceof Error ? error.message : String(error),
      });

      if (attempt < attempts) {
        const delayMs =
          error instanceof SyncSendError && error.retryAfterMs !== undefined
            ? error.retryAfterMs
            : withJitter(backoffMs(attempt), random);
        await sleep(delayMs);
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new SyncSendError(`Failed to deliver sync event: ${String(lastError)}`, { retryable: true });
}
