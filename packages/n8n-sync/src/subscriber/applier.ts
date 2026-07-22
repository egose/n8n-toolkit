import type { Logger } from '../shared/logger';
import type { SyncCredentialDto, SyncEvent, SyncExecutionDto, SyncWorkflowDto } from '../shared/types';
import type { N8nSyncRepositories } from './n8n-runtime';

export interface ApplierOptions {
  /** When set, newly created workflows/credentials are linked to this project. */
  targetProjectId?: string;
  /**
   * When true, the source's active/activeVersionId state is written to the
   * target database. Defaults to false because writing the DB flag does NOT
   * register triggers/webhooks with the target's active workflow manager.
   */
  applyActiveState?: boolean;
  log: Logger;
}

export type ApplySyncEvent = (event: SyncEvent) => Promise<void>;

function toDate(value: string | Date | undefined): Date | undefined {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
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
 * target instance's own repositories, preserving source IDs.
 */
export function createApplier(repos: N8nSyncRepositories, options: ApplierOptions): ApplySyncEvent {
  const { log } = options;
  const applyActiveState = options.applyActiveState ?? false;
  const targetProjectId = options.targetProjectId || undefined;

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
      cachedFallbackProjectId = null;
      return undefined;
    }
  }

  async function linkWorkflowToProject(workflowId: string): Promise<void> {
    const projectId = await resolveLinkProjectId();
    if (!projectId) return;
    try {
      await repos.sharedWorkflow.save({ workflowId, projectId, role: 'workflow:owner' });
    } catch (error) {
      log.warn('Failed to link workflow to target project', {
        workflowId,
        projectId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async function linkCredentialToProject(credentialId: string): Promise<void> {
    const projectId = await resolveLinkProjectId();
    if (!projectId) return;
    try {
      await repos.sharedCredentials.save({
        credentialsId: credentialId,
        projectId,
        role: 'credential:owner',
      });
    } catch (error) {
      log.warn('Failed to link credential to target project', {
        credentialId,
        projectId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
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

    const existing = await repos.workflow.findOneBy({ id: workflow.id });

    if (existing) {
      if (isStaleEvent(existing, updatedAt)) {
        log.debug('Skipping stale workflow upsert', { workflowId: workflow.id });
        return;
      }
      await repos.workflow.update(workflow.id, fields);
      log.debug('Workflow updated', { workflowId: workflow.id });
      return;
    }

    const createdAt = toDate(workflow.createdAt);
    await repos.workflow.save({
      id: workflow.id,
      ...fields,
      ...(applyActiveState ? {} : { active: false, activeVersionId: null }),
      ...(createdAt ? { createdAt } : {}),
    });
    await linkWorkflowToProject(workflow.id);
    log.debug('Workflow created', { workflowId: workflow.id });
  }

  async function deleteWorkflow(workflowId: string): Promise<void> {
    await repos.workflow.delete(workflowId);
    log.debug('Workflow deleted', { workflowId });
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
    const fields: Record<string, unknown> = {
      name: credential.name,
      type: credential.type,
      // n8n credential hooks can surface either the encrypted DB blob or the
      // plain JSON object n8n encrypts on save. Pass it through verbatim and
      // let the target repository persist it using its own entity semantics.
      data: credential.data,
      isGlobal: credential.isGlobal ?? false,
      isManaged: credential.isManaged ?? false,
    };
    const updatedAt = toDate(credential.updatedAt);
    if (updatedAt) fields.updatedAt = updatedAt;

    const existing = await repos.credentials.findOneBy({ id: credential.id });

    if (existing) {
      if (isStaleEvent(existing, updatedAt)) {
        log.debug('Skipping stale credential upsert', { credentialId: credential.id });
        return;
      }
      await repos.credentials.update(credential.id, fields);
      log.debug('Credential updated', { credentialId: credential.id });
      return;
    }

    const createdAt = toDate(credential.createdAt);
    await repos.credentials.save({ id: credential.id, ...fields, ...(createdAt ? { createdAt } : {}) });
    await linkCredentialToProject(credential.id);
    log.debug('Credential created', { credentialId: credential.id });
  }

  async function deleteCredential(credentialId: string): Promise<void> {
    await repos.credentials.delete(credentialId);
    log.debug('Credential deleted', { credentialId });
  }

  /**
   * Idempotently upsert an execution row on the target. Preserves the source
   * execution id. `startedAt`/`createdAt` are immutable in n8n's own
   * `updateExistingExecution`, so we mirror that for the update branch and
   * only write mutable columns (status, finished, stoppedAt, waitTill,
   * mode, retryOf, retrySuccessId, workflowVersionId).
   *
   * Staleness guard: an incoming execution is skipped when the stored row has
   * a `stoppedAt` at or beyond the incoming one (matches the
   * last-write-wins-on-stop semantics). In-flight executions may have no
   * `stoppedAt`; in that case the guard is skipped and the update proceeds.
   */
  async function upsertExecution(execution: SyncExecutionDto): Promise<void> {
    if (!repos.execution) {
      log.warn('Received execution event but executions are not enabled on this subscriber', {
        executionId: execution.id,
      });
      return;
    }

    const updatedAt = toDate(execution.stoppedAt);
    const fields: Record<string, unknown> = {
      status: execution.status,
      finished: execution.finished,
      mode: execution.mode,
      workflowId: execution.workflowId ?? null,
      retryOf: execution.retryOf ?? null,
      retrySuccessId: execution.retrySuccessId ?? null,
      workflowVersionId: execution.workflowVersionId ?? null,
    };
    if (updatedAt) fields.stoppedAt = updatedAt;
    if (execution.startedAt) {
      const startedAt = toDate(execution.startedAt);
      if (startedAt) fields.startedAt = startedAt;
    } else {
      // n8n's own update path forbids changing startedAt; only set it on insert.
      fields.startedAt = null;
    }

    const existing = await repos.execution.findOneBy({ id: execution.id });

    if (existing) {
      if (isStaleEvent(existing, updatedAt, 'stoppedAt')) {
        log.debug('Skipping stale execution upsert', { executionId: execution.id });
        return;
      }
      // `startedAt` and `createdAt` are immutable post-insert — drop them on update.
      const { startedAt: _startedAt, createdAt: _createdAt, ...updateFields } = fields;
      void _startedAt;
      void _createdAt;
      await repos.execution.update({ id: execution.id }, updateFields);
      log.debug('Execution updated', { executionId: execution.id });
      return;
    }

    const createdAt = toDate(execution.createdAt ?? execution.startedAt);
    await repos.execution.save({
      id: execution.id,
      ...fields,
      storedAt: 'db',
      deduplicationKey: null,
      waitTill: null,
      tracingContext: null,
      usedPrivateCredentials: false,
      ...(createdAt ? { createdAt } : {}),
    });
    log.debug('Execution created', { executionId: execution.id });
  }

  return async function applySyncEvent(event: SyncEvent): Promise<void> {
    switch (event.type) {
      case 'workflow.upsert':
      case 'workflow.activate':
        await upsertWorkflow(event.workflow);
        break;
      case 'workflow.delete':
        await deleteWorkflow(event.workflowId);
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
        await upsertExecution(event.execution);
        break;
    }
  };
}
