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

export interface N8nSyncRepositories {
  workflow: WorkflowRepositoryLike;
  credentials: CredentialsRepositoryLike;
  sharedWorkflow: SharedWorkflowRepositoryLike;
  sharedCredentials: SharedCredentialsRepositoryLike;
}

type N8nContainer = {
  get<T>(service: unknown): T;
};

type N8nDbModule = {
  WorkflowRepository: unknown;
  CredentialsRepository: unknown;
  SharedWorkflowRepository: unknown;
  SharedCredentialsRepository: unknown;
};

/**
 * Resolve the n8n repositories needed for applying sync events from n8n's DI
 * container. Must be called from inside the n8n host process (e.g. within the
 * `n8n.ready` hook), where the container is fully initialized.
 *
 * Module locations default to the official n8n docker image layout and can be
 * overridden with the N8N_DI_PATH / N8N_DB_PATH environment variables.
 */
export function buildN8nSyncRepositories(): N8nSyncRepositories {
  const { Container } = require(N8N_DI_PATH) as { Container: N8nContainer };
  const { WorkflowRepository, CredentialsRepository, SharedWorkflowRepository, SharedCredentialsRepository } = require(
    N8N_DB_PATH,
  ) as N8nDbModule;

  return {
    workflow: Container.get<WorkflowRepositoryLike>(WorkflowRepository),
    credentials: Container.get<CredentialsRepositoryLike>(CredentialsRepository),
    sharedWorkflow: Container.get<SharedWorkflowRepositoryLike>(SharedWorkflowRepository),
    sharedCredentials: Container.get<SharedCredentialsRepositoryLike>(SharedCredentialsRepository),
  };
}
