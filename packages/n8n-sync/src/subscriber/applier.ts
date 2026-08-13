import { getSourceEntityStateKey } from '../shared/ordering';
import type { Logger } from '../shared/logger';
import type { SyncCredentialDto, SyncEvent, SyncExecutionDto, SyncWorkflowDto } from '../shared/types';
import { createExecutionIdentityStore, type ExecutionIdentityStore } from './execution-identity';
import type { ConditionalUpdateResult } from './n8n-runtime';
import type { N8nSyncRepositories, SharedCredentialsRepositoryLike, SharedWorkflowRepositoryLike } from './n8n-runtime';
import { createSyncOrderingStore, type SyncOrderingStore } from './order-state';

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
  log: Logger;
}

export type ApplySyncEvent = (event: SyncEvent) => Promise<void>;

type PersistenceContext = {
  repos: N8nSyncRepositories;
  transactional: boolean;
};

const TERMINAL_EXECUTION_STATUSES = new Set(['success', 'error', 'crashed', 'canceled']);

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
function isStaleEvent(
  existing: unknown,
  incomingTimestamp: Date | undefined,
  timestampField: 'updatedAt' | 'stoppedAt' = 'updatedAt',
): boolean {
  if (!incomingTimestamp) return false;
  const existingTimestamp = toDate(
    (existing as { updatedAt?: Date | string; stoppedAt?: Date | string } | null)?.[timestampField],
  );
  return existingTimestamp !== undefined && existingTimestamp.getTime() >= incomingTimestamp.getTime();
}

/**
 * Create the sync-event applier. Events are applied idempotently via the
 * target instance's own repositories. Workflow and credential ids are
 * preserved; execution rows always use a target-generated id behind a durable
 * `(sourceId, sourceExecutionId)` mapping.
 */
