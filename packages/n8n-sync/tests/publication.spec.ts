import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { SyncEntity } from '../src/shared/config';
import type { Logger } from '../src/shared/logger';
import type { SyncEvent, SyncWorkflowDto } from '../src/shared/types';
import { createApplier } from '../src/subscriber/applier';
import type { N8nSyncRepositories } from '../src/subscriber/n8n-runtime';
import { createWorkflowPublicationManager } from '../src/subscriber/publication';

const log: Logger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  child: vi.fn(),
};

const owner = { id: 'owner-1', firstName: 'Owner', lastName: 'User' };

function makeServices() {
  return {
    history: {
      findVersion: vi.fn().mockResolvedValue(null),
      saveVersion: vi.fn().mockResolvedValue(undefined),
    },
    workflows: {
      activateWorkflow: vi.fn().mockResolvedValue({}),
      deactivateWorkflow: vi.fn().mockResolvedValue({}),
    },
  };
}

const version = { versionId: 'v-1', nodes: [{ id: 'n1' }], connections: {} };

describe('createWorkflowPublicationManager', () => {
  beforeEach(() => vi.clearAllMocks());

  it('materializes a missing history version before publishing', async () => {
    const services = makeServices();
    const manager = createWorkflowPublicationManager(
      { historyService: services.history, workflowService: services.workflows },
      { log },
    );

    const status = await manager.syncPublishedState({ workflowId: 'wf-1', version, active: true }, owner);

    expect(status).toBe('published');
    expect(services.history.findVersion).toHaveBeenCalledWith('wf-1', 'v-1');
    expect(services.history.saveVersion).toHaveBeenCalledWith(
      owner,
      { versionId: 'v-1', nodes: [{ id: 'n1' }], connections: {} },
      'wf-1',
    );
    expect(services.workflows.activateWorkflow).toHaveBeenCalledWith(owner, 'wf-1');
    expect(services.workflows.deactivateWorkflow).not.toHaveBeenCalled();
  });

  it('skips the version save when the version already exists', async () => {
    const services = makeServices();
    services.history.findVersion.mockResolvedValue({ versionId: 'v-1' });
    const manager = createWorkflowPublicationManager(
      { historyService: services.history, workflowService: services.workflows },
      { log },
    );

    const status = await manager.syncPublishedState({ workflowId: 'wf-1', version, active: true }, owner);

    expect(status).toBe('published');
    expect(services.history.saveVersion).not.toHaveBeenCalled();
    expect(services.workflows.activateWorkflow).toHaveBeenCalledWith(owner, 'wf-1');
  });

  it('unpublishes through the workflow service when the desired state is inactive', async () => {
    const services = makeServices();
    const manager = createWorkflowPublicationManager(
      { historyService: services.history, workflowService: services.workflows },
      { log },
    );

    const status = await manager.syncPublishedState({ workflowId: 'wf-1', version, active: false }, owner);

    expect(status).toBe('unpublished');
    // The version is still ensured so a later publish finds it.
    expect(services.history.saveVersion).toHaveBeenCalled();
    expect(services.workflows.deactivateWorkflow).toHaveBeenCalledWith(owner, 'wf-1');
    expect(services.workflows.activateWorkflow).not.toHaveBeenCalled();
  });

  it('reports unavailable when services or the owner are missing', async () => {
    const services = makeServices();
    const full = createWorkflowPublicationManager(
      { historyService: services.history, workflowService: services.workflows },
      { log },
    );
    const partial = createWorkflowPublicationManager({ workflowService: services.workflows }, { log });
    const empty = createWorkflowPublicationManager({}, { log });

    expect(await full.syncPublishedState({ workflowId: 'wf-1', version, active: true }, undefined)).toBe('unavailable');
    expect(await partial.syncPublishedState({ workflowId: 'wf-1', version, active: true }, owner)).toBe('unavailable');
    expect(await empty.syncPublishedState({ workflowId: 'wf-1', version, active: true }, owner)).toBe('unavailable');

    expect(services.workflows.activateWorkflow).not.toHaveBeenCalled();
    expect(services.history.saveVersion).not.toHaveBeenCalled();
  });

  it('reports failed without throwing when activation fails', async () => {
    const services = makeServices();
    services.workflows.activateWorkflow.mockRejectedValue(new Error('webhook conflict'));
    const manager = createWorkflowPublicationManager(
      { historyService: services.history, workflowService: services.workflows },
      { log },
    );

    const status = await manager.syncPublishedState({ workflowId: 'wf-1', version, active: true }, owner);

    expect(status).toBe('failed');
    expect(log.warn).toHaveBeenCalledWith(
      'Target workflow publication sync failed',
      expect.objectContaining({ workflowId: 'wf-1', active: true }),
    );
  });

  it('still attempts the version save when the version lookup fails', async () => {
    const services = makeServices();
    services.history.findVersion.mockRejectedValue(new Error('lookup boom'));
    const manager = createWorkflowPublicationManager(
      { historyService: services.history, workflowService: services.workflows },
      { log },
    );

    const status = await manager.syncPublishedState({ workflowId: 'wf-1', version, active: true }, owner);

    expect(status).toBe('published');
    expect(services.history.saveVersion).toHaveBeenCalled();
    expect(services.workflows.activateWorkflow).toHaveBeenCalled();
  });

  it('unpublishes best-effort before removal and never throws', async () => {
    const services = makeServices();
    const manager = createWorkflowPublicationManager(
      { historyService: services.history, workflowService: services.workflows },
      { log },
    );

    await manager.removePublication('wf-1', owner);
    expect(services.workflows.deactivateWorkflow).toHaveBeenCalledWith(owner, 'wf-1');

    services.workflows.deactivateWorkflow.mockRejectedValueOnce(new Error('gone'));
    await manager.removePublication('wf-1', owner);
    expect(log.warn).toHaveBeenCalledWith(
      'Target workflow unpublish before removal failed',
      expect.objectContaining({ workflowId: 'wf-1' }),
    );

    await manager.removePublication('wf-1', undefined);
    await createWorkflowPublicationManager({}, { log }).removePublication('wf-1', owner);
  });
});

