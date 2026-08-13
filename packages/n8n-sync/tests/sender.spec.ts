import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Logger } from '../src/shared/logger';
import type { SyncEvent, SyncWorkflowDto } from '../src/shared/types';
import { createEventSender } from '../src/publisher/sender';

const log: Logger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  child: vi.fn(),
};

function makeEvent(id: string): SyncEvent {
  return {
    type: 'workflow.delete',
    at: '2026-01-01T00:00:00.000Z',
    sourceId: 'src',
    eventId: `src:delete:${id}`,
    entityRevision: '1',
    workflowId: id,
  };
}

type WorkflowOperation = 'upsert' | 'activate' | 'archive' | 'unarchive' | 'delete';

function makeWorkflow(id: string, overrides: Partial<SyncWorkflowDto> = {}): SyncWorkflowDto {
  return {
    id,
    name: `Workflow ${id}`,
    active: false,
    isArchived: false,
    nodes: [],
    connections: {},
    ...overrides,
  };
}

function makeWorkflowEvent(
  operation: WorkflowOperation,
  id = 'wf-1',
  overrides: Partial<SyncWorkflowDto> = {},
): SyncEvent {
  const base = {
    at: '2026-01-01T00:00:00.000Z',
    sourceId: 'src',
    eventId: `src:${operation}:${id}`,
    entityRevision: '1',
  };

  switch (operation) {
    case 'upsert':
      return { ...base, type: 'workflow.upsert', workflow: makeWorkflow(id, overrides) };
    case 'activate':
      return { ...base, type: 'workflow.activate', workflow: makeWorkflow(id, { active: true, ...overrides }) };
    case 'archive':
      return { ...base, type: 'workflow.archive', workflowId: id, archived: true };
    case 'unarchive':
      return { ...base, type: 'workflow.archive', workflowId: id, archived: false };
    case 'delete':
      return { ...base, type: 'workflow.delete', workflowId: id };
  }
}

function eventLabel(event: SyncEvent): string {
  if (event.type === 'workflow.archive') {
    return event.archived ? 'workflow.archive' : 'workflow.unarchive';
  }

  return event.type;
}

function eventResourceId(event: SyncEvent): string {
  switch (event.type) {
    case 'workflow.upsert':
    case 'workflow.activate':
      return event.workflow.id;
    case 'workflow.delete':
    case 'workflow.archive':
      return event.workflowId;
    case 'credentials.upsert':
      return event.credential.id;
    case 'credentials.delete':
      return event.credentialId;
    case 'execution.upsert':
      return event.execution.id;
  }
}

function makeSenderOptions(fetchImpl: typeof fetch, overrides: Partial<{ maxQueueSize: number }> = {}) {
  return {
    baseUrl: 'https://target.example.com',
    eventsPath: '/rest/sync/v1/events',
    auth: { mode: 'hmac', secret: 's3cret' } as const, // pragma: allowlist secret
    timeoutMs: 1000,
    maxAttempts: 1,
    maxQueueSize: overrides.maxQueueSize,
    log,
    fetchImpl,
    sleep: vi.fn().mockResolvedValue(undefined) as (ms: number) => Promise<void>,
  };
}

