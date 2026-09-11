import { getSourceEntityStateKey, getSyncEventEntityRef, type AppliedEventState } from '../shared/ordering';
import type { SyncEntity } from '../shared/config';
import type { Logger } from '../shared/logger';
import type { SyncCredentialDto, SyncEvent, SyncExecutionDto, SyncWorkflowDto } from '../shared/types';
import { createExecutionIdentityStore, type ExecutionIdentityStore } from './execution-identity';
import type { ConditionalUpdateResult } from './n8n-runtime';
import type {
  N8nSyncRepositories,
  PublicationUserLike,
  SharedCredentialsRepositoryLike,
  SharedWorkflowRepositoryLike,
} from './n8n-runtime';
import { createSyncOrderingStore, type SyncOrderingStore } from './order-state';
import type { WorkflowPublicationManager } from './publication';

export interface ApplierOptions {
  /** When set, newly created workflows/credentials are linked to this project. */
  targetProjectId?: string;
  /**
   * When true, the source's active/activeVersionId state is written to the
   * target database. Defaults to false because writing the DB flag does NOT
   * register triggers/webhooks with the target's active workflow manager.
   */
  applyActiveState?: boolean;
  ordering?: SyncOrderingStore;
  executionIdentity?: ExecutionIdentityStore;
  allowedEntities?: ReadonlySet<SyncEntity>;
  /**
   * Target-side publication manager. When present with `applyActiveState`,
   * workflow upserts converge the real publish state (history version +
   * trigger registration) instead of only the `active` DB column. Absence
   * keeps the legacy column-only behavior.
   */
  publication?: WorkflowPublicationManager;
  log: Logger;
}

export type ApplySyncEventResult =
  | { status: 'applied' }
  | { status: 'duplicate' }
  | { status: 'stale' }
  | { status: 'disabled'; error: SyncEntityDisabledError }
  | { status: 'conflict'; error: SyncRevisionConflictError };

export type ApplySyncEvent = (event: SyncEvent) => Promise<ApplySyncEventResult>;

export class SyncRevisionConflictError extends Error {
  readonly code = 'SYNC_REVISION_CONFLICT';
  readonly event: Pick<SyncEvent, 'type' | 'sourceId' | 'eventId' | 'entityRevision'>;
  readonly entity: { kind: string; id: string };
  readonly previous: AppliedEventState;

  constructor(event: SyncEvent, previous: AppliedEventState) {
    const entity = getSyncEventEntityRef(event);
    super('Sync event revision was already applied by a different event');
    this.name = 'SyncRevisionConflictError';
    this.event = {
      type: event.type,
      sourceId: event.sourceId,
      eventId: event.eventId,
      entityRevision: event.entityRevision,
    };
    this.entity = { kind: entity.kind, id: entity.id };
    this.previous = previous;
  }
}

export class SyncEntityDisabledError extends Error {
  readonly code = 'SYNC_ENTITY_DISABLED';
  readonly entity: SyncEntity;
  readonly event: Pick<SyncEvent, 'type' | 'sourceId' | 'eventId' | 'entityRevision'>;

  constructor(event: SyncEvent, entity: SyncEntity) {
    super(`Sync entity family is disabled: ${entity}`);
    this.name = 'SyncEntityDisabledError';
    this.entity = entity;
    this.event = {
      type: event.type,
      sourceId: event.sourceId,
      eventId: event.eventId,
      entityRevision: event.entityRevision,
    };
  }
}

export class SyncEntityTimestampConflictError extends Error {
  readonly code = 'SYNC_ENTITY_TIMESTAMP_CONFLICT';
  readonly event: Pick<SyncEvent, 'type' | 'sourceId' | 'eventId' | 'entityRevision'>;
  readonly entity: { kind: string; id: string };

  constructor(event: SyncEvent, message = 'Sync entity timestamp is older than the target row') {
    const entity = getSyncEventEntityRef(event);
    super(message);
    this.name = 'SyncEntityTimestampConflictError';
    this.event = {
      type: event.type,
      sourceId: event.sourceId,
      eventId: event.eventId,
      entityRevision: event.entityRevision,
    };
    this.entity = { kind: entity.kind, id: entity.id };
  }
}

type PersistenceContext = {
  repos: N8nSyncRepositories;
  transactional: boolean;
};

