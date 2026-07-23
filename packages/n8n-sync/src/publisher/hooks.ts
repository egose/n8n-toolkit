import { mapCredential, mapExecution, mapWorkflow } from '../shared/mappers';
import type {
  ICredentialsDb,
  IExternalHooksFileData,
  IRunPayload,
  IWorkflowBase,
  IWorkflowTag,
  SyncEvent,
  WorkflowSnapshot,
} from '../shared/types';

type WorkflowFindOptions = {
  where: { id: string };
  relations?: string[];
};

type PublisherHookThis = {
  dbCollections?: {
    Workflow?: {
      findOne(options: WorkflowFindOptions): Promise<(IWorkflowBase & { tags?: IWorkflowTag[] }) | null>;
    };
    Credentials?: {
      findOne(options: {
        where: { id?: string; name?: string; type?: string };
        order?: { updatedAt: 'DESC' };
      }): Promise<ICredentialsDb | null>;
    };
  };
};

export interface PublisherDeps {
  /** Deliver a fully-built event to the subscriber. Must never throw. */
  emit: (event: SyncEvent) => Promise<void>;
  /** Identifier of this publishing instance, stamped on every event. */
  sourceId: string;
  /** Injectable clock for tests. */
  now?: () => Date;
  /**
   * Per-entity gates. When a gate is `false`, the corresponding hook is not
   * wired at all (returns no handler) so n8n pays zero overhead for it.
   * Defaults to enabling the legacy entities (workflows + credentials) and
   * disabling executions — the high-volume `workflow.postExecute` hook is
   * opt-in.
   */
  entities?: {
    workflows?: boolean;
    credentials?: boolean;
    executions?: boolean;
  };
  /**
   * When `true`, workflow/execution events are published only for workflows
   * carrying {@link PublisherDeps.syncWorkflowTag}. Workflows that lose the
   * sync tag trigger a `workflow.delete` event. The top-level `active` field
   * on outbound workflow DTOs is rewritten based on the presence of
   * {@link PublisherDeps.activeTag}, with the source's real value preserved
   * under `meta.active_real`. Defaults to `false` (full passthrough).
   */
  filterByTag?: boolean;
  /** Tag name that marks a workflow as eligible for sync. Default: `sync`. */
  syncWorkflowTag?: string;
  /** Tag name that marks a synced workflow as active on the target. Default: `active`. */
  activeTag?: string;
}

/**
 * Build the n8n external-hook map for the publisher side.
 *
 * Wired hooks (lifecycle only — no execution hooks):
 *   credentials.create / credentials.update / credentials.delete
 *   workflow.afterCreate / workflow.afterUpdate / workflow.afterDelete
 *   workflow.activate / workflow.afterArchive / workflow.afterUnarchive
 *   workflow.postExecute (per-execution; opt-in via `entities.executions`)
 *
 * Note: n8n fires no external hook on workflow deactivation, and
 * `workflow.activate` fires before the activation is committed.
 */
