import type {
  Audit,
  CredentialDetail,
  CredentialSchema,
  CredentialSchemaProperty,
  CredentialSharedItem,
  CredentialSummary,
  DataTable,
  DataTableColumn,
  DataTableRow,
  DataTableRowListResponse,
  DiscoverEndpoint,
  DiscoverFilter,
  DiscoverResponse,
  DiscoverResource,
  Folder,
  FolderDetail,
  FolderHomeProject,
  FolderListResponse,
  InsightsMetric,
  InsightsSummary,
  Project,
  ProjectMember,
  ProjectMemberListResponse,
  ProjectSummary,
  SharedWorkflow,
  Tag,
  TestCaseExecutionListResponse,
  TestRunListResponse,
  User,
  UserCreateResponse,
  UserCreateResult,
  UserInvite,
  Variable,
  Workflow,
  WorkflowListResponse,
  ExecutionListResponse,
  CredentialListResponse,
  TagListResponse,
  UserListResponse,
  VariableListResponse,
  ProjectListResponse,
  DataTableListResponse,
} from './types.js';

type PaginatedInput<T> = {
  data?: T[] | null;
  nextCursor?: string | null;
};

function normalizePaginatedResponse<TInput, TOutput>(
  response: PaginatedInput<TInput> | null | undefined,
  normalizeItem: (item: TInput) => TOutput,
): { data: TOutput[]; nextCursor: string | null } {
  return {
    data: (response?.data ?? []).map(normalizeItem),
    nextCursor: response?.nextCursor ?? null,
  };
}

export function normalizeTag(tag: Partial<Tag> | null | undefined): Tag {
  const value = tag ?? {};

  return {
    ...value,
    createdAt: value.createdAt ?? null,
    updatedAt: value.updatedAt ?? null,
  } as Tag;
}

export function normalizeWorkflow(workflow: Partial<Workflow> | null | undefined): Workflow {
  const value = workflow ?? {};

  return {
    ...value,
    description: value.description ?? null,
    settings: value.settings ?? {},
    staticData: value.staticData ?? null,
    pinData: value.pinData ?? null,
    meta: value.meta ?? null,
    nodeGroups: value.nodeGroups ?? [],
    activeVersionId: value.activeVersionId ?? null,
    versionCounter: value.versionCounter ?? null,
    sourceWorkflowId: value.sourceWorkflowId ?? null,
    tags: (value.tags ?? []).map(normalizeTag),
    shared: (value.shared ?? []).map(normalizeSharedWorkflow),
    parentFolder: value.parentFolder ? normalizeFolder(value.parentFolder) : null,
    activeVersion: value.activeVersion ?? null,
  } as Workflow;
}

export function normalizeWorkflowListResponse(response: PaginatedInput<Workflow>): WorkflowListResponse {
  return normalizePaginatedResponse(response, normalizeWorkflow);
}

export function normalizeExecutionListResponse(
  response: PaginatedInput<import('./types.js').Execution>,
): ExecutionListResponse {
  return normalizePaginatedResponse(response, (execution) => execution);
}

export function normalizeTestRunListResponse(
  response: PaginatedInput<import('./types.js').TestRunSummary>,
): TestRunListResponse {
  return normalizePaginatedResponse(response, (testRun) => testRun);
}

export function normalizeTestCaseExecutionListResponse(
  response: PaginatedInput<import('./types.js').TestCaseExecution>,
): TestCaseExecutionListResponse {
  return normalizePaginatedResponse(response, (testCase) => testCase);
}

export function normalizeCredentialSharedItem(
  shared: Partial<CredentialSharedItem> | null | undefined,
): CredentialSharedItem {
  return {
    ...(shared ?? {}),
  } as CredentialSharedItem;
}

export function normalizeCredentialSummary(
  credential: Partial<CredentialSummary> | null | undefined,
): CredentialSummary {
  const value = credential ?? {};

  return {
    ...value,
    shared: (value.shared ?? []).map(normalizeCredentialSharedItem),
  } as CredentialSummary;
}

export function normalizeCredentialDetail(credential: Partial<CredentialDetail> | null | undefined): CredentialDetail {
  const value = credential ?? {};

  return {
    ...value,
    resolvableAllowFallback: value.resolvableAllowFallback ?? false,
    resolverId: value.resolverId ?? null,
  } as CredentialDetail;
}

export function normalizeCredentialListResponse(response: PaginatedInput<CredentialSummary>): CredentialListResponse {
  return normalizePaginatedResponse(response, normalizeCredentialSummary);
}

