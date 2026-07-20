import { hostname } from 'node:os';

import {
  SYNC_EVENTS_PATH,
  SYNC_MAX_RETRIES,
  SYNC_SHARED_SECRET,
  SYNC_SOURCE_ID,
  SYNC_SUBSCRIBER_URL,
  SYNC_TIMEOUT_MS,
} from '../shared/config';
import { sendSyncEvent } from '../shared/http';
import { createLogger, logError } from '../shared/logger';
import type { SyncEvent } from '../shared/types';
import { createPublisherHooks } from './hooks';

const log = createLogger('N8nSyncPublisher');

function createHookConfig() {
  const sourceId = SYNC_SOURCE_ID || hostname();
  const eventsUrl = `${SYNC_SUBSCRIBER_URL}${SYNC_EVENTS_PATH}`;

  /**
   * Deliver an event to the subscriber. Errors are caught and logged so a
   * sync failure can never break n8n operations (hook rejections propagate
   * to users — e.g. a rejecting `workflow.activate` hook cancels activation).
   */
  const emit = async (event: SyncEvent): Promise<void> => {
    if (!SYNC_SUBSCRIBER_URL) {
      log.warn('SYNC_SUBSCRIBER_URL is not set; dropping sync event', { type: event.type });
      return;
    }

    try {
      await sendSyncEvent(event, {
        url: eventsUrl,
        token: SYNC_SHARED_SECRET,
        timeoutMs: SYNC_TIMEOUT_MS,
        maxRetries: SYNC_MAX_RETRIES,
        log,
      });
      log.debug('Sync event delivered', { type: event.type });
    } catch (error) {
      logError(log, error, { context: 'publish sync event', type: event.type });
    }
  };

  log.info('n8n-sync publisher hooks registered', {
    sourceId,
    subscriber: SYNC_SUBSCRIBER_URL ? eventsUrl : '(disabled)',
  });

  return createPublisherHooks({ emit, sourceId });
}

/** n8n external-hooks entry: CommonJS export for the hook runtime. */
export = createHookConfig();
