import { signPayload, SYNC_SIGNATURE_HEADER, SYNC_TIMESTAMP_HEADER, SYNC_TOKEN_HEADER } from './auth';
import type { SyncAuthConfig } from './config';
import { MAX_WORKFLOW_CREDENTIAL_REFS } from './credential-refs';
import type { Logger } from './logger';
import type { SyncEvent } from './types';
import { MAX_ID_LENGTH } from './validate';

const RETRYABLE_STATUSES = new Set([408, 429, 500, 502, 503, 504]);
const MAX_BACKOFF_MS = 10_000;
const MAX_DISCARD_BYTES = 64 * 1024;
const MAX_RESPONSE_BYTES = 64 * 1024;
const JITTER_RATIO = 0.25;

type BodyLike = ReadableStream<Uint8Array> & { cancel?: (reason?: unknown) => Promise<void> };

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

function createAbortError(): Error {
  const error = new Error('Request timed out');
  error.name = 'AbortError';
  return error;
}

function remainingMs(deadlineAtMs: number): number {
  return Math.max(0, deadlineAtMs - Date.now());
}

async function withAttemptDeadline<T>(
  operationFactory: () => Promise<T>,
  deadlineAtMs: number,
  signal: AbortSignal,
  abortAttempt: () => void,
): Promise<T> {
  const operation = operationFactory();

  if (signal.aborted || remainingMs(deadlineAtMs) <= 0) {
    abortAttempt();
    operation.catch(() => undefined);
    throw createAbortError();
  }

  let timer: ReturnType<typeof setTimeout> | undefined;
  let abortListener: (() => void) | undefined;

  const timeout = new Promise<never>((_resolve, reject) => {
    const fail = () => {
      abortAttempt();
      reject(createAbortError());
    };

    abortListener = fail;
    signal.addEventListener('abort', fail, { once: true });
    timer = setTimeout(fail, remainingMs(deadlineAtMs));
  });

  try {
    return await Promise.race([operation, timeout]);
  } finally {
    if (timer !== undefined) {
      clearTimeout(timer);
    }
    if (abortListener) {
      signal.removeEventListener('abort', abortListener);
    }
  }
}

async function cancelBody(
  cancel: () => Promise<void>,
  deadlineAtMs: number,
  signal: AbortSignal,
  abortAttempt: () => void,
): Promise<void> {
  try {
    await withAttemptDeadline(cancel, deadlineAtMs, signal, abortAttempt);
  } catch {
    // Best effort only; retry behavior should not depend on body disposal.
  }
}

async function disposeResponseBody(
  response: Response,
  deadlineAtMs: number,
  signal: AbortSignal,
  abortAttempt: () => void,
): Promise<void> {
  const body = response.body;
  if (!body) {
    return;
  }

  const readableBody = body as BodyLike;
  if (typeof readableBody.getReader !== 'function') {
    if (typeof readableBody.cancel === 'function') {
      await cancelBody(() => readableBody.cancel!(), deadlineAtMs, signal, abortAttempt);
    }
    return;
  }

  const reader = readableBody.getReader();
  let discardedBytes = 0;

  try {
    while (discardedBytes <= MAX_DISCARD_BYTES) {
      const { done, value } = await withAttemptDeadline(() => reader.read(), deadlineAtMs, signal, abortAttempt);
      if (done) {
        return;
      }

      discardedBytes += value?.byteLength ?? 0;
      if (discardedBytes > MAX_DISCARD_BYTES) {
        await cancelBody(() => reader.cancel(), deadlineAtMs, signal, abortAttempt);
        return;
      }
    }
  } catch {
    await cancelBody(() => reader.cancel(), deadlineAtMs, signal, abortAttempt);
  } finally {
    try {
      reader.releaseLock();
    } catch {
      // Ignore already-released locks.
    }
  }
}

/**
 * Result of a successful sync-event delivery. The subscriber reports
 * workflow-referenced credential ids absent on the target so the publisher
 * can backfill exactly those blobs.
 */
export interface SyncDeliveryResult {
  missingCredentialIds: string[];
}

