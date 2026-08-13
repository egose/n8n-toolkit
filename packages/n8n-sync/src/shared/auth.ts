import { createHmac, timingSafeEqual } from 'node:crypto';
import type { IncomingMessage } from 'node:http';

/** Header carrying the shared secret as a static bearer token (token mode). */
export const SYNC_TOKEN_HEADER = 'x-sync-token';
/** Header carrying the epoch-milliseconds timestamp of the signature (hmac mode). */
export const SYNC_TIMESTAMP_HEADER = 'x-sync-timestamp';
/** Header carrying the hex HMAC-SHA256 signature of `<timestamp>.<rawBody>` (hmac mode). */
export const SYNC_SIGNATURE_HEADER = 'x-sync-signature';

/** Default maximum age/skew accepted for a signed request (5 minutes). */
export const DEFAULT_SIGNATURE_TOLERANCE_MS = 5 * 60 * 1000;
export const DEFAULT_REPLAY_CACHE_SIZE = 10_000;

/**
 * Publisher → subscriber authentication scheme:
 *   - `hmac`  (default) — per-request HMAC-SHA256 signature with timestamp (replay-protected)
 *   - `token`           — static shared-secret bearer token
 */
export type SyncAuthMode = 'hmac' | 'token';

export interface RequestReplayGuard {
  remember(req: IncomingMessage): 'accepted' | 'replayed' | 'missing';
}

/**
 * Sign a request payload: hex HMAC-SHA256 of `<timestamp>.<rawBody>` keyed
 * with the shared secret. Binding the timestamp into the signature gives
 * replay protection when combined with the subscriber's tolerance window.
 */
export function signPayload(secret: string, timestamp: string, rawBody: string): string {
  return createHmac('sha256', secret).update(`${timestamp}.${rawBody}`, 'utf8').digest('hex');
}

function headerValue(req: IncomingMessage, name: string): string | undefined {
  const header = req.headers[name];
  const value = Array.isArray(header) ? header[0] : header;
  return value ? String(value) : undefined;
}

/**
 * Verify the HMAC signature on an incoming subscriber request.
 *
 * Fails closed when no secret is configured, headers are missing/malformed,
 * the timestamp is outside the tolerance window, or the signature does not
 * match the exact raw request body.
 */
export function verifyRequestSignature(
  req: IncomingMessage,
  secret: string,
  rawBody: string,
  toleranceMs: number = DEFAULT_SIGNATURE_TOLERANCE_MS,
  nowMs: number = Date.now(),
): boolean {
  if (!secret) return false;

  const timestamp = headerValue(req, SYNC_TIMESTAMP_HEADER);
  const signature = headerValue(req, SYNC_SIGNATURE_HEADER);
  if (!timestamp || !signature) return false;

  const timestampMs = Number(timestamp);
  if (!Number.isFinite(timestampMs)) return false;
  if (Math.abs(nowMs - timestampMs) > toleranceMs) return false;

  const expected = Buffer.from(signPayload(secret, timestamp, rawBody));
  const received = Buffer.from(signature);
  if (received.length !== expected.length) return false;

  return timingSafeEqual(received, expected);
}

export function createRequestReplayGuard(options: {
  ttlMs: number;
  maxEntries?: number;
  nowMs?: () => number;
}): RequestReplayGuard {
  const ttlMs = Math.max(1, options.ttlMs);
  const maxEntries = Math.max(1, options.maxEntries ?? DEFAULT_REPLAY_CACHE_SIZE);
  const nowMs = options.nowMs ?? (() => Date.now());
  const cache = new Map<string, number>();

  const prune = (now: number) => {
    for (const [key, expiresAt] of cache) {
      if (expiresAt <= now) cache.delete(key);
    }
    while (cache.size > maxEntries) {
      const oldestKey = cache.keys().next().value as string | undefined;
      if (!oldestKey) break;
      cache.delete(oldestKey);
    }
  };

  return {
    remember(req) {
      const timestamp = headerValue(req, SYNC_TIMESTAMP_HEADER);
      const signature = headerValue(req, SYNC_SIGNATURE_HEADER);
      if (!timestamp || !signature) return 'missing';

      const now = nowMs();
      prune(now);
      const key = `${timestamp}:${signature}`;
      if (cache.has(key)) return 'replayed';

      cache.set(key, now + ttlMs);
      prune(now);
      return 'accepted';
    },
  };
}

/** Check the static shared-secret bearer token on an incoming request (token mode). */
export function verifyRequestToken(req: IncomingMessage, secret: string): boolean {
  if (!secret) return false;

  const token = headerValue(req, SYNC_TOKEN_HEADER);
  if (!token) return false;

  const received = Buffer.from(token);
  const expected = Buffer.from(secret);
  if (received.length !== expected.length) return false;

  return timingSafeEqual(received, expected);
}

/** Verify an incoming request with the configured authentication scheme. */
export function verifyRequest(
  req: IncomingMessage,
  secret: string,
  rawBody: string,
  mode: SyncAuthMode,
  toleranceMs: number = DEFAULT_SIGNATURE_TOLERANCE_MS,
  nowMs: number = Date.now(),
): boolean {
  if (mode === 'token') return verifyRequestToken(req, secret);
  return verifyRequestSignature(req, secret, rawBody, toleranceMs, nowMs);
}