const TERMINAL_EXECUTION_STATUSES = new Set(['success', 'error', 'crashed', 'canceled']);
const ALL_SYNC_ENTITIES = new Set<SyncEntity>(['workflows', 'credentials', 'executions']) as ReadonlySet<SyncEntity>;

function getSyncEventEntityFamily(event: SyncEvent): SyncEntity {
  if (event.type.startsWith('workflow.')) return 'workflows';
  if (event.type.startsWith('credentials.')) return 'credentials';
  return 'executions';
}

function requireRepository<T>(repo: T | undefined, capabilityName: string): T {
  if (repo === undefined) {
    throw new Error(`Required n8n repository is not available: ${capabilityName}`);
  }
  return repo;
}

function toExecutionRepositoryId(value: unknown): string | number | undefined {
  return typeof value === 'string' || typeof value === 'number' ? value : undefined;
}

function toDate(value: string | Date | undefined): Date | undefined {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function isTerminalExecutionStatus(status: unknown): boolean {
  return typeof status === 'string' && TERMINAL_EXECUTION_STATUSES.has(status);
}

function isTerminalExecutionRow(existing: unknown): boolean {
  const row = existing as { status?: unknown; stoppedAt?: Date | string } | null;
  return isTerminalExecutionStatus(row?.status) || toDate(row?.stoppedAt) !== undefined;
}

function isUniqueConstraintError(error: unknown): boolean {
  const code = (error as NodeJS.ErrnoException | undefined)?.code;
  if (code === '23505' || code === 'ER_DUP_ENTRY' || code === 'SQLITE_CONSTRAINT') return true;
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return message.includes('unique') || message.includes('duplicate');
}

function assertEncryptedCredentialData(data: unknown): asserts data is string {
  if (typeof data !== 'string' || data.length === 0) {
    throw new Error('Credential sync requires encrypted string data');
  }
}

function shouldSkipExecutionLifecycleRegression(existing: unknown, incoming: SyncExecutionDto): boolean {
  if (!isTerminalExecutionRow(existing)) return false;
  if (!isTerminalExecutionStatus(incoming.status)) return true;
  return toDate(incoming.stoppedAt) === undefined;
}

/**
 * Last-write-wins guard: deliveries can arrive out of order (a retrying slow
 * event alongside a newer one), and retries re-deliver the same event. An
 * incoming upsert is stale when the stored row's timestamp is at or beyond
 * the incoming one.
 *
 * For workflows/credentials the invariant column is `updatedAt`; for
 * executions it is `stoppedAt` (the moment the run transitioned to a
 * terminal state). Callers pick the field matching the entity via
 * `timestampField` — defaults to `updatedAt` for back-compat.
 */
function getTimestampGuardResult(
  existing: unknown,
  incomingTimestamp: Date | undefined,
  timestampField: 'updatedAt' | 'stoppedAt' = 'updatedAt',
  allowEqualTimestamp = false,
): 'allow' | 'stale' | 'conflict' {
  if (!incomingTimestamp) return 'allow';
  const existingTimestamp = toDate(
    (existing as { updatedAt?: Date | string; stoppedAt?: Date | string } | null)?.[timestampField],
  );
  if (existingTimestamp === undefined) return 'allow';
  const existingTime = existingTimestamp.getTime();
  const incomingTime = incomingTimestamp.getTime();
  if (existingTime > incomingTime) return allowEqualTimestamp ? 'conflict' : 'stale';
  if (existingTime === incomingTime) return allowEqualTimestamp ? 'allow' : 'stale';
  return 'allow';
}

/**
 * Create the sync-event applier. Events are applied idempotently via the
 * target instance's own repositories. Current production workflow and
 * credential paths use source-provided ids as target ids; the source ownership
 * ADR is not enforced until IDENTITY-02. Execution rows use target-generated
 * ids behind a file-backed `(sourceId, sourceExecutionId)` mapping, which is
 * durable but not committed atomically with the execution row.
 */
export function createApplier(repos: N8nSyncRepositories, options: ApplierOptions): ApplySyncEvent {
  const { log } = options;
  const allowedEntities = options.allowedEntities ?? ALL_SYNC_ENTITIES;
  const applyActiveState = options.applyActiveState ?? false;
  const publication = options.publication;
  const targetProjectId = options.targetProjectId || undefined;
  const ordering = options.ordering ?? createSyncOrderingStore();
  const executionIdentity =
    options.executionIdentity ?? (allowedEntities.has('executions') ? createExecutionIdentityStore() : undefined);
  const entityChains = new Map<string, Promise<void>>();

  function withEntityLock<T>(key: string, work: () => Promise<T>): Promise<T> {
    const previous = entityChains.get(key) ?? Promise.resolve();
    const result = previous.catch(() => undefined).then(work);
    const settled = result.then(
      () => undefined,
      () => undefined,
    );
    entityChains.set(key, settled);
    return result.finally(() => {
      if (entityChains.get(key) === settled) {
        entityChains.delete(key);
      }
    });
  }

  // Cache for the owner-fallback resolution. `undefined` means not yet
  // resolved; `null` means resolution was attempted and failed (so we don't
  // re-attempt on every event); a string is the resolved project id.
  let cachedFallbackProjectId: string | null | undefined;
  // Cache for the owner user entity itself. `undefined` means not yet
  // resolved; `null` means no owner exists. Thrown lookups are not cached so
  // transient failures retry on the next event.
  let cachedOwnerUser: PublicationUserLike | null | undefined;

  /**
   * Resolve the target instance owner user. Used for project fallback
   * linkage and as the acting user for target-side publication (n8n's
   * publish/unpublish entry points enforce `workflow:publish` /
   * `workflow:unpublish` permissions).
   */
  async function resolveOwnerUser(): Promise<PublicationUserLike | undefined> {
    if (cachedOwnerUser !== undefined) return cachedOwnerUser ?? undefined;
    const userRepo = requireRepository(repos.user, 'UserRepository');
    const owner = await userRepo.findOne({
      where: { role: { slug: 'global:owner' } },
      relations: ['role'],
      order: { createdAt: 'ASC' },
      take: 1,
    });
    if (!owner) {
      log.warn('Owner fallback: no global:owner user found on target');
      cachedOwnerUser = null;
      return undefined;
    }
    cachedOwnerUser = owner;
    return owner;
  }

  /**
   * Resolve the project id to link newly created workflows/credentials to.
   * When `targetProjectId` is configured, it wins. Otherwise, fall back to
   * the target instance owner's personal project so synced entities are
   * visible through the target's Public API without explicit configuration.
   * The fallback is resolved lazily and cached (including the negative
   * case) to avoid repeating DB lookups on every event.
   */
  async function resolveLinkProjectId(): Promise<string | undefined> {
    if (targetProjectId) return targetProjectId;
    if (cachedFallbackProjectId !== undefined) return cachedFallbackProjectId ?? undefined;
    const projectRepo = requireRepository(repos.project, 'ProjectRepository');
    try {
      const owner = await resolveOwnerUser();
      if (!owner) {
        cachedFallbackProjectId = null;
        return undefined;
      }
      const project = await projectRepo.getPersonalProjectForUser(owner.id);
      if (!project) {
        log.warn('Owner fallback: owner has no personal project', { ownerId: owner.id });
        cachedFallbackProjectId = null;
        return undefined;
      }
      log.debug('Owner fallback resolved personal project', {
        ownerId: owner.id,
        projectId: project.id,
      });
      cachedFallbackProjectId = project.id;
      return project.id;
    } catch (error) {
      log.warn('Owner fallback: failed to resolve personal project', {
        error: error instanceof Error ? error.message : String(error),
      });
      return undefined;
    }
  }

  /**
   * Best-effort owner lookup for target-side publication. Owner resolution
   * failures degrade to `undefined` (the publication manager then reports
   * `unavailable`) instead of failing the sync event.
   */
  async function resolvePublicationOwner(): Promise<PublicationUserLike | undefined> {
    try {
      return await resolveOwnerUser();
    } catch (error) {
      log.warn('Target workflow publication skipped: owner lookup failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return undefined;
    }
  }

  /**
   * Converge the target's real publish state after a workflow row write.
   * Infallible by contract: publication failures are logged by the manager
   * and retried on the next event, never fail the applied event.
   */
  async function syncWorkflowPublication(workflow: SyncWorkflowDto): Promise<void> {
    if (!applyActiveState || !publication || workflow.isArchived) return;
    if (!workflow.versionId) {
      log.warn('Skipping target workflow publication: DTO has no versionId', { workflowId: workflow.id });
      return;
    }
    try {
      await publication.syncPublishedState(
        {
          workflowId: workflow.id,
          version: {
            versionId: workflow.versionId,
            nodes: workflow.nodes ?? [],
            connections: workflow.connections ?? {},
          },
          active: workflow.active ?? false,
        },
        await resolvePublicationOwner(),
      );
    } catch (error) {
      log.warn('Target workflow publication sync failed without status', {
        workflowId: workflow.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Best-effort unpublish before a row delete or archive so stale triggers
   * cannot survive and `ON DELETE RESTRICT` dependents cannot block removal.
   * Infallible by contract.
   */
  async function removeWorkflowPublication(workflowId: string): Promise<void> {
    if (!applyActiveState || !publication) return;
    try {
      await publication.removePublication(workflowId, await resolvePublicationOwner());
    } catch (error) {
      log.warn('Target workflow unpublish before removal failed without status', {
        workflowId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async function ensureOwnerLink(
    repo: SharedWorkflowRepositoryLike | SharedCredentialsRepositoryLike,
    ownerKey: 'workflowId' | 'credentialsId',
    ownerId: string,
    role: 'workflow:owner' | 'credential:owner',
    transactional: boolean,
  ): Promise<void> {
    const projectId = await resolveLinkProjectId();
    if (!projectId) return;

    const existing = await repo.findOneBy?.({ [ownerKey]: ownerId, role });
    const existingProjectId =
      existing && typeof existing === 'object' && 'projectId' in existing && typeof existing.projectId === 'string'
        ? existing.projectId
        : undefined;

    if (existingProjectId === projectId) return;

    if (existingProjectId && existingProjectId !== projectId && repo.delete) {
      await repo.delete({ [ownerKey]: ownerId, projectId: existingProjectId, role });
      if (!transactional) {
        try {
          await repo.save({ [ownerKey]: ownerId, projectId, role });
        } catch (error) {
          await repo.save({ [ownerKey]: ownerId, projectId: existingProjectId, role });
          throw error;
        }
        return;
      }

      await repo.save({ [ownerKey]: ownerId, projectId, role });
      return;
    }

    await repo.save({ [ownerKey]: ownerId, projectId, role });
  }

  async function ensureWorkflowProjectLink(context: PersistenceContext, workflowId: string): Promise<void> {
    try {
      await ensureOwnerLink(
        requireRepository(context.repos.sharedWorkflow, 'SharedWorkflowRepository'),
        'workflowId',
        workflowId,
        'workflow:owner',
        context.transactional,
      );
    } catch (error) {
      log.warn('Failed to link workflow to target project', {
        workflowId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async function ensureCredentialProjectLink(context: PersistenceContext, credentialId: string): Promise<void> {
    try {
      await ensureOwnerLink(
        requireRepository(context.repos.sharedCredentials, 'SharedCredentialsRepository'),
        'credentialsId',
        credentialId,
        'credential:owner',
        context.transactional,
      );
    } catch (error) {
      log.warn('Failed to link credential to target project', {
        credentialId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async function withPersistenceContext<T>(work: (context: PersistenceContext) => Promise<T>): Promise<T> {
    if (!repos.transaction) {
      return work({ repos, transactional: false });
    }

    return repos.transaction(async (transactionRepos) => await work({ repos: transactionRepos, transactional: true }));
  }

  async function createWorkflowInContext(
    context: PersistenceContext,
    workflow: SyncWorkflowDto,
    entity: Record<string, unknown>,
  ): Promise<'created'> {
    const workflowRepo = requireRepository(context.repos.workflow, 'WorkflowRepository');
    await workflowRepo.save(entity);

    try {
      await ensureWorkflowProjectLink(context, workflow.id);
    } catch (error) {
      if (!context.transactional) {
        await workflowRepo.delete(workflow.id);
      }
      throw error;
    }

    return 'created';
  }

  async function createCredentialInContext(
    context: PersistenceContext,
    credential: SyncCredentialDto,
    entity: Record<string, unknown>,
  ): Promise<'created'> {
    const credentialsRepo = requireRepository(context.repos.credentials, 'CredentialsRepository');
    await credentialsRepo.save(entity);

    try {
      await ensureCredentialProjectLink(context, credential.id);
    } catch (error) {
      if (!context.transactional) {
        await credentialsRepo.delete(credential.id);
      }
      throw error;
    }

    return 'created';
  }

  async function applyConditionalUpdate(
    result: ConditionalUpdateResult,
    ensureLink: () => Promise<void>,
    event: SyncEvent,
  ): Promise<'updated' | 'stale' | undefined> {
    if (result === 'missing') return undefined;
    if (result === 'conflict') throw new SyncEntityTimestampConflictError(event);
    await ensureLink();
    return result;
  }

  async function upsertWorkflow(
    workflow: SyncWorkflowDto,
    event: SyncEvent,
    allowEqualTimestamp: boolean,
  ): Promise<void> {
    const fields: Record<string, unknown> = {
      name: workflow.name,
      nodes: workflow.nodes ?? [],
      connections: workflow.connections ?? {},
      settings: workflow.settings ?? {},
      staticData: workflow.staticData ?? null,
      pinData: workflow.pinData ?? {},
      meta: workflow.meta ?? null,
      isArchived: workflow.isArchived ?? false,
    };
    if (workflow.description !== undefined) fields.description = workflow.description;
    if (workflow.versionId !== undefined) fields.versionId = workflow.versionId;
    if (applyActiveState) {
      fields.active = workflow.active ?? false;
      fields.activeVersionId = workflow.activeVersionId ?? null;
    }
    const updatedAt = toDate(workflow.updatedAt);
    if (updatedAt) fields.updatedAt = updatedAt;

    const createdAt = toDate(workflow.createdAt);
    const entity = {
      id: workflow.id,
      ...fields,
      ...(applyActiveState ? {} : { active: false, activeVersionId: null }),
      ...(createdAt ? { createdAt } : {}),
    };

    try {
      const outcome = await withPersistenceContext(async (context) => {
        const workflowRepo = requireRepository(context.repos.workflow, 'WorkflowRepository');
        if (workflowRepo.conditionalUpdate) {
          const conditional = await workflowRepo.conditionalUpdate(workflow.id, fields, {
            incomingTimestamp: updatedAt,
            timestampField: 'updatedAt',
            allowEqualTimestamp,
          });
          const handled = await applyConditionalUpdate(
            conditional,
            async () => await ensureWorkflowProjectLink(context, workflow.id),
            event,
          );
          if (handled) return handled;
        } else {
          const existing = await workflowRepo.findOneBy({ id: workflow.id });
          if (existing) {
            const guard = getTimestampGuardResult(existing, updatedAt, 'updatedAt', allowEqualTimestamp);
            if (guard === 'conflict') throw new SyncEntityTimestampConflictError(event);
            if (guard === 'stale') {
              await ensureWorkflowProjectLink(context, workflow.id);
              return 'stale';
            }
            await workflowRepo.update(workflow.id, fields);
            await ensureWorkflowProjectLink(context, workflow.id);
            return 'updated';
          }
        }

        return await createWorkflowInContext(context, workflow, entity);
      });

      if (outcome === 'stale') {
        log.debug('Skipping stale workflow upsert', { workflowId: workflow.id });
        return;
      }

      log.debug(outcome === 'created' ? 'Workflow created' : 'Workflow updated', { workflowId: workflow.id });
      await syncWorkflowPublication(workflow);
    } catch (error) {
      if (!isUniqueConstraintError(error)) throw error;

      await withPersistenceContext(async (context) => {
        const workflowRepo = requireRepository(context.repos.workflow, 'WorkflowRepository');
        const concurrent = await workflowRepo.findOneBy({ id: workflow.id });
        if (!concurrent) throw error;

        if (workflowRepo.conditionalUpdate) {
          const conditional = await workflowRepo.conditionalUpdate(workflow.id, fields, {
            incomingTimestamp: updatedAt,
            timestampField: 'updatedAt',
            allowEqualTimestamp,
          });
          if (conditional === 'missing') throw error;
          if (conditional === 'conflict') throw new SyncEntityTimestampConflictError(event);
        } else {
          const guard = getTimestampGuardResult(concurrent, updatedAt, 'updatedAt', allowEqualTimestamp);
          if (guard === 'conflict') throw new SyncEntityTimestampConflictError(event);
          if (guard === 'stale') return;
          await workflowRepo.update(workflow.id, fields);
        }

        await ensureWorkflowProjectLink(context, workflow.id);
      });
      log.debug('Workflow create raced with an existing row; reconciled in place', { workflowId: workflow.id });
      await syncWorkflowPublication(workflow);
    }
  }

  async function deleteWorkflow(workflowId: string, sourceId: string): Promise<void> {
    const workflowRepo = requireRepository(repos.workflow, 'WorkflowRepository');
    const executionMappings =
      repos.execution && executionIdentity
        ? await executionIdentity.listBySourceWorkflow({ sourceId, workflowId })
        : [];

    for (const mapping of executionMappings) {
      await repos.execution?.delete(mapping.targetExecutionId);
    }

    await removeWorkflowPublication(workflowId);
    await workflowRepo.delete(workflowId);
    const removedExecutionMappings = executionIdentity
      ? await executionIdentity.deleteBySourceWorkflow({ sourceId, workflowId })
      : 0;
    log.debug('Workflow deleted', {
      workflowId,
      sourceId,
      removedExecutionMappings,
      removedExecutionRows: executionMappings.length,
    });
  }

  async function archiveWorkflow(workflowId: string, archived: boolean): Promise<void> {
    const workflowRepo = requireRepository(repos.workflow, 'WorkflowRepository');
    const fields: Record<string, unknown> = { isArchived: archived };
    // Archived workflows cannot be active; mirror that when state sync is on.
    if (archived && applyActiveState) {
      fields.active = false;
      fields.activeVersionId = null;
      await removeWorkflowPublication(workflowId);
    }
    await workflowRepo.update(workflowId, fields);
    log.debug(archived ? 'Workflow archived' : 'Workflow unarchived', { workflowId });
  }

  async function upsertCredential(
    credential: SyncCredentialDto,
    event: SyncEvent,
    allowEqualTimestamp: boolean,
  ): Promise<void> {
    assertEncryptedCredentialData(credential.data);

    const fields: Record<string, unknown> = {
      name: credential.name,
      type: credential.type,
      // Fail closed unless the publisher delivered the encrypted DB blob.
      data: credential.data,
      isGlobal: credential.isGlobal ?? false,
      isManaged: credential.isManaged ?? false,
    };
    const updatedAt = toDate(credential.updatedAt);
    if (updatedAt) fields.updatedAt = updatedAt;

    const createdAt = toDate(credential.createdAt);
    const entity = { id: credential.id, ...fields, ...(createdAt ? { createdAt } : {}) };

    try {
      const outcome = await withPersistenceContext(async (context) => {
        const credentialsRepo = requireRepository(context.repos.credentials, 'CredentialsRepository');
        if (credentialsRepo.conditionalUpdate) {
          const conditional = await credentialsRepo.conditionalUpdate(credential.id, fields, {
            incomingTimestamp: updatedAt,
            timestampField: 'updatedAt',
            allowEqualTimestamp,
          });
          const handled = await applyConditionalUpdate(
            conditional,
            async () => await ensureCredentialProjectLink(context, credential.id),
            event,
          );
          if (handled) return handled;
        } else {
          const existing = await credentialsRepo.findOneBy({ id: credential.id });
          if (existing) {
            const guard = getTimestampGuardResult(existing, updatedAt, 'updatedAt', allowEqualTimestamp);
            if (guard === 'conflict') throw new SyncEntityTimestampConflictError(event);
            if (guard === 'stale') {
              await ensureCredentialProjectLink(context, credential.id);
              return 'stale';
            }
            await credentialsRepo.update(credential.id, fields);
            await ensureCredentialProjectLink(context, credential.id);
            return 'updated';
          }
        }

        return await createCredentialInContext(context, credential, entity);
      });

      if (outcome === 'stale') {
        log.debug('Skipping stale credential upsert', { credentialId: credential.id });
        return;
      }

      log.debug(outcome === 'created' ? 'Credential created' : 'Credential updated', { credentialId: credential.id });
    } catch (error) {
      if (!isUniqueConstraintError(error)) throw error;

      await withPersistenceContext(async (context) => {
        const credentialsRepo = requireRepository(context.repos.credentials, 'CredentialsRepository');
        const concurrent = await credentialsRepo.findOneBy({ id: credential.id });
        if (!concurrent) throw error;

        if (credentialsRepo.conditionalUpdate) {
          const conditional = await credentialsRepo.conditionalUpdate(credential.id, fields, {
            incomingTimestamp: updatedAt,
            timestampField: 'updatedAt',
            allowEqualTimestamp,
          });
          if (conditional === 'missing') throw error;
          if (conditional === 'conflict') throw new SyncEntityTimestampConflictError(event);
        } else {
          const guard = getTimestampGuardResult(concurrent, updatedAt, 'updatedAt', allowEqualTimestamp);
          if (guard === 'conflict') throw new SyncEntityTimestampConflictError(event);
          if (guard === 'stale') return;
          await credentialsRepo.update(credential.id, fields);
        }

        await ensureCredentialProjectLink(context, credential.id);
      });
      log.debug('Credential create raced with an existing row; reconciled in place', { credentialId: credential.id });
    }
  }

  async function deleteCredential(credentialId: string): Promise<void> {
    await requireRepository(repos.credentials, 'CredentialsRepository').delete(credentialId);
    log.debug('Credential deleted', { credentialId });
  }

  /**
   * Idempotently upsert an execution row on the target. The source execution id
   * is stored only in the durable `(sourceId, sourceExecutionId)` mapping;
   * target rows keep their native primary keys. `startedAt`/`createdAt` are
   * immutable in n8n's own
   * `updateExistingExecution`, so we mirror that for the update branch and
   * only write the scalar lifecycle columns we publish (status, finished,
   * stoppedAt, mode, workflowId).
   *
   * Staleness guard: an incoming execution is skipped when the stored row has
   * a `stoppedAt` at or beyond the incoming one (matches the
   * last-write-wins-on-stop semantics). In-flight executions may have no
   * `stoppedAt`; in that case the guard is skipped and the update proceeds.
   */
  async function upsertExecution(
    execution: SyncExecutionDto,
    sourceId: string,
    event: SyncEvent,
    allowEqualTimestamp: boolean,
  ): Promise<void> {
    const executionRepo = requireRepository(repos.execution, 'ExecutionRepository');
    const workflowRepo = requireRepository(repos.workflow, 'WorkflowRepository');
    const identityStore = requireRepository(executionIdentity, 'ExecutionIdentityStore');

    if (!execution.workflowId) {
      throw new Error('Execution sync event is missing workflowId');
    }

    const targetWorkflow = await workflowRepo.findOneBy({ id: execution.workflowId });
    if (!targetWorkflow) {
      throw new Error(`Target workflow ${execution.workflowId} does not exist for synced execution ${execution.id}`);
    }

    const updatedAt = toDate(execution.stoppedAt);
    const fields: Record<string, unknown> = {
      status: execution.status,
      finished: execution.finished,
      mode: execution.mode,
      workflowId: execution.workflowId,
    };
    if (updatedAt) fields.stoppedAt = updatedAt;
    if (execution.startedAt) {
      const startedAt = toDate(execution.startedAt);
      if (startedAt) fields.startedAt = startedAt;
    } else {
      // n8n's own update path forbids changing startedAt; only set it on insert.
      fields.startedAt = null;
    }

    const sourceExecutionId = execution.id;
    const mapping = await identityStore.get({ sourceId, sourceExecutionId });
    let targetExecutionId = mapping?.targetExecutionId;
    let existing: unknown | null = null;

    if (targetExecutionId !== undefined) {
      existing = await executionRepo.findOneBy({ id: targetExecutionId });
      if (!existing) {
        await identityStore.delete({ sourceId, sourceExecutionId });
        targetExecutionId = undefined;
      }
    }

    if (existing) {
      if (shouldSkipExecutionLifecycleRegression(existing, execution)) {
        log.debug('Skipping execution lifecycle regression', {
          executionId: execution.id,
          sourceId,
          sourceExecutionId,
          targetExecutionId,
        });
        return;
      }
      const guard = getTimestampGuardResult(existing, updatedAt, 'stoppedAt', allowEqualTimestamp);
      if (guard === 'conflict') throw new SyncEntityTimestampConflictError(event);
      if (guard === 'stale') {
        log.debug('Skipping stale execution upsert', { sourceId, sourceExecutionId, targetExecutionId });
        return;
      }
      // `startedAt` and `createdAt` are immutable post-insert — drop them on update.
      const { startedAt: _startedAt, createdAt: _createdAt, ...updateFields } = fields;
      void _startedAt;
      void _createdAt;
      if (executionRepo.conditionalUpdate) {
        const conditional = await executionRepo.conditionalUpdate(targetExecutionId!, updateFields, {
          incomingTimestamp: updatedAt,
          timestampField: 'stoppedAt',
          allowEqualTimestamp,
        });
        if (conditional === 'missing') {
          await identityStore.delete({ sourceId, sourceExecutionId });
          throw new Error(`Mapped target execution ${String(targetExecutionId)} disappeared during update`);
        }
        if (conditional === 'conflict') throw new SyncEntityTimestampConflictError(event);
        if (conditional === 'stale') {
          log.debug('Skipping stale execution upsert', { sourceId, sourceExecutionId, targetExecutionId });
          return;
        }
      } else {
        await executionRepo.update({ id: targetExecutionId! }, updateFields);
      }
      await identityStore.set({
        sourceId,
        sourceExecutionId,
        targetExecutionId: targetExecutionId!,
        workflowId: execution.workflowId,
      });
      log.debug('Execution updated', { sourceId, sourceExecutionId, targetExecutionId });
      return;
    }

    const createdAt = toDate(execution.createdAt ?? execution.startedAt);
    const created = await executionRepo.save({
      ...fields,
      storedAt: 'db',
      deduplicationKey: null,
      waitTill: null,
      tracingContext: null,
      usedPrivateCredentials: false,
      ...(createdAt ? { createdAt } : {}),
    });
    const savedExecutionId = toExecutionRepositoryId((created as { id?: unknown } | null | undefined)?.id);
    if (savedExecutionId === undefined) {
      throw new Error('Execution repository save did not return a target execution id');
    }
    await identityStore.set({
      sourceId,
      sourceExecutionId,
      targetExecutionId: savedExecutionId,
      workflowId: execution.workflowId,
    });
    log.debug('Execution created', { sourceId, sourceExecutionId, targetExecutionId: savedExecutionId });
  }

  return async function applySyncEvent(event: SyncEvent): Promise<ApplySyncEventResult> {
    const entityFamily = getSyncEventEntityFamily(event);
    if (!allowedEntities.has(entityFamily)) {
      const error = new SyncEntityDisabledError(event, entityFamily);
      log.warn('Rejecting sync event for disabled entity family', {
        type: event.type,
        sourceId: event.sourceId,
        eventId: event.eventId,
        entity: entityFamily,
      });
      return { status: 'disabled', error };
    }

    const sourceEntityKey = getSourceEntityStateKey(event);

    return await withEntityLock(sourceEntityKey, async (): Promise<ApplySyncEventResult> => {
      const inspection = await ordering.inspect(event);
      const decision = inspection.decision;
      if (decision === 'duplicate') {
        log.debug('Skipping duplicate sync event', {
          type: event.type,
          sourceId: event.sourceId,
          eventId: event.eventId,
        });
        return { status: 'duplicate' };
      }
      if (decision === 'stale') {
        log.debug('Skipping stale sync event', { type: event.type, sourceId: event.sourceId, eventId: event.eventId });
        return { status: 'stale' };
      }
      if (decision === 'conflict') {
        const error = new SyncRevisionConflictError(event, inspection.previous!);
        log.warn('Rejecting conflicting sync event revision', {
          type: event.type,
          sourceId: event.sourceId,
          eventId: event.eventId,
          entityRevision: event.entityRevision,
          previousEventId: error.previous.eventId,
        });
        return { status: 'conflict', error };
      }

      const allowEqualTimestamp = decision === 'apply' && inspection.previous !== undefined;

      switch (event.type) {
        case 'workflow.upsert':
        case 'workflow.activate':
          await upsertWorkflow(event.workflow, event, allowEqualTimestamp);
          break;
        case 'workflow.delete':
          await deleteWorkflow(event.workflowId, event.sourceId);
          break;
        case 'workflow.archive':
          await archiveWorkflow(event.workflowId, event.archived);
          break;
        case 'credentials.upsert':
          await upsertCredential(event.credential, event, allowEqualTimestamp);
          break;
        case 'credentials.delete':
          await deleteCredential(event.credentialId);
          break;
        case 'execution.upsert':
          await upsertExecution(event.execution, event.sourceId, event, allowEqualTimestamp);
          break;
      }

      await ordering.recordApplied(event);
      return { status: 'applied' };
    });
  };
}
