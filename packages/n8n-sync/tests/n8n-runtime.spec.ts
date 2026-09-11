import { createRequire } from 'node:module';
import { resolve } from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import type { SyncEntity } from '../src/shared/config';
import {
  buildN8nSyncRepositories,
  createN8nRuntimeAdapter,
  probeSyncMetadataTransactionCapability,
  SYNC_METADATA_SCHEMA_SQL,
  SUPPORTED_N8N_RUNTIME_VERSION_MATRIX,
} from '../src/subscriber/n8n-runtime';

const requireModule = createRequire(__filename);

type FixtureContainer = {
  get(token: unknown): unknown;
  set(token: unknown, value: unknown): void;
  reset(): void;
};

function fixturePath(version: string, file: 'db.cjs' | 'di.cjs') {
  return resolve(__dirname, 'fixtures', 'n8n-runtime', version, file);
}

function loadVersionFixture(version: string) {
  const diPath = fixturePath(version, 'di.cjs');
  const dbPath = fixturePath(version, 'db.cjs');
  const { Container } = requireModule(diPath) as { Container: FixtureContainer };
  const dbModule = requireModule(dbPath) as Record<string, unknown>;

  Container.reset();
  for (const token of Object.values(dbModule)) {
    Container.set(token, {
      findOneBy: vi.fn().mockResolvedValue(null),
      save: vi.fn().mockResolvedValue({}),
      update: vi.fn().mockResolvedValue({}),
      delete: vi.fn().mockResolvedValue({}),
    });
  }

  return { diPath, dbPath };
}

