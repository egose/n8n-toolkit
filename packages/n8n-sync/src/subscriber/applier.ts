import type { Logger } from '../shared/logger';
import type { SyncCredentialDto, SyncEvent, SyncWorkflowDto } from '../shared/types';
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
 * incoming upsert is stale when the stored row's updatedAt is at or beyond
 * the incoming one.
 */
function isStaleEvent(existing: unknown, incomingUpdatedAt: Date | undefined): boolean {
  if (!incomingUpdatedAt) return false;
  const existingUpdatedAt = toDate((existing as { updatedAt?: Date | string } | null)?.updatedAt);
  return existingUpdatedAt !== undefined && existingUpdatedAt.getTime() >= incomingUpdatedAt.getTime();
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
    }
  };
}