function makePublication() {
  return {
    syncPublishedState: vi.fn().mockResolvedValue('published'),
    removePublication: vi.fn().mockResolvedValue(undefined),
  };
}

function makeRepos(existing: { workflow?: unknown } = {}) {
  const mocks = {
    workflow: {
      findOneBy: vi.fn().mockResolvedValue(existing.workflow ?? null),
      save: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    },
    credentials: {
      findOneBy: vi.fn().mockResolvedValue(null),
      save: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    },
    sharedWorkflow: {
      findOneBy: vi.fn().mockResolvedValue(null),
      save: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    },
    sharedCredentials: {
      findOneBy: vi.fn().mockResolvedValue(null),
      save: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    },
    user: { findOne: vi.fn().mockResolvedValue(owner) },
    project: { getPersonalProjectForUser: vi.fn().mockResolvedValue(null) },
  };
  return mocks as unknown as N8nSyncRepositories & { [K in keyof typeof mocks]: (typeof mocks)[K] };
}

const workflow: SyncWorkflowDto = {
  id: 'wf-1',
  name: 'Synced Workflow',
  active: true,
  isArchived: false,
  nodes: [{ id: 'n1' }],
  connections: {},
  versionId: 'v-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
};

function orderedEvent<T extends Omit<SyncEvent, 'at' | 'sourceId' | 'eventId' | 'entityRevision'>>(
  event: T,
  overrides: Partial<Pick<SyncEvent, 'at' | 'sourceId' | 'eventId' | 'entityRevision'>> = {},
): T & Pick<SyncEvent, 'at' | 'sourceId' | 'eventId' | 'entityRevision'> {
  return {
    ...event,
    at: overrides.at ?? '2026-01-02T00:00:00.000Z',
    sourceId: overrides.sourceId ?? 's',
    eventId: overrides.eventId ?? 's:1',
    entityRevision: overrides.entityRevision ?? '1',
  };
}