describe('buildN8nSyncRepositories', () => {
  it('fails clearly when the configured n8n DI module cannot be loaded', () => {
    expect(() =>
      buildN8nSyncRepositories({
        adapter: createN8nRuntimeAdapter({
          require: () => {
            throw new Error('Cannot find module');
          },
        }),
      }),
    ).toThrow('Unable to load n8n DI runtime from configured N8N_DI_PATH');
  });

  it('fails clearly when a required repository export is missing', () => {
    const adapter = {
      loadContainer: () => ({ get: vi.fn() }),
      loadDbModule: () => ({
        CredentialsRepository: Symbol('CredentialsRepository'),
        SharedWorkflowRepository: Symbol('SharedWorkflowRepository'),
        SharedCredentialsRepository: Symbol('SharedCredentialsRepository'),
        UserRepository: Symbol('UserRepository'),
        ProjectRepository: Symbol('ProjectRepository'),
      }),
      loadCoreServices: () => ({}),
      getService: vi.fn(),
    } as unknown as Parameters<typeof buildN8nSyncRepositories>[0]['adapter'];

    expect(() => buildN8nSyncRepositories({ adapter })).toThrow('n8n DB runtime does not expose WorkflowRepository');
  });

  it('fails clearly when the DI container cannot resolve a requested capability', () => {
    const workflowToken = Symbol('WorkflowRepository');
    const credentialsToken = Symbol('CredentialsRepository');
    const sharedWorkflowToken = Symbol('SharedWorkflowRepository');
    const sharedCredentialsToken = Symbol('SharedCredentialsRepository');
    const userToken = Symbol('UserRepository');
    const projectToken = Symbol('ProjectRepository');
    const container = { get: vi.fn() };
    container.get.mockImplementation((token: unknown) => {
      if (token === credentialsToken) throw new Error('boom');
      return {};
    });
    const adapter = {
      loadContainer: () => container,
      loadDbModule: () => ({
        WorkflowRepository: workflowToken,
        CredentialsRepository: credentialsToken,
        SharedWorkflowRepository: sharedWorkflowToken,
        SharedCredentialsRepository: sharedCredentialsToken,
        UserRepository: userToken,
        ProjectRepository: projectToken,
      }),
      loadCoreServices: () => ({}),
      getService: createN8nRuntimeAdapter().getService,
    };

    expect(() => buildN8nSyncRepositories({ adapter })).toThrow(
      'n8n DI container could not resolve CredentialsRepository',
    );
  });

  it('does not require execution support when executions are disabled', () => {
    const workflowToken = Symbol('WorkflowRepository');
    const credentialsToken = Symbol('CredentialsRepository');
    const sharedWorkflowToken = Symbol('SharedWorkflowRepository');
    const sharedCredentialsToken = Symbol('SharedCredentialsRepository');
    const userToken = Symbol('UserRepository');
    const projectToken = Symbol('ProjectRepository');
    const adapter = {
      loadContainer: () => ({ get: vi.fn().mockReturnValue({}) }),
      loadDbModule: () => ({
        WorkflowRepository: workflowToken,
        CredentialsRepository: credentialsToken,
        SharedWorkflowRepository: sharedWorkflowToken,
        SharedCredentialsRepository: sharedCredentialsToken,
        UserRepository: userToken,
        ProjectRepository: projectToken,
      }),
      loadCoreServices: () => ({}),
      getService: vi.fn().mockReturnValue({}),
    };

    const repos = buildN8nSyncRepositories({ adapter, includeExecutions: false });

    expect(repos.execution).toBeUndefined();
    expect(adapter.getService).not.toHaveBeenCalledWith(expect.anything(), expect.anything(), 'ExecutionRepository');
  });

  it('resolves target-side publication services when the core layout exposes them', () => {
    const historyToken = Symbol('WorkflowHistoryService');
    const workflowsToken = Symbol('WorkflowService');
    const historyService = { findVersion: vi.fn(), saveVersion: vi.fn() };
    const workflowService = { activateWorkflow: vi.fn(), deactivateWorkflow: vi.fn() };
    const getService = vi.fn((_container: unknown, token: unknown) => {
      if (token === historyToken) return historyService;
      if (token === workflowsToken) return workflowService;
      return {};
    });
    const adapter = {
      loadContainer: () => ({ get: vi.fn() }),
      loadDbModule: () => ({
        WorkflowRepository: Symbol('WorkflowRepository'),
        CredentialsRepository: Symbol('CredentialsRepository'),
        SharedWorkflowRepository: Symbol('SharedWorkflowRepository'),
        SharedCredentialsRepository: Symbol('SharedCredentialsRepository'),
        UserRepository: Symbol('UserRepository'),
        ProjectRepository: Symbol('ProjectRepository'),
      }),
      loadCoreServices: () => ({ WorkflowHistoryService: historyToken, WorkflowService: workflowsToken }),
      getService,
    };

    const repos = buildN8nSyncRepositories({ adapter });

    expect(repos.workflowHistoryService).toBe(historyService);
    expect(repos.workflowService).toBe(workflowService);
    expect(getService).toHaveBeenCalledWith(expect.anything(), historyToken, 'WorkflowHistoryService');
    expect(getService).toHaveBeenCalledWith(expect.anything(), workflowsToken, 'WorkflowService');
  });

  it('degrades to column-only writes when core services are missing or unresolvable', () => {
    const dbModule = {
      WorkflowRepository: Symbol('WorkflowRepository'),
      CredentialsRepository: Symbol('CredentialsRepository'),
      SharedWorkflowRepository: Symbol('SharedWorkflowRepository'),
      SharedCredentialsRepository: Symbol('SharedCredentialsRepository'),
      UserRepository: Symbol('UserRepository'),
      ProjectRepository: Symbol('ProjectRepository'),
    };
    const missingFiles = buildN8nSyncRepositories({
      adapter: {
        loadContainer: () => ({ get: vi.fn().mockReturnValue({}) }),
        loadDbModule: () => dbModule,
        loadCoreServices: () => ({}),
        getService: vi.fn().mockReturnValue({}),
      },
    });
    expect(missingFiles.workflowHistoryService).toBeUndefined();
    expect(missingFiles.workflowService).toBeUndefined();

    const failingHistoryToken = Symbol('WorkflowHistoryService');
    const unresolvable = buildN8nSyncRepositories({
      adapter: {
        loadContainer: () => ({ get: vi.fn().mockReturnValue({}) }),
        loadDbModule: () => dbModule,
        loadCoreServices: () => ({ WorkflowHistoryService: failingHistoryToken }),
        getService: ((_container: unknown, token: unknown) => {
          if (token === failingHistoryToken) throw new Error('n8n DI container could not resolve it');
          return {};
        }) as never,
      },
    });
    expect(unresolvable.workflowHistoryService).toBeUndefined();
    expect(unresolvable.workflowService).toBeUndefined();
  });

  it('skips core service resolution when workflows are disabled', () => {
    const loadCoreServices = vi.fn();
    const adapter = {
      loadContainer: () => ({ get: vi.fn().mockReturnValue({}) }),
      loadDbModule: () => ({
        CredentialsRepository: Symbol('CredentialsRepository'),
        SharedCredentialsRepository: Symbol('SharedCredentialsRepository'),
        UserRepository: Symbol('UserRepository'),
        ProjectRepository: Symbol('ProjectRepository'),
      }),
      loadCoreServices,
      getService: vi.fn().mockReturnValue({}),
    };

    const repos = buildN8nSyncRepositories({
      adapter,
      entities: new Set<SyncEntity>(['credentials']),
    });

    expect(loadCoreServices).not.toHaveBeenCalled();
    expect(repos.workflowHistoryService).toBeUndefined();
    expect(repos.workflowService).toBeUndefined();
  });

  it('loads core service modules tolerantly file by file', () => {
    class WorkflowServiceFixture {}
    const adapter = createN8nRuntimeAdapter({
      require: (path: string) => {
        if (path.endsWith('dist/workflows/workflow.service.js')) return { WorkflowService: WorkflowServiceFixture };
        throw new Error(`Cannot find module '${path}'`);
      },
    });

    const modules = adapter.loadCoreServices('/n8n/core');

    expect(modules.WorkflowService).toBe(WorkflowServiceFixture);
    expect(modules.WorkflowHistoryService).toBeUndefined();
  });

  it('does not resolve repositories for disabled workflow and credential families', () => {
    const workflowToken = Symbol('WorkflowRepository');
    const credentialsToken = Symbol('CredentialsRepository');
    const sharedWorkflowToken = Symbol('SharedWorkflowRepository');
    const sharedCredentialsToken = Symbol('SharedCredentialsRepository');
    const userToken = Symbol('UserRepository');
    const projectToken = Symbol('ProjectRepository');
    const makeAdapter = () => ({
      loadContainer: () => ({ get: vi.fn().mockReturnValue({}) }),
      loadDbModule: () => ({
        WorkflowRepository: workflowToken,
        CredentialsRepository: credentialsToken,
        SharedWorkflowRepository: sharedWorkflowToken,
        SharedCredentialsRepository: sharedCredentialsToken,
        UserRepository: userToken,
        ProjectRepository: projectToken,
      }),
      loadCoreServices: () => ({}),
      getService: vi.fn().mockReturnValue({}),
    });
    const workflowOnlyAdapter = makeAdapter();
    const credentialsOnlyAdapter = makeAdapter();

    const workflowOnly = buildN8nSyncRepositories({
      adapter: workflowOnlyAdapter,
      entities: new Set<SyncEntity>(['workflows']),
    });
    const credentialsOnly = buildN8nSyncRepositories({
      adapter: credentialsOnlyAdapter,
      entities: new Set<SyncEntity>(['credentials']),
    });

    expect(workflowOnly.credentials).toBeUndefined();
    expect(workflowOnly.sharedCredentials).toBeUndefined();
    expect(credentialsOnly.workflow).toBeUndefined();
    expect(credentialsOnly.sharedWorkflow).toBeUndefined();
    expect(workflowOnlyAdapter.getService).not.toHaveBeenCalledWith(
      expect.anything(),
      credentialsToken,
      'CredentialsRepository',
    );
    expect(workflowOnlyAdapter.getService).not.toHaveBeenCalledWith(
      expect.anything(),
      sharedCredentialsToken,
      'SharedCredentialsRepository',
    );
    expect(credentialsOnlyAdapter.getService).not.toHaveBeenCalledWith(
      expect.anything(),
      workflowToken,
      'WorkflowRepository',
    );
    expect(credentialsOnlyAdapter.getService).not.toHaveBeenCalledWith(
      expect.anything(),
      sharedWorkflowToken,
      'SharedWorkflowRepository',
    );
  });

  it.each(SUPPORTED_N8N_RUNTIME_VERSION_MATRIX)(
    'loads the pinned $label runtime fixture for n8n $version',
    ({ version }) => {
      const { diPath, dbPath } = loadVersionFixture(version);

      const repos = buildN8nSyncRepositories({
        includeExecutions: true,
        diPath,
        dbPath,
      });

      expect(repos.workflow).toMatchObject({
        findOneBy: expect.any(Function),
        save: expect.any(Function),
        update: expect.any(Function),
        delete: expect.any(Function),
      });
      expect(repos.credentials).toMatchObject({
        findOneBy: expect.any(Function),
        save: expect.any(Function),
        update: expect.any(Function),
        delete: expect.any(Function),
      });
      expect(repos.execution).toMatchObject({
        findOneBy: expect.any(Function),
        save: expect.any(Function),
        update: expect.any(Function),
        delete: expect.any(Function),
      });
    },
  );

  it('decorates real repository conditional updates with equal-timestamp and conflict semantics', async () => {
    const workflowToken = Symbol('WorkflowRepository');
    const credentialsToken = Symbol('CredentialsRepository');
    const sharedWorkflowToken = Symbol('SharedWorkflowRepository');
    const sharedCredentialsToken = Symbol('SharedCredentialsRepository');
    const userToken = Symbol('UserRepository');
    const projectToken = Symbol('ProjectRepository');
    const conditions: string[] = [];
    const queryBuilder = {
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      andWhere: vi.fn((condition: string) => {
        conditions.push(condition);
        return queryBuilder;
      }),
      execute: vi.fn().mockResolvedValue({ affected: 0 }),
    };
    const workflowRepo = {
      manager: { connection: { driver: { escape: (name: string) => `"${name}"` } } },
      metadata: { columns: [{ propertyName: 'updatedAt', databaseName: 'updatedAt' }] },
      createQueryBuilder: vi.fn(() => queryBuilder),
      findOneBy: vi.fn().mockResolvedValue({ id: 'wf-1', updatedAt: new Date('2026-01-03T00:00:00.000Z') }),
      save: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    const adapter = {
      loadContainer: () => ({ get: <T>(token: unknown) => (token === workflowToken ? workflowRepo : {}) as T }),
      loadDbModule: () => ({
        WorkflowRepository: workflowToken,
        CredentialsRepository: credentialsToken,
        SharedWorkflowRepository: sharedWorkflowToken,
        SharedCredentialsRepository: sharedCredentialsToken,
        UserRepository: userToken,
        ProjectRepository: projectToken,
      }),
      loadCoreServices: () => ({}),
      getService: createN8nRuntimeAdapter().getService,
    };

    const repos = buildN8nSyncRepositories({ adapter });
    const result = await repos.workflow.conditionalUpdate?.(
      'wf-1',
      { name: 'Incoming' },
      {
        incomingTimestamp: new Date('2026-01-02T00:00:00.000Z'),
        timestampField: 'updatedAt',
        allowEqualTimestamp: true,
      },
    );

    expect(conditions[0]).toContain('<= :incomingTimestamp');
    expect(result).toBe('conflict');
  });

  it('probes for a same-database transaction manager with raw query support', () => {
    const transaction = vi.fn();
    const query = vi.fn();
    const manager = { transaction, query };

    const capability = probeSyncMetadataTransactionCapability({
      workflow: {
        manager,
        findOneBy: vi.fn(),
        save: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      } as never,
    });

    expect(capability.supported).toBe(true);
    expect(capability.manager).toBe(manager);
    expect(capability.reason).toBeUndefined();
  });

  it('rejects metadata storage when raw transactional query support is unavailable', () => {
    expect(probeSyncMetadataTransactionCapability({})).toMatchObject({
      supported: false,
      reason: 'No resolved n8n repository exposes a TypeORM manager',
    });
    expect(
      probeSyncMetadataTransactionCapability({
        workflow: {
          manager: { transaction: vi.fn() },
          findOneBy: vi.fn(),
          save: vi.fn(),
          update: vi.fn(),
          delete: vi.fn(),
        } as never,
      }),
    ).toMatchObject({
      supported: false,
      reason: 'Resolved n8n repository manager does not expose raw query()',
    });
  });

  it('keeps the prototype schema concrete and namespaced', () => {
    expect(SYNC_METADATA_SCHEMA_SQL).toHaveLength(4);
    expect(SYNC_METADATA_SCHEMA_SQL.join('\n')).toContain('create table if not exists n8n_sync_entity_state');
    expect(SYNC_METADATA_SCHEMA_SQL.join('\n')).toContain('primary key (source_id, entity_kind, source_entity_id)');
    expect(SYNC_METADATA_SCHEMA_SQL.join('\n')).toContain('unique (target_execution_id)');
  });
});
