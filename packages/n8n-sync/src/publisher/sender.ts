import { sendSyncEvent } from '../shared/http';
import { logError, type Logger } from '../shared/logger';
import type { SyncAuthConfig } from '../shared/config';
import type { SyncEvent } from '../shared/types';

export interface EventSenderOptions {
  /** Base URL of the target instance (no trailing slash). */
  baseUrl: string;
  eventsPath: string;
  auth: SyncAuthConfig;
  timeoutMs: number;
  maxAttempts: number;
  maxQueueSize?: number;
  log: Logger;
  /** Injectable for tests. */
  fetchImpl?: typeof fetch;
  /** Injectable for tests. */
  sleep?: (ms: number) => Promise<void>;
}

export interface EventSender {
  /**
   * Enqueue an event for delivery. Resolves once the event is queued —
   * delivery continues in the background so n8n hooks stay fast.
   */
  send(event: SyncEvent): void;
  /** Resolves when every queued event has been delivered (or has failed). */
  drain(): Promise<void>;
}

/**
 * Create a per-target sender with a serialized delivery queue: events are
 * delivered one at a time, in the exact order the hooks fired. Exact
 * duplicates that preserve the same semantic operation may replace older
 * queued entries, but mixed operations stay ordered. A failed delivery is
 * logged and does not block the rest of the queue.
 */
export function createEventSender(options: EventSenderOptions): EventSender {
  const url = `${options.baseUrl}${options.eventsPath}`;
  const maxQueueSize = Math.max(1, options.maxQueueSize ?? 1000);
  const queue: SyncEvent[] = [];
  const idleResolvers = new Set<() => void>();
  let draining = false;

  const deliver = (event: SyncEvent): Promise<void> =>
    sendSyncEvent(event, {
      url,
      auth: options.auth,
      timeoutMs: options.timeoutMs,
      maxAttempts: options.maxAttempts,
      log: options.log,
      fetchImpl: options.fetchImpl,
      sleep: options.sleep,
    });

  const coalescingKey = (event: SyncEvent): string => {
    switch (event.type) {
      case 'workflow.upsert':
        return `workflow.upsert:${event.workflow.id}`;
      case 'workflow.activate':
        return `workflow.activate:${event.workflow.id}`;
      case 'workflow.delete':
        return `workflow.delete:${event.workflowId}`;
      case 'workflow.archive':
        return `workflow.archive:${event.workflowId}:${event.archived ? 'archived' : 'unarchived'}`;
      case 'credentials.upsert':
        return `credential.upsert:${event.credential.id}`;
      case 'credentials.delete':
        return `credential.delete:${event.credentialId}`;
      case 'execution.upsert':
        return `execution.upsert:${event.execution.id}`;
    }
  };

  const resolveIdle = () => {
    if (draining || queue.length > 0) {
      return;
    }

    for (const resolve of idleResolvers) {
      resolve();
    }
    idleResolvers.clear();
  };

  const pumpQueue = async (): Promise<void> => {
    if (draining) {
      return;
    }

    draining = true;
    try {
      while (queue.length > 0) {
        const event = queue.shift();
        if (!event) {
          continue;
        }

        try {
          await deliver(event);
          options.log.debug('Sync event delivered', { type: event.type, target: url });
        } catch (error) {
          logError(options.log, error, { context: 'publish sync event', type: event.type, target: url });
        }
      }
    } finally {
      draining = false;
      resolveIdle();
      if (queue.length > 0) {
        void pumpQueue();
      }
    }
  };

  const send = (event: SyncEvent): void => {
    const key = coalescingKey(event);
    const existingIndex = queue.findIndex((queuedEvent) => coalescingKey(queuedEvent) === key);
    if (existingIndex >= 0) {
      queue.splice(existingIndex, 1);
      options.log.debug('Coalesced queued sync event', { type: event.type, target: url, key });
    }

    if (queue.length >= maxQueueSize) {
      const dropped = queue.shift();
      options.log.warn('Sync queue is full; dropping oldest queued event', {
        target: url,
        droppedType: dropped?.type,
        droppedKey: dropped ? coalescingKey(dropped) : undefined,
        maxQueueSize,
      });
    }

    queue.push(event);
    void pumpQueue();
  };

  return {
    send,
    drain: () =>
      !draining && queue.length === 0
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            idleResolvers.add(resolve);
          }),
  };
}
