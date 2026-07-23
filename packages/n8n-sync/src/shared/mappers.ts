import type {
  ICredentialsDb,
  IRunPayload,
  IWorkflowBase,
  IWorkflowTag,
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
export function mapWorkflow(
  workflow: IWorkflowBase,
  options: {
    /**
     * Tags attached to the workflow on the source. When omitted, the DTO
     * carries no `tags` field. When `[]` is passed, an empty array is sent
     * (explicit "no tags" — used when filter is enabled and the workflow's
     * tags were resolved).
     */
    tags?: IWorkflowTag[];
    /**
     * When `true`, the top-level `active` field is replaced with
     * `rewriteActiveTo` and the source's real `active` value is preserved
     * under `meta.active_real`. Used by the publisher when
     * `SYNC_FILTER_BY_TAG` is enabled and the `active` tag is/isn't present.
     */
    rewriteActive?: boolean;
    /** Value to write into the top-level `active` field when `rewriteActive` is true. */
    rewriteActiveTo?: boolean;
  } = {},
): SyncWorkflowDto {
  const createdAt = toIsoString(workflow.createdAt);
  const updatedAt = toIsoString(workflow.updatedAt);

  let meta: Record<string, unknown> | undefined =
    workflow.meta !== undefined ? (workflow.meta as Record<string, unknown>) : undefined;
  let active = workflow.active ?? false;

  if (options.rewriteActive) {
    const rewritten = options.rewriteActiveTo ?? false;
    // Always preserve the source's real active value under meta.active_real
    // so the subscriber (or operator) can inspect it. Ensure meta exists even
    // when the source had no meta.
    if (meta === undefined) meta = {};
    meta['active_real'] = active;
    active = rewritten;
  }

  return {
    id: workflow.id,
    name: workflow.name,
    ...(workflow.description !== undefined ? { description: workflow.description } : {}),
    active,
    isArchived: workflow.isArchived ?? false,
    nodes: workflow.nodes ?? [],
    connections: workflow.connections ?? {},
    ...(workflow.settings !== undefined ? { settings: workflow.settings } : {}),
    ...(workflow.staticData !== undefined ? { staticData: workflow.staticData } : {}),
    ...(workflow.pinData !== undefined ? { pinData: workflow.pinData } : {}),
    ...(meta !== undefined ? { meta } : {}),
    ...(workflow.versionId !== undefined ? { versionId: workflow.versionId } : {}),
    ...(workflow.activeVersionId !== undefined ? { activeVersionId: workflow.activeVersionId } : {}),
    ...(options.tags !== undefined ? { tags: options.tags } : {}),
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
