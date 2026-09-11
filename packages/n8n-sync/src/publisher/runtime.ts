import type { SyncConfig } from '../shared/config';
import { createLogger, logError } from '../shared/logger';
import type { SyncEvent } from '../shared/types';
import { createPublisherHooks } from './hooks';
import { createEventOrderingAllocator } from './order-state';
import { createEventSender, type EventSendOptions } from './sender';

export interface PublisherHookRuntimeDeps {
  createLogger?: typeof createLogger;
  createEventSender?: typeof createEventSender;
  createEventOrderingAllocator?: typeof createEventOrderingAllocator;
  createPublisherHooks?: typeof createPublisherHooks;
}

export function createPublisherHookConfig(config: SyncConfig, deps: PublisherHookRuntimeDeps = {}) {
  const loggerFactory = deps.createLogger ?? createLogger;
  const eventSenderFactory = deps.createEventSender ?? createEventSender;
  const orderingFactory = deps.createEventOrderingAllocator ?? createEventOrderingAllocator;
  const hooksFactory = deps.createPublisherHooks ?? createPublisherHooks;
  const log = loggerFactory('N8nSyncPublisher', { minLevel: config.logLevel });
  const sourceId = config.publisher.sourceId || 'disabled';

  // One serialized sender per target: deliveries to a given target happen in
  // hook order, and a slow/unreachable target never delays the others.
  const senders = config.publisher.subscriberUrls.map((baseUrl) =>
    eventSenderFactory({
      baseUrl,
      eventsPath: config.publisher.eventsPath,
      auth: config.auth,
      timeoutMs: config.publisher.timeoutMs,
      maxAttempts: config.publisher.maxAttempts,
      maxQueueSize: config.publisher.maxQueueSize,
      log,
    }),
  );

  /**
   * Fan an event out to every target. Delivery is queued in the background
   * and failures are caught + logged per target, so a sync outage can never
   * break n8n operations (hook rejections propagate to users — e.g. a
   * rejecting `workflow.activate` hook cancels activation).
   */
  const emit = async (event: SyncEvent, opts?: EventSendOptions): Promise<void> => {
    if (!senders.length) {
      log.warn('SYNC_SUBSCRIBER_URLS is not set; dropping sync event', { type: event.type });
      return;
    }

    for (const sender of senders) {
      sender.send(event, opts);
    }
  };

  const entities = {
    workflows: config.entities.has('workflows'),
    credentials: config.entities.has('credentials'),
    executions: config.entities.has('executions'),
  };

  const tagFilter = {
    filterByTag: config.filterByTag,
    syncWorkflowTag: config.syncWorkflowTag,
    activeTag: config.activeTag,
  };

  const ordering = orderingFactory({
    sourceId,
    statePath: config.publisher.publisherStatePath,
    invalidState: config.publisher.invalidState,
  });

  const logContext = {
    sourceId,
    authMode: config.auth.mode,
    targets: senders.length ? config.publisher.subscriberUrls : '(disabled)',
    maxQueueSize: config.publisher.maxQueueSize,
    orderingStatePath: config.publisher.publisherStatePath,
    entities,
    ...tagFilter,
  };

  if (senders.length > 0) {
    log.info('Initializing n8n-sync publisher state...', logContext);
    void ordering
      .initialize()
      .then(() => {
        const reset = typeof ordering.getInvalidStateReset === 'function' ? ordering.getInvalidStateReset() : undefined;
        if (reset) {
          log.warn(
            'Sync publisher order state quarantined and reset for a new source epoch; a full subscriber resync is mandatory before trusting convergence',
            {
              ...logContext,
              previousSourceId: reset.previousSourceId,
              newSourceId: reset.newSourceId,
              quarantinedBackupPath: reset.backupPath,
              invalidStateMode: config.publisher.invalidState,
            },
          );
        }
        const summary = typeof ordering.getStateSummary === 'function' ? ordering.getStateSummary() : undefined;
        log.info('n8n-sync publisher hooks registered', {
          ...logContext,
          invalidStateMode: config.publisher.invalidState,
          ...(summary
            ? {
                publisherStateVersion: summary.version,
                publisherStateSourceId: summary.sourceId,
                publisherNextEventSequence: summary.nextEventSequence,
                publisherEntityKeyCount: summary.entityKeyCount,
              }
            : {}),
        });
      })
      .catch((error) => {
        logError(log, error, { context: 'publisher state readiness initialization' });
        const status = ordering.getStatus();
        const reset = typeof ordering.getInvalidStateReset === 'function' ? ordering.getInvalidStateReset() : undefined;
        log.warn('n8n-sync publisher hooks registered in degraded state', {
          ...logContext,
          ...(status.ready === true ? {} : { reason: status.reason }),
          invalidStateMode: config.publisher.invalidState,
          ...(reset ? { quarantinedBackupPath: reset.backupPath } : {}),
        });
      });
  } else {
    log.info('n8n-sync publisher hooks registered', logContext);
  }

  return hooksFactory({
    emit,
    log,
    sourceId,
    ordering,
    orderingStatus: () => ordering.getStatus(),
    entities,
    ...tagFilter,
  });
}
