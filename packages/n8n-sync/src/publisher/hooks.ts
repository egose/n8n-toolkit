import { mapCredential, mapExecution, mapWorkflow } from '../shared/mappers';
import { logError, type Logger } from '../shared/logger';
import { getEntityOrderingKey, type StateStoreStatus, type SyncEntityKind } from '../shared/ordering';
import { createEventOrderingAllocator, type EventOrderingAllocator } from './order-state';
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
      findOne(options: { where: { id: string } }): Promise<ICredentialsDb | null>;
    };
  };
};

const CREDENTIAL_LOOKUP_ATTEMPTS = 10;
const CREDENTIAL_LOOKUP_DELAY_MS = 250;
const SUPPORTED_CREDENTIAL_HOOK_N8N_VERSION = '2.31.2';

export interface PublisherDeps {
  /** Deliver a fully-built event to the subscriber. Must never throw. */
  emit: (event: SyncEvent) => Promise<void>;
  /** Logger used for the publisher's no-throw hook boundary. */
  log: Logger;
  /** Identifier of this publishing instance, stamped on every event. */
  sourceId: string;
  /** Monotonic event/revision allocator. Defaults to an in-memory allocator. */
  ordering?: EventOrderingAllocator;
  /** Durable publisher state readiness, surfaced when hook work is contained. */
  orderingStatus?: () => StateStoreStatus;
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
  const ordering = deps.ordering ?? createEventOrderingAllocator({ sourceId: deps.sourceId });
  type SyncEventPayload = Parameters<EventOrderingAllocator['allocate']>[0];
  const envelope = async <T extends SyncEventPayload>(
    event: T,
  ): Promise<T & Pick<SyncEvent, 'at' | 'sourceId' | 'eventId' | 'entityRevision'>> => {
    const ordered = await ordering.allocate(event);
    return {
      ...event,
      at: timestamp(),
      sourceId: deps.sourceId,
      eventId: ordered.eventId,
      entityRevision: ordered.entityRevision,
    } as T & Pick<SyncEvent, 'at' | 'sourceId' | 'eventId' | 'entityRevision'>;
  };

  const reportHookError = (error: unknown, hook: string, detached = false): void => {
    const status = deps.orderingStatus?.();
    logError(deps.log, error, {
      context: 'publisher hook',
      hook,
      detached,
      ...(status && status.ready === false ? { publisherStateReady: false, publisherStateReason: status.reason } : {}),
    });
  };

  const preparationChains = new Map<string, Promise<void>>();

  const enqueueEntityWork = (options: {
    hook: string;
    kind: SyncEntityKind;
    id: string;
    work: () => Promise<void>;
    detached?: boolean;
  }): Promise<void> => {
    const key = getEntityOrderingKey({ kind: options.kind, id: options.id });
    const previous = preparationChains.get(key) ?? Promise.resolve();
    const run = previous.then(options.work, options.work);
    const guarded = run.catch((error) => {
      reportHookError(error, options.hook, options.detached ?? false);
    });
    // Dropped preparation emits no event and consumes no revision, but it must
    // release later same-entity work in the original hook invocation order.
    const chain = guarded.finally(() => {
      if (preparationChains.get(key) === chain) {
        preparationChains.delete(key);
      }
    });
    preparationChains.set(key, chain);
    return guarded;
  };

  const withErrorBoundary = <Args extends unknown[]>(
    hook: string,
    handler: (this: PublisherHookThis, ...args: Args) => Promise<void> | void,
  ) => {
    return async function (this: PublisherHookThis, ...args: Args): Promise<void> {
      try {
        await handler.apply(this, args);
      } catch (error) {
        reportHookError(error, hook);
      }
    };
  };

  const runDetached = (hook: string, work: () => Promise<void>): void => {
    void Promise.resolve()
      .then(work)
      .catch((error) => {
        reportHookError(error, hook, true);
      });
  };

  const workflowIdFromInput = (workflowOrId: IWorkflowBase | string): string | undefined =>
    typeof workflowOrId === 'string' ? workflowOrId : workflowOrId.id;

  const entities = {
    workflows: deps.entities?.workflows ?? true,
    credentials: deps.entities?.credentials ?? true,
    executions: deps.entities?.executions ?? false,
  };

  if (entities.executions && !entities.workflows) {
    throw new Error('Execution sync requires workflow sync to also be enabled');
  }

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
      // Fall back to the in-memory hook payload when the DB lookup fails. In
      // filtered mode this leaves tags unresolved, and the caller will skip
      // emitting rather than risk an unintended delete.
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

  type WorkflowSyncDecision = 'emit' | 'delete' | 'skip';

