import type { Express, Request, Response } from 'express';

import {
  createRequestReplayGuard,
  verifyRequest,
  verifyRequestToken,
  type RequestReplayGuard,
  type RequestReplayReservation,
} from '../shared/auth';
import { assertJsonRequest, BodyParseError, parseJsonBody, readJsonBody, readRawBody } from '../shared/body';
import type { SyncAuthConfig } from '../shared/config';
import { logError, type Logger } from '../shared/logger';
import type { StateStoreStatus } from '../shared/ordering';
import { parseSyncEvent } from '../shared/validate';
import { SyncEntityTimestampConflictError } from './applier';
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
  readiness?: () => StateStoreStatus | Promise<StateStoreStatus>;
}

type SyncRequest = Request & { rawBody?: Buffer | string; body?: unknown };

const READINESS_LOG_INTERVAL_MS = 60_000;

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
  let lastReadinessLogAt = 0;
  let lastReadinessReason: string | undefined;

  const checkReady = async (): Promise<boolean> => {
    if (!deps.readiness) return true;
    let status: StateStoreStatus;
    try {
      status = await deps.readiness();
    } catch (error) {
      logError(deps.log, error, { context: 'sync readiness check' });
      return false;
    }
    if (status.ready === true) {
      lastReadinessReason = undefined;
      return true;
    }

    const now = Date.now();
    if (status.reason !== lastReadinessReason || now - lastReadinessLogAt >= READINESS_LOG_INTERVAL_MS) {
      deps.log.warn('n8n-sync subscriber is not ready', { reason: status.reason });
      lastReadinessLogAt = now;
      lastReadinessReason = status.reason;
    }
    return false;
  };

  return async function syncEventsHandler(req: Request, res: Response): Promise<void> {
    const syncReq = req as SyncRequest;
    let replayReservation: RequestReplayReservation | undefined;

    if (!(await checkReady())) {
      res.status(503).json({ ok: false, ready: false });
      return;
    }

    const handleBodyFailure = (error: unknown): void => {
      replayReservation?.release();
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

        replayReservation = replayGuard?.reserve(syncReq);
        if (replayReservation?.status === 'replayed') {
          res.status(409).json({ error: 'replayed request' });
          return;
        }

        payload = parseJson(raw);
      } else {
        ({ parsed: payload } = await readJson(syncReq, deps.maxBodyBytes));
      }
    } catch (error) {
      handleBodyFailure(error);
      return;
    }

    const event = parseSyncEvent(payload);
    if (!event) {
      replayReservation?.release();
      res.status(400).json({ error: 'invalid sync event' });
      return;
    }

    try {
      const result = await deps.apply(event);
      if (result?.status === 'disabled') {
        replayReservation?.complete();
        res.status(422).json({
          error: 'sync entity disabled',
          code: result.error.code,
          entity: result.error.entity,
        });
        return;
      }
      if (result?.status === 'conflict') {
        replayReservation?.complete();
        res.status(409).json({ error: 'sync revision conflict', code: result.error.code });
        return;
      }
      replayReservation?.complete();
      res.status(200).json({ ok: true });
    } catch (error) {
      if (error instanceof SyncEntityTimestampConflictError) {
        replayReservation?.complete();
        res.status(409).json({ error: 'sync entity timestamp conflict', code: error.code });
        return;
      }
      replayReservation?.release();
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
  readiness?: () => StateStoreStatus | Promise<StateStoreStatus>,
): void {
  app.get(`${routeBase}/health`, (_req, res) => {
    res.status(200).json({ ok: true });
  });
  app.get(`${routeBase}/ready`, async (_req, res) => {
    try {
      const status = readiness ? await readiness() : { ready: true as const };
      if (status.ready === true) {
        res.status(200).json({ ok: true, ready: true });
        return;
      }
      res.status(503).json({ ok: false, ready: false, reason: status.reason });
    } catch {
      res.status(503).json({ ok: false, ready: false });
    }
  });
  app.post(`${routeBase}/events`, handler);
}
