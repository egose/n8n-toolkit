import { createRequire } from 'node:module';
import { resolve } from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import {
  buildN8nSyncRepositories,
  createN8nRuntimeAdapter,
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
      getService: vi.fn().mockReturnValue({}),
    };

    const repos = buildN8nSyncRepositories({ adapter, includeExecutions: false });

    expect(repos.execution).toBeUndefined();
    expect(adapter.getService).not.toHaveBeenCalledWith(expect.anything(), expect.anything(), 'ExecutionRepository');
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
});
