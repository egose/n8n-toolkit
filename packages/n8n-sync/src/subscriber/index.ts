import type { Express } from 'express';

import {
  SYNC_APPLY_ACTIVE_STATE,
  SYNC_AUTH_MODE,
  SYNC_ENTITIES,
  SYNC_ROUTE_BASE,
  SYNC_SHARED_SECRET,
  SYNC_TARGET_PROJECT_ID,
} from '../shared/config';
import { createLogger } from '../shared/logger';
import { createApplier } from './applier';
import { createSubscriberHooks } from './hooks';
import { buildN8nSyncRepositories } from './n8n-runtime';
import { createSyncRouteHandler, mountSyncRoutes } from './routes';

const log = createLogger('N8nSyncSubscriber');

function resolveExpressApp(server: { app?: Express } | Express): Express {
  const app = (server as { app?: Express }).app;
  return app && typeof app.get === 'function' && typeof app.post === 'function' ? app : (server as Express);
}

function createHookConfig() {
  const includeExecutions = SYNC_ENTITIES.has('executions');

  return createSubscriberHooks({
    ready: async (server) => {
      log.info('Initializing n8n-sync subscriber...', { entities: [...SYNC_ENTITIES] });

      if (!SYNC_SHARED_SECRET) {
        throw new Error('SYNC_SHARED_SECRET is not set');
      }

      const n8nRepositories = buildN8nSyncRepositories({ includeExecutions });
      const apply = createApplier(n8nRepositories, {
        targetProjectId: SYNC_TARGET_PROJECT_ID || undefined,
        applyActiveState: SYNC_APPLY_ACTIVE_STATE,
        log,
      });

      const handler = createSyncRouteHandler({ secret: SYNC_SHARED_SECRET, apply, log, authMode: SYNC_AUTH_MODE });
      mountSyncRoutes(resolveExpressApp(server), handler, SYNC_ROUTE_BASE);

      log.info('n8n-sync subscriber routes active.', {
        routeBase: SYNC_ROUTE_BASE,
        authMode: SYNC_AUTH_MODE,
        executionsEnabled: includeExecutions,
      });
    },
  });
}

/** n8n external-hooks entry: CommonJS export for the hook runtime. */
export = createHookConfig();