export function createApplier(repos: N8nSyncRepositories, options: ApplierOptions): ApplySyncEvent {
  const { log } = options;
  const applyActiveState = options.applyActiveState ?? false;
  const targetProjectId = options.targetProjectId || undefined;
  const ordering = options.ordering ?? createSyncOrderingStore();
  const executionIdentity = options.executionIdentity ?? createExecutionIdentityStore();
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
    try {
      const owner = await repos.user.findOne({
        where: { role: { slug: 'global:owner' } },
        relations: ['role'],
        order: { createdAt: 'ASC' },
        take: 1,
      });
      if (!owner) {
        log.warn('Owner fallback: no global:owner user found on target');
        cachedFallbackProjectId = null;
        return undefined;
      }
      const project = await repos.project.getPersonalProjectForUser(owner.id);
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
        context.repos.sharedWorkflow,
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
        context.repos.sharedCredentials,
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
    await context.repos.workflow.save(entity);

    try {
      await ensureWorkflowProjectLink(context, workflow.id);
    } catch (error) {
      if (!context.transactional) {
        await context.repos.workflow.delete(workflow.id);
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
    await context.repos.credentials.save(entity);

    try {
      await ensureCredentialProjectLink(context, credential.id);
    } catch (error) {
      if (!context.transactional) {
        await context.repos.credentials.delete(credential.id);
      }
      throw error;
    }

    return 'created';
  }

  async function applyConditionalUpdate(
    result: ConditionalUpdateResult,
    ensureLink: () => Promise<void>,
  ): Promise<'updated' | 'stale' | undefined> {
    if (result === 'missing') return undefined;
    await ensureLink();
    return result;
  }

  async function upsertWorkflow(workflow: SyncWorkflowDto): Promise<void> {
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
        if (context.repos.workflow.conditionalUpdate) {
          const conditional = await context.repos.workflow.conditionalUpdate(workflow.id, fields, {
            incomingTimestamp: updatedAt,
            timestampField: 'updatedAt',
          });
          const handled = await applyConditionalUpdate(
            conditional,
            async () => await ensureWorkflowProjectLink(context, workflow.id),
          );
          if (handled) return handled;
        } else {
          const existing = await context.repos.workflow.findOneBy({ id: workflow.id });
          if (existing) {
            if (isStaleEvent(existing, updatedAt)) {
              await ensureWorkflowProjectLink(context, workflow.id);
              return 'stale';
            }
            await context.repos.workflow.update(workflow.id, fields);
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
    } catch (error) {
      if (!isUniqueConstraintError(error)) throw error;

      await withPersistenceContext(async (context) => {
        const concurrent = await context.repos.workflow.findOneBy({ id: workflow.id });
        if (!concurrent) throw error;

        if (context.repos.workflow.conditionalUpdate) {
          const conditional = await context.repos.workflow.conditionalUpdate(workflow.id, fields, {
            incomingTimestamp: updatedAt,
            timestampField: 'updatedAt',
          });
          if (conditional === 'missing') throw error;
        } else if (!isStaleEvent(concurrent, updatedAt)) {
          await context.repos.workflow.update(workflow.id, fields);
        }

        await ensureWorkflowProjectLink(context, workflow.id);
      });
      log.debug('Workflow create raced with an existing row; reconciled in place', { workflowId: workflow.id });
    }
  }

  async function deleteWorkflow(workflowId: string, sourceId: string): Promise<void> {
    const executionMappings = repos.execution
      ? await executionIdentity.listBySourceWorkflow({ sourceId, workflowId })
      : [];

    for (const mapping of executionMappings) {
      await repos.execution?.delete(mapping.targetExecutionId);
    }

    await repos.workflow.delete(workflowId);
    const removedExecutionMappings = await executionIdentity.deleteBySourceWorkflow({ sourceId, workflowId });
    log.debug('Workflow deleted', {
      workflowId,
      sourceId,
      removedExecutionMappings,
      removedExecutionRows: executionMappings.length,
    });
  }

  async function archiveWorkflow(workflowId: string, archived: boolean): Promise<void> {
    const fields: Record<string, unknown> = { isArchived: archived };
    // Archived workflows cannot be active; mirror that when state sync is on.
    if (archived && applyActiveState) {
      fields.active = false;
      fields.activeVersionId = null;
    }
    await repos.workflow.update(workflowId, fields);
    log.debug(archived ? 'Workflow archived' : 'Workflow unarchived', { workflowId });
  }

  async function upsertCredential(credential: SyncCredentialDto): Promise<void> {
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
        if (context.repos.credentials.conditionalUpdate) {
          const conditional = await context.repos.credentials.conditionalUpdate(credential.id, fields, {
            incomingTimestamp: updatedAt,
            timestampField: 'updatedAt',
          });
          const handled = await applyConditionalUpdate(
            conditional,
            async () => await ensureCredentialProjectLink(context, credential.id),
          );
          if (handled) return handled;
        } else {
          const existing = await context.repos.credentials.findOneBy({ id: credential.id });
          if (existing) {
            if (isStaleEvent(existing, updatedAt)) {
              await ensureCredentialProjectLink(context, credential.id);
              return 'stale';
            }
            await context.repos.credentials.update(credential.id, fields);
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
        const concurrent = await context.repos.credentials.findOneBy({ id: credential.id });
        if (!concurrent) throw error;

        if (context.repos.credentials.conditionalUpdate) {
          const conditional = await context.repos.credentials.conditionalUpdate(credential.id, fields, {
            incomingTimestamp: updatedAt,
            timestampField: 'updatedAt',
          });
          if (conditional === 'missing') throw error;
        } else if (!isStaleEvent(concurrent, updatedAt)) {
          await context.repos.credentials.update(credential.id, fields);
        }

        await ensureCredentialProjectLink(context, credential.id);
      });
      log.debug('Credential create raced with an existing row; reconciled in place', { credentialId: credential.id });
    }
  }

  async function deleteCredential(credentialId: string): Promise<void> {
    await repos.credentials.delete(credentialId);
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
  async function upsertExecution(execution: SyncExecutionDto, sourceId: string): Promise<void> {
    if (!repos.execution) {
      throw new Error('Received execution event but executions are not enabled on this subscriber');
    }

    if (!execution.workflowId) {
      throw new Error('Execution sync event is missing workflowId');
    }

    const targetWorkflow = await repos.workflow.findOneBy({ id: execution.workflowId });
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
    const mapping = await executionIdentity.get({ sourceId, sourceExecutionId });
    let targetExecutionId = mapping?.targetExecutionId;
    let existing: unknown | null = null;

    if (targetExecutionId !== undefined) {
      existing = await repos.execution.findOneBy({ id: targetExecutionId });
      if (!existing) {
        await executionIdentity.delete({ sourceId, sourceExecutionId });
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
      if (isStaleEvent(existing, updatedAt, 'stoppedAt')) {
        log.debug('Skipping stale execution upsert', { sourceId, sourceExecutionId, targetExecutionId });
        return;
      }
      // `startedAt` and `createdAt` are immutable post-insert — drop them on update.
      const { startedAt: _startedAt, createdAt: _createdAt, ...updateFields } = fields;
      void _startedAt;
      void _createdAt;
      await repos.execution.update({ id: targetExecutionId! }, updateFields);
      await executionIdentity.set({
        sourceId,
        sourceExecutionId,
        targetExecutionId: targetExecutionId!,
        workflowId: execution.workflowId,
      });
      log.debug('Execution updated', { sourceId, sourceExecutionId, targetExecutionId });
      return;
    }

    const createdAt = toDate(execution.createdAt ?? execution.startedAt);
    const created = await repos.execution.save({
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
    await executionIdentity.set({
      sourceId,
      sourceExecutionId,
      targetExecutionId: savedExecutionId,
      workflowId: execution.workflowId,
    });
    log.debug('Execution created', { sourceId, sourceExecutionId, targetExecutionId: savedExecutionId });
  }

  return async function applySyncEvent(event: SyncEvent): Promise<void> {
    const sourceEntityKey = getSourceEntityStateKey(event);

    await withEntityLock(sourceEntityKey, async () => {
      const decision = await ordering.inspect(event);
      if (decision === 'duplicate') {
        log.debug('Skipping duplicate sync event', {
          type: event.type,
          sourceId: event.sourceId,
          eventId: event.eventId,
        });
        return;
      }
      if (decision === 'stale') {
        log.debug('Skipping stale sync event', { type: event.type, sourceId: event.sourceId, eventId: event.eventId });
        return;
      }
      if (decision === 'conflict') {
        log.warn('Rejecting conflicting sync event revision', {
          type: event.type,
          sourceId: event.sourceId,
          eventId: event.eventId,
          entityRevision: event.entityRevision,
        });
        return;
      }

      switch (event.type) {
        case 'workflow.upsert':
        case 'workflow.activate':
          await upsertWorkflow(event.workflow);
          break;
        case 'workflow.delete':
          await deleteWorkflow(event.workflowId, event.sourceId);
          break;
        case 'workflow.archive':
          await archiveWorkflow(event.workflowId, event.archived);
          break;
        case 'credentials.upsert':
          await upsertCredential(event.credential);
          break;
        case 'credentials.delete':
          await deleteCredential(event.credentialId);
          break;
        case 'execution.upsert':
          await upsertExecution(event.execution, event.sourceId);
          break;
      }

      await ordering.recordApplied(event);
    });
  };
}
