import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createPublisherHooks } from '../src/publisher/hooks';
import { createEventOrderingAllocator } from '../src/publisher/order-state';
import { createPublisherHookConfig } from '../src/publisher/runtime';
import { parseConfig } from '../src/shared/config';
import type { SyncConfig } from '../src/shared/config';
import type { Logger } from '../src/shared/logger';
import type { ICredentialsDb, IRunPayload, IWorkflowBase, IWorkflowTag, SyncEvent } from '../src/shared/types';
import { parseSyncEvent } from '../src/shared/validate';

const NOW = new Date('2026-03-04T05:06:07.000Z');

function makeDeps(
  overrides: {
    entities?: { workflows?: boolean; credentials?: boolean; executions?: boolean };
    filterByTag?: boolean;
    syncWorkflowTag?: string;
    activeTag?: string;
    emit?: (event: SyncEvent) => Promise<void>;
  } = {},
) {
  const emit = vi.fn(overrides.emit ?? (async () => undefined));
  const log: Logger = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    child: vi.fn(),
  };
  const hooks = createPublisherHooks({
    emit,
    log,
    sourceId: 'src-1',
    now: () => NOW,
    ...(overrides.entities ? { entities: overrides.entities } : {}),
    ...(overrides.filterByTag !== undefined ? { filterByTag: overrides.filterByTag } : {}),
    ...(overrides.syncWorkflowTag !== undefined ? { syncWorkflowTag: overrides.syncWorkflowTag } : {}),
    ...(overrides.activeTag !== undefined ? { activeTag: overrides.activeTag } : {}),
  });
  return { emit, hooks, log };
}

const workflow: IWorkflowBase = {
  id: 'wf-1',
  name: 'W',
  active: false,
  isArchived: false,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  nodes: [],
  connections: {},
};

const credential: ICredentialsDb = {
  id: 'cred-1',
  name: 'C',
  type: 'httpBasicAuth',
  data: 'encrypted',
};

function emittedEvent(emit: ReturnType<typeof vi.fn>): SyncEvent {
  return emit.mock.calls[0][0] as SyncEvent;
}

function deferred<T = void>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });
  return { promise, resolve, reject };
}

function emittedWorkflowEvent(emit: ReturnType<typeof vi.fn>): Extract<SyncEvent, { workflow: unknown }> {
  const event = emittedEvent(emit);
  if (!('workflow' in event)) {
    throw new Error(`expected workflow event, received ${event.type}`);
  }
  return event;
}

