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

  async function linkWorkflowToProject(workflowId: string): Promise<void> {
    if (!targetProjectId) return;
    try {
      await repos.sharedWorkflow.save({ workflowId, projectId: targetProjectId, role: 'workflow:owner' });
    } catch (error) {
      log.warn('Failed to link workflow to target project', {
        workflowId,
        projectId: targetProjectId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async function linkCredentialToProject(credentialId: string): Promise<void> {
    if (!targetProjectId) return;
    try {
      await repos.sharedCredentials.save({
        credentialsId: credentialId,
        projectId: targetProjectId,
        role: 'credential:owner',
      });
    } catch (error) {
      log.warn('Failed to link credential to target project', {
        credentialId,
        projectId: targetProjectId,
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
      // Encrypted blob passthrough — requires both instances to share
      // N8N_ENCRYPTION_KEY so the target can decrypt it at runtime.
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
