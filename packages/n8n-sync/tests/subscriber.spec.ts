import type { IncomingMessage } from 'node:http';
import { Readable } from 'node:stream';

import { beforeEach, describe, expect, it, vi } from 'vitest';

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

function makeReq(body: unknown, token?: string): IncomingMessage & { body?: unknown } {
  const req = Readable.from(body === undefined ? [] : [JSON.stringify(body)]) as IncomingMessage & { body?: unknown };
  req.headers = token === undefined ? {} : { 'x-sync-token': token };
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

describe('createSyncRouteHandler', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects requests without a valid token with 401', async () => {
    const apply = vi.fn();
    const handler = createSyncRouteHandler({ secret: SECRET, apply, log });
    const res = makeRes();

    await handler(makeReq(validEvent, 'wrong') as never, res as never);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(apply).not.toHaveBeenCalled();
  });

  it('rejects malformed events with 400', async () => {
    const apply = vi.fn();
    const handler = createSyncRouteHandler({ secret: SECRET, apply, log });
    const res = makeRes();

    await handler(makeReq({ type: 'nope' }, SECRET) as never, res as never);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(apply).not.toHaveBeenCalled();
  });

  it('rejects invalid JSON with 400', async () => {
    const apply = vi.fn();
    const handler = createSyncRouteHandler({ secret: SECRET, apply, log });
    const req = Readable.from(['{invalid']) as IncomingMessage & { body?: unknown };
    req.headers = { 'x-sync-token': SECRET };
    const res = makeRes();

    await handler(req as never, res as never);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(apply).not.toHaveBeenCalled();
  });

  it('applies a valid event and responds 200', async () => {
    const apply = vi.fn().mockResolvedValue(undefined);
    const handler = createSyncRouteHandler({ secret: SECRET, apply, log });
    const res = makeRes();

    await handler(makeReq(validEvent, SECRET) as never, res as never);

    expect(apply).toHaveBeenCalledWith(validEvent);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ ok: true });
  });

  it('responds 500 when applying fails', async () => {
    const apply = vi.fn().mockRejectedValue(new Error('db down'));
    const handler = createSyncRouteHandler({ secret: SECRET, apply, log });
    const res = makeRes();

    await handler(makeReq(validEvent, SECRET) as never, res as never);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(log.error).toHaveBeenCalled();
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
});