describe('createPublisherHooks', () => {
  beforeEach(() => vi.clearAllMocks());

  it('wires all lifecycle hooks', () => {
    const { hooks } = makeDeps();
    expect(Object.keys(hooks.credentials).sort()).toEqual(['create', 'delete', 'update']);
    expect(Object.keys(hooks.workflow).sort()).toEqual([
      'activate',
      'afterArchive',
      'afterCreate',
      'afterDelete',
      'afterUnarchive',
      'afterUpdate',
    ]);
    // executions are off by default; postExecute must not be wired
    expect(hooks.workflow.postExecute).toBeUndefined();
  });

  it('wires workflow.postExecute only when entities.executions is true', () => {
    const { hooks } = makeDeps({ entities: { executions: true } });
    expect(Array.isArray(hooks.workflow.postExecute)).toBe(true);
  });

  it('omits the workflow resource entirely when both workflows and executions are disabled', () => {
    const { hooks } = makeDeps({ entities: { workflows: false, executions: false } });
    expect(hooks.workflow).toBeUndefined();
  });

  it('omits the credentials resource when credentials is disabled', () => {
    const { hooks } = makeDeps({ entities: { credentials: false } });
    expect(hooks.credentials).toBeUndefined();
  });

  it('rejects enabling execution sync when workflow sync is disabled', () => {
    expect(() => makeDeps({ entities: { workflows: false, executions: true } })).toThrow(
      'Execution sync requires workflow sync to also be enabled',
    );
  });

  it('stamps every event with at/sourceId', async () => {
    const { emit, hooks } = makeDeps();
    await hooks.workflow.afterDelete[0]('wf-1' as never);
    expect(emittedEvent(emit)).toMatchObject({
      at: NOW.toISOString(),
      sourceId: 'src-1',
      eventId: 'src-1:1',
      entityRevision: '1',
    });
  });

  it('increments the per-entity revision even when timestamps are equal', async () => {
    const { emit, hooks } = makeDeps();

    await hooks.workflow.afterUpdate[0](workflow as never);
    await hooks.workflow.afterUpdate[0](workflow as never);

    expect(emit.mock.calls[0][0]).toMatchObject({ eventId: 'src-1:1', entityRevision: '1' });
    expect(emit.mock.calls[1][0]).toMatchObject({ eventId: 'src-1:2', entityRevision: '2' });
  });

  it('contains publisher state allocation failures and surfaces degraded state in the log', async () => {
    const ordering = {
      initialize: vi.fn().mockResolvedValue(undefined),
      getStatus: vi.fn().mockReturnValue({ ready: false, reason: 'storage_error' }),
      allocate: vi.fn().mockRejectedValue(new Error('write failed')),
    };
    const { emit, log } = makeDeps({});
    const degradedHooks = createPublisherHooks({
      emit,
      log,
      sourceId: 'src-1',
      ordering,
      orderingStatus: ordering.getStatus,
      now: () => NOW,
    });

    await degradedHooks.workflow.afterDelete[0]('wf-1' as never);

    expect(emit).not.toHaveBeenCalled();
    expect(log.error).toHaveBeenCalledWith(
      'error',
      expect.objectContaining({
        context: 'publisher hook',
        hook: 'workflow.afterDelete',
        publisherStateReady: false,
        publisherStateReason: 'storage_error',
      }),
    );
  });

  it('maps credentials.create and credentials.update to credentials.upsert from the hook payload', async () => {
    const { emit, hooks } = makeDeps();

    await hooks.credentials.create[0](credential as never);
    expect(emittedEvent(emit)).toMatchObject({
      type: 'credentials.upsert',
      credential: { id: 'cred-1', data: 'encrypted' },
    });

    emit.mockClear();
    await hooks.credentials.update[0](credential as never);
    expect(emittedEvent(emit)).toMatchObject({ type: 'credentials.upsert', credential: { id: 'cred-1' } });
  });

  it('resolves credentials.create from dbCollections by id when the stored row appears later', async () => {
    vi.useFakeTimers();

    try {
      const { emit, hooks } = makeDeps();
      const findOne = vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(null).mockResolvedValueOnce(credential);

      await hooks.credentials.create[0].call({ dbCollections: { Credentials: { findOne } } }, {
        id: credential.id,
      } as never);
      await vi.runAllTimersAsync();

      expect(emit).toHaveBeenCalledTimes(1);
      expect(findOne).toHaveBeenNthCalledWith(1, { where: { id: credential.id } });
      expect(findOne).toHaveBeenNthCalledWith(2, { where: { id: credential.id } });
      expect(findOne).toHaveBeenNthCalledWith(3, { where: { id: credential.id } });
      expect(emittedEvent(emit)).toMatchObject({
        type: 'credentials.upsert',
        credential: { id: 'cred-1', name: 'C', data: 'encrypted' },
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not query dbCollections on credentials.update when the payload is complete', async () => {
    const { emit, hooks } = makeDeps();
    const findOne = vi.fn().mockResolvedValue({ ...credential, name: 'from-db' });

    await hooks.credentials.update[0].call({ dbCollections: { Credentials: { findOne } } }, credential as never);

    expect(findOne).not.toHaveBeenCalled();
    expect(emittedEvent(emit)).toMatchObject({
      type: 'credentials.upsert',
      credential: { id: 'cred-1', name: 'C', data: 'encrypted' },
    });
  });

  it('drops credential object payloads without logging secret material', async () => {
    const { emit, hooks, log } = makeDeps();

    await hooks.credentials.update[0]({
      ...credential,
      data: { user: 'alice', password: 'secret' }, // pragma: allowlist secret
    } as never);

    expect(emit).not.toHaveBeenCalled();
    expect(log.warn).toHaveBeenCalledWith(
      'Dropping credential sync event',
      expect.objectContaining({
        context: 'publisher hook',
        hook: 'credentials.update',
        reason: 'plaintext_object_payload',
        credentialId: credential.id,
        supportedN8nVersion: '2.31.2',
      }),
    );
    expect(log.warn).toHaveBeenCalledWith(
      'Dropping credential sync event',
      expect.not.objectContaining({ data: expect.anything(), password: expect.anything(), user: expect.anything() }),
    );
  });

  it('maps credentials.delete to credentials.delete', async () => {
    const { emit, hooks } = makeDeps();
    await hooks.credentials.delete[0]('cred-9' as never);
    expect(emittedEvent(emit)).toMatchObject({ type: 'credentials.delete', credentialId: 'cred-9' });
  });

  it('drops duplicate-name credential creates without a stable id instead of guessing by name and type', async () => {
    const { emit, hooks, log } = makeDeps();
    const findOne = vi.fn().mockResolvedValue({ ...credential, id: 'cred-2' });

    await hooks.credentials.create[0].call({ dbCollections: { Credentials: { findOne } } }, {
      name: credential.name,
      type: credential.type,
    } as never);
    await new Promise((resolve) => setImmediate(resolve));

    expect(findOne).not.toHaveBeenCalled();
    expect(emit).not.toHaveBeenCalled();
    expect(log.warn).toHaveBeenCalledWith(
      'Dropping credential sync event',
      expect.objectContaining({
        context: 'publisher hook',
        hook: 'credentials.create',
        reason: 'missing_stable_id',
        supportedN8nVersion: '2.31.2',
      }),
    );
  });

  it('drops concurrent duplicate-name credential creates without cross-publication', async () => {
    const { emit, hooks, log } = makeDeps();
    const findOne = vi.fn();

    await Promise.all([
      hooks.credentials.create[0].call({ dbCollections: { Credentials: { findOne } } }, {
        name: credential.name,
        type: credential.type,
      } as never),
      hooks.credentials.create[0].call({ dbCollections: { Credentials: { findOne } } }, {
        name: credential.name,
        type: credential.type,
      } as never),
    ]);
    await new Promise((resolve) => setImmediate(resolve));

    expect(findOne).not.toHaveBeenCalled();
    expect(emit).not.toHaveBeenCalled();
    expect(log.warn).toHaveBeenCalledTimes(2);
  });

  it('drops credentials.create when the stable id never becomes visible before the retry timeout', async () => {
    vi.useFakeTimers();

    try {
      const { emit, hooks, log } = makeDeps();
      const findOne = vi.fn().mockResolvedValue(null);

      await hooks.credentials.create[0].call({ dbCollections: { Credentials: { findOne } } }, {
        id: credential.id,
      } as never);
      await vi.runAllTimersAsync();

      expect(findOne).toHaveBeenCalledTimes(10);
      expect(emit).not.toHaveBeenCalled();
      expect(log.warn).toHaveBeenCalledWith(
        'Dropping credential sync event',
        expect.objectContaining({
          context: 'publisher hook',
          hook: 'credentials.create',
          reason: 'not_visible_before_timeout',
          credentialId: credential.id,
          supportedN8nVersion: '2.31.2',
        }),
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it('maps workflow.afterCreate and workflow.afterUpdate to workflow.upsert', async () => {
    const { emit, hooks } = makeDeps();

    await hooks.workflow.afterCreate[0](workflow as never);
    expect(emittedEvent(emit)).toMatchObject({ type: 'workflow.upsert', workflow: { id: 'wf-1' } });

    emit.mockClear();
    await hooks.workflow.afterUpdate[0](workflow as never);
    expect(emittedEvent(emit)).toMatchObject({ type: 'workflow.upsert', workflow: { id: 'wf-1' } });
  });

  it('resolves workflow.afterCreate from dbCollections when n8n passes only the workflow id', async () => {
    const { emit, hooks } = makeDeps();

    await hooks.workflow.afterCreate[0].call(
      { dbCollections: { Workflow: { findOne: vi.fn().mockResolvedValue(workflow) } } },
      'wf-1' as never,
    );

    expect(emittedEvent(emit)).toMatchObject({ type: 'workflow.upsert', workflow: { id: 'wf-1' } });
  });

  it('maps workflow.activate to workflow.activate', async () => {
    const { emit, hooks } = makeDeps();
    await hooks.workflow.activate[0]({ ...workflow, active: true } as never);
    expect(emittedEvent(emit)).toMatchObject({ type: 'workflow.activate', workflow: { id: 'wf-1', active: true } });
  });

  it('maps workflow.afterDelete to workflow.delete', async () => {
    const { emit, hooks } = makeDeps();
    await hooks.workflow.afterDelete[0]('wf-7' as never);
    expect(emittedEvent(emit)).toMatchObject({ type: 'workflow.delete', workflowId: 'wf-7' });
  });

  it('maps archive/unarchive to workflow.archive with the archived flag', async () => {
    const { emit, hooks } = makeDeps();

    await hooks.workflow.afterArchive[0]('wf-1' as never);
    expect(emittedEvent(emit)).toMatchObject({ type: 'workflow.archive', workflowId: 'wf-1', archived: true });

    emit.mockClear();
    await hooks.workflow.afterUnarchive[0]('wf-1' as never);
    expect(emittedEvent(emit)).toMatchObject({ type: 'workflow.archive', workflowId: 'wf-1', archived: false });
  });

  it('preserves same-workflow hook order when upsert preparation is blocked before archive/delete', async () => {
    const target = new Map<string, { archived: boolean }>();
    const emitted: SyncEvent[] = [];
    const { emit, hooks } = makeDeps({
      emit: async (event) => {
        emitted.push(event);
        if (event.type === 'workflow.upsert') {
          target.set(event.workflow.id, { archived: event.workflow.isArchived ?? false });
        } else if (event.type === 'workflow.archive') {
          const current = target.get(event.workflowId);
          if (current) current.archived = event.archived;
        } else if (event.type === 'workflow.delete') {
          target.delete(event.workflowId);
        }
      },
    });
    const lookup = deferred<IWorkflowBase | null>();
    const findOne = vi.fn().mockReturnValue(lookup.promise);

    const upsert = hooks.workflow.afterUpdate[0].call({ dbCollections: { Workflow: { findOne } } }, 'wf-1' as never);
    await Promise.resolve();
    const archive = hooks.workflow.afterArchive[0]('wf-1' as never);
    const remove = hooks.workflow.afterDelete[0]('wf-1' as never);
    await Promise.resolve();

    expect(findOne).toHaveBeenCalledWith({ where: { id: 'wf-1' } });
    expect(emit).not.toHaveBeenCalled();

    lookup.resolve(workflow);
    await Promise.all([upsert, archive, remove]);

    expect(emitted.map((event) => event.type)).toEqual(['workflow.upsert', 'workflow.archive', 'workflow.delete']);
    expect(emitted.map((event) => event.entityRevision)).toEqual(['1', '2', '3']);
    expect(target.has('wf-1')).toBe(false);
  });

  it('prepares different workflows concurrently while preserving each entity chain', async () => {
    const { emit, hooks } = makeDeps();
    const first = deferred<IWorkflowBase | null>();
    const second = deferred<IWorkflowBase | null>();
    const findOne = vi.fn(({ where }: { where: { id: string } }) =>
      where.id === 'wf-1' ? first.promise : second.promise,
    );

    const firstHook = hooks.workflow.afterUpdate[0].call({ dbCollections: { Workflow: { findOne } } }, 'wf-1' as never);
    const secondHook = hooks.workflow.afterUpdate[0].call(
      { dbCollections: { Workflow: { findOne } } },
      'wf-2' as never,
    );
    await Promise.resolve();

    expect(findOne).toHaveBeenCalledTimes(2);

    second.resolve({ ...workflow, id: 'wf-2', name: 'Second' });
    await secondHook;
    expect(emit).toHaveBeenCalledTimes(1);
    expect(emittedEvent(emit)).toMatchObject({ type: 'workflow.upsert', workflow: { id: 'wf-2' } });

    first.resolve(workflow);
    await firstHook;
    expect(emit).toHaveBeenCalledTimes(2);
    expect(emit.mock.calls.map(([event]) => (event as SyncEvent).type)).toEqual(['workflow.upsert', 'workflow.upsert']);
  });

  it('releases later same-workflow hooks after a dropped preparation without consuming a revision', async () => {
    const { emit, hooks } = makeDeps();
    const lookup = deferred<IWorkflowBase | null>();
    const findOne = vi.fn().mockReturnValue(lookup.promise);

    const upsert = hooks.workflow.afterUpdate[0].call(
      { dbCollections: { Workflow: { findOne } } },
      'wf-missing' as never,
    );
    await Promise.resolve();
    const remove = hooks.workflow.afterDelete[0]('wf-missing' as never);
    await Promise.resolve();

    expect(emit).not.toHaveBeenCalled();
    lookup.resolve(null);
    await Promise.all([upsert, remove]);

    expect(emit).toHaveBeenCalledTimes(1);
    expect(emittedEvent(emit)).toMatchObject({
      type: 'workflow.delete',
      workflowId: 'wf-missing',
      entityRevision: '1',
    });
  });

  it('preserves same-credential hook order when create lookup overlaps update/delete', async () => {
    const emitted: SyncEvent[] = [];
    const { emit, hooks } = makeDeps({
      emit: async (event) => {
        emitted.push(event);
      },
    });
    const lookup = deferred<ICredentialsDb | null>();
    const findOne = vi.fn().mockReturnValue(lookup.promise);

    await hooks.credentials.create[0].call({ dbCollections: { Credentials: { findOne } } }, { id: 'cred-1' } as never);
    await Promise.resolve();
    const update = hooks.credentials.update[0]({ ...credential, name: 'Updated' } as never);
    const remove = hooks.credentials.delete[0]('cred-1' as never);
    await Promise.resolve();

    expect(emit).not.toHaveBeenCalled();
    lookup.resolve(credential);
    await Promise.all([update, remove]);

    expect(emitted.map((event) => event.type)).toEqual([
      'credentials.upsert',
      'credentials.upsert',
      'credentials.delete',
    ]);
    expect(emitted.map((event) => event.entityRevision)).toEqual(['1', '2', '3']);
    expect(emitted[1]).toMatchObject({ type: 'credentials.upsert', credential: { name: 'Updated' } });
  });

  it('preserves same-execution detached hook order while allowing later snapshots to wait', async () => {
    const emitted: SyncEvent[] = [];
    const { emit, hooks } = makeDeps({
      entities: { executions: true },
      filterByTag: true,
      emit: async (event) => {
        emitted.push(event);
      },
    });
    const lookup = deferred<(IWorkflowBase & { tags?: IWorkflowTag[] }) | null>();
    const findOne = vi.fn().mockReturnValue(lookup.promise);
    const firstRun: IRunPayload = {
      mode: 'manual',
      status: 'running',
      finished: false,
      startedAt: new Date('2026-05-01T10:00:00.000Z'),
    };
    const secondRun: IRunPayload = {
      mode: 'manual',
      status: 'success',
      finished: true,
      startedAt: new Date('2026-05-01T10:00:00.000Z'),
      stoppedAt: new Date('2026-05-01T10:00:05.000Z'),
    };

    await hooks.workflow.postExecute[0].call(
      { dbCollections: { Workflow: { findOne } } },
      firstRun as never,
      { id: 'wf-1' } as never,
      'exec-1' as never,
    );
    await Promise.resolve();
    await hooks.workflow.postExecute[0](
      secondRun as never,
      { ...workflow, tags: [{ id: 't1', name: 'sync' }] } as never,
      'exec-1' as never,
    );
    await Promise.resolve();

    expect(emit).not.toHaveBeenCalled();
    lookup.resolve({ ...workflow, tags: [{ id: 't1', name: 'sync' }] });
    await vi.waitFor(() => expect(emit).toHaveBeenCalledTimes(2));

    expect(emitted.map((event) => event.type)).toEqual(['execution.upsert', 'execution.upsert']);
    expect(emitted.map((event) => event.entityRevision)).toEqual(['1', '2']);
    expect(emitted.map((event) => (event.type === 'execution.upsert' ? event.execution.status : undefined))).toEqual([
      'running',
      'success',
    ]);
  });

  it('logs same-entity preparation failures and continues with later queued hooks', async () => {
    const { emit, hooks, log } = makeDeps();
    const failure = deferred<IWorkflowBase | null>();
    const findOne = vi.fn().mockReturnValue(failure.promise);

    const upsert = hooks.workflow.afterUpdate[0].call({ dbCollections: { Workflow: { findOne } } }, 'wf-1' as never);
    await Promise.resolve();
    const remove = hooks.workflow.afterDelete[0]('wf-1' as never);

    failure.reject(new Error('lookup failed'));
    await Promise.all([upsert, remove]);

    expect(log.error).toHaveBeenCalledWith(
      'error',
      expect.objectContaining({ context: 'publisher hook', hook: 'workflow.afterUpdate', detached: false }),
    );
    expect(emit).toHaveBeenCalledTimes(1);
    expect(emittedEvent(emit)).toMatchObject({ type: 'workflow.delete', workflowId: 'wf-1', entityRevision: '1' });
  });

  it('logs and resolves when credentials.create detached lookup work rejects', async () => {
    const { emit, hooks, log } = makeDeps();
    const unhandled: unknown[] = [];
    const onUnhandled = (error: unknown) => {
      unhandled.push(error);
    };
    process.on('unhandledRejection', onUnhandled);

    try {
      await expect(
        hooks.credentials.create[0].call(
          {
            dbCollections: {
              Credentials: {
                findOne: vi.fn().mockRejectedValue(new Error('credential lookup failed')),
              },
            },
          },
          { id: credential.id } as never,
        ),
      ).resolves.toBeUndefined();

      await new Promise((resolve) => setImmediate(resolve));

      expect(emit).not.toHaveBeenCalled();
      expect(unhandled).toEqual([]);
      expect(log.error).toHaveBeenCalledWith(
        'error',
        expect.objectContaining({ context: 'publisher hook', hook: 'credentials.create', detached: true }),
      );
      expect(log.error).toHaveBeenCalledWith(
        'error',
        expect.not.objectContaining({ credential: expect.anything(), workflow: expect.anything() }),
      );
    } finally {
      process.off('unhandledRejection', onUnhandled);
    }
  });

  it('logs and resolves when credentials.update emit rejects', async () => {
    const { hooks, log } = makeDeps({
      emit: async () => {
        throw new Error('emit failed');
      },
    });

    await expect(hooks.credentials.update[0](credential as never)).resolves.toBeUndefined();
    expect(log.error).toHaveBeenCalledWith(
      'error',
      expect.objectContaining({ context: 'publisher hook', hook: 'credentials.update', detached: false }),
    );
  });

  it('logs and resolves when workflow lookup rejects', async () => {
    const { emit, hooks, log } = makeDeps();

    await expect(
      hooks.workflow.afterCreate[0].call(
        {
          dbCollections: {
            Workflow: {
              findOne: vi.fn().mockRejectedValue(new Error('workflow lookup failed')),
            },
          },
        },
        'wf-1' as never,
      ),
    ).resolves.toBeUndefined();

    expect(emit).not.toHaveBeenCalled();
    expect(log.error).toHaveBeenCalledWith(
      'error',
      expect.objectContaining({ context: 'publisher hook', hook: 'workflow.afterCreate', detached: false }),
    );
  });

  describe('workflow.postExecute', () => {
    it('emits an execution.upsert event from the postExecute hook and is fire-and-forget', async () => {
      const { emit, hooks } = makeDeps({ entities: { executions: true } });
      const run: IRunPayload = {
        finished: true,
        mode: 'manual',
        status: 'success',
        startedAt: new Date('2026-05-01T10:00:00.000Z'),
        stoppedAt: new Date('2026-05-01T10:00:05.000Z'),
      };

      // awaiting the hook should not block on emit (fire-and-forget)
      await hooks.workflow.postExecute[0](run as never, workflow as never, 'exec-1' as never);

      // the promise was voided; allow the microtask to flush
      await new Promise((resolve) => setImmediate(resolve));

      expect(emit).toHaveBeenCalledTimes(1);
      expect(emittedEvent(emit)).toMatchObject({
        type: 'execution.upsert',
        at: NOW.toISOString(),
        sourceId: 'src-1',
        execution: {
          id: 'exec-1',
          workflowId: 'wf-1',
          status: 'success',
          mode: 'manual',
          finished: true,
          startedAt: '2026-05-01T10:00:00.000Z',
          stoppedAt: '2026-05-01T10:00:05.000Z',
        },
      });
    });

    it('ignores a missing execution id without emitting', async () => {
      const { emit, hooks } = makeDeps({ entities: { executions: true } });
      await hooks.workflow.postExecute[0](undefined as never, workflow as never, '' as never);
      await new Promise((resolve) => setImmediate(resolve));
      expect(emit).not.toHaveBeenCalled();
    });

    it('drops execution events when the workflow identity is missing', async () => {
      const { emit, hooks, log } = makeDeps({ entities: { executions: true } });

      await hooks.workflow.postExecute[0](
        { status: 'success', mode: 'manual', startedAt: new Date('2026-05-01T00:00:00Z'), finished: true } as never,
        undefined as never,
        'exec-missing-workflow' as never,
      );
      await new Promise((resolve) => setImmediate(resolve));

      expect(emit).not.toHaveBeenCalled();
      expect(log.warn).toHaveBeenCalledWith(
        'Dropping execution sync event',
        expect.objectContaining({ reason: 'missing_workflow_id', executionId: 'exec-missing-workflow' }),
      );
    });

    it('drops execution events when the hook payload has no lifecycle timestamps', async () => {
      const { emit, hooks, log } = makeDeps({ entities: { executions: true } });

      await hooks.workflow.postExecute[0](undefined as never, workflow as never, 'exec-missing-time' as never);
      await new Promise((resolve) => setImmediate(resolve));

      expect(emit).not.toHaveBeenCalled();
      expect(log.warn).toHaveBeenCalledWith(
        'Dropping execution sync event',
        expect.objectContaining({ reason: 'missing_lifecycle_timestamp', executionId: 'exec-missing-time' }),
      );
    });

    it('logs and resolves when detached execution emit rejects without unhandledRejection', async () => {
      const { hooks, log } = makeDeps({
        entities: { executions: true },
        emit: async () => {
          throw new Error('execution emit failed');
        },
      });
      const unhandled: unknown[] = [];
      const onUnhandled = (error: unknown) => {
        unhandled.push(error);
      };
      process.on('unhandledRejection', onUnhandled);

      try {
        await expect(
          hooks.workflow.postExecute[0](
            {
              status: 'success',
              mode: 'manual',
              finished: true,
              startedAt: new Date('2026-05-01T10:00:00.000Z'),
              stoppedAt: new Date('2026-05-01T10:00:05.000Z'),
            } as never,
            workflow as never,
            'exec-1' as never,
          ),
        ).resolves.toBeUndefined();
        await new Promise((resolve) => setImmediate(resolve));

        expect(unhandled).toEqual([]);
        expect(log.error).toHaveBeenCalledWith(
          'error',
          expect.objectContaining({ context: 'publisher hook', hook: 'workflow.postExecute', detached: true }),
        );
      } finally {
        process.off('unhandledRejection', onUnhandled);
      }
    });
  });

  describe('workflow tag filtering (filterByTag=true)', () => {
    const syncTag: IWorkflowTag = { id: 't1', name: 'sync' };
    const activeTag: IWorkflowTag = { id: 't2', name: 'active' };
    const workflowWithSync: IWorkflowBase & { tags?: IWorkflowTag[] } = {
      ...workflow,
      id: 'wf-sync',
      active: true,
      tags: [syncTag],
    };
    const workflowWithSyncAndActive: IWorkflowBase & { tags?: IWorkflowTag[] } = {
      ...workflow,
      id: 'wf-active',
      active: true,
      tags: [syncTag, activeTag],
    };
    const workflowWithoutSync: IWorkflowBase & { tags?: IWorkflowTag[] } = {
      ...workflow,
      id: 'wf-no-sync',
      active: true,
      tags: [activeTag],
    };

    it('publishes a workflow.upsert with no rewriting when filterByTag is disabled (default)', async () => {
      const { emit, hooks } = makeDeps();
      await hooks.workflow.afterCreate[0]({ ...workflowWithSync } as never);
      expect(emit).toHaveBeenCalledTimes(1);
      expect(emittedEvent(emit)).toMatchObject({
        type: 'workflow.upsert',
        workflow: { id: 'wf-sync', active: true },
      });
      const event = emittedWorkflowEvent(emit);
      // No tags, no active_real rewriting on the DTO when filter is off
      expect(event.workflow.tags).toBeUndefined();
      expect(event.workflow.meta).toBeUndefined();
    });

    it('emits a workflow.upsert (with tags + meta.active_real=real active) when sync tag is present but active tag missing', async () => {
      const { emit, hooks } = makeDeps({ filterByTag: true });
      await hooks.workflow.afterCreate[0]({ ...workflowWithSync } as never);
      expect(emit).toHaveBeenCalledTimes(1);
      expect(emittedEvent(emit)).toMatchObject({
        type: 'workflow.upsert',
        workflow: {
          id: 'wf-sync',
          active: false, // active tag missing → rewritten to false
          tags: [{ id: 't1', name: 'sync' }],
          meta: { active_real: true },
        },
      });
    });

    it('keeps active=true when both sync and active tags are present (preserves real active in meta)', async () => {
      const { emit, hooks } = makeDeps({ filterByTag: true });
      await hooks.workflow.afterUpdate[0]({ ...workflowWithSyncAndActive } as never);
      expect(emit).toHaveBeenCalledTimes(1);
      expect(emittedEvent(emit)).toMatchObject({
        type: 'workflow.upsert',
        workflow: {
          id: 'wf-active',
          active: true,
          tags: [
            { id: 't1', name: 'sync' },
            { id: 't2', name: 'active' },
          ],
          meta: { active_real: true },
        },
      });
    });

    it('preserves the source real active=false when both tags present but source is inactive', async () => {
      const { emit, hooks } = makeDeps({ filterByTag: true });
      const inactiveSource: IWorkflowBase & { tags?: IWorkflowTag[] } = {
        ...workflowWithSyncAndActive,
        active: false,
      };
      await hooks.workflow.afterCreate[0](inactiveSource as never);
      expect(emittedEvent(emit)).toMatchObject({
        type: 'workflow.upsert',
        workflow: { id: 'wf-active', active: true, meta: { active_real: false } },
      });
    });

    it('emits workflow.delete when sync tag is missing (and skips the upsert)', async () => {
      const { emit, hooks } = makeDeps({ filterByTag: true });
      await hooks.workflow.afterUpdate[0]({ ...workflowWithoutSync } as never);
      expect(emit).toHaveBeenCalledTimes(1);
      expect(emittedEvent(emit)).toMatchObject({
        type: 'workflow.delete',
        workflowId: 'wf-no-sync',
      });
    });

    it('applies the same drop-to-delete logic to workflow.activate', async () => {
      const { emit, hooks } = makeDeps({ filterByTag: true });
      await hooks.workflow.activate[0]({ ...workflowWithSync } as never);
      expect(emittedEvent(emit)).toMatchObject({
        type: 'workflow.activate',
        workflow: { id: 'wf-sync', active: false, meta: { active_real: true } },
      });

      emit.mockClear();
      await hooks.workflow.activate[0]({ ...workflowWithoutSync } as never);
      expect(emittedEvent(emit)).toMatchObject({
        type: 'workflow.delete',
        workflowId: 'wf-no-sync',
      });
    });

    it('respects a custom syncWorkflowTag and activeTag name', async () => {
      const { emit, hooks } = makeDeps({
        filterByTag: true,
        syncWorkflowTag: 'replicate',
        activeTag: 'on',
      });
      const wf: IWorkflowBase & { tags?: IWorkflowTag[] } = {
        ...workflow,
        id: 'wf-custom',
        active: false,
        tags: [
          { id: 'a', name: 'replicate' },
          { id: 'b', name: 'on' },
        ],
      };
      await hooks.workflow.afterCreate[0](wf as never);
      expect(emittedEvent(emit)).toMatchObject({
        type: 'workflow.upsert',
        workflow: { id: 'wf-custom', active: true, meta: { active_real: false } },
      });
    });

    it('resolves tags via dbCollections.Workflow.findOne({ relations: ["tags"] }) when the hook passes only an id', async () => {
      const { emit, hooks } = makeDeps({ filterByTag: true });
      const findOne = vi.fn().mockResolvedValue({ ...workflowWithSyncAndActive });

      await hooks.workflow.afterCreate[0].call({ dbCollections: { Workflow: { findOne } } }, 'wf-active' as never);

      expect(findOne).toHaveBeenCalledWith({ where: { id: 'wf-active' }, relations: ['tags'] });
      expect(emittedEvent(emit)).toMatchObject({
        type: 'workflow.upsert',
        workflow: { id: 'wf-active', active: true, tags: [syncTag, activeTag] },
      });
    });

    it('when the workflow id lookup misses, does not emit a delete (because we cannot confirm the workflow exists)', async () => {
      const { emit, hooks } = makeDeps({ filterByTag: true });
      const findOne = vi.fn().mockResolvedValue(null);
      await hooks.workflow.afterCreate[0].call({ dbCollections: { Workflow: { findOne } } }, 'wf-ghost' as never);
      expect(emit).not.toHaveBeenCalled();
    });

    it('skips an unresolved workflow payload rather than emitting workflow.delete', async () => {
      const { emit, hooks } = makeDeps({ filterByTag: true });
      const findOne = vi.fn().mockResolvedValue(null);

      await hooks.workflow.afterUpdate[0].call({ dbCollections: { Workflow: { findOne } } }, {
        ...workflow,
        id: 'wf-unknown-tags',
      } as never);

      expect(findOne).toHaveBeenCalledWith({ where: { id: 'wf-unknown-tags' }, relations: ['tags'] });
      expect(emit).not.toHaveBeenCalled();
    });

    it('workflow.postExecute drops the execution when the workflow lacks the sync tag', async () => {
      const { emit, hooks } = makeDeps({ entities: { executions: true }, filterByTag: true });
      // workflowData carries tags inline — no DB lookup needed
      const wf: IWorkflowBase & { tags?: IWorkflowTag[] } = {
        ...workflow,
        id: 'wf-no-sync-exec',
        tags: [{ id: 'x', name: 'other' }],
      };
      await hooks.workflow.postExecute[0](
        { status: 'success', mode: 'manual', startedAt: new Date('2026-05-01T00:00:00Z'), finished: true } as never,
        wf as never,
        'exec-x' as never,
      );
      await new Promise((resolve) => setImmediate(resolve));
      expect(emit).not.toHaveBeenCalled();
    });

    it('workflow.postExecute emits when the workflow has the sync tag (tags inline on workflowData)', async () => {
      const { emit, hooks } = makeDeps({ entities: { executions: true }, filterByTag: true });
      const wf: IWorkflowBase & { tags?: IWorkflowTag[] } = {
        ...workflow,
        id: 'wf-sync-exec',
        tags: [syncTag],
      };
      await hooks.workflow.postExecute[0](
        { status: 'success', mode: 'manual', startedAt: new Date('2026-05-01T00:00:00Z'), finished: true } as never,
        wf as never,
        'exec-y' as never,
      );
      await new Promise((resolve) => setImmediate(resolve));
      expect(emit).toHaveBeenCalledTimes(1);
      expect(emittedEvent(emit)).toMatchObject({
        type: 'execution.upsert',
        execution: { id: 'exec-y', workflowId: 'wf-sync-exec', status: 'success' },
      });
    });

    it('workflow.postExecute resolves tags from dbCollections.Workflow when workflowData carries no tags', async () => {
      const { emit, hooks } = makeDeps({ entities: { executions: true }, filterByTag: true });
      const findOne = vi.fn().mockResolvedValue({ ...workflowWithSync });
      // workflowData carries id only, no tags array
      const wf = { id: 'wf-sync' } as IWorkflowBase;

      await hooks.workflow.postExecute[0].call(
        { dbCollections: { Workflow: { findOne } } },
        { status: 'success', mode: 'manual', startedAt: new Date('2026-05-01T00:00:00Z'), finished: true } as never,
        wf as never,
        'exec-z' as never,
      );
      await new Promise((resolve) => setImmediate(resolve));

      expect(findOne).toHaveBeenCalledWith({ where: { id: 'wf-sync' }, relations: ['tags'] });
      expect(emit).toHaveBeenCalledTimes(1);
      expect(emittedEvent(emit)).toMatchObject({
        type: 'execution.upsert',
        execution: { id: 'exec-z', workflowId: 'wf-sync' },
      });
    });

    it('workflow.postExecute logs tag-resolution failures without unhandledRejection', async () => {
      const { emit, hooks, log } = makeDeps({ entities: { executions: true }, filterByTag: true });
      const unhandled: unknown[] = [];
      const onUnhandled = (error: unknown) => {
        unhandled.push(error);
      };
      process.on('unhandledRejection', onUnhandled);

      try {
        await expect(
          hooks.workflow.postExecute[0].call(
            {
              dbCollections: {
                Workflow: {
                  findOne: vi.fn().mockRejectedValue(new Error('tag lookup failed')),
                },
              },
            },
            { status: 'success', mode: 'manual', startedAt: new Date('2026-05-01T00:00:00Z'), finished: true } as never,
            { id: 'wf-sync' } as never,
            'exec-z' as never,
          ),
        ).resolves.toBeUndefined();
        await new Promise((resolve) => setImmediate(resolve));

        expect(emit).not.toHaveBeenCalled();
        expect(unhandled).toEqual([]);
        expect(log.error).toHaveBeenCalledWith(
          'error',
          expect.objectContaining({ context: 'publisher hook', hook: 'workflow.postExecute', detached: true }),
        );
      } finally {
        process.off('unhandledRejection', onUnhandled);
      }
    });
  });
});

describe('createPublisherHookConfig readiness', () => {
  it('does not log healthy registration until durable publisher state initializes', async () => {
    const init = deferred();
    const log: Logger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      child: vi.fn(),
    };
    const allocator = {
      initialize: vi.fn().mockReturnValue(init.promise),
      getStatus: vi.fn().mockReturnValue({ ready: true }),
      allocate: vi.fn(),
    };
    const config: SyncConfig = {
      logLevel: 'info',
      auth: { mode: 'hmac', secret: 's3cret' }, // pragma: allowlist secret
      entities: new Set(['workflows', 'credentials'] as const),
      filterByTag: false,
      syncWorkflowTag: 'sync',
      activeTag: 'active',
      publisher: {
        sourceId: 'src-1',
        subscriberUrls: ['https://target.example.com'],
        eventsPath: '/rest/sync/v1/events',
        timeoutMs: 1000,
        maxAttempts: 1,
        maxQueueSize: 10,
        publisherStatePath: '/state/publisher.json',
        invalidState: 'fail',
      },
      subscriber: {
        routeBase: '/rest/sync/v1',
        targetProjectId: '',
        applyActiveState: false,
        maxBodyBytes: 1024,
        signatureToleranceMs: 1000,
        replayCacheSize: 10,
        subscriberStatePath: '/state/subscriber.json',
        n8nDiPath: '/n8n/di',
        n8nDbPath: '/n8n/db',
      },
    };

    createPublisherHookConfig(config, {
      createLogger: vi.fn().mockReturnValue(log),
      createEventSender: vi.fn().mockReturnValue({ send: vi.fn() }),
      createEventOrderingAllocator: vi.fn().mockReturnValue(allocator),
      createPublisherHooks: vi.fn().mockReturnValue({}),
    });

    expect(log.info).toHaveBeenCalledWith('Initializing n8n-sync publisher state...', expect.any(Object));
    expect(log.info).not.toHaveBeenCalledWith('n8n-sync publisher hooks registered', expect.any(Object));

    init.resolve();
    await init.promise;
    await Promise.resolve();

    expect(log.info).toHaveBeenCalledWith('n8n-sync publisher hooks registered', expect.any(Object));
  });

  it('logs a prominent epoch-reset warn after quarantine-reset recovery', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'n8n-sync-publisher-reset-warn-'));

    try {
      const statePath = join(tempDir, 'publisher-ordering.json');
      await writeFile(statePath, JSON.stringify({ version: 99, sourceId: 'old-source' }));
      const log: Logger = {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        child: vi.fn(),
      };
      const config = parseConfig({
        SYNC_SHARED_SECRET: 's3cret', // pragma: allowlist secret
        SYNC_SUBSCRIBER_URLS: 'https://target.example.com',
        SYNC_SOURCE_ID: 'new-source',
        SYNC_PUBLISHER_STATE_PATH: statePath,
        SYNC_PUBLISHER_INVALID_STATE: 'quarantine-reset',
      });

      createPublisherHookConfig(config, {
        createLogger: vi.fn().mockReturnValue(log),
        createPublisherHooks: vi.fn().mockReturnValue({}),
      });

      await vi.waitFor(() => {
        expect(log.warn).toHaveBeenCalledWith(
          expect.stringContaining('full subscriber resync is mandatory'),
          expect.objectContaining({
            previousSourceId: 'old-source',
            newSourceId: 'new-source',
            invalidStateMode: 'quarantine-reset',
          }),
        );
      });
      const warnCall = (log.warn as ReturnType<typeof vi.fn>).mock.calls[0] as [string, Record<string, unknown>];
      expect(String(warnCall[1].quarantinedBackupPath)).toContain('.corrupt.');
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('logs publisher state version/sourceId/counters/mode at info on fresh boot', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'n8n-sync-publisher-boot-info-'));

    try {
      const statePath = join(tempDir, 'publisher-ordering.json');
      await writeFile(
        statePath,
        JSON.stringify({
          version: 3,
          sourceId: 'n8n',
          nextEventSequence: '33',
          entityRevisions: { '["workflow","cVEK5GA9Im9YPUAk"]': '33' },
        }),
      );
      const log: Logger = {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        child: vi.fn(),
      };
      const config = parseConfig({
        SYNC_SHARED_SECRET: 's3cret', // pragma: allowlist secret
        SYNC_SUBSCRIBER_URLS: 'https://target.example.com',
        SYNC_SOURCE_ID: 'n8n',
        SYNC_PUBLISHER_STATE_PATH: statePath,
      });

      createPublisherHookConfig(config, {
        createLogger: vi.fn().mockReturnValue(log),
        createPublisherHooks: vi.fn().mockReturnValue({}),
      });

      await vi.waitFor(() => {
        expect(log.info).toHaveBeenCalledWith(
          'n8n-sync publisher hooks registered',
          expect.objectContaining({
            publisherStateVersion: 3,
            publisherStateSourceId: 'n8n',
            publisherNextEventSequence: '33',
            publisherEntityKeyCount: 1,
            invalidStateMode: 'fail',
          }),
        );
      });
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});

describe('publisher ordering source identity', () => {
  it('persists the configured source id and rejects later mismatches', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'n8n-sync-publisher-source-'));

    try {
      const statePath = join(tempDir, 'publisher-ordering.json');
      const allocator = createEventOrderingAllocator({ sourceId: 'source-1', statePath });

      await expect(allocator.allocate({ type: 'workflow.delete', workflowId: 'wf-1' })).resolves.toEqual({
        eventId: 'source-1:1',
        entityRevision: '1',
      });

      const raw = JSON.parse(await readFile(statePath, 'utf8')) as { version: number; sourceId: string };
      expect(raw).toMatchObject({ version: 3, sourceId: 'source-1' });

      await rm(`${statePath}.lock`, { force: true });
      const rotated = createEventOrderingAllocator({ sourceId: 'source-2', statePath });
      await expect(rotated.initialize()).rejects.toThrow(/does not match publisher state sourceId.*source-retirement/);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('migrates legacy publisher state to source-bound format 3', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'n8n-sync-publisher-source-'));

    try {
      const statePath = join(tempDir, 'publisher-ordering.json');
      await writeFile(
        statePath,
        JSON.stringify({
          version: 2,
          nextEventSequence: '3',
          entityRevisions: { '["workflow","wf-1"]': '2' },
        }),
      );

      const allocator = createEventOrderingAllocator({ sourceId: 'source-1', statePath });
      await expect(allocator.allocate({ type: 'workflow.delete', workflowId: 'wf-1' })).resolves.toEqual({
        eventId: 'source-1:4',
        entityRevision: '3',
      });

      const raw = JSON.parse(await readFile(statePath, 'utf8')) as {
        version: number;
        sourceId: string;
        entityRevisions: Record<string, string>;
      };
      expect(raw).toMatchObject({ version: 3, sourceId: 'source-1' });
      expect(raw.entityRevisions).toEqual({ '["workflow","wf-1"]': '3' });
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('rejects concurrent publisher allocators sharing one state path', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'n8n-sync-publisher-source-'));

    try {
      const statePath = join(tempDir, 'publisher-ordering.json');
      const first = createEventOrderingAllocator({ sourceId: 'source-1', statePath });
      // Short wait window: the live same-host lock must still fail loud,
      // but only after the bounded wait (PUBLOCK-01 wait-and-retry).
      const second = createEventOrderingAllocator({
        sourceId: 'source-1',
        statePath,
        lock: { waitTimeoutMs: 500, pollMs: 20 },
      });

      await first.initialize();
      await expect(second.initialize()).rejects.toThrow(/Multiple publisher processes sharing one SYNC_SOURCE_ID/);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('emits publisher-generated events that pass subscriber wire validation', async () => {
    const emitted: SyncEvent[] = [];
    const { hooks } = makeDeps({
      entities: { executions: true },
      emit: async (event) => {
        emitted.push(event);
      },
    });

    await hooks.workflow.afterDelete[0]('wf-1' as never);
    await hooks.credentials.delete[0]('cred-1' as never);
    await hooks.workflow.postExecute[0](
      {
        status: 'success',
        mode: 'manual',
        finished: true,
        startedAt: new Date('2026-05-01T10:00:00.000Z'),
      } as never,
      workflow as never,
      'exec-1' as never,
    );
    await new Promise((resolve) => setImmediate(resolve));

    expect(emitted).toHaveLength(3);
    for (const event of emitted) {
      expect(parseSyncEvent(event)).toEqual(event);
    }
  });
});
