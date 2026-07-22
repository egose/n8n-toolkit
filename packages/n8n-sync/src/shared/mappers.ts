import type {
  ICredentialsDb,
  IRunPayload,
  IWorkflowBase,
  SyncCredentialDto,
  SyncExecutionDto,
  SyncWorkflowDto,
  WorkflowSnapshot,
} from './types';

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

/**
 * Map an n8n `workflow.postExecute` hook payload to the sync execution DTO.
 *
 * The publisher is called with `[fullRunData: IRun | undefined, workflowData:
 * IWorkflowBase, executionId: string]`. The optional snapshot is carried as
 * a best-effort reference; the applier only uses scalar columns when upserting
 * the execution row on the target.
 */
export function mapExecution(
  executionId: string,
  fullRunData: IRunPayload | undefined,
  workflowData: WorkflowSnapshot | IWorkflowBase | undefined,
): SyncExecutionDto {
  const status = fullRunData?.status ?? 'unknown';
  const mode = fullRunData?.mode ?? 'unknown';
  const startedAt = toIsoString(fullRunData?.startedAt);
  const stoppedAt = toIsoString(fullRunData?.stoppedAt);
  const createdAt = startedAt;

  const dto: SyncExecutionDto = {
    id: executionId,
    workflowId: (workflowData as { id?: string } | undefined)?.id ?? null,
    status,
    mode,
    finished: fullRunData?.finished ?? isFinishedStatus(status),
  };

  if (dto.workflowId === null) delete dto.workflowId;
  if (startedAt) dto.startedAt = startedAt;
  if (stoppedAt) dto.stoppedAt = stoppedAt;
  if (createdAt) dto.createdAt = createdAt;

  if (workflowData && typeof workflowData === 'object') {
    const { id: _id, name, nodes, connections } = workflowData as Partial<IWorkflowBase>;
    if (name !== undefined || Array.isArray(nodes) || connections !== undefined) {
      dto.workflowSnapshot = {
        id: (_id as string | undefined) ?? '',
        name: name ?? '',
        nodes: nodes ?? [],
        connections: connections ?? {},
      };
    }
  }

  return dto;
}

/**
 * Map n8n's `ExecutionStatus` to the deprecated `finished` boolean column so
 * the target's legacy indexes keep working. Mirrors n8n's "terminal success"
 * semantics: `success` is finished; terminal failures (`error`/`crashed`/
 * `canceled`) and any in-flight state are not.
 */
function isFinishedStatus(status: string): boolean {
  return status === 'success';
}
