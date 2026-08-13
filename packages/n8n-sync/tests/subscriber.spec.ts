import type { IncomingMessage } from 'node:http';
import { Readable } from 'node:stream';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { signPayload } from '../src/shared/auth';
import type { Logger } from '../src/shared/logger';
import type { SyncEvent } from '../src/shared/types';
import { createSubscriberHooks } from '../src/subscriber/hooks';
import { createSyncRouteHandler, mountSyncRoutes } from '../src/subscriber/routes';

const log: Logger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  child: vi.fn(),
};

const SECRET = 's3cret'; // pragma: allowlist secret
const DEFAULT_ROUTE_DEPS = {
  maxBodyBytes: 1024 * 1024,
  signatureToleranceMs: 5 * 60 * 1000,
  replayCacheSize: 100,
} as const;
const HMAC_AUTH = { mode: 'hmac', secret: SECRET } as const;
const TOKEN_AUTH = { mode: 'token', token: SECRET } as const;

const validEvent: SyncEvent = {
  type: 'workflow.delete',
  at: '2026-01-01T00:00:00.000Z',
  sourceId: 'src-1',
  eventId: 'src-1:1',
  entityRevision: '1',
  workflowId: 'wf-1',
};

type TestReq = IncomingMessage & { body?: unknown; rawBody?: Buffer | string };

function makeSignedReq(body: unknown, secret: string, timestamp = String(Date.now())): TestReq {
  const raw = JSON.stringify(body);
  const req = Readable.from([raw]) as TestReq;
  req.headers = {
    'content-type': 'application/json',
    'x-sync-timestamp': timestamp,
    'x-sync-signature': signPayload(secret, timestamp, raw),
  };
  return req;
}

function makeTokenReq(body: unknown, token: string): TestReq {
  const req = Readable.from([JSON.stringify(body)]) as TestReq;
  req.headers = { 'content-type': 'application/json', 'x-sync-token': token };
  return req;
}

function makeRawReq(raw: string, headers: Record<string, string>): TestReq {
  const req = Readable.from([raw]) as TestReq;
  req.headers = headers;
  return req;
}

function makeRes() {
  const res = {
    status: vi.fn(),
    json: vi.fn(),
  };
  res.status.mockReturnValue(res);
  return res;
}

