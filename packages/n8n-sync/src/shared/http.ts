import type { Logger } from './logger';
import type { SyncEvent } from './types';

/** HTTP header carrying the shared secret on publisher → subscriber requests. */
export const SYNC_TOKEN_HEADER = 'x-sync-token';

const RETRYABLE_STATUSES = new Set([408, 429, 500, 502, 503, 504]);
const MAX_BACKOFF_MS = 10_000;

export class SyncSendError extends Error {
  readonly status: number | undefined;
  readonly retryable: boolean;

  constructor(message: string, options?: { status?: number; retryable?: boolean; cause?: unknown }) {
    super(message);
    this.name = 'SyncSendError';
    this.status = options?.status;
    this.retryable = options?.retryable ?? false;
    if (options?.cause !== undefined) {
      (this as Error & { cause?: unknown }).cause = options.cause;
    }
  }
}

export interface SendSyncEventOptions {
  url: string;
  token: string;
  /** Per-attempt timeout in milliseconds (default: 10000). */
  timeoutMs?: number;
  /** Total attempts including the first one (default: 3). */
  maxRetries?: number;
  log?: Logger;
  /** Injectable for tests. */
  fetchImpl?: typeof fetch;
  /** Injectable for tests. */
  sleep?: (ms: number) => Promise<void>;
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function backoffMs(attempt: number): number {
  return Math.min(1000 * 2 ** (attempt - 1), MAX_BACKOFF_MS);
}

/**
 * POST a sync event to the subscriber with exponential backoff
 * (1s, 2s, 4s, … capped at 10s). Network errors, timeouts and 408/429/5xx
 * responses are retried; other 4xx responses throw immediately.
 */
export async function sendSyncEvent(event: SyncEvent, options: SendSyncEventOptions): Promise<void> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const sleep = options.sleep ?? defaultSleep;
  const timeoutMs = options.timeoutMs ?? 10_000;
  const attempts = Math.max(1, options.maxRetries ?? 3);

  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      let response: Response;
      try {
        response = await fetchImpl(options.url, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            [SYNC_TOKEN_HEADER]: options.token,
          },
          body: JSON.stringify(event),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timer);
      }

      if (response.ok) return;

      const retryable = RETRYABLE_STATUSES.has(response.status);
      throw new SyncSendError(`Subscriber responded with status ${response.status}`, {
        status: response.status,
        retryable,
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
        await sleep(backoffMs(attempt));
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new SyncSendError(`Failed to deliver sync event: ${String(lastError)}`, { retryable: true });
}
