import type { IncomingMessage } from 'node:http';

import { describe, expect, it } from 'vitest';

import {
  createRequestReplayGuard,
  signPayload,
  verifyRequest,
  verifyRequestSignature,
  verifyRequestToken,
} from '../src/shared/auth';

const SECRET = 's3cret'; // pragma: allowlist secret
const BODY = '{"type":"workflow.delete","workflowId":"wf-1"}';
const NOW = 1_800_000_000_000;

function reqWithHeaders(headers: Record<string, string | string[] | undefined>): IncomingMessage {
  return { headers } as unknown as IncomingMessage;
}

function signedHeaders(secret: string, timestamp: string, body: string) {
  return {
    'x-sync-timestamp': timestamp,
    'x-sync-signature': signPayload(secret, timestamp, body),
  };
}

describe('verifyRequestToken', () => {
  it('accepts a matching token', () => {
    expect(verifyRequestToken(reqWithHeaders({ 'x-sync-token': SECRET }), SECRET)).toBe(true);
  });

  it('rejects a wrong token', () => {
    expect(verifyRequestToken(reqWithHeaders({ 'x-sync-token': 'wrong!' }), SECRET)).toBe(false);
  });

  it('rejects a missing token', () => {
    expect(verifyRequestToken(reqWithHeaders({}), SECRET)).toBe(false);
  });

  it('rejects when no secret is configured', () => {
    expect(verifyRequestToken(reqWithHeaders({ 'x-sync-token': SECRET }), '')).toBe(false);
  });

  it('rejects tokens of different length without throwing', () => {
    expect(verifyRequestToken(reqWithHeaders({ 'x-sync-token': 'a-much-longer-token-than-the-secret' }), SECRET)).toBe(
      false,
    );
  });

  it('uses the first value of a multi-value header', () => {
    expect(verifyRequestToken(reqWithHeaders({ 'x-sync-token': [SECRET, 'other'] }), SECRET)).toBe(true);
  });
});

describe('verifyRequestSignature', () => {
  it('accepts a valid signature within the tolerance window', () => {
    const req = reqWithHeaders(signedHeaders(SECRET, String(NOW - 1000), BODY));
    expect(verifyRequestSignature(req, SECRET, BODY, 60_000, NOW)).toBe(true);
  });

  it('rejects a signature made with the wrong secret', () => {
    const req = reqWithHeaders(signedHeaders('other-secret', String(NOW), BODY));
    expect(verifyRequestSignature(req, SECRET, BODY, 60_000, NOW)).toBe(false);
  });

  it('rejects when the body was tampered with', () => {
    const req = reqWithHeaders(signedHeaders(SECRET, String(NOW), BODY));
    const tampered = BODY.replace('wf-1', 'wf-2');
    expect(verifyRequestSignature(req, SECRET, tampered, 60_000, NOW)).toBe(false);
  });

  it('rejects an expired timestamp', () => {
    const req = reqWithHeaders(signedHeaders(SECRET, String(NOW - 120_000), BODY));
    expect(verifyRequestSignature(req, SECRET, BODY, 60_000, NOW)).toBe(false);
  });

  it('rejects a timestamp too far in the future', () => {
    const req = reqWithHeaders(signedHeaders(SECRET, String(NOW + 120_000), BODY));
    expect(verifyRequestSignature(req, SECRET, BODY, 60_000, NOW)).toBe(false);
  });

  it('rejects a non-numeric timestamp', () => {
    const req = reqWithHeaders(signedHeaders(SECRET, 'not-a-number', BODY));
    expect(verifyRequestSignature(req, SECRET, BODY, 60_000, NOW)).toBe(false);
  });

  it.each([['x-sync-timestamp'], ['x-sync-signature']])('rejects when %s is missing', (missing) => {
    const headers = signedHeaders(SECRET, String(NOW), BODY);
    const req = reqWithHeaders({ ...headers, [missing]: undefined });
    expect(verifyRequestSignature(req, SECRET, BODY, 60_000, NOW)).toBe(false);
  });

  it('rejects when no secret is configured', () => {
    const req = reqWithHeaders(signedHeaders(SECRET, String(NOW), BODY));
    expect(verifyRequestSignature(req, '', BODY, 60_000, NOW)).toBe(false);
  });
});

describe('verifyRequest', () => {
  it('dispatches to token verification in token mode', () => {
    const req = reqWithHeaders({ 'x-sync-token': SECRET });
    expect(verifyRequest(req, SECRET, BODY, 'token', 60_000, NOW)).toBe(true);
  });

  it('dispatches to signature verification in hmac mode', () => {
    const req = reqWithHeaders(signedHeaders(SECRET, String(NOW), BODY));
    expect(verifyRequest(req, SECRET, BODY, 'hmac', 60_000, NOW)).toBe(true);
  });

  it('does not cross-accept modes', () => {
    const tokenReq = reqWithHeaders({ 'x-sync-token': SECRET });
    expect(verifyRequest(tokenReq, SECRET, BODY, 'hmac', 60_000, NOW)).toBe(false);

    const hmacReq = reqWithHeaders(signedHeaders(SECRET, String(NOW), BODY));
    expect(verifyRequest(hmacReq, SECRET, BODY, 'token', 60_000, NOW)).toBe(false);
  });
});

describe('createRequestReplayGuard', () => {
  it('accepts the first verified request and rejects an exact replay', () => {
    const timestamp = String(NOW);
    const req = reqWithHeaders(signedHeaders(SECRET, timestamp, BODY));
    const replayGuard = createRequestReplayGuard({ ttlMs: 60_000, nowMs: () => NOW });

    expect(replayGuard.remember(req)).toBe('accepted');
    expect(replayGuard.remember(req)).toBe('replayed');
  });

  it('expires old entries and keeps the cache bounded', () => {
    let now = NOW;
    const replayGuard = createRequestReplayGuard({ ttlMs: 10, maxEntries: 1, nowMs: () => now });

    const first = reqWithHeaders(signedHeaders(SECRET, String(NOW), BODY));
    const second = reqWithHeaders(signedHeaders(SECRET, String(NOW + 1), BODY));

    expect(replayGuard.remember(first)).toBe('accepted');
    expect(replayGuard.remember(second)).toBe('accepted');

    now += 20;

    expect(replayGuard.remember(first)).toBe('accepted');
  });
});