describe('createSyncRouteHandler (hmac mode, default)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects requests with an invalid signature with 401', async () => {
    const apply = vi.fn();
    const handler = createSyncRouteHandler({ auth: HMAC_AUTH, apply, log, ...DEFAULT_ROUTE_DEPS });
    const res = makeRes();

    await handler(makeSignedReq(validEvent, 'wrong-secret') as never, res as never);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(apply).not.toHaveBeenCalled();
  });

  it('rejects requests with an expired timestamp with 401', async () => {
    const apply = vi.fn();
    const handler = createSyncRouteHandler({ auth: HMAC_AUTH, apply, log, ...DEFAULT_ROUTE_DEPS });
    const res = makeRes();
    const expired = String(Date.now() - 10 * 60 * 1000);

    await handler(makeSignedReq(validEvent, SECRET, expired) as never, res as never);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(apply).not.toHaveBeenCalled();
  });

  it('rejects bearer-token requests with 401 (no cross-mode acceptance)', async () => {
    const apply = vi.fn();
    const handler = createSyncRouteHandler({ auth: HMAC_AUTH, apply, log, ...DEFAULT_ROUTE_DEPS });
    const res = makeRes();

    await handler(makeTokenReq(validEvent, SECRET) as never, res as never);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(apply).not.toHaveBeenCalled();
  });

  it('rejects malformed events with 400', async () => {
    const apply = vi.fn();
    const handler = createSyncRouteHandler({ auth: HMAC_AUTH, apply, log, ...DEFAULT_ROUTE_DEPS });
    const res = makeRes();

    await handler(makeSignedReq({ type: 'nope' }, SECRET) as never, res as never);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(apply).not.toHaveBeenCalled();
  });

  it('rejects invalid JSON with 400 after authenticating the raw bytes', async () => {
    const apply = vi.fn();
    const handler = createSyncRouteHandler({ auth: HMAC_AUTH, apply, log, ...DEFAULT_ROUTE_DEPS });
    const res = makeRes();
    const raw = '{invalid';
    const timestamp = String(Date.now());

    await handler(
      makeRawReq(raw, {
        'content-type': 'application/json',
        'x-sync-timestamp': timestamp,
        'x-sync-signature': signPayload(SECRET, timestamp, raw),
      }) as never,
      res as never,
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(apply).not.toHaveBeenCalled();
  });

  it('rejects an invalid HMAC request before JSON parsing', async () => {
    const apply = vi.fn();
    const handler = createSyncRouteHandler({ auth: HMAC_AUTH, apply, log, ...DEFAULT_ROUTE_DEPS });
    const res = makeRes();
    const raw = '{invalid';
    const timestamp = String(Date.now());

    await handler(
      makeRawReq(raw, {
        'content-type': 'application/json',
        'x-sync-timestamp': timestamp,
        'x-sync-signature': signPayload('wrong-secret', timestamp, raw),
      }) as never,
      res as never,
    );

    expect(res.status).toHaveBeenCalledWith(401);
    expect(apply).not.toHaveBeenCalled();
  });

  it('applies a valid signed event and responds 200', async () => {
    const apply = vi.fn().mockResolvedValue(undefined);
    const handler = createSyncRouteHandler({ auth: HMAC_AUTH, apply, log, ...DEFAULT_ROUTE_DEPS });
    const res = makeRes();

    await handler(makeSignedReq(validEvent, SECRET) as never, res as never);

    expect(apply).toHaveBeenCalledWith(validEvent);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ ok: true });
  });

  it('rejects an exact replay of the same signed request with 409', async () => {
    const apply = vi.fn().mockResolvedValue(undefined);
    const handler = createSyncRouteHandler({ auth: HMAC_AUTH, apply, log, ...DEFAULT_ROUTE_DEPS });
    const res1 = makeRes();
    const res2 = makeRes();
    const timestamp = String(Date.now());

    await handler(makeSignedReq(validEvent, SECRET, timestamp) as never, res1 as never);
    await handler(makeSignedReq(validEvent, SECRET, timestamp) as never, res2 as never);

    expect(res1.status).toHaveBeenCalledWith(200);
    expect(res2.status).toHaveBeenCalledWith(409);
    expect(apply).toHaveBeenCalledTimes(1);
  });

  it('verifies the signature against the exact raw bytes from req.rawBody', async () => {
    const apply = vi.fn().mockResolvedValue(undefined);
    const handler = createSyncRouteHandler({ auth: HMAC_AUTH, apply, log, ...DEFAULT_ROUTE_DEPS });
    const res = makeRes();

    // Simulate n8n's rawBodyReader: rawBody + pre-parsed body, no readable stream
    const raw = JSON.stringify(validEvent);
    const timestamp = String(Date.now());
    const req = Readable.from([]) as TestReq;
    req.headers = {
      'content-type': 'application/json',
      'x-sync-timestamp': timestamp,
      'x-sync-signature': signPayload(SECRET, timestamp, raw),
    };
    req.rawBody = Buffer.from(raw);
    req.body = validEvent;

    await handler(req as never, res as never);

    expect(apply).toHaveBeenCalledWith(validEvent);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('fails closed in hmac mode when only a pre-parsed body is available', async () => {
    const apply = vi.fn();
    const handler = createSyncRouteHandler({ auth: HMAC_AUTH, apply, log, ...DEFAULT_ROUTE_DEPS });
    const res = makeRes();
    const timestamp = String(Date.now());
    const req = Readable.from([]) as TestReq;
    req.headers = {
      'content-type': 'application/json',
      'x-sync-timestamp': timestamp,
      'x-sync-signature': signPayload(SECRET, timestamp, JSON.stringify(validEvent)),
    };
    req.body = validEvent;

    await handler(req as never, res as never);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Exact raw request body unavailable for HMAC verification' });
    expect(apply).not.toHaveBeenCalled();
  });

  it('rejects wrong content types with 415', async () => {
    const apply = vi.fn();
    const handler = createSyncRouteHandler({ auth: HMAC_AUTH, apply, log, ...DEFAULT_ROUTE_DEPS });
    const res = makeRes();

    await handler(makeRawReq(JSON.stringify(validEvent), { 'content-type': 'text/plain' }) as never, res as never);

    expect(res.status).toHaveBeenCalledWith(415);
    expect(apply).not.toHaveBeenCalled();
  });

  it('rejects unsupported content encodings with 415', async () => {
    const apply = vi.fn();
    const handler = createSyncRouteHandler({ auth: HMAC_AUTH, apply, log, ...DEFAULT_ROUTE_DEPS });
    const res = makeRes();

    await handler(
      makeRawReq(JSON.stringify(validEvent), {
        'content-type': 'application/json',
        'content-encoding': 'gzip',
      }) as never,
      res as never,
    );

    expect(res.status).toHaveBeenCalledWith(415);
    expect(apply).not.toHaveBeenCalled();
  });

  it('returns a generic 500 and logs when body reading fails unexpectedly', async () => {
    const apply = vi.fn();
    const handler = createSyncRouteHandler({ auth: HMAC_AUTH, apply, log, ...DEFAULT_ROUTE_DEPS });
    const res = makeRes();
    const req = new Readable({
      read() {
        this.destroy(new Error('stream exploded'));
      },
    }) as TestReq;
    req.headers = { 'content-type': 'application/json' };

    await handler(req as never, res as never);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'failed to read request body' });
    expect(log.error).toHaveBeenCalled();
    expect(apply).not.toHaveBeenCalled();
  });

  it('responds 500 when applying fails', async () => {
    const apply = vi.fn().mockRejectedValue(new Error('db down'));
    const handler = createSyncRouteHandler({ auth: HMAC_AUTH, apply, log, ...DEFAULT_ROUTE_DEPS });
    const res = makeRes();

    await handler(makeSignedReq(validEvent, SECRET) as never, res as never);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(log.error).toHaveBeenCalled();
  });

  it('supports injected hmac body-reader and verifier dependencies', async () => {
    const apply = vi.fn().mockResolvedValue(undefined);
    const assertJsonRequest = vi.fn();
    const readRawBody = vi.fn().mockResolvedValue(JSON.stringify(validEvent));
    const parseJsonBody = vi.fn().mockReturnValue(validEvent);
    const verifyRequest = vi.fn().mockReturnValue(true);
    const remember = vi.fn().mockReturnValue('accepted');
    const createRequestReplayGuard = vi.fn().mockReturnValue({ remember });
    const handler = createSyncRouteHandler({
      auth: HMAC_AUTH,
      apply,
      log,
      ...DEFAULT_ROUTE_DEPS,
      assertJsonRequest,
      readRawBody,
      parseJsonBody,
      verifyRequest,
      createRequestReplayGuard,
    });
    const res = makeRes();

    await handler(makeSignedReq(validEvent, SECRET) as never, res as never);

    expect(assertJsonRequest).toHaveBeenCalled();
    expect(readRawBody).toHaveBeenCalledWith(expect.anything(), DEFAULT_ROUTE_DEPS.maxBodyBytes, {
      allowParsedBodyFallback: false,
    });
    expect(verifyRequest).toHaveBeenCalledWith(
      expect.anything(),
      SECRET,
      JSON.stringify(validEvent),
      'hmac',
      DEFAULT_ROUTE_DEPS.signatureToleranceMs,
    );
    expect(parseJsonBody).toHaveBeenCalledWith(JSON.stringify(validEvent));
    expect(remember).toHaveBeenCalled();
    expect(apply).toHaveBeenCalledWith(validEvent);
  });
});

