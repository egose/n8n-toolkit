import type { Express, Request, Response } from 'express';

import { isAuthorized } from '../shared/auth';
import { BodyParseError, readJsonBody } from '../shared/body';
import { SYNC_MAX_BODY_BYTES } from '../shared/config';
import { logError, type Logger } from '../shared/logger';
import { parseSyncEvent } from '../shared/validate';
import type { ApplySyncEvent } from './applier';

export interface SyncRouteHandlerDeps {
  secret: string;
  apply: ApplySyncEvent;
  log: Logger;
  maxBodyBytes?: number;
}

/**
 * Build the POST /events request handler. The handler authenticates the
 * shared secret, parses and validates the event envelope, then applies it.
 */
export function createSyncRouteHandler(deps: SyncRouteHandlerDeps) {
  const maxBodyBytes = deps.maxBodyBytes ?? SYNC_MAX_BODY_BYTES;

  return async function syncEventsHandler(req: Request, res: Response): Promise<void> {
    if (!isAuthorized(req, deps.secret)) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }

    let payload: unknown;
    try {
      payload = await readJsonBody(req, maxBodyBytes);
    } catch (error) {
      const statusCode = error instanceof BodyParseError ? error.statusCode : 400;
      res.status(statusCode).json({ error: error instanceof Error ? error.message : 'invalid body' });
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