export function normalizeCredentialSchema(schema: Partial<CredentialSchema> | null | undefined): CredentialSchema {
  const value = schema ?? {};

  return {
    additionalProperties: value.additionalProperties ?? false,
    type: value.type ?? 'object',
    properties: Object.fromEntries(
      Object.entries(value.properties ?? {}).map(([key, property]) => [
        key,
        normalizeCredentialSchemaProperty(property),
      ]),
    ),
    required: value.required ?? [],
  };
}

function normalizeCredentialSchemaProperty(
  property: Partial<CredentialSchemaProperty> | null | undefined,
): CredentialSchemaProperty {
  const value = property ?? {};

  return {
    type: value.type ?? 'string',
    ...(value.enum ? { enum: value.enum } : {}),
  };
}

export function normalizeTagListResponse(response: PaginatedInput<Tag>): TagListResponse {
  return normalizePaginatedResponse(response, normalizeTag);
}

export function normalizeUser(user: Partial<User> | null | undefined): User {
  const value = user ?? {};

  return {
    ...value,
    firstName: value.firstName ?? null,
    lastName: value.lastName ?? null,
    role: value.role ?? null,
    mfaEnabled: value.mfaEnabled ?? false,
  } as User;
}

function normalizeUserInvite(user: Partial<UserInvite> | null | undefined): UserInvite {
  const value = user ?? {};

  return {
    ...value,
    inviteAcceptUrl: value.inviteAcceptUrl ?? null,
    emailSent: value.emailSent ?? false,
    role: value.role ?? null,
  } as UserInvite;
}

function normalizeUserCreateResult(result: Partial<UserCreateResult> | null | undefined): UserCreateResult {
  const value = result ?? {};

  return {
    user: normalizeUserInvite(value.user),
    error: value.error ?? '',
  };
}

export function normalizeUserListResponse(response: PaginatedInput<User>): UserListResponse {
  return normalizePaginatedResponse(response, normalizeUser);
}

export function normalizeUserCreateResponse(
  response: Partial<UserCreateResult>[] | null | undefined,
): UserCreateResponse {
  return (response ?? []).map(normalizeUserCreateResult);
}

export function normalizeProjectSummary(project: Partial<ProjectSummary> | null | undefined): ProjectSummary {
  const value = project ?? {};

  return {
    ...value,
    icon: value.icon ?? null,
    description: value.description ?? null,
    customTelemetryTags: value.customTelemetryTags ?? [],
  } as ProjectSummary;
}

export function normalizeProject(project: Partial<Project> | null | undefined): Project {
  const value = project ?? {};

  return {
    ...normalizeProjectSummary(value),
    role: value.role ?? '',
    scopes: value.scopes ?? [],
  } as Project;
}

export function normalizeProjectMember(member: Partial<ProjectMember> | null | undefined): ProjectMember {
  const value = member ?? {};

  return {
    ...value,
    firstName: value.firstName ?? null,
    lastName: value.lastName ?? null,
  } as ProjectMember;
}

export function normalizeProjectListResponse(response: PaginatedInput<ProjectSummary>): ProjectListResponse {
  return normalizePaginatedResponse(response, normalizeProjectSummary);
}

export function normalizeProjectMemberListResponse(response: PaginatedInput<ProjectMember>): ProjectMemberListResponse {
  return normalizePaginatedResponse(response, normalizeProjectMember);
}

export function normalizeVariable(variable: Partial<Variable> | null | undefined): Variable {
  const value = variable ?? {};

  return {
    ...value,
    type: value.type ?? null,
    project: value.project ? normalizeProjectSummary(value.project) : null,
  } as Variable;
}

export function normalizeVariableListResponse(response: PaginatedInput<Variable>): VariableListResponse {
  return normalizePaginatedResponse(response, normalizeVariable);
}

function normalizeFolderHomeProject(project: Partial<FolderHomeProject> | null | undefined): FolderHomeProject {
  const value = project ?? {};

  return {
    ...value,
    icon: value.icon ?? null,
  } as FolderHomeProject;
}

export function normalizeFolder(folder: Partial<Folder> | null | undefined): Folder {
  const value = folder ?? {};

  return {
    ...value,
    parentFolderId: value.parentFolderId ?? null,
    parentFolder: value.parentFolder ? normalizeFolder(value.parentFolder) : null,
    homeProject: value.homeProject ? normalizeFolderHomeProject(value.homeProject) : null,
    tags: (value.tags ?? []).map(normalizeTag),
    workflowCount: value.workflowCount ?? null,
    subFolderCount: value.subFolderCount ?? null,
  } as Folder;
}

