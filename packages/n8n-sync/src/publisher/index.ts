import { hostname } from 'node:os';

import {
  SYNC_ACTIVE_TAG,
  SYNC_AUTH_MODE,
  SYNC_ENTITIES,
  SYNC_EVENTS_PATH,
  SYNC_FILTER_BY_TAG,
  SYNC_MAX_RETRIES,
  SYNC_SHARED_SECRET,
  SYNC_SOURCE_ID,
  SYNC_SUBSCRIBER_URLS,
  SYNC_TIMEOUT_MS,
  SYNC_WORKFLOW_TAG,
} from '../shared/config';
import { createLogger } from '../shared/logger';
import type { SyncEvent } from '../shared/types';
import { createPublisherHooks } from './hooks';
import { createEventSender } from './sender';

const log = createLogger('N8nSyncPublisher');

function createHookConfig() {
  const sourceId = SYNC_SOURCE_ID || hostname();

  // One serialized sender per target: deliveries to a given target happen in
  // hook order, and a slow/unreachable target never delays the others.
  const senders = SYNC_SUBSCRIBER_URLS.map((baseUrl) =>
    createEventSender({
      baseUrl,
      eventsPath: SYNC_EVENTS_PATH,
      secret: SYNC_SHARED_SECRET,
      authMode: SYNC_AUTH_MODE,
      timeoutMs: SYNC_TIMEOUT_MS,
      maxRetries: SYNC_MAX_RETRIES,
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
    workflows: SYNC_ENTITIES.has('workflows'),
    credentials: SYNC_ENTITIES.has('credentials'),
    executions: SYNC_ENTITIES.has('executions'),
  };

  const tagFilter = {
    filterByTag: SYNC_FILTER_BY_TAG,
    syncWorkflowTag: SYNC_WORKFLOW_TAG,
    activeTag: SYNC_ACTIVE_TAG,
  };

  log.info('n8n-sync publisher hooks registered', {
    sourceId,
    authMode: SYNC_AUTH_MODE,
    targets: senders.length ? SYNC_SUBSCRIBER_URLS : '(disabled)',
    entities,
    ...tagFilter,
  });

  return createPublisherHooks({ emit, sourceId, entities, ...tagFilter });
}

/** n8n external-hooks entry: CommonJS export for the hook runtime. */
export = createHookConfig();
