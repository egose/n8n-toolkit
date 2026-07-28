import { describe, expect, it, vi } from 'vitest';

import type { Logger } from '../src/shared/logger';
import type { SyncEvent } from '../src/shared/types';
import { createEventSender } from '../src/publisher/sender';

const log: Logger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  child: vi.fn(),
};

function makeEvent(id: string): SyncEvent {
  return { type: 'workflow.delete', at: '2026-01-01T00:00:00.000Z', sourceId: 'src', workflowId: id };
}

function makeSenderOptions(fetchImpl: typeof fetch, overrides: Partial<{ maxQueueSize: number }> = {}) {
  return {
    baseUrl: 'https://target.example.com',
    eventsPath: '/rest/sync/v1/events',
    secret: 's3cret', // pragma: allowlist secret
    authMode: 'hmac' as const,
    timeoutMs: 1000,
    maxRetries: 1,
    maxQueueSize: overrides.maxQueueSize,
    log,
    fetchImpl,
    sleep: vi.fn().mockResolvedValue(undefined) as (ms: number) => Promise<void>,
  };
}

describe('createEventSender', () => {
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

  it('coalesces queued events for the same resource key', async () => {
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

    const sender = createEventSender(makeSenderOptions(fetchImpl));

    sender.send(makeEvent('wf-1'));
    sender.send(makeEvent('wf-2'));
    sender.send(makeEvent('wf-2'));

    releaseFirst();
    await sender.drain();

    expect(delivered).toEqual(['wf-1', 'wf-2']);
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
