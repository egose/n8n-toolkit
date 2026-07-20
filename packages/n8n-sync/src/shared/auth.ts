import { timingSafeEqual } from 'node:crypto';
import type { IncomingMessage } from 'node:http';

import { SYNC_TOKEN_HEADER } from './http';

/** Check the shared-secret token on an incoming subscriber request. */
export function isAuthorized(req: IncomingMessage, secret: string): boolean {
  if (!secret) return false;

  const header = req.headers[SYNC_TOKEN_HEADER];
  const token = Array.isArray(header) ? header[0] : header;
  if (!token) return false;

  const received = Buffer.from(String(token));
  const expected = Buffer.from(secret);
  if (received.length !== expected.length) return false;

  return timingSafeEqual(received, expected);
}