describe('createSyncRouteHandler (token mode)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('accepts a valid bearer token', async () => {
    const apply = vi.fn().mockResolvedValue(undefined);
    const handler = createSyncRouteHandler({ auth: TOKEN_AUTH, apply, log, ...DEFAULT_ROUTE_DEPS });
    const res = makeRes();

    await handler(makeTokenReq(validEvent, SECRET) as never, res as never);

    expect(apply).toHaveBeenCalledWith(validEvent);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('rejects hmac-signed requests with 401 (no cross-mode acceptance)', async () => {
    const apply = vi.fn();
    const handler = createSyncRouteHandler({ auth: TOKEN_AUTH, apply, log, ...DEFAULT_ROUTE_DEPS });
    const res = makeRes();

    await handler(makeSignedReq(validEvent, SECRET) as never, res as never);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(apply).not.toHaveBeenCalled();
  });

  it('rejects an invalid bearer token before attempting to parse the body', async () => {
    const apply = vi.fn();
    const handler = createSyncRouteHandler({ auth: TOKEN_AUTH, apply, log, ...DEFAULT_ROUTE_DEPS });
    const res = makeRes();

    await handler(makeRawReq('{invalid', { 'x-sync-token': 'wrong-token' }) as never, res as never);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(apply).not.toHaveBeenCalled();
  });

  it('rejects a cyclic pre-parsed body with a controlled 400', async () => {
    const apply = vi.fn();
    const handler = createSyncRouteHandler({ auth: TOKEN_AUTH, apply, log, ...DEFAULT_ROUTE_DEPS });
    const res = makeRes();
    const body: { self?: unknown } = {};
    body.self = body;
    const req = Readable.from([]) as TestReq;
    req.headers = { 'content-type': 'application/json', 'x-sync-token': SECRET };
    req.body = body;

    await handler(req as never, res as never);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Pre-parsed request body is not valid JSON' });
    expect(apply).not.toHaveBeenCalled();
  });

  it('supports injected token verifier and JSON reader dependencies', async () => {
    const apply = vi.fn().mockResolvedValue(undefined);
    const verifyRequestToken = vi.fn().mockReturnValue(true);
    const readJsonBody = vi.fn().mockResolvedValue({ raw: JSON.stringify(validEvent), parsed: validEvent });
    const handler = createSyncRouteHandler({
      auth: TOKEN_AUTH,
      apply,
      log,
      ...DEFAULT_ROUTE_DEPS,
      verifyRequestToken,
      readJsonBody,
    });
    const res = makeRes();

    await handler(makeTokenReq(validEvent, SECRET) as never, res as never);

    expect(verifyRequestToken).toHaveBeenCalledWith(expect.anything(), SECRET);
    expect(readJsonBody).toHaveBeenCalledWith(expect.anything(), DEFAULT_ROUTE_DEPS.maxBodyBytes);
    expect(apply).toHaveBeenCalledWith(validEvent);
  });
});

