import type { Express } from 'express';

import type { SyncConfig } from '../shared/config';
import { createLogger } from '../shared/logger';
import { createApplier } from './applier';
import { createSubscriberHooks } from './hooks';
import { buildN8nSyncRepositories } from './n8n-runtime';
import { createSyncOrderingStore } from './order-state';
import { createSyncRouteHandler, mountSyncRoutes } from './routes';

export interface SubscriberHookRuntimeDeps {
  buildN8nSyncRepositories?: typeof buildN8nSyncRepositories;
  createSyncOrderingStore?: typeof createSyncOrderingStore;
  createApplier?: typeof createApplier;
  createSyncRouteHandler?: typeof createSyncRouteHandler;
  mountSyncRoutes?: typeof mountSyncRoutes;
}

function resolveExpressApp(server: { app?: Express } | Express): Express {
  const app = (server as { app?: Express }).app;
  return app && typeof app.get === 'function' && typeof app.post === 'function' ? app : (server as Express);
}

export function createSubscriberHookConfig(config: SyncConfig, deps: SubscriberHookRuntimeDeps = {}) {
  const log = createLogger('N8nSyncSubscriber', { minLevel: config.logLevel });
  const includeExecutions = config.entities.has('executions');
  const buildRepositories = deps.buildN8nSyncRepositories ?? buildN8nSyncRepositories;
  const createOrderingStore = deps.createSyncOrderingStore ?? createSyncOrderingStore;
  const createApply = deps.createApplier ?? createApplier;
  const createRouteHandler = deps.createSyncRouteHandler ?? createSyncRouteHandler;
  const mountRoutes = deps.mountSyncRoutes ?? mountSyncRoutes;

  return createSubscriberHooks({
    ready: async (server) => {
      log.info('Initializing n8n-sync subscriber...', { entities: [...config.entities] });

      const authValue = config.auth.mode === 'token' ? config.auth.token : config.auth.secret;
      if (!authValue) {
        throw new Error('SYNC_SHARED_SECRET is not set');
      }

      const n8nRepositories = buildRepositories({
        includeExecutions,
        diPath: config.subscriber.n8nDiPath,
        dbPath: config.subscriber.n8nDbPath,
      });
      const ordering = createOrderingStore({ statePath: config.subscriber.subscriberStatePath });
      const apply = createApply(n8nRepositories, {
        targetProjectId: config.subscriber.targetProjectId || undefined,
        applyActiveState: config.subscriber.applyActiveState,
        ordering,
        log,
      });

      const handler = createRouteHandler({
        auth: config.auth,
        apply,
        log,
        maxBodyBytes: config.subscriber.maxBodyBytes,
        signatureToleranceMs: config.subscriber.signatureToleranceMs,
        replayCacheSize: config.subscriber.replayCacheSize,
      });
      mountRoutes(resolveExpressApp(server), handler, config.subscriber.routeBase);

      log.info('n8n-sync subscriber routes active.', {
        routeBase: config.subscriber.routeBase,
        authMode: config.auth.mode,
        executionsEnabled: includeExecutions,
        replayCacheSize: config.auth.mode === 'hmac' ? config.subscriber.replayCacheSize : 0,
        orderingStatePath: config.subscriber.subscriberStatePath,
      });
    },
  });
}
