import { DEFAULT_N8N_DB_PATH, DEFAULT_N8N_DI_PATH } from '../shared/config';

export const SUPPORTED_N8N_RUNTIME_VERSION_MATRIX = Object.freeze([{ label: 'current', version: '2.31.2' }] as const);

export const SUPPORTED_N8N_RUNTIME_VERSIONS = Object.freeze(
  SUPPORTED_N8N_RUNTIME_VERSION_MATRIX.map((entry) => entry.version),
);

export const DEFAULT_SUPPORTED_N8N_RUNTIME_VERSION =
  SUPPORTED_N8N_RUNTIME_VERSION_MATRIX[SUPPORTED_N8N_RUNTIME_VERSION_MATRIX.length - 1].version;

// ---------------------------------------------------------------------------
// Minimal structural types for the TypeORM repositories used by the applier.
// The real implementations are resolved from n8n's DI container at runtime.
// ---------------------------------------------------------------------------

export interface WorkflowRepositoryLike {
  findOneBy(where: { id: string }): Promise<unknown | null>;
  save(entity: Record<string, unknown>): Promise<unknown>;
  update(id: string, partial: Record<string, unknown>): Promise<unknown>;
  delete(id: string): Promise<unknown>;
  conditionalUpdate?(
    id: string,
    partial: Record<string, unknown>,
    options: { incomingTimestamp?: Date; timestampField: 'updatedAt' | 'stoppedAt' },
  ): Promise<ConditionalUpdateResult>;
}

export interface CredentialsRepositoryLike {
  findOneBy(where: { id: string }): Promise<unknown | null>;
  save(entity: Record<string, unknown>): Promise<unknown>;
  update(id: string, partial: Record<string, unknown>): Promise<unknown>;
  delete(id: string): Promise<unknown>;
  conditionalUpdate?(
    id: string,
    partial: Record<string, unknown>,
    options: { incomingTimestamp?: Date; timestampField: 'updatedAt' | 'stoppedAt' },
  ): Promise<ConditionalUpdateResult>;
}

export interface SharedWorkflowRepositoryLike {
  findOneBy?(where: Record<string, unknown>): Promise<unknown | null>;
  save(entity: Record<string, unknown>): Promise<unknown>;
  delete?(criteria: Record<string, unknown>): Promise<unknown>;
}

export interface SharedCredentialsRepositoryLike {
  findOneBy?(where: Record<string, unknown>): Promise<unknown | null>;
  save(entity: Record<string, unknown>): Promise<unknown>;
  delete?(criteria: Record<string, unknown>): Promise<unknown>;
}

/**
 * Minimal subset of n8n's UserRepository used by the applier's owner fallback.
 * `findOne` is the inherited TypeORM repository method; we type it loosely
 * because the `where`/`relations` shape is complex and version-specific.
 */
export interface UserRepositoryLike {
  findOne(options: Record<string, unknown>): Promise<{ id: string } | null>;
}

/**
 * Minimal subset of n8n's ProjectRepository used by the applier's owner
 * fallback. `getPersonalProjectForUser` is the canonical n8n method that
 * returns the user's personal project (or null).
 */
export interface ProjectRepositoryLike {
  getPersonalProjectForUser(userId: string): Promise<{ id: string } | null>;
}

/**
 * Minimal subset of n8n's `ExecutionRepository` (writes the
 * `execution_entity` table). The applier uses the inherited TypeORM methods
 * (`findOneBy`, `save`, `update`, `delete`) for idempotent upserts.
 */
export interface ExecutionRepositoryLike {
  findOneBy(where: { id: string | number }): Promise<unknown | null>;
  save(entity: Record<string, unknown>): Promise<{ id: string | number } & Record<string, unknown>>;
  update(criteria: unknown, partial: Record<string, unknown>): Promise<unknown>;
  delete(id: string | number): Promise<unknown>;
  conditionalUpdate?(
    id: string | number,
    partial: Record<string, unknown>,
    options: { incomingTimestamp?: Date; timestampField: 'updatedAt' | 'stoppedAt' },
  ): Promise<ConditionalUpdateResult>;
}

