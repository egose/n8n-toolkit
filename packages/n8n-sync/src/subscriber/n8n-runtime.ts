import { N8N_DB_PATH, N8N_DI_PATH } from '../shared/config';

// ---------------------------------------------------------------------------
// Minimal structural types for the TypeORM repositories used by the applier.
// The real implementations are resolved from n8n's DI container at runtime.
// ---------------------------------------------------------------------------

export interface WorkflowRepositoryLike {
  findOneBy(where: { id: string }): Promise<unknown | null>;
  save(entity: Record<string, unknown>): Promise<unknown>;
  update(id: string, partial: Record<string, unknown>): Promise<unknown>;
  delete(id: string): Promise<unknown>;
}

export interface CredentialsRepositoryLike {
  findOneBy(where: { id: string }): Promise<unknown | null>;
  save(entity: Record<string, unknown>): Promise<unknown>;
  update(id: string, partial: Record<string, unknown>): Promise<unknown>;
  delete(id: string): Promise<unknown>;
}

export interface SharedWorkflowRepositoryLike {
  save(entity: Record<string, unknown>): Promise<unknown>;
}

export interface SharedCredentialsRepositoryLike {
  save(entity: Record<string, unknown>): Promise<unknown>;
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
  findOneBy(where: { id: string }): Promise<unknown | null>;
  save(entity: Record<string, unknown>): Promise<unknown>;
  update(criteria: unknown, partial: Record<string, unknown>): Promise<unknown>;
  delete(id: string): Promise<unknown>;
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
export function buildN8nSyncRepositories(options: { includeExecutions?: boolean } = {}): N8nSyncRepositories {
  const { Container } = require(N8N_DI_PATH) as { Container: N8nContainer };
  const {
    WorkflowRepository,
    CredentialsRepository,
    SharedWorkflowRepository,
    SharedCredentialsRepository,
    UserRepository,
    ProjectRepository,
    ExecutionRepository,
  } = require(N8N_DB_PATH) as N8nDbModule;

  const repos: N8nSyncRepositories = {
    workflow: Container.get<WorkflowRepositoryLike>(WorkflowRepository),
    credentials: Container.get<CredentialsRepositoryLike>(CredentialsRepository),
    sharedWorkflow: Container.get<SharedWorkflowRepositoryLike>(SharedWorkflowRepository),
    sharedCredentials: Container.get<SharedCredentialsRepositoryLike>(SharedCredentialsRepository),
    user: Container.get<UserRepositoryLike>(UserRepository),
    project: Container.get<ProjectRepositoryLike>(ProjectRepository),
  };

  if (options.includeExecutions && ExecutionRepository) {
    repos.execution = Container.get<ExecutionRepositoryLike>(ExecutionRepository);
  }

  return repos;
}