describe('applier target-side publication wiring', () => {
  beforeEach(() => vi.clearAllMocks());

  it('converges publish state after a created workflow when applyActiveState is enabled', async () => {
    const repos = makeRepos();
    const publication = makePublication();
    const apply = createApplier(repos, { log, applyActiveState: true, publication });

    const result = await apply(orderedEvent({ type: 'workflow.upsert', workflow }));

    expect(result).toEqual({ status: 'applied' });
    expect(publication.syncPublishedState).toHaveBeenCalledTimes(1);
    expect(publication.syncPublishedState).toHaveBeenCalledWith(
      {
        workflowId: 'wf-1',
        version: { versionId: 'v-1', nodes: [{ id: 'n1' }], connections: {} },
        active: true,
      },
      owner,
    );
  });

  it('skips publication for stale upserts and when applyActiveState is disabled', async () => {
    const stale = makeRepos({
      workflow: { id: 'wf-1', updatedAt: new Date('2026-02-01T00:00:00.000Z') },
    } as never);
    const publication = makePublication();
    const applyStale = createApplier(stale, { log, applyActiveState: true, publication });

    await applyStale(orderedEvent({ type: 'workflow.upsert', workflow }));

    expect(publication.syncPublishedState).not.toHaveBeenCalled();

    const repos = makeRepos();
    const applyInactive = createApplier(repos, { log, publication });
    await applyInactive(orderedEvent({ type: 'workflow.upsert', workflow }));
    expect(publication.syncPublishedState).not.toHaveBeenCalled();
  });

  it('still applies the event when the publication manager fails without status', async () => {
    const repos = makeRepos();
    const publication = makePublication();
    publication.syncPublishedState.mockRejectedValue(new Error('unexpected'));
    const apply = createApplier(repos, { log, applyActiveState: true, publication });

    const result = await apply(orderedEvent({ type: 'workflow.upsert', workflow }));

    expect(result).toEqual({ status: 'applied' });
    expect(log.warn).toHaveBeenCalledWith(
      'Target workflow publication sync failed without status',
      expect.objectContaining({ workflowId: 'wf-1' }),
    );
  });

  it('skips publication for archived workflows', async () => {
    const repos = makeRepos();
    const publication = makePublication();
    const apply = createApplier(repos, { log, applyActiveState: true, publication });

    await apply(orderedEvent({ type: 'workflow.upsert', workflow: { ...workflow, isArchived: true } }));

    expect(publication.syncPublishedState).not.toHaveBeenCalled();
  });

  it('unpublishes before deleting the workflow row', async () => {
    const repos = makeRepos();
    const publication = makePublication();
    const apply = createApplier(repos, {
      log,
      applyActiveState: true,
      allowedEntities: new Set<SyncEntity>(['workflows']),
      publication,
    });

    const result = await apply(orderedEvent({ type: 'workflow.delete', workflowId: 'wf-1' }));

    expect(result).toEqual({ status: 'applied' });
    expect(publication.removePublication).toHaveBeenCalledWith('wf-1', owner);
    expect(repos.workflow.delete).toHaveBeenCalledWith('wf-1');
    expect(publication.removePublication.mock.invocationCallOrder[0]).toBeLessThan(
      (repos.workflow.delete as unknown as { mock: { invocationCallOrder: number[] } }).mock.invocationCallOrder[0],
    );
  });

  it('unpublishes when archiving but not when unarchiving', async () => {
    const repos = makeRepos();
    const publication = makePublication();
    const apply = createApplier(repos, { log, applyActiveState: true, publication });

    await apply(orderedEvent({ type: 'workflow.archive', workflowId: 'wf-1', archived: true }));
    expect(publication.removePublication).toHaveBeenCalledWith('wf-1', owner);

    vi.clearAllMocks();
    await apply(
      orderedEvent(
        { type: 'workflow.archive', workflowId: 'wf-1', archived: false },
        { eventId: 's:2', entityRevision: '2' },
      ),
    );
    expect(publication.removePublication).not.toHaveBeenCalled();
  });
});