export function createPublisherHooks(deps: PublisherDeps): IExternalHooksFileData {
  const timestamp = (): string => (deps.now ? deps.now() : new Date()).toISOString();
  const envelope = <T extends Omit<SyncEvent, 'at' | 'sourceId'>>(event: T): T & Pick<SyncEvent, 'at' | 'sourceId'> =>
    ({ ...event, at: timestamp(), sourceId: deps.sourceId }) as T & Pick<SyncEvent, 'at' | 'sourceId'>;

  const entities = {
    workflows: deps.entities?.workflows ?? true,
    credentials: deps.entities?.credentials ?? true,
    executions: deps.entities?.executions ?? false,
  };

  const filterByTag = deps.filterByTag ?? false;
  const syncWorkflowTag = deps.syncWorkflowTag ?? 'sync';
  const activeTag = deps.activeTag ?? 'active';

  /**
   * Resolve a workflow from the n8n hook payload. When {@link filterByTag}
   * is enabled, the workflow is fetched with its `tags` relation populated so
   * we can decide whether to publish and how to rewrite `active`. When the
   * filter is disabled, tags are not requested (no extra join).
   */
  async function resolveWorkflow(
    this: PublisherHookThis,
    workflowOrId: IWorkflowBase | string,
  ): Promise<(IWorkflowBase & { tags?: IWorkflowTag[] }) | undefined> {
    if (typeof workflowOrId !== 'string') {
      // For full workflow payloads from the hook, fire a follow-up lookup to
      // attach tags only when filtered publishing is enabled.
      if (!filterByTag) return workflowOrId;
      const withTags = await this.dbCollections?.Workflow?.findOne({
        where: { id: workflowOrId.id },
        relations: ['tags'],
      });
      // Fall back to the in-memory hook payload when the DB lookup fails; the
      // tag filter just won't apply (event will be published).
      return withTags ?? workflowOrId;
    }
    const workflow = await this.dbCollections?.Workflow?.findOne({
      where: { id: workflowOrId },
      ...(filterByTag ? { relations: ['tags'] } : {}),
    });
    return workflow ?? undefined;
  }

  function workflowHasTag(tags: IWorkflowTag[] | undefined, tagName: string): boolean {
    return Array.isArray(tags) && tags.some((tag) => tag?.name === tagName);
  }

  /**
   * Decide whether a workflow is eligible for sync. When the tag filter is
   * disabled, every workflow passes. When enabled, the workflow must carry
   * {@link syncWorkflowTag}.
   */
  function shouldSyncWorkflow(workflow: { tags?: IWorkflowTag[] }): boolean {
    if (!filterByTag) return true;
    return workflowHasTag(workflow.tags, syncWorkflowTag);
  }

  /**
   * When `filterByTag` is enabled, rewrite the DTO's top-level `active`
   * field based on the presence of {@link activeTag} and preserve the source's
   * real value under `meta.active_real`. When the filter is disabled, the
   * DTO is returned verbatim.
   */
  function mapWorkflowDto(workflow: IWorkflowBase & { tags?: IWorkflowTag[] }) {
    if (!filterByTag) {
      return mapWorkflow(workflow);
    }
    return mapWorkflow(workflow, {
      tags: workflow.tags ?? [],
      rewriteActive: true,
      rewriteActiveTo: workflowHasTag(workflow.tags, activeTag),
    });
  }

  function hasCredentialIdentity(
    credential: Partial<ICredentialsDb>,
  ): credential is Pick<ICredentialsDb, 'name' | 'type'> {
    return typeof credential.name === 'string' && typeof credential.type === 'string';
  }

  async function resolveCredential(
    this: PublisherHookThis,
    credential: Partial<ICredentialsDb>,
  ): Promise<ICredentialsDb | undefined> {
    const hasCompletePayload = typeof credential.id === 'string' && credential.data !== undefined;

    if (hasCompletePayload) {
      return credential as ICredentialsDb;
    }

    const repository = this.dbCollections?.Credentials;
    if (!repository) {
      return hasCompletePayload ? (credential as ICredentialsDb) : undefined;
    }

    // `credentials.create` can surface before the final row is visible from the
    // hook payload (`id` may be present but still undefined). Poll briefly in
    // the background for the canonical stored row, then emit that snapshot.
    for (let attempt = 0; attempt < 10; attempt += 1) {
      if (attempt > 0) {
        await new Promise((resolve) => setTimeout(resolve, 250));
      }

      if (typeof credential.id === 'string') {
        const byId = await repository.findOne({ where: { id: credential.id } });
        if (byId) return byId;
      }

      if (hasCredentialIdentity(credential)) {
        const byIdentity = await repository.findOne({
          where: { name: credential.name, type: credential.type },
          order: { updatedAt: 'DESC' },
        });
        if (byIdentity) return byIdentity;
      }
    }

    return hasCompletePayload ? (credential as ICredentialsDb) : undefined;
  }

  async function emitCredentialUpsert(this: PublisherHookThis, credential: Partial<ICredentialsDb>): Promise<void> {
    const resolved = await resolveCredential.call(this, credential);
    if (!resolved) return;
    await deps.emit(envelope({ type: 'credentials.upsert', credential: mapCredential(resolved) }));
  }

  /**
   * Resolve + publish a workflow upsert. Used by `afterCreate` and
   * `afterUpdate`. When the tag filter is enabled and the workflow loses the
   * sync tag, the publisher emits a `workflow.delete` instead so the
   * subscriber drops it (eventually-consistent — a delete for an unknown ID
   * is a documented no-op on the subscriber side).
   */
  const emitWorkflowUpsert = async (workflow: IWorkflowBase & { tags?: IWorkflowTag[] }) => {
    if (!shouldSyncWorkflow(workflow)) {
      await deps.emit(envelope({ type: 'workflow.delete', workflowId: workflow.id }));
      return;
    }
    await deps.emit(envelope({ type: 'workflow.upsert', workflow: mapWorkflowDto(workflow) }));
  };

  /**
   * `workflow.activate` hook path. When the tag filter is enabled and the
   * workflow lacks the sync tag, fall back to a delete so the subscriber
   * can't keep a stale active copy around.
   */
  const emitWorkflowActivate = async (workflow: IWorkflowBase & { tags?: IWorkflowTag[] }) => {
    if (!shouldSyncWorkflow(workflow)) {
      await deps.emit(envelope({ type: 'workflow.delete', workflowId: workflow.id }));
      return;
    }
    await deps.emit(envelope({ type: 'workflow.activate', workflow: mapWorkflowDto(workflow) }));
  };

  return {
    ...(entities.credentials
      ? {
          credentials: {
            create: [
              async function (this: PublisherHookThis, encryptedData: Partial<ICredentialsDb>) {
                if (typeof encryptedData.id === 'string' && encryptedData.data !== undefined) {
                  await emitCredentialUpsert.call(this, encryptedData);
                  return;
                }
                void emitCredentialUpsert.call(this, encryptedData);
              },
            ],
            update: [
              async function (this: PublisherHookThis, newCredentialData: Partial<ICredentialsDb>) {
                await emitCredentialUpsert.call(this, newCredentialData);
              },
            ],
            delete: [
              async function (credentialId: string) {
                await deps.emit(envelope({ type: 'credentials.delete', credentialId }));
              },
            ],
          },
        }
      : {}),
    ...(entities.workflows || entities.executions
      ? {
          workflow: {
            ...(entities.workflows
              ? {
                  afterCreate: [
                    async function (this: PublisherHookThis, createdWorkflow: IWorkflowBase | string) {
                      const workflow = await resolveWorkflow.call(this, createdWorkflow);
                      if (!workflow) return;
                      await emitWorkflowUpsert(workflow);
                    },
                  ],
                  afterUpdate: [
                    async function (this: PublisherHookThis, updatedWorkflow: IWorkflowBase | string) {
                      const workflow = await resolveWorkflow.call(this, updatedWorkflow);
                      if (!workflow) return;
                      await emitWorkflowUpsert(workflow);
                    },
                  ],
                  activate: [
                    async function (this: PublisherHookThis, updatedWorkflow: IWorkflowBase | string) {
                      const workflow = await resolveWorkflow.call(this, updatedWorkflow);
                      if (!workflow) return;
                      await emitWorkflowActivate(workflow);
                    },
                  ],
                  afterDelete: [
                    async function (workflowId: string) {
                      await deps.emit(envelope({ type: 'workflow.delete', workflowId }));
                    },
                  ],
                  afterArchive: [
                    async function (workflowId: string) {
                      await deps.emit(envelope({ type: 'workflow.archive', workflowId, archived: true }));
                    },
                  ],
                  afterUnarchive: [
                    async function (workflowId: string) {
                      await deps.emit(envelope({ type: 'workflow.archive', workflowId, archived: false }));
                    },
                  ],
                }
              : {}),
            ...(entities.executions
              ? {
                  postExecute: [
                    /**
                     * n8n signature: `[fullRunData: IRun | undefined, workflowData: IWorkflowBase, executionId: string]`.
                     * Fire-and-forget: this hook fires per execution and must
                     * not block n8n, so we void the emit and let the
                     * publisher's serialized queue handle delivery.
                     *
                     * When the tag filter is enabled and the workflow lacks
                     * {@link syncWorkflowTag}, the execution is silently
                     * dropped (no DB lookup needed when the hook payload
                     * already carries a complete `IWorkflowBase` with tags;
                     * otherwise we resolve tags from the repository once).
                     */
                    async function (
                      this: PublisherHookThis,
                      fullRunData: IRunPayload | undefined,
                      workflowData: WorkflowSnapshot | IWorkflowBase | undefined,
                      executionId: string,
                    ) {
                      if (typeof executionId !== 'string' || !executionId) return;

                      if (filterByTag) {
                        const workflowId = (workflowData as { id?: string } | undefined)?.id;
                        if (!workflowId) return;
                        // Use the in-memory workflow payload if it already has
                        // tags; otherwise resolve the workflow with its tags
                        // relation from the DB.
                        let tags: IWorkflowTag[] | undefined = (workflowData as { tags?: IWorkflowTag[] }).tags;
                        if (tags === undefined) {
                          const resolved = await resolveWorkflow.call(this, workflowId);
                          tags = resolved?.tags;
                        }
                        if (!workflowHasTag(tags, syncWorkflowTag)) return;
                      }

                      const event = envelope({
                        type: 'execution.upsert',
                        execution: mapExecution(executionId, fullRunData, workflowData),
                      });
                      void deps.emit(event);
                    },
                  ],
                }
              : {}),
          },
        }
      : {}),
  };
}
