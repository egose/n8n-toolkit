import type { Express } from 'express';

import type { SyncConfig } from '../shared/config';
import { createLogger, logError } from '../shared/logger';
import { createApplier } from './applier';
import { createExecutionIdentityStore, getExecutionIdentityStatePath } from './execution-identity';
import { createSubscriberHooks } from './hooks';
import { buildN8nSyncRepositories, type N8nSyncRepositories } from './n8n-runtime';
import { createSyncOrderingStore } from './order-state';
import { createWorkflowPublicationManager } from './publication';
import { createSyncRouteHandler, mountSyncRoutes } from './routes';

export interface SubscriberHookRuntimeDeps {
  buildN8nSyncRepositories?: typeof buildN8nSyncRepositories;
  createSyncOrderingStore?: typeof createSyncOrderingStore;
  createExecutionIdentityStore?: typeof createExecutionIdentityStore;
  createApplier?: typeof createApplier;
  createWorkflowPublicationManager?: typeof createWorkflowPublicationManager;
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
  const createExecutionStore = deps.createExecutionIdentityStore ?? createExecutionIdentityStore;
  const createApply = deps.createApplier ?? createApplier;
  const createPublicationManager = deps.createWorkflowPublicationManager ?? createWorkflowPublicationManager;
  const createRouteHandler = deps.createSyncRouteHandler ?? createSyncRouteHandler;
  const mountRoutes = deps.mountSyncRoutes ?? mountSyncRoutes;

  /**
   * Operator visibility for graceful degradation: with
   * `SYNC_APPLY_ACTIVE_STATE=true` but publication services unresolvable,
   * the subscriber keeps the legacy DB-column-only behavior. Warn once at
   * startup so nobody mistakes the column flag for a real publish.
   */
  function warnWhenPublicationUnavailable(n8nRepositories: N8nSyncRepositories): void {
    if (
      config.subscriber.applyActiveState &&
      (!n8nRepositories.workflowHistoryService || !n8nRepositories.workflowService)
    ) {
      log.warn('Target-side workflow publication unavailable; active state stays DB-column-only', {
        n8nCorePath: config.subscriber.n8nCorePath,
      });
    }
  }

  return createSubscriberHooks({
    ready: async (server) => {
      log.info('Initializing n8n-sync subscriber...', { entities: [...config.entities] });

      const authValue = config.auth.mode === 'token' ? config.auth.token : config.auth.secret;
      if (!authValue) {
        throw new Error('SYNC_SHARED_SECRET is not set');
      }

      const n8nRepositories = buildRepositories({
        entities: config.entities,
        includeExecutions,
        diPath: config.subscriber.n8nDiPath,
        dbPath: config.subscriber.n8nDbPath,
        corePath: config.subscriber.n8nCorePath,
      });
      const ordering = createOrderingStore({ statePath: config.subscriber.subscriberStatePath });
      const executionIdentity = includeExecutions
        ? createExecutionStore({ statePath: getExecutionIdentityStatePath(config.subscriber.subscriberStatePath) })
        : undefined;

      try {
        if (typeof ordering.initialize === 'function') {
          await ordering.initialize();
        }
        if (executionIdentity && typeof executionIdentity.initialize === 'function') {
          await executionIdentity.initialize();
        }
      } catch (error) {
        logError(log, error, { context: 'subscriber state readiness initialization' });
      }

      const readiness = () => {
        const stores = [ordering, executionIdentity].filter(Boolean);
        const notReady = stores.find((store) => {
          if (typeof store?.getStatus !== 'function') return false;
          return !store.getStatus().ready;
        });
        return notReady && typeof notReady.getStatus === 'function' ? notReady.getStatus() : { ready: true as const };
      };

      const apply = createApply(n8nRepositories, {
        targetProjectId: config.subscriber.targetProjectId || undefined,
        applyActiveState: config.subscriber.applyActiveState,
        allowedEntities: config.entities,
        ordering,
        ...(executionIdentity ? { executionIdentity } : {}),
        publication: createPublicationManager(
          {
            historyService: n8nRepositories.workflowHistoryService,
            workflowService: n8nRepositories.workflowService,
          },
          { log },
        ),
        log,
      });
      warnWhenPublicationUnavailable(n8nRepositories);

      const handler = createRouteHandler({
        auth: config.auth,
        apply,
        log,
        maxBodyBytes: config.subscriber.maxBodyBytes,
        signatureToleranceMs: config.subscriber.signatureToleranceMs,
        replayCacheSize: config.subscriber.replayCacheSize,
        readiness,
      });
      mountRoutes(resolveExpressApp(server), handler, config.subscriber.routeBase, readiness);

      const readinessStatus = readiness();
      const logContext = {
        routeBase: config.subscriber.routeBase,
        authMode: config.auth.mode,
        executionsEnabled: includeExecutions,
        replayCacheSize: config.auth.mode === 'hmac' ? config.subscriber.replayCacheSize : 0,
        orderingStatePath: config.subscriber.subscriberStatePath,
        ...(includeExecutions
          ? { executionIdentityStatePath: getExecutionIdentityStatePath(config.subscriber.subscriberStatePath) }
          : {}),
      };
      if (readinessStatus.ready === true) {
        log.info('n8n-sync subscriber routes active.', logContext);
      } else {
        log.warn('n8n-sync subscriber routes mounted but not ready.', {
          ...logContext,
          reason: readinessStatus.reason,
        });
      }
    },
  });
}
