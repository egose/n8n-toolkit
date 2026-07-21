import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createPublisherHooks } from '../src/publisher/hooks';
import type { ICredentialsDb, IWorkflowBase, SyncEvent } from '../src/shared/types';

const NOW = new Date('2026-03-04T05:06:07.000Z');

function makeDeps() {
  const emit = vi.fn().mockResolvedValue(undefined);
  const hooks = createPublisherHooks({ emit, sourceId: 'src-1', now: () => NOW });
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
});