export type ConditionalUpdateResult = 'updated' | 'stale' | 'missing';

interface TypeOrmUpdateResultLike {
  affected?: number | null;
}

interface TypeOrmUpdateQueryBuilderLike {
  update(): TypeOrmUpdateQueryBuilderLike;
  set(values: Record<string, unknown>): TypeOrmUpdateQueryBuilderLike;
  where(condition: string, parameters?: Record<string, unknown>): TypeOrmUpdateQueryBuilderLike;
  andWhere(condition: string, parameters?: Record<string, unknown>): TypeOrmUpdateQueryBuilderLike;
  execute(): Promise<TypeOrmUpdateResultLike>;
}

interface TypeOrmDriverLike {
  escape?(name: string): string;
}

interface TypeOrmConnectionLike {
  driver?: TypeOrmDriverLike;
}

interface TypeOrmEntityManagerLike {
  connection?: TypeOrmConnectionLike;
  transaction?<T>(work: (manager: TypeOrmEntityManagerLike) => Promise<T>): Promise<T>;
  withRepository?<T>(repository: T): T;
  getRepository?<T>(target: unknown): T;
}

interface TypeOrmColumnMetadataLike {
  propertyName: string;
  databaseName: string;
}

interface TypeOrmRepositoryMetadataLike {
  target?: unknown;
  columns?: TypeOrmColumnMetadataLike[];
}

interface TransactionCapableRepositoryLike {
  manager?: TypeOrmEntityManagerLike;
  metadata?: TypeOrmRepositoryMetadataLike;
  createQueryBuilder?(): TypeOrmUpdateQueryBuilderLike;
}

export interface N8nSyncRepositories {
  workflow: WorkflowRepositoryLike;
  credentials: CredentialsRepositoryLike;
  sharedWorkflow: SharedWorkflowRepositoryLike;
  sharedCredentials: SharedCredentialsRepositoryLike;
  user: UserRepositoryLike;
  project: ProjectRepositoryLike;
  /**
   * Only present when executions are enabled on the subscriber
   * (`SYNC_ENTITIES` includes "executions"). When absent, the applier drops
   * `execution.*` events.
   */
  execution?: ExecutionRepositoryLike;
  transaction?<T>(work: (repos: N8nSyncRepositories) => Promise<T>): Promise<T>;
}

type N8nContainer = {
  get<T>(service: unknown): T;
};

type N8nDbModule = {
  WorkflowRepository: unknown;
  CredentialsRepository: unknown;
  SharedWorkflowRepository: unknown;
  SharedCredentialsRepository: unknown;
  UserRepository: unknown;
  ProjectRepository: unknown;
  ExecutionRepository?: unknown;
};

export interface N8nRuntimeAdapter {
  loadContainer(diPath: string): N8nContainer;
  loadDbModule(dbPath: string): N8nDbModule;
  getService<T>(container: N8nContainer, token: unknown, capabilityName: string): T;
}

