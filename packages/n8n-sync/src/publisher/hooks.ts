import { mapCredential, mapWorkflow } from '../shared/mappers';
import type { ICredentialsDb, IExternalHooksFileData, IWorkflowBase, SyncEvent } from '../shared/types';

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

  const emitWorkflowUpsert = async (workflow: IWorkflowBase) => {
    await deps.emit(envelope({ type: 'workflow.upsert', workflow: mapWorkflow(workflow) }));
  };

  return {
    credentials: {
      create: [
        async function (encryptedData: ICredentialsDb) {
          await deps.emit(envelope({ type: 'credentials.upsert', credential: mapCredential(encryptedData) }));
        },
      ],
      update: [
        async function (newCredentialData: ICredentialsDb) {
          await deps.emit(envelope({ type: 'credentials.upsert', credential: mapCredential(newCredentialData) }));
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
        async function (createdWorkflow: IWorkflowBase) {
          await emitWorkflowUpsert(createdWorkflow);
        },
      ],
      afterUpdate: [
        async function (updatedWorkflow: IWorkflowBase) {
          await emitWorkflowUpsert(updatedWorkflow);
        },
      ],
      activate: [
        async function (updatedWorkflow: IWorkflowBase) {
          await deps.emit(envelope({ type: 'workflow.activate', workflow: mapWorkflow(updatedWorkflow) }));
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
