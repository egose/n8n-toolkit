import { mapCredential, mapWorkflow } from '../shared/mappers';
import type { ICredentialsDb, IExternalHooksFileData, IWorkflowBase, SyncEvent } from '../shared/types';

type PublisherHookThis = {
  dbCollections?: {
    Workflow?: {
      findOne(options: { where: { id: string } }): Promise<IWorkflowBase | null>;
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
}

/**
 * Build the n8n external-hook map for the publisher side.
 *
 * Wired hooks (lifecycle only — no execution hooks):
 *   credentials.create / credentials.update / credentials.delete
 *   workflow.afterCreate / workflow.afterUpdate / workflow.afterDelete
 *   workflow.activate / workflow.afterArchive / workflow.afterUnarchive
 *
 * Note: n8n fires no external hook on workflow deactivation, and
 * `workflow.activate` fires before the activation is committed.
 */
export function createPublisherHooks(deps: PublisherDeps): IExternalHooksFileData {
  const timestamp = (): string => (deps.now ? deps.now() : new Date()).toISOString();
  const envelope = <T extends Omit<SyncEvent, 'at' | 'sourceId'>>(event: T): T & Pick<SyncEvent, 'at' | 'sourceId'> =>
    ({ ...event, at: timestamp(), sourceId: deps.sourceId }) as T & Pick<SyncEvent, 'at' | 'sourceId'>;

  async function resolveWorkflow(
    this: PublisherHookThis,
    workflowOrId: IWorkflowBase | string,
  ): Promise<IWorkflowBase | undefined> {
    if (typeof workflowOrId !== 'string') return workflowOrId;
    const workflow = await this.dbCollections?.Workflow?.findOne({ where: { id: workflowOrId } });
    return workflow ?? undefined;
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

  const emitWorkflowUpsert = async (workflow: IWorkflowBase) => {
    await deps.emit(envelope({ type: 'workflow.upsert', workflow: mapWorkflow(workflow) }));
  };

  return {
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
    workflow: {
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
          await deps.emit(envelope({ type: 'workflow.activate', workflow: mapWorkflow(workflow) }));
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
    },
  };
}