function createRuntimeError(message: string, cause?: unknown): Error {
  return cause === undefined ? new Error(message) : new Error(message, { cause });
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function loadRequiredModule<T>(
  requireModule: (path: string) => unknown,
  path: string,
  label: string,
  envVarName: 'N8N_DB_PATH' | 'N8N_DI_PATH',
): T {
  try {
    return requireModule(path) as T;
  } catch (error) {
    throw createRuntimeError(`Unable to load ${label} from configured ${envVarName}`, error);
  }
}

function requireDbExport<T>(dbModule: N8nDbModule, exportName: keyof N8nDbModule, optional = false): T | undefined {
  const token = dbModule[exportName];
  if (token !== undefined) return token as T;
  if (optional) return undefined;
  throw createRuntimeError(`n8n DB runtime does not expose ${String(exportName)}`);
}

export function createN8nRuntimeAdapter(
  options: {
    require?: (path: string) => unknown;
  } = {},
): N8nRuntimeAdapter {
  const requireModule = options.require ?? require;

  return {
    loadContainer(diPath: string): N8nContainer {
      const runtime = loadRequiredModule<{ Container?: unknown }>(
        requireModule,
        diPath,
        'n8n DI runtime',
        'N8N_DI_PATH',
      );
      const container = runtime.Container;
      if (!isObject(container) || typeof container.get !== 'function') {
        throw createRuntimeError('n8n DI runtime does not expose Container.get');
      }
      return container as N8nContainer;
    },

    loadDbModule(dbPath: string): N8nDbModule {
      return loadRequiredModule<N8nDbModule>(requireModule, dbPath, 'n8n DB runtime', 'N8N_DB_PATH');
    },

    getService<T>(container: N8nContainer, token: unknown, capabilityName: string): T {
      try {
        return container.get<T>(token);
      } catch (error) {
        throw createRuntimeError(`n8n DI container could not resolve ${capabilityName}`, error);
      }
    },
  };
}

function quoteIdentifier(repo: TransactionCapableRepositoryLike, name: string): string {
  const escape = repo.manager?.connection?.driver?.escape;
  if (typeof escape === 'function') return escape.call(repo.manager?.connection?.driver, name);
  return `"${name.replace(/"/g, '""')}"`;
}

function getColumnName(repo: TransactionCapableRepositoryLike, propertyName: string): string {
  try {
    return repo.metadata?.columns?.find((column) => column.propertyName === propertyName)?.databaseName ?? propertyName;
  } catch {
    // Some runtime-bound repositories expose a working query builder but their
    // metadata getter is not safe to touch before TypeORM attaches a manager.
    // The columns we conditionally update (`id`, `updatedAt`, `stoppedAt`) use
    // their property names as database column names on the supported runtime.
    return propertyName;
  }
}

function withConditionalUpdate<
  R extends TransactionCapableRepositoryLike & { findOneBy(where: { id: string | number }): Promise<unknown | null> },
>(
  repo: R,
): R & {
  conditionalUpdate(
    id: string | number,
    partial: Record<string, unknown>,
    options: { incomingTimestamp?: Date; timestampField: 'updatedAt' | 'stoppedAt' },
  ): Promise<ConditionalUpdateResult>;
} {
  if (!repo.createQueryBuilder || !repo.manager) {
    return repo as R & {
      conditionalUpdate(
        id: string | number,
        partial: Record<string, unknown>,
        options: { incomingTimestamp?: Date; timestampField: 'updatedAt' | 'stoppedAt' },
      ): Promise<ConditionalUpdateResult>;
    };
  }

  return Object.assign(repo, {
    async conditionalUpdate(
      id: string | number,
      partial: Record<string, unknown>,
      options: { incomingTimestamp?: Date; timestampField: 'updatedAt' | 'stoppedAt' },
    ): Promise<ConditionalUpdateResult> {
      const idColumn = quoteIdentifier(repo, getColumnName(repo, 'id'));
      const timestampColumn = quoteIdentifier(repo, getColumnName(repo, options.timestampField));
      const query = repo.createQueryBuilder!().update().set(partial).where(`${idColumn} = :id`, { id });

      if (options.incomingTimestamp) {
        query.andWhere(`(${timestampColumn} IS NULL OR ${timestampColumn} < :incomingTimestamp)`, {
          incomingTimestamp: options.incomingTimestamp,
        });
      }

      const result = await query.execute();
      if ((result.affected ?? 0) > 0) return 'updated';

      const existing = await repo.findOneBy({ id });
      return existing ? 'stale' : 'missing';
    },
  });
}

function bindRepository<T extends object>(manager: TypeOrmEntityManagerLike, repository: T): T {
  if (typeof manager.withRepository === 'function') {
    return manager.withRepository(repository);
  }

  let target: unknown;
  try {
    target = (repository as TransactionCapableRepositoryLike).metadata?.target;
  } catch {
    target = undefined;
  }
  if (target !== undefined && typeof manager.getRepository === 'function') {
    return manager.getRepository<T>(target);
  }

  return repository;
}

function decorateRepositories(
  rawRepos: Omit<N8nSyncRepositories, 'transaction'>,
): Omit<N8nSyncRepositories, 'transaction'> {
  return {
    workflow: withConditionalUpdate(
      rawRepos.workflow as WorkflowRepositoryLike & TransactionCapableRepositoryLike,
    ) as WorkflowRepositoryLike,
    credentials: withConditionalUpdate(
      rawRepos.credentials as CredentialsRepositoryLike & TransactionCapableRepositoryLike,
    ) as CredentialsRepositoryLike,
    sharedWorkflow: rawRepos.sharedWorkflow,
    sharedCredentials: rawRepos.sharedCredentials,
    user: rawRepos.user,
    project: rawRepos.project,
    execution: rawRepos.execution
      ? (withConditionalUpdate(
          rawRepos.execution as ExecutionRepositoryLike & TransactionCapableRepositoryLike,
        ) as ExecutionRepositoryLike)
      : undefined,
  };
}

/**
 * Resolve the n8n repositories needed for applying sync events from n8n's DI
 * container. Must be called from inside the n8n host process (e.g. within the
 * `n8n.ready` hook), where the container is fully initialized.
 *
 * Module locations default to the official n8n docker image layout and can be
 * overridden with the N8N_DI_PATH / N8N_DB_PATH environment variables.
 *
 * `execution` is only resolved when `includeExecutions` is true (the caller
 * gates this on `SYNC_ENTITIES`); the resolver tolerates the symbol being
 * absent from the loaded `@n8n/db` module without throwing.
 *
 * @param includeExecutions when true, also resolve `ExecutionRepository`.
 */
export function buildN8nSyncRepositories(
  options: {
    includeExecutions?: boolean;
    diPath?: string;
    dbPath?: string;
    adapter?: N8nRuntimeAdapter;
  } = {},
): N8nSyncRepositories {
  const diPath = options.diPath ?? DEFAULT_N8N_DI_PATH;
  const dbPath = options.dbPath ?? DEFAULT_N8N_DB_PATH;
  const adapter = options.adapter ?? createN8nRuntimeAdapter();
  const container = adapter.loadContainer(diPath);
  const dbModule = adapter.loadDbModule(dbPath);
  const workflowToken = requireDbExport(dbModule, 'WorkflowRepository');
  const credentialsToken = requireDbExport(dbModule, 'CredentialsRepository');
  const sharedWorkflowToken = requireDbExport(dbModule, 'SharedWorkflowRepository');
  const sharedCredentialsToken = requireDbExport(dbModule, 'SharedCredentialsRepository');
  const userToken = requireDbExport(dbModule, 'UserRepository');
  const projectToken = requireDbExport(dbModule, 'ProjectRepository');
  const executionToken = options.includeExecutions ? requireDbExport(dbModule, 'ExecutionRepository') : undefined;

  const rawRepos: Omit<N8nSyncRepositories, 'transaction'> = {
    workflow: adapter.getService<WorkflowRepositoryLike>(container, workflowToken, 'WorkflowRepository'),
    credentials: adapter.getService<CredentialsRepositoryLike>(container, credentialsToken, 'CredentialsRepository'),
    sharedWorkflow: adapter.getService<SharedWorkflowRepositoryLike>(
      container,
      sharedWorkflowToken,
      'SharedWorkflowRepository',
    ),
    sharedCredentials: adapter.getService<SharedCredentialsRepositoryLike>(
      container,
      sharedCredentialsToken,
      'SharedCredentialsRepository',
    ),
    user: adapter.getService<UserRepositoryLike>(container, userToken, 'UserRepository'),
    project: adapter.getService<ProjectRepositoryLike>(container, projectToken, 'ProjectRepository'),
  };

  if (executionToken !== undefined) {
    rawRepos.execution = adapter.getService<ExecutionRepositoryLike>(container, executionToken, 'ExecutionRepository');
  }

  const repos: N8nSyncRepositories = {
    ...decorateRepositories(rawRepos),
  };

  // On the pinned n8n 2.31.2 runtime, rebinding these repository instances
  // into a transaction manager produces objects whose core methods (`save`,
  // `createQueryBuilder`) lose their internal manager reference. Exposing that
  // wrapper would make every sync write fail at runtime, so the adapter keeps
  // the working raw repositories and lets the applier fall back to the
  // non-transactional code path on this runtime.

  return repos;
}