export function normalizeFolderDetail(folder: Partial<FolderDetail> | null | undefined): FolderDetail {
  const value = folder ?? {};

  return {
    ...normalizeFolder(value),
    totalSubFolders: value.totalSubFolders ?? 0,
    totalWorkflows: value.totalWorkflows ?? 0,
  } as FolderDetail;
}

export function normalizeFolderListResponse(
  response: Partial<FolderListResponse> | null | undefined,
): FolderListResponse {
  return {
    count: response?.count ?? 0,
    data: (response?.data ?? []).map(normalizeFolder),
  };
}

export function normalizeDataTableColumn(column: Partial<DataTableColumn> | null | undefined): DataTableColumn {
  const value = column ?? {};

  return {
    ...value,
    dataTableId: value.dataTableId ?? null,
    createdAt: value.createdAt ?? null,
    updatedAt: value.updatedAt ?? null,
  } as DataTableColumn;
}

export function normalizeDataTable(dataTable: Partial<DataTable> | null | undefined): DataTable {
  const value = dataTable ?? {};

  return {
    ...value,
    columns: (value.columns ?? []).map(normalizeDataTableColumn),
  } as DataTable;
}

export function normalizeDataTableRow(row: Partial<DataTableRow> | null | undefined): DataTableRow {
  const value = row ?? {};

  return {
    ...value,
    createdAt: value.createdAt ?? null,
    updatedAt: value.updatedAt ?? null,
  } as DataTableRow;
}

export function normalizeDataTableListResponse(response: PaginatedInput<DataTable>): DataTableListResponse {
  return normalizePaginatedResponse(response, normalizeDataTable);
}

export function normalizeDataTableRowListResponse(response: PaginatedInput<DataTableRow>): DataTableRowListResponse {
  return normalizePaginatedResponse(response, normalizeDataTableRow);
}

function normalizeSharedWorkflow(shared: Partial<SharedWorkflow> | null | undefined): SharedWorkflow {
  const value = shared ?? {};

  return {
    ...value,
    project: value.project ? normalizeProjectSummary(value.project) : null,
  } as SharedWorkflow;
}

function normalizeInsightsMetric(metric: Partial<InsightsMetric> | null | undefined): InsightsMetric {
  const value = metric ?? {};

  return {
    value: value.value ?? 0,
    deviation: value.deviation ?? null,
    unit: value.unit ?? 'count',
  };
}

export function normalizeInsightsSummary(summary: Partial<InsightsSummary> | null | undefined): InsightsSummary {
  const value = summary ?? {};

  return {
    total: normalizeInsightsMetric(value.total),
    failed: normalizeInsightsMetric(value.failed),
    failureRate: normalizeInsightsMetric(value.failureRate),
    timeSaved: normalizeInsightsMetric(value.timeSaved),
    averageRunTime: normalizeInsightsMetric(value.averageRunTime),
  };
}

function normalizeDiscoverEndpoint(endpoint: Partial<DiscoverEndpoint> | null | undefined): DiscoverEndpoint {
  return {
    ...(endpoint ?? {}),
  } as DiscoverEndpoint;
}

function normalizeDiscoverResource(resource: Partial<DiscoverResource> | null | undefined): DiscoverResource {
  const value = resource ?? {};

  return {
    operations: value.operations ?? [],
    endpoints: (value.endpoints ?? []).map(normalizeDiscoverEndpoint),
  };
}

function normalizeDiscoverFilter(filter: Partial<DiscoverFilter> | null | undefined): DiscoverFilter {
  const value = filter ?? {};

  return {
    description: value.description ?? '',
    values: value.values ?? [],
  };
}

export function normalizeDiscoverResponse(response: Partial<DiscoverResponse> | null | undefined): DiscoverResponse {
  const value = response ?? {};

  return {
    data: {
      scopes: value.data?.scopes ?? [],
      resources: Object.fromEntries(
        Object.entries(value.data?.resources ?? {}).map(([key, resource]) => [
          key,
          normalizeDiscoverResource(resource),
        ]),
      ),
      filters: Object.fromEntries(
        Object.entries(value.data?.filters ?? {}).map(([key, filter]) => [key, normalizeDiscoverFilter(filter)]),
      ),
      specUrl: value.data?.specUrl ?? '',
    },
  };
}

export function normalizeAudit(audit: Partial<Audit> | null | undefined): Audit {
  return {
    ...(audit ?? {}),
  };
}
