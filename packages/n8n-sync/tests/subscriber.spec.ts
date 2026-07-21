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

const validEvent: SyncEvent = {
  type: 'workflow.delete',
  at: '2026-01-01T00:00:00.000Z',
  sourceId: 'src-1',
  workflowId: 'wf-1',
};

type TestReq = IncomingMessage & { body?: unknown; rawBody?: Buffer | string };

function makeSignedReq(body: unknown, secret: string, timestamp = String(Date.now())): TestReq {
  const raw = JSON.stringify(body);
  const req = Readable.from([raw]) as TestReq;
  req.headers = {
    'x-sync-timestamp': timestamp,
    'x-sync-signature': signPayload(secret, timestamp, raw),
  };
  return req;
}

function makeTokenReq(body: unknown, token: string): TestReq {
  const req = Readable.from([JSON.stringify(body)]) as TestReq;
  req.headers = { 'x-sync-token': token };
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
    const handler = createSyncRouteHandler({ secret: SECRET, apply, log });
    const res = makeRes();

    await handler(makeSignedReq(validEvent, 'wrong-secret') as never, res as never);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(apply).not.toHaveBeenCalled();
  });

  it('rejects requests with an expired timestamp with 401', async () => {
    const apply = vi.fn();
    const handler = createSyncRouteHandler({ secret: SECRET, apply, log });
    const res = makeRes();
    const expired = String(Date.now() - 10 * 60 * 1000);

    await handler(makeSignedReq(validEvent, SECRET, expired) as never, res as never);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(apply).not.toHaveBeenCalled();
  });

  it('rejects bearer-token requests with 401 (no cross-mode acceptance)', async () => {
    const apply = vi.fn();
    const handler = createSyncRouteHandler({ secret: SECRET, apply, log });
    const res = makeRes();

    await handler(makeTokenReq(validEvent, SECRET) as never, res as never);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(apply).not.toHaveBeenCalled();
  });

  it('rejects malformed events with 400', async () => {
    const apply = vi.fn();
    const handler = createSyncRouteHandler({ secret: SECRET, apply, log });
    const res = makeRes();

    await handler(makeSignedReq({ type: 'nope' }, SECRET) as never, res as never);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(apply).not.toHaveBeenCalled();
  });

  it('rejects invalid JSON with 400 before checking auth', async () => {
    const apply = vi.fn();
    const handler = createSyncRouteHandler({ secret: SECRET, apply, log });
    const res = makeRes();

    await handler(makeRawReq('{invalid', {}) as never, res as never);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(apply).not.toHaveBeenCalled();
  });

  it('applies a valid signed event and responds 200', async () => {
    const apply = vi.fn().mockResolvedValue(undefined);
    const handler = createSyncRouteHandler({ secret: SECRET, apply, log });
    const res = makeRes();

    await handler(makeSignedReq(validEvent, SECRET) as never, res as never);

    expect(apply).toHaveBeenCalledWith(validEvent);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ ok: true });
  });

  it('verifies the signature against the exact raw bytes from req.rawBody', async () => {
    const apply = vi.fn().mockResolvedValue(undefined);
    const handler = createSyncRouteHandler({ secret: SECRET, apply, log });
    const res = makeRes();

    // Simulate n8n's rawBodyReader: rawBody + pre-parsed body, no readable stream
    const raw = JSON.stringify(validEvent);
    const timestamp = String(Date.now());
    const req = Readable.from([]) as TestReq;
    req.headers = { 'x-sync-timestamp': timestamp, 'x-sync-signature': signPayload(SECRET, timestamp, raw) };
    req.rawBody = Buffer.from(raw);
    req.body = validEvent;

    await handler(req as never, res as never);

    expect(apply).toHaveBeenCalledWith(validEvent);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('responds 500 when applying fails', async () => {
    const apply = vi.fn().mockRejectedValue(new Error('db down'));
    const handler = createSyncRouteHandler({ secret: SECRET, apply, log });
    const res = makeRes();

    await handler(makeSignedReq(validEvent, SECRET) as never, res as never);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(log.error).toHaveBeenCalled();
  });
});

describe('createSyncRouteHandler (token mode)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('accepts a valid bearer token', async () => {
    const apply = vi.fn().mockResolvedValue(undefined);
    const handler = createSyncRouteHandler({ secret: SECRET, apply, log, authMode: 'token' });
    const res = makeRes();

    await handler(makeTokenReq(validEvent, SECRET) as never, res as never);

    expect(apply).toHaveBeenCalledWith(validEvent);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('rejects hmac-signed requests with 401 (no cross-mode acceptance)', async () => {
    const apply = vi.fn();
    const handler = createSyncRouteHandler({ secret: SECRET, apply, log, authMode: 'token' });
    const res = makeRes();

    await handler(makeSignedReq(validEvent, SECRET) as never, res as never);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(apply).not.toHaveBeenCalled();
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
