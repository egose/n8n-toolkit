import type { Express, Request, Response } from 'express';

import { createRequestReplayGuard, verifyRequest, verifyRequestToken, type RequestReplayGuard } from '../shared/auth';
import { assertJsonRequest, BodyParseError, parseJsonBody, readJsonBody, readRawBody } from '../shared/body';
import type { SyncAuthConfig } from '../shared/config';
import { logError, type Logger } from '../shared/logger';
import { parseSyncEvent } from '../shared/validate';
import type { ApplySyncEvent } from './applier';

export interface SyncRouteHandlerDeps {
  auth: SyncAuthConfig;
  apply: ApplySyncEvent;
  log: Logger;
  /** Maximum request body accepted in bytes. */
  maxBodyBytes: number;
  /** Maximum signature age/skew accepted in hmac mode. */
  signatureToleranceMs: number;
  replayCacheSize: number;
  replayGuard?: RequestReplayGuard;
  assertJsonRequest?: typeof assertJsonRequest;
  readRawBody?: typeof readRawBody;
  readJsonBody?: typeof readJsonBody;
  parseJsonBody?: typeof parseJsonBody;
  verifyRequest?: typeof verifyRequest;
  verifyRequestToken?: typeof verifyRequestToken;
  createRequestReplayGuard?: typeof createRequestReplayGuard;
}

type SyncRequest = Request & { rawBody?: Buffer | string; body?: unknown };

/**
 * Build the POST /events request handler. The handler authenticates the
 * request (HMAC signature by default, or static bearer token), validates the
 * event envelope, then applies it.
 */
export function createSyncRouteHandler(deps: SyncRouteHandlerDeps) {
  const authMode = deps.auth.mode;
  const authValue = deps.auth.mode === 'token' ? deps.auth.token : deps.auth.secret;
  const assertJson = deps.assertJsonRequest ?? assertJsonRequest;
  const readRaw = deps.readRawBody ?? readRawBody;
  const readJson = deps.readJsonBody ?? readJsonBody;
  const parseJson = deps.parseJsonBody ?? parseJsonBody;
  const verifySignedRequest = deps.verifyRequest ?? verifyRequest;
  const verifyTokenRequest = deps.verifyRequestToken ?? verifyRequestToken;
  const replayGuardFactory = deps.createRequestReplayGuard ?? createRequestReplayGuard;
  const replayGuard =
    deps.replayGuard ??
    (authMode === 'hmac'
      ? replayGuardFactory({ ttlMs: deps.signatureToleranceMs, maxEntries: deps.replayCacheSize })
      : undefined);

  return async function syncEventsHandler(req: Request, res: Response): Promise<void> {
    const syncReq = req as SyncRequest;

    const handleBodyFailure = (error: unknown): void => {
      if (error instanceof BodyParseError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }

      logError(deps.log, error, { context: 'read sync request body', authMode });
      res.status(500).json({ error: 'failed to read request body' });
    };

    if (authMode === 'token' && !verifyTokenRequest(syncReq, authValue)) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }

    let payload: unknown;
    try {
      assertJson(syncReq);

      if (authMode === 'hmac') {
        const raw = await readRaw(syncReq, deps.maxBodyBytes, { allowParsedBodyFallback: false });
        if (!verifySignedRequest(syncReq, authValue, raw, authMode, deps.signatureToleranceMs)) {
          res.status(401).json({ error: 'unauthorized' });
          return;
        }

        if (replayGuard?.remember(syncReq) === 'replayed') {
          res.status(409).json({ error: 'replayed request' });
          return;
        }

        payload = syncReq.rawBody !== undefined && syncReq.body !== undefined ? syncReq.body : parseJson(raw);
      } else {
        ({ parsed: payload } = await readJson(syncReq, deps.maxBodyBytes));
      }
    } catch (error) {
      handleBodyFailure(error);
      return;
    }

    const event = parseSyncEvent(payload);
    if (!event) {
      res.status(400).json({ error: 'invalid sync event' });
      return;
    }

    try {
      await deps.apply(event);
      res.status(200).json({ ok: true });
    } catch (error) {
      logError(deps.log, error, { context: 'apply sync event', type: event.type, sourceId: event.sourceId });
      res.status(500).json({ error: 'failed to apply sync event' });
    }
  };
}

/** Mount the sync endpoints on the n8n server's Express app. */
export function mountSyncRoutes(
  app: Express,
  handler: ReturnType<typeof createSyncRouteHandler>,
  routeBase: string,
): void {
  app.get(`${routeBase}/health`, (_req, res) => {
    res.status(200).json({ ok: true });
  });
  app.post(`${routeBase}/events`, handler);
}
