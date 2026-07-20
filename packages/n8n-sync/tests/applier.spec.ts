import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Logger } from '../src/shared/logger';
import type { SyncCredentialDto, SyncWorkflowDto } from '../src/shared/types';
import { createApplier } from '../src/subscriber/applier';
import type { N8nSyncRepositories } from '../src/subscriber/n8n-runtime';

const log: Logger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  child: vi.fn(),
};

function makeRepos(existing: { workflow?: unknown; credential?: unknown } = {}) {
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
    sharedWorkflow: { save: vi.fn().mockResolvedValue(undefined) },
    sharedCredentials: { save: vi.fn().mockResolvedValue(undefined) },
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

describe('createApplier', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('workflow.upsert', () => {
    it('updates an existing workflow and preserves the target active state by default', async () => {
      const repos = makeRepos({ workflow: { id: 'wf-1' } });
      const apply = createApplier(repos, { log });

      await apply({ type: 'workflow.upsert', at: '', sourceId: 's', workflow });

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

      await apply({ type: 'workflow.upsert', at: '', sourceId: 's', workflow });

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

    it('applies the source active state when applyActiveState is enabled', async () => {
      const repos = makeRepos({ workflow: { id: 'wf-1' } });
      const apply = createApplier(repos, { log, applyActiveState: true });

      await apply({ type: 'workflow.activate', at: '', sourceId: 's', workflow });

      const [, fields] = repos.workflow.update.mock.calls[0] as [string, Record<string, unknown>];
      expect(fields.active).toBe(true);
      expect(fields.activeVersionId).toBe('v-1');
    });

    it('skips the update when the stored workflow is newer than the incoming event', async () => {
      const repos = makeRepos({ workflow: { id: 'wf-1', updatedAt: new Date('2026-06-01T00:00:00.000Z') } });
      const apply = createApplier(repos, { log });

      // workflow.updatedAt is 2026-01-02 — older than the stored row
      await apply({ type: 'workflow.upsert', at: '', sourceId: 's', workflow });

      expect(repos.workflow.update).not.toHaveBeenCalled();
    });

    it('skips re-delivery of an already-applied event (equal updatedAt)', async () => {
      const repos = makeRepos({ workflow: { id: 'wf-1', updatedAt: new Date('2026-01-02T00:00:00.000Z') } });
      const apply = createApplier(repos, { log });

      await apply({ type: 'workflow.upsert', at: '', sourceId: 's', workflow });

      expect(repos.workflow.update).not.toHaveBeenCalled();
    });

    it('applies the update when the stored workflow is older than the incoming event', async () => {
      const repos = makeRepos({ workflow: { id: 'wf-1', updatedAt: new Date('2026-01-01T00:00:00.000Z') } });
      const apply = createApplier(repos, { log });

      await apply({ type: 'workflow.upsert', at: '', sourceId: 's', workflow });

      expect(repos.workflow.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('workflow.delete', () => {
    it('deletes the workflow by id', async () => {
      const repos = makeRepos();
      const apply = createApplier(repos, { log });

      await apply({ type: 'workflow.delete', at: '', sourceId: 's', workflowId: 'wf-1' });

      expect(repos.workflow.delete).toHaveBeenCalledWith('wf-1');
    });
  });

  describe('workflow.archive', () => {
    it('sets only the archive flag by default', async () => {
      const repos = makeRepos();
      const apply = createApplier(repos, { log });

      await apply({ type: 'workflow.archive', at: '', sourceId: 's', workflowId: 'wf-1', archived: true });

      expect(repos.workflow.update).toHaveBeenCalledWith('wf-1', { isArchived: true });
    });

    it('also clears the active state on archive when applyActiveState is enabled', async () => {
      const repos = makeRepos();
      const apply = createApplier(repos, { log, applyActiveState: true });

      await apply({ type: 'workflow.archive', at: '', sourceId: 's', workflowId: 'wf-1', archived: true });

      expect(repos.workflow.update).toHaveBeenCalledWith('wf-1', {
        isArchived: true,
        active: false,
        activeVersionId: null,
      });
    });
  });

  describe('credentials.upsert', () => {
    it('updates an existing credential, passing the encrypted blob through', async () => {
      const repos = makeRepos({ credential: { id: 'cred-1' } });
      const apply = createApplier(repos, { log });

      await apply({ type: 'credentials.upsert', at: '', sourceId: 's', credential });

      const [id, fields] = repos.credentials.update.mock.calls[0] as [string, Record<string, unknown>];
      expect(id).toBe('cred-1');
      expect(fields.data).toBe('encrypted-blob');
      expect(fields.type).toBe('httpBasicAuth');
      expect(repos.credentials.save).not.toHaveBeenCalled();
    });

    it('creates a missing credential and links it to the target project', async () => {
      const repos = makeRepos();
      const apply = createApplier(repos, { log, targetProjectId: 'proj-1' });

      await apply({ type: 'credentials.upsert', at: '', sourceId: 's', credential });

      const entity = repos.credentials.save.mock.calls[0][0] as Record<string, unknown>;
      expect(entity.id).toBe('cred-1');
      expect(entity.isGlobal).toBe(false);
      expect(repos.sharedCredentials.save).toHaveBeenCalledWith({
        credentialsId: 'cred-1',
        projectId: 'proj-1',
        role: 'credential:owner',
      });
    });

    it('skips the update when the stored credential is newer than the incoming event', async () => {
      const repos = makeRepos({ credential: { id: 'cred-1', updatedAt: new Date('2026-06-01T00:00:00.000Z') } });
      const apply = createApplier(repos, { log });

      // credential.updatedAt is 2026-01-02 — older than the stored row
      await apply({ type: 'credentials.upsert', at: '', sourceId: 's', credential });

      expect(repos.credentials.update).not.toHaveBeenCalled();
    });
  });

  describe('credentials.delete', () => {
    it('deletes the credential by id', async () => {
      const repos = makeRepos();
      const apply = createApplier(repos, { log });

      await apply({ type: 'credentials.delete', at: '', sourceId: 's', credentialId: 'cred-1' });

      expect(repos.credentials.delete).toHaveBeenCalledWith('cred-1');
    });
  });
});
