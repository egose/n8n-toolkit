import type { ICredentialsDb, IWorkflowBase, SyncCredentialDto, SyncWorkflowDto } from './types';

function toIsoString(value: unknown): string | undefined {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') return value;
  return undefined;
}

/** Map an n8n `IWorkflowBase` hook payload to its JSON-serializable DTO. */
export function mapWorkflow(workflow: IWorkflowBase): SyncWorkflowDto {
  const createdAt = toIsoString(workflow.createdAt);
  const updatedAt = toIsoString(workflow.updatedAt);

  return {
    id: workflow.id,
    name: workflow.name,
    ...(workflow.description !== undefined ? { description: workflow.description } : {}),
    active: workflow.active ?? false,
    isArchived: workflow.isArchived ?? false,
    nodes: workflow.nodes ?? [],
    connections: workflow.connections ?? {},
    ...(workflow.settings !== undefined ? { settings: workflow.settings } : {}),
    ...(workflow.staticData !== undefined ? { staticData: workflow.staticData } : {}),
    ...(workflow.pinData !== undefined ? { pinData: workflow.pinData } : {}),
    ...(workflow.meta !== undefined ? { meta: workflow.meta } : {}),
    ...(workflow.versionId !== undefined ? { versionId: workflow.versionId } : {}),
    ...(workflow.activeVersionId !== undefined ? { activeVersionId: workflow.activeVersionId } : {}),
    ...(createdAt ? { createdAt } : {}),
    ...(updatedAt ? { updatedAt } : {}),
  };
}

/** Map an n8n `ICredentialsDb` hook payload to its JSON-serializable DTO. */
export function mapCredential(credential: ICredentialsDb): SyncCredentialDto {
  const createdAt = toIsoString(credential.createdAt);
  const updatedAt = toIsoString(credential.updatedAt);

  return {
    id: credential.id,
    name: credential.name,
    type: credential.type,
    data: credential.data,
    ...(credential.isGlobal !== undefined ? { isGlobal: credential.isGlobal } : {}),
    ...(credential.isManaged !== undefined ? { isManaged: credential.isManaged } : {}),
    ...(createdAt ? { createdAt } : {}),
    ...(updatedAt ? { updatedAt } : {}),
  };
}
