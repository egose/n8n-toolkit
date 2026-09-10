import { sendSyncEvent, SyncSendError } from '../shared/http';
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

interface QueueNode {
  event: SyncEvent;
  key: string;
  previous: QueueNode | undefined;
  next: QueueNode | undefined;
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
  const queuedByKey = new Map<string, QueueNode>();
  const idleResolvers = new Set<() => void>();
  let queueHead: QueueNode | undefined;
  let queueTail: QueueNode | undefined;
  let queueSize = 0;
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
    if (draining || queueSize > 0) {
      return;
    }

    for (const resolve of idleResolvers) {
      resolve();
    }
    idleResolvers.clear();
  };

  const removeNode = (node: QueueNode): void => {
    if (node.previous) {
      node.previous.next = node.next;
    } else {
      queueHead = node.next;
    }

    if (node.next) {
      node.next.previous = node.previous;
    } else {
      queueTail = node.previous;
    }

    queuedByKey.delete(node.key);
    queueSize -= 1;
    node.previous = undefined;
    node.next = undefined;
  };

  const appendEvent = (event: SyncEvent, key: string): void => {
    const node: QueueNode = { event, key, previous: queueTail, next: undefined };

    if (queueTail) {
      queueTail.next = node;
    } else {
      queueHead = node;
    }

    queueTail = node;
    queuedByKey.set(key, node);
    queueSize += 1;
  };

  const shiftEvent = (): SyncEvent | undefined => {
    const node = queueHead;
    if (!node) {
      return undefined;
    }

    const event = node.event;
    removeNode(node);
    return event;
  };

  const pumpQueue = async (): Promise<void> => {
    if (draining) {
      return;
    }

    draining = true;
    try {
      while (queueSize > 0) {
        const event = shiftEvent();
        if (!event) {
          continue;
        }

        try {
          await deliver(event);
          options.log.debug('Sync event delivered', { type: event.type, target: url });
        } catch (error) {
          logError(options.log, error, {
            context: 'publish sync event',
            type: event.type,
            target: url,
            ...(error instanceof SyncSendError && error.status !== undefined
              ? { status: error.status, retryable: error.retryable }
              : {}),
          });
        }
      }
    } finally {
      draining = false;
      resolveIdle();
      if (queueSize > 0) {
        void pumpQueue();
      }
    }
  };

  const send = (event: SyncEvent): void => {
    const key = coalescingKey(event);
    const existing = queuedByKey.get(key);
    if (existing) {
      removeNode(existing);
      options.log.debug('Coalesced queued sync event', { type: event.type, target: url, queueDepth: queueSize });
    }

    if (queueSize >= maxQueueSize) {
      const dropped = shiftEvent();
      options.log.warn('Sync queue is full; dropping oldest queued event', {
        target: url,
        droppedType: dropped?.type,
        queueDepth: queueSize,
        maxQueueSize,
      });
    }

    appendEvent(event, key);
    options.log.debug('Queued sync event', { type: event.type, target: url, queueDepth: queueSize });
    void pumpQueue();
  };

  return {
    send,
    drain: () =>
      !draining && queueSize === 0
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            idleResolvers.add(resolve);
          }),
  };
}
