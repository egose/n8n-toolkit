import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createPublisherHooks } from '../src/publisher/hooks';
import type { ICredentialsDb, IRunPayload, IWorkflowBase, IWorkflowTag, SyncEvent } from '../src/shared/types';

const NOW = new Date('2026-03-04T05:06:07.000Z');

function makeDeps(
  overrides: {
    entities?: { workflows?: boolean; credentials?: boolean; executions?: boolean };
    filterByTag?: boolean;
    syncWorkflowTag?: string;
    activeTag?: string;
  } = {},
) {
  const emit = vi.fn().mockResolvedValue(undefined);
  const hooks = createPublisherHooks({
    emit,
    sourceId: 'src-1',
    now: () => NOW,
    ...(overrides.entities ? { entities: overrides.entities } : {}),
    ...(overrides.filterByTag !== undefined ? { filterByTag: overrides.filterByTag } : {}),
    ...(overrides.syncWorkflowTag !== undefined ? { syncWorkflowTag: overrides.syncWorkflowTag } : {}),
    ...(overrides.activeTag !== undefined ? { activeTag: overrides.activeTag } : {}),
  });
  return { emit, hooks };
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

  it('wires only workflow.postExecute when workflows is disabled but executions is enabled', () => {
    const { hooks } = makeDeps({ entities: { workflows: false, executions: true } });
    expect(hooks.workflow).toBeDefined();
    expect(hooks.workflow.postExecute).toBeDefined();
    expect(hooks.workflow.afterCreate).toBeUndefined();
    expect(hooks.workflow.activate).toBeUndefined();
  });

  it('stamps every event with at/sourceId', async () => {
    const { emit, hooks } = makeDeps();
    await hooks.workflow.afterDelete[0]('wf-1' as never);
    expect(emittedEvent(emit)).toMatchObject({ at: NOW.toISOString(), sourceId: 'src-1' });
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

  it('resolves credentials.create from dbCollections when the hook payload is incomplete', async () => {
    const { emit, hooks } = makeDeps();
    const findOne = vi.fn().mockResolvedValue(credential);

    await hooks.credentials.create[0].call({ dbCollections: { Credentials: { findOne } } }, {
      name: credential.name,
      type: credential.type,
    } as never);

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(emit).toHaveBeenCalledTimes(1);
    expect(findOne).toHaveBeenCalledWith({
      where: { name: credential.name, type: credential.type },
      order: { updatedAt: 'DESC' },
    });
    expect(emittedEvent(emit)).toMatchObject({
      type: 'credentials.upsert',
      credential: { id: 'cred-1', name: 'C', data: 'encrypted' },
    });
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

  it('maps credentials.delete to credentials.delete', async () => {
    const { emit, hooks } = makeDeps();
    await hooks.credentials.delete[0]('cred-9' as never);
    expect(emittedEvent(emit)).toMatchObject({ type: 'credentials.delete', credentialId: 'cred-9' });
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
      // No tags, no active_real rewriting on the DTO when filter is off
      expect((emittedEvent(emit) as { workflow: Record<string, unknown> }).workflow.tags).toBeUndefined();
      expect((emittedEvent(emit) as { workflow: { meta?: unknown } }).workflow.meta).toBeUndefined();
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
  });
});