  /**
   * Decide whether a workflow should be emitted, deleted, or skipped. When
   * the tag filter is enabled but tags are unresolved, the publisher skips
   * the event rather than treating an unknown tag state as a delete.
   */
  function shouldSyncWorkflow(workflow: { tags?: IWorkflowTag[] }): WorkflowSyncDecision {
    if (!filterByTag) return 'emit';
    if (workflow.tags === undefined) return 'skip';
    return workflowHasTag(workflow.tags, syncWorkflowTag) ? 'emit' : 'delete';
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

  type CredentialDropReason =
    | 'missing_stable_id'
    | 'plaintext_object_payload'
    | 'repository_unavailable'
    | 'not_visible_before_timeout';

  type CredentialResolution = { credential: ICredentialsDb } | { dropReason: CredentialDropReason };

  async function resolveCredential(
    this: PublisherHookThis,
    credential: Partial<ICredentialsDb>,
  ): Promise<CredentialResolution> {
    const hasCompletePayload = typeof credential.id === 'string' && typeof credential.data === 'string';

    if (hasCompletePayload) {
      return { credential: credential as ICredentialsDb };
    }

    if (typeof credential.id !== 'string') {
      return { dropReason: 'missing_stable_id' };
    }

    if (credential.data !== undefined) {
      return { dropReason: 'plaintext_object_payload' };
    }

    const repository = this.dbCollections?.Credentials;
    if (!repository) {
      return { dropReason: 'repository_unavailable' };
    }

    // On n8n 2.31.2, the credential hook can expose the stable row id before
    // the stored row becomes queryable. Retry by that id only; never guess by
    // mutable fields like name/type because duplicates can publish the wrong row.
    for (let attempt = 0; attempt < CREDENTIAL_LOOKUP_ATTEMPTS; attempt += 1) {
      if (attempt > 0) {
        await new Promise((resolve) => setTimeout(resolve, CREDENTIAL_LOOKUP_DELAY_MS));
      }

      const byId = await repository.findOne({ where: { id: credential.id } });
      if (byId) {
        if (typeof byId.data !== 'string') {
          return { dropReason: 'plaintext_object_payload' };
        }
        return { credential: byId };
      }
    }

    return { dropReason: 'not_visible_before_timeout' };
  }

  function logCredentialDrop(hook: string, reason: CredentialDropReason, credential: Partial<ICredentialsDb>): void {
    deps.log.warn('Dropping credential sync event', {
      context: 'publisher hook',
      hook,
      reason,
      ...(typeof credential.id === 'string' ? { credentialId: credential.id } : {}),
      supportedN8nVersion: SUPPORTED_CREDENTIAL_HOOK_N8N_VERSION,
    });
  }

  function logWorkflowDrop(
    hook: string,
    reason: 'missing_workflow_id' | 'workflow_not_found',
    workflowId?: string,
  ): void {
    deps.log.warn('Dropping workflow sync event', {
      context: 'publisher hook',
      hook,
      reason,
      ...(typeof workflowId === 'string' && workflowId ? { workflowId } : {}),
    });
  }

  function logWorkflowSkip(hook: string, reason: 'tag_unresolved', workflowId?: string): void {
    deps.log.debug('Skipping workflow sync event', {
      context: 'publisher hook',
      hook,
      reason,
      ...(typeof workflowId === 'string' && workflowId ? { workflowId } : {}),
    });
  }

  async function emitCredentialUpsert(
    this: PublisherHookThis,
    hook: string,
    credential: Partial<ICredentialsDb>,
  ): Promise<void> {
    const resolved = await resolveCredential.call(this, credential);
    if (!('credential' in resolved)) {
      logCredentialDrop(hook, resolved.dropReason, credential);
      return;
    }
    await deps.emit(await envelope({ type: 'credentials.upsert', credential: mapCredential(resolved.credential) }));
  }

  /**
   * Resolve + publish a workflow upsert. Used by `afterCreate` and
   * `afterUpdate`. When the tag filter is enabled and the workflow loses the
   * sync tag, the publisher emits a `workflow.delete` instead so the
   * subscriber drops it (eventually-consistent — a delete for an unknown ID
   * is a documented no-op on the subscriber side).
   */
  const emitWorkflowUpsert = async (hook: string, workflow: IWorkflowBase & { tags?: IWorkflowTag[] }) => {
    const decision = shouldSyncWorkflow(workflow);
    if (decision === 'skip') {
      logWorkflowSkip(hook, 'tag_unresolved', workflow.id);
      return;
    }
    if (decision === 'delete') {
      await deps.emit(await envelope({ type: 'workflow.delete', workflowId: workflow.id }));
      return;
    }
    await deps.emit(await envelope({ type: 'workflow.upsert', workflow: mapWorkflowDto(workflow) }));
  };

  /**
   * `workflow.activate` hook path. When the tag filter is enabled and the
   * workflow lacks the sync tag, fall back to a delete so the subscriber
   * can't keep a stale active copy around.
   */
  const emitWorkflowActivate = async (hook: string, workflow: IWorkflowBase & { tags?: IWorkflowTag[] }) => {
    const decision = shouldSyncWorkflow(workflow);
    if (decision === 'skip') {
      logWorkflowSkip(hook, 'tag_unresolved', workflow.id);
      return;
    }
    if (decision === 'delete') {
      await deps.emit(await envelope({ type: 'workflow.delete', workflowId: workflow.id }));
      return;
    }
    await deps.emit(await envelope({ type: 'workflow.activate', workflow: mapWorkflowDto(workflow) }));
  };

  return {
    ...(entities.credentials
      ? {
          credentials: {
            create: [
              withErrorBoundary(
                'credentials.create',
                async function (this: PublisherHookThis, encryptedData: Partial<ICredentialsDb>) {
                  if (typeof encryptedData.id !== 'string') {
                    await emitCredentialUpsert.call(this, 'credentials.create', encryptedData);
                    return;
                  }
                  if (typeof encryptedData.id === 'string' && encryptedData.data !== undefined) {
                    await enqueueEntityWork({
                      hook: 'credentials.create',
                      kind: 'credential',
                      id: encryptedData.id,
                      work: () => emitCredentialUpsert.call(this, 'credentials.create', encryptedData),
                    });
                    return;
                  }
                  runDetached('credentials.create', () =>
                    enqueueEntityWork({
                      hook: 'credentials.create',
                      kind: 'credential',
                      id: encryptedData.id as string,
                      work: () => emitCredentialUpsert.call(this, 'credentials.create', encryptedData),
                      detached: true,
                    }),
                  );
                },
              ),
            ],
            update: [
              withErrorBoundary(
                'credentials.update',
                async function (this: PublisherHookThis, newCredentialData: Partial<ICredentialsDb>) {
                  if (typeof newCredentialData.id !== 'string') {
                    await emitCredentialUpsert.call(this, 'credentials.update', newCredentialData);
                    return;
                  }
                  await enqueueEntityWork({
                    hook: 'credentials.update',
                    kind: 'credential',
                    id: newCredentialData.id,
                    work: () => emitCredentialUpsert.call(this, 'credentials.update', newCredentialData),
                  });
                },
              ),
            ],
            delete: [
              withErrorBoundary('credentials.delete', async function (credentialId: string) {
                await enqueueEntityWork({
                  hook: 'credentials.delete',
                  kind: 'credential',
                  id: credentialId,
                  work: async () => {
                    await deps.emit(await envelope({ type: 'credentials.delete', credentialId }));
                  },
                });
              }),
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
                    withErrorBoundary(
                      'workflow.afterCreate',
                      async function (this: PublisherHookThis, createdWorkflow: IWorkflowBase | string) {
                        const id = workflowIdFromInput(createdWorkflow);
                        if (!id) {
                          logWorkflowDrop('workflow.afterCreate', 'missing_workflow_id');
                          return;
                        }
                        await enqueueEntityWork({
                          hook: 'workflow.afterCreate',
                          kind: 'workflow',
                          id,
                          work: async () => {
                            const workflow = await resolveWorkflow.call(this, createdWorkflow);
                            if (!workflow) {
                              logWorkflowDrop('workflow.afterCreate', 'workflow_not_found', id);
                              return;
                            }
                            await emitWorkflowUpsert('workflow.afterCreate', workflow);
                          },
                        });
                      },
                    ),
                  ],
                  afterUpdate: [
                    withErrorBoundary(
                      'workflow.afterUpdate',
                      async function (this: PublisherHookThis, updatedWorkflow: IWorkflowBase | string) {
                        const id = workflowIdFromInput(updatedWorkflow);
                        if (!id) {
                          logWorkflowDrop('workflow.afterUpdate', 'missing_workflow_id');
                          return;
                        }
                        await enqueueEntityWork({
                          hook: 'workflow.afterUpdate',
                          kind: 'workflow',
                          id,
                          work: async () => {
                            const workflow = await resolveWorkflow.call(this, updatedWorkflow);
                            if (!workflow) {
                              logWorkflowDrop('workflow.afterUpdate', 'workflow_not_found', id);
                              return;
                            }
                            await emitWorkflowUpsert('workflow.afterUpdate', workflow);
                          },
                        });
                      },
                    ),
                  ],
                  activate: [
                    withErrorBoundary(
                      'workflow.activate',
                      async function (this: PublisherHookThis, updatedWorkflow: IWorkflowBase | string) {
                        const id = workflowIdFromInput(updatedWorkflow);
                        if (!id) {
                          logWorkflowDrop('workflow.activate', 'missing_workflow_id');
                          return;
                        }
                        await enqueueEntityWork({
                          hook: 'workflow.activate',
                          kind: 'workflow',
                          id,
                          work: async () => {
                            const workflow = await resolveWorkflow.call(this, updatedWorkflow);
                            if (!workflow) {
                              logWorkflowDrop('workflow.activate', 'workflow_not_found', id);
                              return;
                            }
                            await emitWorkflowActivate('workflow.activate', workflow);
                          },
                        });
                      },
                    ),
                  ],
                  afterDelete: [
                    withErrorBoundary('workflow.afterDelete', async function (workflowId: string) {
                      await enqueueEntityWork({
                        hook: 'workflow.afterDelete',
                        kind: 'workflow',
                        id: workflowId,
                        work: async () => {
                          await deps.emit(await envelope({ type: 'workflow.delete', workflowId }));
                        },
                      });
                    }),
                  ],
                  afterArchive: [
                    withErrorBoundary('workflow.afterArchive', async function (workflowId: string) {
                      await enqueueEntityWork({
                        hook: 'workflow.afterArchive',
                        kind: 'workflow',
                        id: workflowId,
                        work: async () => {
                          await deps.emit(await envelope({ type: 'workflow.archive', workflowId, archived: true }));
                        },
                      });
                    }),
                  ],
                  afterUnarchive: [
                    withErrorBoundary('workflow.afterUnarchive', async function (workflowId: string) {
                      await enqueueEntityWork({
                        hook: 'workflow.afterUnarchive',
                        kind: 'workflow',
                        id: workflowId,
                        work: async () => {
                          await deps.emit(await envelope({ type: 'workflow.archive', workflowId, archived: false }));
                        },
                      });
                    }),
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
                    withErrorBoundary(
                      'workflow.postExecute',
                      async function (
                        this: PublisherHookThis,
                        fullRunData: IRunPayload | undefined,
                        workflowData: WorkflowSnapshot | IWorkflowBase | undefined,
                        executionId: string,
                      ) {
                        if (typeof executionId !== 'string' || !executionId) {
                          deps.log.debug('Dropping execution sync event', {
                            context: 'publisher hook',
                            hook: 'workflow.postExecute',
                            reason: 'missing_execution_id',
                          });
                          return;
                        }

                        runDetached('workflow.postExecute', async () => {
                          await enqueueEntityWork({
                            hook: 'workflow.postExecute',
                            kind: 'execution',
                            id: executionId,
                            detached: true,
                            work: async () => {
                              if (!workflowData?.id) {
                                deps.log.warn('Dropping execution sync event', {
                                  context: 'publisher hook',
                                  hook: 'workflow.postExecute',
                                  reason: 'missing_workflow_id',
                                  executionId,
                                });
                                return;
                              }
                              const workflowId = workflowData.id;

                              if (filterByTag) {
                                // Use the in-memory workflow payload if it already has
                                // tags; otherwise resolve the workflow with its tags
                                // relation from the DB.
                                let tags: IWorkflowTag[] | undefined = (workflowData as { tags?: IWorkflowTag[] }).tags;
                                if (tags === undefined) {
                                  const resolved = await resolveWorkflow.call(this, workflowId);
                                  tags = resolved?.tags;
                                }
                                if (!workflowHasTag(tags, syncWorkflowTag)) {
                                  deps.log.debug('Skipping execution sync event', {
                                    context: 'publisher hook',
                                    hook: 'workflow.postExecute',
                                    reason: 'tag_filtered_out',
                                    executionId,
                                    workflowId,
                                  });
                                  return;
                                }
                              }

                              const execution = mapExecution(executionId, fullRunData, workflowData);
                              if (!execution.startedAt && !execution.stoppedAt && !execution.createdAt) {
                                deps.log.warn('Dropping execution sync event', {
                                  context: 'publisher hook',
                                  hook: 'workflow.postExecute',
                                  reason: 'missing_lifecycle_timestamp',
                                  executionId,
                                  workflowId: execution.workflowId,
                                });
                                return;
                              }

                              const event = await envelope({
                                type: 'execution.upsert',
                                execution,
                              });
                              await deps.emit(event);
                            },
                          });
                        });
                      },
                    ),
                  ],
                }
              : {}),
          },
        }
      : {}),
  };
}
