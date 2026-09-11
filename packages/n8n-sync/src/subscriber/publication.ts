import type { Logger } from '../shared/logger';
import type { PublicationUserLike, WorkflowHistoryServiceLike, WorkflowServiceLike } from './n8n-runtime';

export interface WorkflowVersionSnapshot {
  versionId: string;
  nodes: unknown;
  connections: unknown;
}

export interface PublishedStateRequest {
  workflowId: string;
  version: WorkflowVersionSnapshot;
  /** Desired publish state, already resolved from the sync DTO's `active` flag. */
  active: boolean;
}

export type PublicationSyncStatus = 'published' | 'unpublished' | 'unavailable' | 'failed';

export interface PublicationServices {
  historyService?: WorkflowHistoryServiceLike;
  workflowService?: WorkflowServiceLike;
}

export interface WorkflowPublicationManager {
  /**
   * Converge the target's publish state toward `request.active`. Materializes
   * the synced `versionId` as a history row when absent, then publishes or
   * unpublishes through n8n's canonical workflow service so triggers and
   * webhooks are registered with the active workflow manager.
   *
   * Never throws: service failures resolve to `'failed'` (the row state has
   * already converged; the next event retries), missing services or owner
   * resolve to `'unavailable'` (column-only behavior stays in effect).
   */
  syncPublishedState(
    request: PublishedStateRequest,
    owner: PublicationUserLike | undefined,
  ): Promise<PublicationSyncStatus>;
  /**
   * Best-effort unpublish before a row delete or archive so no stale triggers
   * survive and `ON DELETE RESTRICT` dependents cannot block the delete.
   * Never throws.
   */
  removePublication(workflowId: string, owner: PublicationUserLike | undefined): Promise<void>;
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function hasFullPublishCapability(services: PublicationServices): boolean {
  return (
    typeof services.historyService?.findVersion === 'function' &&
    typeof services.historyService?.saveVersion === 'function' &&
    typeof services.workflowService?.activateWorkflow === 'function' &&
    typeof services.workflowService?.deactivateWorkflow === 'function'
  );
}

export function createWorkflowPublicationManager(
  services: PublicationServices,
  options: { log: Logger },
): WorkflowPublicationManager {
  const { log } = options;

  async function ensureVersionRow(
    workflowId: string,
    version: WorkflowVersionSnapshot,
    owner: PublicationUserLike,
  ): Promise<void> {
    const history = services.historyService!;
    let existing: unknown = null;
    try {
      existing = await history.findVersion!(workflowId, version.versionId);
    } catch (error) {
      // A lookup failure must not block activation: `saveVersion` tolerates
      // the version already existing and logs insert failures itself.
      log.debug('Workflow history lookup failed; attempting version save', {
        workflowId,
        versionId: version.versionId,
        error: describeError(error),
      });
    }
    if (existing) return;
    await history.saveVersion!(
      owner,
      { versionId: version.versionId, nodes: version.nodes, connections: version.connections },
      workflowId,
    );
  }

  return {
    async syncPublishedState(
      request: PublishedStateRequest,
      owner: PublicationUserLike | undefined,
    ): Promise<PublicationSyncStatus> {
      if (!hasFullPublishCapability(services)) {
        log.debug('Target workflow publication unavailable; keeping column-only active state', {
          workflowId: request.workflowId,
        });
        return 'unavailable';
      }
      if (!owner) {
        log.warn('Target workflow publication unavailable: no owner user to publish as', {
          workflowId: request.workflowId,
        });
        return 'unavailable';
      }

      try {
        await ensureVersionRow(request.workflowId, request.version, owner);
        if (request.active) {
          await services.workflowService!.activateWorkflow!(owner, request.workflowId);
          log.debug('Target workflow published', { workflowId: request.workflowId });
          return 'published';
        }
        await services.workflowService!.deactivateWorkflow!(owner, request.workflowId);
        log.debug('Target workflow unpublished', { workflowId: request.workflowId });
        return 'unpublished';
      } catch (error) {
        log.warn('Target workflow publication sync failed', {
          workflowId: request.workflowId,
          active: request.active,
          error: describeError(error),
        });
        return 'failed';
      }
    },

    async removePublication(workflowId: string, owner: PublicationUserLike | undefined): Promise<void> {
      if (typeof services.workflowService?.deactivateWorkflow !== 'function' || !owner) {
        log.debug('Target workflow unpublish skipped; publication services unavailable', { workflowId });
        return;
      }
      try {
        await services.workflowService.deactivateWorkflow(owner, workflowId);
        log.debug('Target workflow unpublished before removal', { workflowId });
      } catch (error) {
        log.warn('Target workflow unpublish before removal failed', {
          workflowId,
          error: describeError(error),
        });
      }
    },
  };
}
