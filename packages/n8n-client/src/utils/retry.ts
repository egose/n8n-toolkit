import type { HttpClock, HttpRandom, HttpSleep } from '../types.js';

const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);
const RETRY_AFTER_STATUS_CODES = new Set([429, 503]);
const DEFAULT_ATTEMPTS = 3;
const DEFAULT_BASE_DELAY_MS = 1_000;
const DEFAULT_MAX_DELAY_MS = 10_000;
const DEFAULT_MAX_RETRY_AFTER_MS = 30_000;
const DEFAULT_JITTER_RATIO = 0.2;

interface RetryableHttpError {
  status: number;
  headers?: Record<string, string>;
}

export interface RetryTransientErrorOptions {
  attempts?: number;
  signal?: AbortSignal;
  sleep?: HttpSleep;
  now?: HttpClock;
  random?: HttpRandom;
}

export class NetworkError extends Error {
  readonly cause?: unknown;

  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = 'NetworkError';
    this.cause = options?.cause;
  }
}

function createAbortError(message: string): Error {
  const error = new Error(message);
  error.name = 'AbortError';
  return error;
}

function toAbortError(reason: unknown): Error {
  if (reason instanceof Error) {
    return reason;
  }

  return createAbortError(typeof reason === 'string' && reason !== '' ? reason : 'This operation was aborted');
}

function defaultSleep(delayMs: number, signal: AbortSignal): Promise<void> {
  if (signal.aborted) {
    return Promise.reject(toAbortError(signal.reason));
  }

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, delayMs);

    const onAbort = () => {
      clearTimeout(timeout);
      reject(toAbortError(signal.reason));
    };

    signal.addEventListener('abort', onAbort, { once: true });
  });
}

function isRetryableStatus(error: unknown): error is RetryableHttpError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof (error as { status?: unknown }).status === 'number' &&
    RETRYABLE_STATUS_CODES.has((error as RetryableHttpError).status)
  );
}

function retryAfterDelayMs(error: RetryableHttpError, now: HttpClock): number | undefined {
  if (!RETRY_AFTER_STATUS_CODES.has(error.status)) {
    return undefined;
  }

  const retryAfterHeader = error.headers?.['retry-after'];
  if (!retryAfterHeader) {
    return undefined;
  }

  const trimmed = retryAfterHeader.trim();
  if (/^\d+$/.test(trimmed)) {
    return Number(trimmed) * 1_000;
  }

  const retryAt = Date.parse(trimmed);
  if (Number.isNaN(retryAt)) {
    return undefined;
  }

  return Math.max(0, retryAt - now());
}

function applyJitter(delayMs: number, random: HttpRandom): number {
  return Math.round(delayMs + delayMs * DEFAULT_JITTER_RATIO * random());
}

function retryDelayMs(attempt: number, error: unknown, now: HttpClock, random: HttpRandom): number {
  const exponentialDelay = Math.min(DEFAULT_BASE_DELAY_MS * 2 ** attempt, DEFAULT_MAX_DELAY_MS);
  const serverDelay = isRetryableStatus(error) ? retryAfterDelayMs(error, now) : undefined;
  const boundedDelay = Math.min(Math.max(exponentialDelay, serverDelay ?? 0), DEFAULT_MAX_RETRY_AFTER_MS);

  return applyJitter(boundedDelay, random);
}

function isTransientError(error: unknown): boolean {
  if (error instanceof NetworkError) {
    return true;
  }

  if (error instanceof Error && error.name === 'AbortError') {
    return false;
  }

  return isRetryableStatus(error);
}

export async function retryTransientError<T>(
  operation: () => Promise<T>,
  options: RetryTransientErrorOptions = {},
): Promise<T> {
  const attempts = options.attempts ?? DEFAULT_ATTEMPTS;
  const sleep = options.sleep ?? defaultSleep;
  const now = options.now ?? Date.now;
  const random = options.random ?? Math.random;
  const signal = options.signal;

  for (let attempt = 0; attempt < attempts; attempt++) {
    if (signal?.aborted) {
      throw toAbortError(signal.reason);
    }

    try {
      return await operation();
    } catch (error) {
      if (!isTransientError(error) || attempt === attempts - 1) {
        throw error;
      }

      if (!signal) {
        throw new Error('Retry signal is required');
      }

      await sleep(retryDelayMs(attempt, error, now, random), signal);
    }
  }

  throw new Error('Unreachable');
}
