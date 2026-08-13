import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Logger } from '../src/shared/logger';
import type { SyncCredentialDto, SyncEvent, SyncExecutionDto, SyncWorkflowDto } from '../src/shared/types';
import { createApplier } from '../src/subscriber/applier';
import type { ExecutionIdentityStore } from '../src/subscriber/execution-identity';
import type { N8nSyncRepositories } from '../src/subscriber/n8n-runtime';
import { createSyncOrderingStore } from '../src/subscriber/order-state';

const log: Logger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  child: vi.fn(),
};

function makeRepos(existing: { workflow?: unknown; credential?: unknown; execution?: unknown } = {}) {
  const mocks = {
    workflow: {
      findOneBy: vi.fn().mockResolvedValue(existing.workflow ?? null),
      save: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    },
    credentials: {
      findOneBy: vi.fn().mockResolvedValue(existing.credential ?? null),
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
    user: { findOne: vi.fn().mockResolvedValue(null) },
    project: { getPersonalProjectForUser: vi.fn().mockResolvedValue(null) },
    execution: {
      findOneBy: vi.fn().mockResolvedValue(existing.execution ?? null),
      save: vi.fn().mockResolvedValue({ id: 'target-exec-1' }),
      update: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    },
  };
  return mocks as unknown as N8nSyncRepositories & { [K in keyof typeof mocks]: (typeof mocks)[K] };
}

function makeReposWithoutExecution(existing: { workflow?: unknown; credential?: unknown } = {}) {
  const mocks = {
    workflow: {
      findOneBy: vi.fn().mockResolvedValue(existing.workflow ?? null),
      save: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    },
    credentials: {
      findOneBy: vi.fn().mockResolvedValue(existing.credential ?? null),
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
    user: { findOne: vi.fn().mockResolvedValue(null) },
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
  connections: { n1: {} },
  settings: { a: 1 },
  versionId: 'v-1',
  activeVersionId: 'v-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
};

const credential: SyncCredentialDto = {
  id: 'cred-1',
  name: 'Synced Credential',
  type: 'httpBasicAuth',
  data: 'encrypted-blob',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
};

const execution: SyncExecutionDto = {
  id: 'exec-1',
  workflowId: 'wf-1',
  status: 'success',
  mode: 'manual',
  finished: true,
  startedAt: '2026-05-01T10:00:00.000Z',
  stoppedAt: '2026-05-01T10:00:05.000Z',
  createdAt: '2026-05-01T10:00:00.000Z',
};

function makeExecutionIdentityStore(
  initial: Array<{
    sourceId: string;
    sourceExecutionId: string;
    targetExecutionId: string | number;
    workflowId?: string | null;
  }> = [],
) {
  const state = new Map(
    initial.map((record) => [JSON.stringify([record.sourceId, record.sourceExecutionId]), { ...record }]),
  );
  const store: ExecutionIdentityStore = {
    get: vi.fn(async ({ sourceId, sourceExecutionId }) => state.get(JSON.stringify([sourceId, sourceExecutionId]))),
    set: vi.fn(async (record) => {
      state.set(JSON.stringify([record.sourceId, record.sourceExecutionId]), { ...record });
    }),
    delete: vi.fn(async ({ sourceId, sourceExecutionId }) =>
      state.delete(JSON.stringify([sourceId, sourceExecutionId])),
    ),
    listBySourceWorkflow: vi.fn(async ({ sourceId, workflowId }) =>
      [...state.values()].filter((record) => record.sourceId === sourceId && record.workflowId === workflowId),
    ),
    deleteBySourceWorkflow: vi.fn(async ({ sourceId, workflowId }) => {
      let removed = 0;
      for (const [key, record] of state.entries()) {
        if (record.sourceId === sourceId && record.workflowId === workflowId) {
          state.delete(key);
          removed += 1;
        }
      }
      return removed;
    }),
    deleteSource: vi.fn(async (sourceId) => {
      let removed = 0;
      for (const [key, record] of state.entries()) {
        if (record.sourceId === sourceId) {
          state.delete(key);
          removed += 1;
        }
      }
      return removed;
    }),
  };
  return { store, state };
}

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

describe('createApplier', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('workflow.upsert', () => {
    it('updates an existing workflow and preserves the target active state by default', async () => {
      const repos = makeRepos({ workflow: { id: 'wf-1' } });
      const apply = createApplier(repos, { log });

      await apply(orderedEvent({ type: 'workflow.upsert', workflow }));

      expect(repos.workflow.update).toHaveBeenCalledTimes(1);
      const [id, fields] = repos.workflow.update.mock.calls[0] as [string, Record<string, unknown>];
      expect(id).toBe('wf-1');
      expect(fields.name).toBe('Synced Workflow');
      expect(fields.isArchived).toBe(false);
      expect(fields.updatedAt).toEqual(new Date('2026-01-02T00:00:00.000Z'));
      expect(fields).not.toHaveProperty('active');
      expect(fields).not.toHaveProperty('activeVersionId');
      expect(repos.workflow.save).not.toHaveBeenCalled();
    });

    it('creates a missing workflow as inactive by default and links it to the target project', async () => {
      const repos = makeRepos();
      const apply = createApplier(repos, { log, targetProjectId: 'proj-1' });

      await apply(orderedEvent({ type: 'workflow.upsert', workflow }));

      expect(repos.workflow.save).toHaveBeenCalledTimes(1);
      const entity = repos.workflow.save.mock.calls[0][0] as Record<string, unknown>;
      expect(entity.id).toBe('wf-1');
      expect(entity.active).toBe(false);
      expect(entity.activeVersionId).toBeNull();
      expect(entity.createdAt).toEqual(new Date('2026-01-01T00:00:00.000Z'));
      expect(repos.sharedWorkflow.save).toHaveBeenCalledWith({
        workflowId: 'wf-1',
        projectId: 'proj-1',
        role: 'workflow:owner',
      });
    });

    it('rolls back the created workflow when the required owner link fails so retry can repair it', async () => {
      const repos = makeRepos();
      repos.sharedWorkflow.save.mockRejectedValueOnce(new Error('link failed'));
      const apply = createApplier(repos, { log, targetProjectId: 'proj-1' });

      await expect(apply(orderedEvent({ type: 'workflow.upsert', workflow }))).rejects.toThrow('link failed');
      expect(repos.workflow.delete).toHaveBeenCalledWith('wf-1');

      repos.sharedWorkflow.save.mockResolvedValue(undefined);
      await apply(orderedEvent({ type: 'workflow.upsert', workflow }, { eventId: 's:2', entityRevision: '2' }));

      expect(repos.workflow.save).toHaveBeenCalledTimes(2);
      expect(repos.sharedWorkflow.save).toHaveBeenLastCalledWith({
        workflowId: 'wf-1',
        projectId: 'proj-1',
        role: 'workflow:owner',
      });
    });

    it('applies the source active state when applyActiveState is enabled', async () => {
      const repos = makeRepos({ workflow: { id: 'wf-1' } });
      const apply = createApplier(repos, { log, applyActiveState: true });

      await apply(orderedEvent({ type: 'workflow.activate', workflow }));

      const [, fields] = repos.workflow.update.mock.calls[0] as [string, Record<string, unknown>];
      expect(fields.active).toBe(true);
      expect(fields.activeVersionId).toBe('v-1');
    });

    it('skips the update when the stored workflow is newer than the incoming event', async () => {
      const repos = makeRepos({ workflow: { id: 'wf-1', updatedAt: new Date('2026-06-01T00:00:00.000Z') } });
      const apply = createApplier(repos, { log });

      await apply(orderedEvent({ type: 'workflow.upsert', workflow }));

      expect(repos.workflow.update).not.toHaveBeenCalled();
    });

    it('skips re-delivery of an already-applied event (equal updatedAt)', async () => {
      const repos = makeRepos({ workflow: { id: 'wf-1', updatedAt: new Date('2026-01-02T00:00:00.000Z') } });
      const apply = createApplier(repos, { log });

      await apply(orderedEvent({ type: 'workflow.upsert', workflow }));

      expect(repos.workflow.update).not.toHaveBeenCalled();
    });

    it('applies the update when the stored workflow is older than the incoming event', async () => {
      const repos = makeRepos({ workflow: { id: 'wf-1', updatedAt: new Date('2026-01-01T00:00:00.000Z') } });
      const apply = createApplier(repos, { log });

      await apply(orderedEvent({ type: 'workflow.upsert', workflow }));

      expect(repos.workflow.update).toHaveBeenCalledTimes(1);
    });

    it('repairs a missing workflow owner link on existing rows', async () => {
      const repos = makeRepos({ workflow: { id: 'wf-1', updatedAt: new Date('2026-01-01T00:00:00.000Z') } });
      repos.sharedWorkflow.findOneBy.mockResolvedValueOnce(null);
      const apply = createApplier(repos, { log, targetProjectId: 'proj-1' });

      await apply(orderedEvent({ type: 'workflow.upsert', workflow }));

      expect(repos.sharedWorkflow.findOneBy).toHaveBeenCalledWith({ workflowId: 'wf-1', role: 'workflow:owner' });
      expect(repos.sharedWorkflow.save).toHaveBeenCalledWith({
        workflowId: 'wf-1',
        projectId: 'proj-1',
        role: 'workflow:owner',
      });
    });

    it('replaces the workflow owner link when targetProjectId changes', async () => {
      const repos = makeRepos({ workflow: { id: 'wf-1', updatedAt: new Date('2026-01-01T00:00:00.000Z') } });
      repos.sharedWorkflow.findOneBy.mockResolvedValueOnce({
        workflowId: 'wf-1',
        projectId: 'old-proj',
        role: 'workflow:owner',
      });
      const apply = createApplier(repos, { log, targetProjectId: 'new-proj' });

      await apply(orderedEvent({ type: 'workflow.upsert', workflow }));

      expect(repos.sharedWorkflow.delete).toHaveBeenCalledWith({
        workflowId: 'wf-1',
        projectId: 'old-proj',
        role: 'workflow:owner',
      });
      expect(repos.sharedWorkflow.save).toHaveBeenCalledWith({
        workflowId: 'wf-1',
        projectId: 'new-proj',
        role: 'workflow:owner',
      });
    });

    it('reconciles a concurrent workflow insert after a uniqueness conflict instead of leaking the error', async () => {
      const repos = makeRepos();
      repos.workflow.save.mockRejectedValueOnce(new Error('duplicate key value violates unique constraint'));
      repos.workflow.findOneBy
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'wf-1', updatedAt: new Date('2026-01-01T00:00:00.000Z') });
      const apply = createApplier(repos, { log, targetProjectId: 'proj-1' });

      await apply(orderedEvent({ type: 'workflow.upsert', workflow }));

      expect(repos.workflow.update).toHaveBeenCalledWith('wf-1', expect.objectContaining({ name: 'Synced Workflow' }));
      expect(repos.sharedWorkflow.save).toHaveBeenCalledWith({
        workflowId: 'wf-1',
        projectId: 'proj-1',
        role: 'workflow:owner',
      });
    });

    it('serializes concurrent workflow revisions so an older update cannot overwrite a newer one', async () => {
      const repos = makeRepos({ workflow: { id: 'wf-1', updatedAt: new Date('2026-01-01T00:00:00.000Z') } });
      let releaseUpdate: (() => void) | undefined;
      repos.workflow.update.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            releaseUpdate = () => resolve(undefined);
          }),
      );
      const apply = createApplier(repos, { log });

      const newer = apply(
        orderedEvent(
          { type: 'workflow.upsert', workflow: { ...workflow, name: 'Newer workflow' } },
          { eventId: 's:2', entityRevision: '2' },
        ),
      );
      const older = apply(
        orderedEvent(
          { type: 'workflow.upsert', workflow: { ...workflow, name: 'Older workflow' } },
          { eventId: 's:1', entityRevision: '1' },
        ),
      );

      await new Promise((resolve) => setTimeout(resolve, 0));
      releaseUpdate?.();
      await Promise.all([newer, older]);

      expect(repos.workflow.update).toHaveBeenCalledTimes(1);
      const [, fields] = repos.workflow.update.mock.calls[0] as [string, Record<string, unknown>];
      expect(fields.name).toBe('Newer workflow');
    });

    it('uses entityRevision to break ties when source timestamps are equal', async () => {
      const repos = makeRepos({ workflow: { id: 'wf-1', updatedAt: new Date('2026-01-01T00:00:00.000Z') } });
      const apply = createApplier(repos, { log });

      await apply(
        orderedEvent(
          {
            type: 'workflow.upsert',
            workflow: { ...workflow, updatedAt: '2026-01-02T00:00:00.000Z', name: 'First name' },
          },
          { eventId: 's:1', entityRevision: '1' },
        ),
      );
      await apply(
        orderedEvent(
          {
            type: 'workflow.upsert',
            workflow: { ...workflow, updatedAt: '2026-01-02T00:00:00.000Z', name: 'Second name' },
          },
          { eventId: 's:2', entityRevision: '2' },
        ),
      );

      expect(repos.workflow.update).toHaveBeenCalledTimes(2);
      const [, secondFields] = repos.workflow.update.mock.calls[1] as [string, Record<string, unknown>];
      expect(secondFields.name).toBe('Second name');
    });
  });

  describe('workflow.delete', () => {
    it('deletes the workflow by id', async () => {
      const repos = makeRepos();
      const identity = makeExecutionIdentityStore();
      const apply = createApplier(repos, { log, executionIdentity: identity.store });

      await apply(orderedEvent({ type: 'workflow.delete', workflowId: 'wf-1' }));

      expect(repos.workflow.delete).toHaveBeenCalledWith('wf-1');
    });

    it('deletes mapped synced executions before deleting the workflow', async () => {
      const repos = makeRepos();
      const identity = makeExecutionIdentityStore([
        { sourceId: 's', sourceExecutionId: 'exec-1', targetExecutionId: 'target-exec-1', workflowId: 'wf-1' },
        { sourceId: 's', sourceExecutionId: 'exec-2', targetExecutionId: 'target-exec-2', workflowId: 'wf-1' },
      ]);
      const apply = createApplier(repos, { log, executionIdentity: identity.store });

      await apply(orderedEvent({ type: 'workflow.delete', workflowId: 'wf-1' }));

      expect(repos.execution.delete).toHaveBeenCalledTimes(2);
      expect(repos.execution.delete).toHaveBeenNthCalledWith(1, 'target-exec-1');
      expect(repos.execution.delete).toHaveBeenNthCalledWith(2, 'target-exec-2');
      expect(repos.workflow.delete).toHaveBeenCalledWith('wf-1');
      expect(identity.store.deleteBySourceWorkflow).toHaveBeenCalledWith({ sourceId: 's', workflowId: 'wf-1' });
    });

    it('treats duplicate delete delivery as a no-op after the first apply', async () => {
      const repos = makeRepos();
      const identity = makeExecutionIdentityStore();
      const apply = createApplier(repos, { log, executionIdentity: identity.store });
      const event = orderedEvent({ type: 'workflow.delete', workflowId: 'wf-1' });

      await apply(event);
      await apply(event);

      expect(repos.workflow.delete).toHaveBeenCalledTimes(1);
    });
  });

  describe('workflow.archive', () => {
    it('sets only the archive flag by default', async () => {
      const repos = makeRepos();
      const apply = createApplier(repos, { log });

      await apply(orderedEvent({ type: 'workflow.archive', workflowId: 'wf-1', archived: true }));

      expect(repos.workflow.update).toHaveBeenCalledWith('wf-1', { isArchived: true });
    });

    it('also clears the active state on archive when applyActiveState is enabled', async () => {
      const repos = makeRepos();
      const apply = createApplier(repos, { log, applyActiveState: true });

      await apply(orderedEvent({ type: 'workflow.archive', workflowId: 'wf-1', archived: true }));

      expect(repos.workflow.update).toHaveBeenCalledWith('wf-1', {
        isArchived: true,
        active: false,
        activeVersionId: null,
      });
    });

    it('skips a stale archive when a newer workflow revision was already applied', async () => {
      const repos = makeRepos();
      const apply = createApplier(repos, { log });

      await apply(orderedEvent({ type: 'workflow.upsert', workflow }, { eventId: 's:2', entityRevision: '2' }));
      repos.workflow.update.mockClear();

      await apply(
        orderedEvent(
          { type: 'workflow.archive', workflowId: 'wf-1', archived: true },
          { eventId: 's:1', entityRevision: '1' },
        ),
      );

      expect(repos.workflow.update).not.toHaveBeenCalled();
    });
  });

  describe('credentials.upsert', () => {
    it('updates an existing credential, passing the encrypted blob through', async () => {
      const repos = makeRepos({ credential: { id: 'cred-1' } });
      const apply = createApplier(repos, { log });

      await apply(orderedEvent({ type: 'credentials.upsert', credential }));

      const [id, fields] = repos.credentials.update.mock.calls[0] as [string, Record<string, unknown>];
      expect(id).toBe('cred-1');
      expect(fields.data).toBe('encrypted-blob');
      expect(fields.type).toBe('httpBasicAuth');
      expect(repos.credentials.save).not.toHaveBeenCalled();
    });

    it('creates a missing credential and links it to the target project', async () => {
      const repos = makeRepos();
      const apply = createApplier(repos, { log, targetProjectId: 'proj-1' });

      await apply(orderedEvent({ type: 'credentials.upsert', credential }));

      const entity = repos.credentials.save.mock.calls[0][0] as Record<string, unknown>;
      expect(entity.id).toBe('cred-1');
      expect(entity.isGlobal).toBe(false);
      expect(repos.sharedCredentials.save).toHaveBeenCalledWith({
        credentialsId: 'cred-1',
        projectId: 'proj-1',
        role: 'credential:owner',
      });
    });

    it('rolls back the created credential when the required owner link fails so retry can repair it', async () => {
      const repos = makeRepos();
      repos.sharedCredentials.save.mockRejectedValueOnce(new Error('link failed'));
      const apply = createApplier(repos, { log, targetProjectId: 'proj-1' });

      await expect(apply(orderedEvent({ type: 'credentials.upsert', credential }))).rejects.toThrow('link failed');
      expect(repos.credentials.delete).toHaveBeenCalledWith('cred-1');

      repos.sharedCredentials.save.mockResolvedValue(undefined);
      await apply(orderedEvent({ type: 'credentials.upsert', credential }, { eventId: 's:2', entityRevision: '2' }));

      expect(repos.credentials.save).toHaveBeenCalledTimes(2);
      expect(repos.sharedCredentials.save).toHaveBeenLastCalledWith({
        credentialsId: 'cred-1',
        projectId: 'proj-1',
        role: 'credential:owner',
      });
    });

    it('skips the update when the stored credential is newer than the incoming event', async () => {
      const repos = makeRepos({ credential: { id: 'cred-1', updatedAt: new Date('2026-06-01T00:00:00.000Z') } });
      const apply = createApplier(repos, { log });

      await apply(orderedEvent({ type: 'credentials.upsert', credential }));

      expect(repos.credentials.update).not.toHaveBeenCalled();
    });

    it('repairs a missing credential owner link on existing rows', async () => {
      const repos = makeRepos({ credential: { id: 'cred-1', updatedAt: new Date('2026-01-01T00:00:00.000Z') } });
      repos.sharedCredentials.findOneBy.mockResolvedValueOnce(null);
      const apply = createApplier(repos, { log, targetProjectId: 'proj-1' });

      await apply(orderedEvent({ type: 'credentials.upsert', credential }));

      expect(repos.sharedCredentials.findOneBy).toHaveBeenCalledWith({
        credentialsId: 'cred-1',
        role: 'credential:owner',
      });
      expect(repos.sharedCredentials.save).toHaveBeenCalledWith({
        credentialsId: 'cred-1',
        projectId: 'proj-1',
        role: 'credential:owner',
      });
    });

    it('fails closed on unsupported credential object payloads', async () => {
      const repos = makeRepos();
      const apply = createApplier(repos, { log });

      await expect(
        apply(
          orderedEvent({
            type: 'credentials.upsert',
            credential: {
              ...credential,
              data: { user: 'alice', password: 'secret' }, // pragma: allowlist secret
            } as unknown as SyncCredentialDto,
          }),
        ),
      ).rejects.toThrow('Credential sync requires encrypted string data');

      expect(repos.credentials.save).not.toHaveBeenCalled();
      expect(repos.credentials.update).not.toHaveBeenCalled();
    });
  });

  describe('credentials.delete', () => {
    it('deletes the credential by id', async () => {
      const repos = makeRepos();
      const apply = createApplier(repos, { log });

      await apply(orderedEvent({ type: 'credentials.delete', credentialId: 'cred-1' }));

      expect(repos.credentials.delete).toHaveBeenCalledWith('cred-1');
    });
  });

  describe('owner fallback (no targetProjectId)', () => {
    it('links a created workflow to the owner personal project when targetProjectId is empty', async () => {
      const repos = makeRepos();
      repos.user.findOne.mockResolvedValueOnce({ id: 'owner-1' });
      repos.project.getPersonalProjectForUser.mockResolvedValueOnce({ id: 'personal-proj-1' });
      const apply = createApplier(repos, { log });

      await apply(orderedEvent({ type: 'workflow.upsert', workflow }));

      expect(repos.user.findOne).toHaveBeenCalledTimes(1);
      const findOpts = repos.user.findOne.mock.calls[0][0] as Record<string, unknown>;
      expect(findOpts.where).toEqual({ role: { slug: 'global:owner' } });
      expect(findOpts.relations).toEqual(['role']);
      expect(repos.project.getPersonalProjectForUser).toHaveBeenCalledWith('owner-1');
      expect(repos.sharedWorkflow.save).toHaveBeenCalledWith({
        workflowId: 'wf-1',
        projectId: 'personal-proj-1',
        role: 'workflow:owner',
      });
    });

    it('links a created credential to the owner personal project when targetProjectId is empty', async () => {
      const repos = makeRepos();
      repos.user.findOne.mockResolvedValueOnce({ id: 'owner-1' });
      repos.project.getPersonalProjectForUser.mockResolvedValueOnce({ id: 'personal-proj-1' });
      const apply = createApplier(repos, { log });

      await apply(orderedEvent({ type: 'credentials.upsert', credential }));

      expect(repos.sharedCredentials.save).toHaveBeenCalledWith({
        credentialsId: 'cred-1',
        projectId: 'personal-proj-1',
        role: 'credential:owner',
      });
    });

    it('caches the resolved personal project across events (single lookup)', async () => {
      const repos = makeRepos();
      repos.user.findOne.mockResolvedValueOnce({ id: 'owner-1' });
      repos.project.getPersonalProjectForUser.mockResolvedValueOnce({ id: 'personal-proj-1' });
      const apply = createApplier(repos, { log });

      await apply(orderedEvent({ type: 'workflow.upsert', workflow }));
      repos.workflow.findOneBy.mockResolvedValue(null);
      const wf2 = { ...workflow, id: 'wf-2' };
      await apply(orderedEvent({ type: 'workflow.upsert', workflow: wf2 }, { eventId: 's:2' }));

      expect(repos.user.findOne).toHaveBeenCalledTimes(1);
      expect(repos.project.getPersonalProjectForUser).toHaveBeenCalledTimes(1);
      expect(repos.sharedWorkflow.save).toHaveBeenCalledWith({
        workflowId: 'wf-2',
        projectId: 'personal-proj-1',
        role: 'workflow:owner',
      });
    });

    it('skips linking when no owner is found and does not retry on subsequent events', async () => {
      const repos = makeRepos();
      const apply = createApplier(repos, { log });

      await apply(orderedEvent({ type: 'workflow.upsert', workflow }));
      await apply(orderedEvent({ type: 'credentials.upsert', credential }, { eventId: 's:2' }));

      expect(repos.sharedWorkflow.save).not.toHaveBeenCalled();
      expect(repos.sharedCredentials.save).not.toHaveBeenCalled();
      expect(repos.user.findOne).toHaveBeenCalledTimes(1);
      expect(repos.project.getPersonalProjectForUser).not.toHaveBeenCalled();
    });

    it('skips linking when owner has no personal project', async () => {
      const repos = makeRepos();
      repos.user.findOne.mockResolvedValueOnce({ id: 'owner-1' });
      const apply = createApplier(repos, { log });

      await apply(orderedEvent({ type: 'workflow.upsert', workflow }));

      expect(repos.sharedWorkflow.save).not.toHaveBeenCalled();
      expect(repos.project.getPersonalProjectForUser).toHaveBeenCalledWith('owner-1');
    });

    it('explicit targetProjectId wins over the owner fallback', async () => {
      const repos = makeRepos();
      repos.user.findOne.mockResolvedValue({ id: 'owner-1' });
      repos.project.getPersonalProjectForUser.mockResolvedValue({ id: 'personal-proj-1' });
      const apply = createApplier(repos, { log, targetProjectId: 'proj-1' });

      await apply(orderedEvent({ type: 'workflow.upsert', workflow }));

      expect(repos.user.findOne).not.toHaveBeenCalled();
      expect(repos.project.getPersonalProjectForUser).not.toHaveBeenCalled();
      expect(repos.sharedWorkflow.save).toHaveBeenCalledWith({
        workflowId: 'wf-1',
        projectId: 'proj-1',
        role: 'workflow:owner',
      });
    });

    it('retries owner fallback resolution after a transient error', async () => {
      const repos = makeRepos();
      repos.user.findOne
        .mockRejectedValueOnce(new Error('temporary db error'))
        .mockResolvedValueOnce({ id: 'owner-1' });
      repos.project.getPersonalProjectForUser.mockResolvedValueOnce({ id: 'personal-proj-1' });
      const apply = createApplier(repos, { log });

      await apply(orderedEvent({ type: 'workflow.upsert', workflow }));
      repos.credentials.findOneBy.mockResolvedValue(null);
      await apply(orderedEvent({ type: 'credentials.upsert', credential }, { eventId: 's:2' }));

      expect(repos.user.findOne).toHaveBeenCalledTimes(2);
      expect(repos.sharedWorkflow.save).not.toHaveBeenCalled();
      expect(repos.sharedCredentials.save).toHaveBeenCalledWith({
        credentialsId: 'cred-1',
        projectId: 'personal-proj-1',
        role: 'credential:owner',
      });
    });
  });

  describe('execution.upsert', () => {
    it('creates a missing execution row with a target-generated id and records the external identity mapping', async () => {
      const repos = makeRepos({ workflow: { id: 'wf-1' } });
      const identity = makeExecutionIdentityStore();
      const apply = createApplier(repos, { log, executionIdentity: identity.store });

      await apply(orderedEvent({ type: 'execution.upsert', execution }));

      expect(repos.execution.save).toHaveBeenCalledTimes(1);
      const entity = repos.execution.save.mock.calls[0][0] as Record<string, unknown>;
      expect(entity.id).toBeUndefined();
      expect(entity.workflowId).toBe('wf-1');
      expect(entity.status).toBe('success');
      expect(entity.finished).toBe(true);
      expect(entity.mode).toBe('manual');
      expect(entity.startedAt).toEqual(new Date('2026-05-01T10:00:00.000Z'));
      expect(entity.stoppedAt).toEqual(new Date('2026-05-01T10:00:05.000Z'));
      expect(entity.createdAt).toEqual(new Date('2026-05-01T10:00:00.000Z'));
      expect(entity).not.toHaveProperty('retryOf');
      expect(entity).not.toHaveProperty('retrySuccessId');
      expect(entity).not.toHaveProperty('workflowVersionId');
      expect(entity.storedAt).toBe('db');
      expect(identity.store.set).toHaveBeenCalledWith({
        sourceId: 's',
        sourceExecutionId: 'exec-1',
        targetExecutionId: 'target-exec-1',
        workflowId: 'wf-1',
      });
      expect(repos.execution.update).not.toHaveBeenCalled();
    });

    it('updates a mapped execution row without touching startedAt / createdAt', async () => {
      const repos = makeRepos({
        workflow: { id: 'wf-1' },
        execution: { id: 'target-exec-9', stoppedAt: new Date('2026-04-01T00:00:00.000Z') },
      });
      const identity = makeExecutionIdentityStore([
        { sourceId: 's', sourceExecutionId: 'exec-1', targetExecutionId: 'target-exec-9', workflowId: 'wf-1' },
      ]);
      const apply = createApplier(repos, { log, executionIdentity: identity.store });

      await apply(orderedEvent({ type: 'execution.upsert', execution }));

      expect(repos.execution.save).not.toHaveBeenCalled();
      expect(repos.execution.update).toHaveBeenCalledTimes(1);
      const [criteria, fields] = repos.execution.update.mock.calls[0] as [{ id: string }, Record<string, unknown>];
      expect(criteria).toEqual({ id: 'target-exec-9' });
      expect(fields.startedAt).toBeUndefined();
      expect(fields.createdAt).toBeUndefined();
      expect(fields.status).toBe('success');
      expect(fields.finished).toBe(true);
      expect(fields.stoppedAt).toEqual(new Date('2026-05-01T10:00:05.000Z'));
    });

    it('does not claim a native target execution whose id only matches the source execution id', async () => {
      const repos = makeRepos({
        workflow: { id: 'wf-1' },
        execution: { id: 'exec-1', stoppedAt: new Date('2026-04-01T00:00:00.000Z') },
      });
      const identity = makeExecutionIdentityStore();
      const apply = createApplier(repos, { log, executionIdentity: identity.store });

      await apply(orderedEvent({ type: 'execution.upsert', execution }));

      expect(repos.execution.findOneBy).not.toHaveBeenCalled();
      expect(repos.execution.update).not.toHaveBeenCalled();
      expect(repos.execution.save).toHaveBeenCalledTimes(1);
      expect(identity.store.set).toHaveBeenCalledWith({
        sourceId: 's',
        sourceExecutionId: 'exec-1',
        targetExecutionId: 'target-exec-1',
        workflowId: 'wf-1',
      });
    });

    it('skips the update when the stored execution is newer than the incoming event (stoppedAt >=)', async () => {
      const repos = makeRepos({
        workflow: { id: 'wf-1' },
        execution: { id: 'target-exec-9', stoppedAt: new Date('2026-06-01T00:00:00.000Z') },
      });
      const identity = makeExecutionIdentityStore([
        { sourceId: 's', sourceExecutionId: 'exec-1', targetExecutionId: 'target-exec-9', workflowId: 'wf-1' },
      ]);
      const apply = createApplier(repos, { log, executionIdentity: identity.store });

      await apply(orderedEvent({ type: 'execution.upsert', execution }));

      expect(repos.execution.update).not.toHaveBeenCalled();
    });

    it('skips the update when the stored execution has the same stoppedAt (idempotent re-delivery)', async () => {
      const repos = makeRepos({
        workflow: { id: 'wf-1' },
        execution: { id: 'target-exec-9', stoppedAt: new Date('2026-05-01T10:00:05.000Z') },
      });
      const identity = makeExecutionIdentityStore([
        { sourceId: 's', sourceExecutionId: 'exec-1', targetExecutionId: 'target-exec-9', workflowId: 'wf-1' },
      ]);
      const apply = createApplier(repos, { log, executionIdentity: identity.store });

      await apply(orderedEvent({ type: 'execution.upsert', execution }));

      expect(repos.execution.update).not.toHaveBeenCalled();
    });

    it('fails execution events when executions is not enabled on the subscriber', async () => {
      const repos = makeReposWithoutExecution();
      const identity = makeExecutionIdentityStore();
      const apply = createApplier(repos, { log, executionIdentity: identity.store });

      await expect(apply(orderedEvent({ type: 'execution.upsert', execution }))).rejects.toThrow(
        'Received execution event but executions are not enabled on this subscriber',
      );
    });

    it('applies when the stored stoppedAt is older than the incoming one', async () => {
      const repos = makeRepos({
        workflow: { id: 'wf-1' },
        execution: { id: 'target-exec-9', stoppedAt: new Date('2026-05-01T10:00:04.000Z') },
      });
      const identity = makeExecutionIdentityStore([
        { sourceId: 's', sourceExecutionId: 'exec-1', targetExecutionId: 'target-exec-9', workflowId: 'wf-1' },
      ]);
      const apply = createApplier(repos, { log, executionIdentity: identity.store });

      await apply(orderedEvent({ type: 'execution.upsert', execution }));

      expect(repos.execution.update).toHaveBeenCalledTimes(1);
    });

    it('recreates the mapping when the mapped target execution row was pruned', async () => {
      const repos = makeRepos({ workflow: { id: 'wf-1' }, execution: null });
      const identity = makeExecutionIdentityStore([
        { sourceId: 's', sourceExecutionId: 'exec-1', targetExecutionId: 'target-exec-old', workflowId: 'wf-1' },
      ]);
      const apply = createApplier(repos, { log, executionIdentity: identity.store });

      await apply(orderedEvent({ type: 'execution.upsert', execution }));

      expect(identity.store.delete).toHaveBeenCalledWith({ sourceId: 's', sourceExecutionId: 'exec-1' });
      expect(repos.execution.save).toHaveBeenCalledTimes(1);
      expect(identity.store.set).toHaveBeenCalledWith({
        sourceId: 's',
        sourceExecutionId: 'exec-1',
        targetExecutionId: 'target-exec-1',
        workflowId: 'wf-1',
      });
    });

    it('serializes concurrent deliveries for the same source execution so only one row is created', async () => {
      const repos = makeRepos({ workflow: { id: 'wf-1' } });
      const identity = makeExecutionIdentityStore();
      let savedExecution: { id: string; stoppedAt?: Date } | null = null;
      repos.execution.findOneBy = vi.fn(async () => savedExecution) as unknown as typeof repos.execution.findOneBy;
      let releaseSave: (() => void) | undefined;
      repos.execution.save = vi.fn(
        () =>
          new Promise((resolve) => {
            releaseSave = () => {
              savedExecution = { id: 'target-exec-1' };
              resolve({ id: 'target-exec-1' });
            };
          }),
      ) as unknown as typeof repos.execution.save;
      const apply = createApplier(repos, { log, executionIdentity: identity.store });

      const first = apply(
        orderedEvent(
          {
            type: 'execution.upsert',
            execution: { ...execution, status: 'running', finished: false, stoppedAt: undefined },
          },
          { eventId: 's:1', entityRevision: '1' },
        ),
      );
      const second = apply(
        orderedEvent(
          {
            type: 'execution.upsert',
            execution,
          },
          { eventId: 's:2', entityRevision: '2' },
        ),
      );

      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(repos.execution.save).toHaveBeenCalledTimes(1);
      releaseSave?.();
      await Promise.all([first, second]);

      expect(repos.execution.save).toHaveBeenCalledTimes(1);
      expect(repos.execution.update).toHaveBeenCalledTimes(1);
    });

    it('rejects orphan execution events when the target workflow does not exist', async () => {
      const repos = makeRepos();
      const identity = makeExecutionIdentityStore();
      const apply = createApplier(repos, { log, executionIdentity: identity.store });

      await expect(apply(orderedEvent({ type: 'execution.upsert', execution }))).rejects.toThrow(
        'Target workflow wf-1 does not exist for synced execution exec-1',
      );
      expect(repos.execution.save).not.toHaveBeenCalled();
      expect(repos.execution.update).not.toHaveBeenCalled();
    });

    it('does not let a terminal execution regress to a non-terminal state without stoppedAt', async () => {
      const repos = makeRepos({
        workflow: { id: 'wf-1' },
        execution: { id: 'target-exec-9', status: 'success', stoppedAt: new Date('2026-05-01T10:00:05.000Z') },
      });
      const identity = makeExecutionIdentityStore([
        { sourceId: 's', sourceExecutionId: 'exec-1', targetExecutionId: 'target-exec-9', workflowId: 'wf-1' },
      ]);
      const apply = createApplier(repos, { log, executionIdentity: identity.store });

      await apply(
        orderedEvent(
          {
            type: 'execution.upsert',
            execution: { ...execution, status: 'running', finished: false, stoppedAt: undefined },
          },
          { eventId: 's:2', entityRevision: '2' },
        ),
      );

      expect(repos.execution.update).not.toHaveBeenCalled();
    });

    it('does not let a terminal execution regress to unknown when the incoming event has no terminal timestamp', async () => {
      const repos = makeRepos({
        workflow: { id: 'wf-1' },
        execution: { id: 'target-exec-9', status: 'error', stoppedAt: new Date('2026-05-01T10:00:05.000Z') },
      });
      const identity = makeExecutionIdentityStore([
        { sourceId: 's', sourceExecutionId: 'exec-1', targetExecutionId: 'target-exec-9', workflowId: 'wf-1' },
      ]);
      const apply = createApplier(repos, { log, executionIdentity: identity.store });

      await apply(
        orderedEvent(
          {
            type: 'execution.upsert',
            execution: { ...execution, status: 'unknown', mode: 'unknown', finished: false, stoppedAt: undefined },
          },
          { eventId: 's:2', entityRevision: '2' },
        ),
      );

      expect(repos.execution.update).not.toHaveBeenCalled();
    });
  });

  describe('durable ordering state', () => {
    it('keeps delete tombstones across applier restarts so stale upserts do not recreate rows', async () => {
      const tempDir = await mkdtemp(join(tmpdir(), 'n8n-sync-order-'));

      try {
        const statePath = join(tempDir, 'subscriber-ordering.json');
        const firstRepos = makeRepos();
        const firstIdentity = makeExecutionIdentityStore();
        const firstApply = createApplier(firstRepos, {
          log,
          executionIdentity: firstIdentity.store,
          ordering: createSyncOrderingStore({ statePath }),
        });

        await firstApply(
          orderedEvent({ type: 'workflow.delete', workflowId: 'wf-1' }, { eventId: 's:2', entityRevision: '2' }),
        );

        const secondRepos = makeRepos();
        const secondIdentity = makeExecutionIdentityStore();
        const secondApply = createApplier(secondRepos, {
          log,
          executionIdentity: secondIdentity.store,
          ordering: createSyncOrderingStore({ statePath }),
        });

        await secondApply(orderedEvent({ type: 'workflow.upsert', workflow }, { eventId: 's:1', entityRevision: '1' }));

        expect(secondRepos.workflow.save).not.toHaveBeenCalled();
        expect(secondRepos.workflow.update).not.toHaveBeenCalled();
      } finally {
        await rm(tempDir, { recursive: true, force: true });
      }
    });

    it('orders revisions per source so different sources do not share ordering state', async () => {
      const tempDir = await mkdtemp(join(tmpdir(), 'n8n-sync-order-'));

      try {
        const statePath = join(tempDir, 'subscriber-ordering.json');
        const repos = makeRepos({ workflow: { id: 'wf-1', updatedAt: new Date('2025-01-01T00:00:00.000Z') } });
        const apply = createApplier(repos, {
          log,
          ordering: createSyncOrderingStore({ statePath }),
        });

        await apply(
          orderedEvent(
            { type: 'workflow.upsert', workflow },
            { sourceId: 'source-a', eventId: 'source-a:1', entityRevision: '1' },
          ),
        );
        await apply(
          orderedEvent(
            { type: 'workflow.upsert', workflow },
            { sourceId: 'source-b', eventId: 'source-b:1', entityRevision: '1' },
          ),
        );

        expect(repos.workflow.update).toHaveBeenCalledTimes(2);
      } finally {
        await rm(tempDir, { recursive: true, force: true });
      }
    });
  });
});