describe('mountSyncRoutes', () => {
  it('registers POST <base>/events on the app', () => {
    const app = { get: vi.fn(), post: vi.fn() };
    const handler = vi.fn();

    mountSyncRoutes(app as never, handler as never, '/rest/sync/v1');

    expect(app.post).toHaveBeenCalledWith('/rest/sync/v1/events', handler);
  });

  it('registers an unauthenticated GET <base>/health on the app', () => {
    const app = { get: vi.fn(), post: vi.fn() };

    mountSyncRoutes(app as never, vi.fn() as never, '/rest/sync/v1');

    expect(app.get).toHaveBeenCalledWith('/rest/sync/v1/health', expect.any(Function));

    const [, healthHandler] = app.get.mock.calls[0] as [string, (req: unknown, res: unknown) => void];
    const res = makeRes();
    healthHandler({}, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ ok: true });
  });
});

describe('createSubscriberHooks', () => {
  it('runs the ready callback from the n8n.ready hook', async () => {
    const ready = vi.fn().mockResolvedValue(undefined);
    const hooks = createSubscriberHooks({ ready });
    const server = { app: {} };

    await hooks.n8n.ready[0](server as never);

    expect(ready).toHaveBeenCalledWith(server);
  });

  it('also accepts the raw express app when n8n.ready passes the app directly', async () => {
    const ready = vi.fn().mockResolvedValue(undefined);
    const hooks = createSubscriberHooks({ ready });
    const app = { get: vi.fn(), post: vi.fn() };

    await hooks.n8n.ready[0](app as never);

    expect(ready).toHaveBeenCalledWith(app);
  });
});