describe('createEventSender', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('posts to <baseUrl><eventsPath>', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    const sender = createEventSender(makeSenderOptions(fetchImpl as unknown as typeof fetch));

    sender.send(makeEvent('wf-1'));
    await sender.drain();

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl.mock.calls[0][0]).toBe('https://target.example.com/rest/sync/v1/events');
  });

  it('delivers events strictly in FIFO order', async () => {
    const order: string[] = [];
    let releaseFirst!: () => void;
    const firstDelivery = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });

    const fetchImpl = vi.fn().mockImplementation(((_url: string, init: RequestInit) => {
      const id = JSON.parse(init.body as string).workflowId as string;
      return id === 'wf-1'
        ? firstDelivery.then(() => {
            order.push(id);
            return { ok: true, status: 200 };
          })
        : Promise.resolve().then(() => {
            order.push(id);
            return { ok: true, status: 200 };
          });
    }) as unknown as typeof fetch);

    const sender = createEventSender(makeSenderOptions(fetchImpl));

    sender.send(makeEvent('wf-1'));
    sender.send(makeEvent('wf-2'));
    sender.send(makeEvent('wf-3'));

    // Give the queue a chance to misbehave — wf-2/wf-3 must not start while wf-1 is in flight
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(order).toEqual([]);

    releaseFirst();
    await sender.drain();

    expect(order).toEqual(['wf-1', 'wf-2', 'wf-3']);
  });

  it('logs a failed delivery and continues with the next event', async () => {
    const delivered: string[] = [];
    const fetchImpl = vi.fn().mockImplementation(((_url: string, init: RequestInit) => {
      const id = JSON.parse(init.body as string).workflowId as string;
      if (id === 'wf-1') return Promise.reject(new Error('ECONNREFUSED'));
      delivered.push(id);
      return Promise.resolve({ ok: true, status: 200 });
    }) as unknown as typeof fetch);

    const sender = createEventSender(makeSenderOptions(fetchImpl));

    sender.send(makeEvent('wf-1'));
    sender.send(makeEvent('wf-2'));
    await sender.drain();

    expect(delivered).toEqual(['wf-2']);
    expect(log.error).toHaveBeenCalled();
  });

  it.each(
    (['upsert', 'activate', 'archive', 'unarchive', 'delete'] as const).flatMap((first) =>
      (['upsert', 'activate', 'archive', 'unarchive', 'delete'] as const)
        .filter((second) => second !== first)
        .map((second) => [first, second] as const),
    ),
  )('preserves mixed workflow queue order for %s -> %s', async (first, second) => {
    const delivered: SyncEvent[] = [];
    let releaseFirst!: () => void;
    const firstDelivery = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    let callCount = 0;

    const fetchImpl = vi.fn().mockImplementation(((_url: string, init: RequestInit) => {
      const event = JSON.parse(init.body as string) as SyncEvent;
      const currentCall = callCount;
      callCount += 1;

      return currentCall === 0
        ? firstDelivery.then(() => {
            delivered.push(event);
            return { ok: true, status: 200 };
          })
        : Promise.resolve().then(() => {
            delivered.push(event);
            return { ok: true, status: 200 };
          });
    }) as unknown as typeof fetch);

    const sender = createEventSender(makeSenderOptions(fetchImpl));

    sender.send(makeWorkflowEvent(first));
    sender.send(makeWorkflowEvent(second));

    releaseFirst();
    await sender.drain();

    expect(delivered.map(eventLabel)).toEqual([
      eventLabel(makeWorkflowEvent(first)),
      eventLabel(makeWorkflowEvent(second)),
    ]);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('coalesces queued workflow.upsert events by keeping the newest payload', async () => {
    const delivered: SyncEvent[] = [];
    let releaseFirst!: () => void;
    const firstDelivery = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });

    const fetchImpl = vi.fn().mockImplementation(((_url: string, init: RequestInit) => {
      const event = JSON.parse(init.body as string) as SyncEvent;
      const workflowId = eventResourceId(event);

      return workflowId === 'wf-blocker'
        ? firstDelivery.then(() => {
            delivered.push(event);
            return { ok: true, status: 200 };
          })
        : Promise.resolve().then(() => {
            delivered.push(event);
            return { ok: true, status: 200 };
          });
    }) as unknown as typeof fetch);

    const sender = createEventSender(makeSenderOptions(fetchImpl));

    sender.send(makeEvent('wf-blocker'));
    sender.send(
      makeWorkflowEvent('upsert', 'wf-1', {
        name: 'Older workflow snapshot',
        updatedAt: '2026-01-01T00:00:01.000Z',
      }),
    );
    sender.send(
      makeWorkflowEvent('upsert', 'wf-1', {
        name: 'Newest workflow snapshot',
        updatedAt: '2026-01-01T00:00:02.000Z',
      }),
    );

    releaseFirst();
    await sender.drain();

    expect(delivered).toEqual([
      makeEvent('wf-blocker'),
      makeWorkflowEvent('upsert', 'wf-1', {
        name: 'Newest workflow snapshot',
        updatedAt: '2026-01-01T00:00:02.000Z',
      }),
    ]);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('drops the oldest queued event when the queue reaches its size limit', async () => {
    const delivered: string[] = [];
    let releaseFirst!: () => void;
    const firstDelivery = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });

    const fetchImpl = vi.fn().mockImplementation(((_url: string, init: RequestInit) => {
      const id = JSON.parse(init.body as string).workflowId as string;
      return id === 'wf-1'
        ? firstDelivery.then(() => {
            delivered.push(id);
            return { ok: true, status: 200 };
          })
        : Promise.resolve().then(() => {
            delivered.push(id);
            return { ok: true, status: 200 };
          });
    }) as unknown as typeof fetch);

    const sender = createEventSender(makeSenderOptions(fetchImpl, { maxQueueSize: 2 }));

    sender.send(makeEvent('wf-1'));
    sender.send(makeEvent('wf-2'));
    sender.send(makeEvent('wf-3'));
    sender.send(makeEvent('wf-4'));

    releaseFirst();
    await sender.drain();

    expect(delivered).toEqual(['wf-1', 'wf-3', 'wf-4']);
    expect(log.warn).toHaveBeenCalled();
  });

  it('drain() resolves immediately when the queue is empty', async () => {
    const sender = createEventSender(makeSenderOptions(vi.fn() as unknown as typeof fetch));
    await expect(sender.drain()).resolves.toBeUndefined();
  });
});