function parseMissingCredentialIds(value: unknown): string[] {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return [];
  const ids = (value as { missingCredentialIds?: unknown }).missingCredentialIds;
  if (!Array.isArray(ids)) return [];
  const collected: string[] = [];
  const seen = new Set<string>();
  for (const id of ids) {
    if (collected.length >= MAX_WORKFLOW_CREDENTIAL_REFS) break;
    if (typeof id !== 'string') continue;
    const trimmed = id.trim();
    if (trimmed.length === 0 || trimmed.length > MAX_ID_LENGTH || seen.has(trimmed)) continue;
    seen.add(trimmed);
    collected.push(trimmed);
  }
  return collected;
}

async function readDeliveryResult(
  response: Response,
  deadlineAtMs: number,
  signal: AbortSignal,
  abortAttempt: () => void,
): Promise<SyncDeliveryResult> {
  const empty: SyncDeliveryResult = { missingCredentialIds: [] };
  const contentLength = response.headers.get('content-length');
  if (
    contentLength !== null &&
    /^\d+$/.test(contentLength.trim()) &&
    Number(contentLength.trim()) > MAX_RESPONSE_BYTES
  ) {
    await disposeResponseBody(response, deadlineAtMs, signal, abortAttempt);
    return empty;
  }
  // Drain through the same bounded reader path as disposal (never text()):
  // small bodies are decoded + parsed for the missing-credential report,
  // oversized bodies are cancelled and degrade to an empty report.
  const text = await readResponseTextBounded(response, deadlineAtMs, signal, abortAttempt);
  if (text === undefined || text.length === 0 || text.length > MAX_RESPONSE_BYTES) return empty;
  try {
    return { missingCredentialIds: parseMissingCredentialIds(JSON.parse(text)) };
  } catch {
    return empty;
  }
}

async function readResponseTextBounded(
  response: Response,
  deadlineAtMs: number,
  signal: AbortSignal,
  abortAttempt: () => void,
): Promise<string | undefined> {
  const body = response.body;
  if (!body) {
    return '';
  }

  const readableBody = body as BodyLike;
  if (typeof readableBody.getReader !== 'function') {
    return undefined;
  }

  const reader = readableBody.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (totalBytes <= MAX_RESPONSE_BYTES) {
      const { done, value } = await withAttemptDeadline(() => reader.read(), deadlineAtMs, signal, abortAttempt);
      if (done) {
        break;
      }

      totalBytes += value?.byteLength ?? 0;
      if (totalBytes > MAX_RESPONSE_BYTES) {
        await cancelBody(() => reader.cancel(), deadlineAtMs, signal, abortAttempt);
        return undefined;
      }
      if (value) {
        chunks.push(value);
      }
    }
  } catch {
    await cancelBody(() => reader.cancel(), deadlineAtMs, signal, abortAttempt);
    return undefined;
  } finally {
    try {
      reader.releaseLock();
    } catch {
      // Ignore already-released locks.
    }
  }

  if (totalBytes === 0) {
    return '';
  }
  const merged = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return new TextDecoder().decode(merged);
  } catch {
    return undefined;
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
 *
 * On success the (small, bounded) response body is parsed for the
 * subscriber's missing-credential report; unparseable bodies degrade to an
 * empty report rather than failing delivery.
 */
export async function sendSyncEvent(event: SyncEvent, options: SendSyncEventOptions): Promise<SyncDeliveryResult> {
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
    const controller = new AbortController();
    const deadlineAtMs = Date.now() + timeoutMs;
    const abortAttempt = () => controller.abort();
    const timer = setTimeout(abortAttempt, timeoutMs);

    try {
      const response = await fetchImpl(options.url, {
        method: 'POST',
        headers: buildHeaders(),
        body,
        signal: controller.signal,
      });

      if (response.ok) {
        return await readDeliveryResult(response, deadlineAtMs, controller.signal, abortAttempt);
      }

      await disposeResponseBody(response, deadlineAtMs, controller.signal, abortAttempt);

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
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new SyncSendError(`Failed to deliver sync event: ${String(lastError)}`, { retryable: true });
}
