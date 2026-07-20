import { SYNC_APPLY_ACTIVE_STATE, SYNC_ROUTE_BASE, SYNC_SHARED_SECRET, SYNC_TARGET_PROJECT_ID } from '../shared/config';
import { createLogger } from '../shared/logger';
import { createApplier } from './applier';
import { createSubscriberHooks } from './hooks';
import { buildN8nSyncRepositories } from './n8n-runtime';
import { createSyncRouteHandler, mountSyncRoutes } from './routes';

const log = createLogger('N8nSyncSubscriber');

function createHookConfig() {
  return createSubscriberHooks({
    ready: async (server) => {
      log.info('Initializing n8n-sync subscriber...');

      if (!SYNC_SHARED_SECRET) {
        throw new Error('SYNC_SHARED_SECRET is not set');
      }

      const n8nRepositories = buildN8nSyncRepositories();
      const apply = createApplier(n8nRepositories, {
        targetProjectId: SYNC_TARGET_PROJECT_ID || undefined,
        applyActiveState: SYNC_APPLY_ACTIVE_STATE,
        log,
      });

      const handler = createSyncRouteHandler({ secret: SYNC_SHARED_SECRET, apply, log });
      mountSyncRoutes(server.app, handler, SYNC_ROUTE_BASE);

      log.info('n8n-sync subscriber routes active.', { routeBase: SYNC_ROUTE_BASE });
    },
  });
}

/** n8n external-hooks entry: CommonJS export for the hook runtime. */
export = createHookConfig();
