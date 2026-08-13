import { hostname } from 'node:os';

import type { SyncConfig } from '../shared/config';
import { createLogger } from '../shared/logger';
import type { SyncEvent } from '../shared/types';
import { createPublisherHooks } from './hooks';
import { createEventOrderingAllocator } from './order-state';
import { createEventSender } from './sender';

export interface PublisherHookRuntimeDeps {
  createLogger?: typeof createLogger;
  createEventSender?: typeof createEventSender;
  createEventOrderingAllocator?: typeof createEventOrderingAllocator;
  createPublisherHooks?: typeof createPublisherHooks;
  hostname?: () => string;
}

export function createPublisherHookConfig(config: SyncConfig, deps: PublisherHookRuntimeDeps = {}) {
  const loggerFactory = deps.createLogger ?? createLogger;
  const eventSenderFactory = deps.createEventSender ?? createEventSender;
  const orderingFactory = deps.createEventOrderingAllocator ?? createEventOrderingAllocator;
  const hooksFactory = deps.createPublisherHooks ?? createPublisherHooks;
  const getHostname = deps.hostname ?? hostname;
  const log = loggerFactory('N8nSyncPublisher', { minLevel: config.logLevel });
  const sourceId = config.publisher.sourceId || getHostname();

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
  const emit = async (event: SyncEvent): Promise<void> => {
    if (!senders.length) {
      log.warn('SYNC_SUBSCRIBER_URLS is not set; dropping sync event', { type: event.type });
      return;
    }

    for (const sender of senders) {
      sender.send(event);
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
  });

  log.info('n8n-sync publisher hooks registered', {
    sourceId,
    authMode: config.auth.mode,
    targets: senders.length ? config.publisher.subscriberUrls : '(disabled)',
    maxQueueSize: config.publisher.maxQueueSize,
    orderingStatePath: config.publisher.publisherStatePath,
    entities,
    ...tagFilter,
  });

  return hooksFactory({ emit, log, sourceId, ordering, entities, ...tagFilter });
}
