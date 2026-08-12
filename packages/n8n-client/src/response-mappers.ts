import type {
  ApiKeyScope,
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
  FolderCreateResult,
  FolderDetail,
  FolderHomeProject,
  FolderListItem,
  FolderListResponse,
  FolderUpdateResult,
  InsightsMetric,
  InsightsSummary,
  Project,
  ProjectCreateResult,
  ProjectEffectiveScope,
  ProjectMember,
  ProjectMemberListResponse,
  ProjectSummary,
  ProjectWithPermissions,
  SharedWorkflow,
  Tag,
  TestCaseExecutionListResponse,
  TestRunListResponse,
  TagMutationResult,
  User,
  UserCreateResponse,
  UserCreateResult,
  UserInvite,
  Variable,
  Workflow,
  WorkflowDetail,
  WorkflowListItem,
  WorkflowListResponse,
  WorkflowMutationResult,
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

function normalizeTagValue(tag: unknown, label: string): Tag {
  const value = requireObject(tag, label);
  const createdAt = readOptionalNullableString(value, 'createdAt', label);
  const updatedAt = readOptionalNullableString(value, 'updatedAt', label);

  return {
    id: requireString(value.id, `${label}.id`),
    name: requireString(value.name, `${label}.name`),
    ...(createdAt === undefined ? {} : { createdAt }),
    ...(updatedAt === undefined ? {} : { updatedAt }),
  };
}

export function normalizeTag(tag: unknown): Tag {
  return normalizeTagValue(tag, 'tag');
}

export function normalizeTagMutationResult(tag: unknown): TagMutationResult {
  const value = requireObject(tag, 'tag mutation result');

  return {
    id: requireString(value.id, 'tag mutation result.id'),
    name: requireString(value.name, 'tag mutation result.name'),
  };
}

type UnknownRecord = Record<string, unknown>;

function hasOwn(record: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(record, key);
}

function requireObject(value: unknown, label: string): UnknownRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }

  return value as UnknownRecord;
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== 'string') {
    throw new TypeError(`${label} must be a string`);
  }

  return value;
}

function requireBoolean(value: unknown, label: string): boolean {
  if (typeof value !== 'boolean') {
    throw new TypeError(`${label} must be a boolean`);
  }

  return value;
}

function requireNumber(value: unknown, label: string): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new TypeError(`${label} must be a number`);
  }

  return value;
}

function requireArray<T>(value: unknown, label: string, normalizeItem: (item: unknown, label: string) => T): T[] {
  if (!Array.isArray(value)) {
    throw new TypeError(`${label} must be an array`);
  }

  return value.map((item, index) => normalizeItem(item, `${label}[${index}]`));
}

function requireJsonObject(value: unknown, label: string): import('./types.js').JsonObject {
  return requireObject(value, label) as import('./types.js').JsonObject;
}

function readOptionalNullableString(record: UnknownRecord, key: string, label: string): string | null | undefined {
  if (!hasOwn(record, key)) {
    return undefined;
  }

  const value = record[key];
  if (value === null) {
    return null;
  }

  return requireString(value, `${label}.${key}`);
}

function readOptionalNullableNumber(record: UnknownRecord, key: string, label: string): number | null | undefined {
  if (!hasOwn(record, key)) {
    return undefined;
  }

  const value = record[key];
  if (value === null) {
    return null;
  }

  return requireNumber(value, `${label}.${key}`);
}

function readOptionalBoolean(record: UnknownRecord, key: string, label: string): boolean | undefined {
  if (!hasOwn(record, key)) {
    return undefined;
  }

  return requireBoolean(record[key], `${label}.${key}`);
}

function readOptionalString(record: UnknownRecord, key: string, label: string): string | undefined {
  if (!hasOwn(record, key)) {
    return undefined;
  }

  return requireString(record[key], `${label}.${key}`);
}

function readOptionalArray<T>(
  record: UnknownRecord,
  key: string,
  label: string,
  normalizeItem: (item: unknown, itemLabel: string) => T,
): T[] | undefined {
  if (!hasOwn(record, key)) {
    return undefined;
  }

  return requireArray(record[key], `${label}.${key}`, normalizeItem);
}

function normalizeWorkflowNode(node: unknown, label: string): import('./types.js').WorkflowNode {
  return requireObject(node, label) as unknown as import('./types.js').WorkflowNode;
}

function normalizeWorkflowCore(workflow: unknown, label: string): Workflow {
  const value = requireObject(workflow, label);
  const description = readOptionalNullableString(value, 'description', label);
  const versionCounter = readOptionalNullableNumber(value, 'versionCounter', label);
  const sourceWorkflowId = readOptionalNullableString(value, 'sourceWorkflowId', label);

  return {
    id: requireString(value.id, `${label}.id`),
    name: requireString(value.name, `${label}.name`),
    active: requireBoolean(value.active, `${label}.active`),
    createdAt: requireString(value.createdAt, `${label}.createdAt`),
    updatedAt: requireString(value.updatedAt, `${label}.updatedAt`),
    isArchived: requireBoolean(value.isArchived, `${label}.isArchived`),
    versionId: requireString(value.versionId, `${label}.versionId`),
    triggerCount: requireNumber(value.triggerCount, `${label}.triggerCount`),
    nodes: requireArray(value.nodes, `${label}.nodes`, normalizeWorkflowNode),
    connections: requireJsonObject(
      value.connections,
      `${label}.connections`,
    ) as unknown as import('./types.js').WorkflowConnections,
    settings: requireJsonObject(value.settings, `${label}.settings`) as import('./types.js').WorkflowSettings,
    staticData: normalizeWorkflowStaticData(value.staticData, `${label}.staticData`),
    pinData: normalizeWorkflowPinData(value.pinData, `${label}.pinData`),
    meta: normalizeWorkflowMeta(value.meta, `${label}.meta`),
    nodeGroups: requireArray(value.nodeGroups, `${label}.nodeGroups`, (group, groupLabel) =>
      requireJsonObject(group, groupLabel),
    ),
    activeVersionId: normalizeOptionalStringOrNull(value.activeVersionId, `${label}.activeVersionId`),
    ...(description === undefined ? {} : { description }),
    ...(versionCounter === undefined ? {} : { versionCounter }),
    ...(sourceWorkflowId === undefined ? {} : { sourceWorkflowId }),
    ...(hasOwn(value, 'tags') ? { tags: requireArray(value.tags, `${label}.tags`, normalizeTag) } : {}),
    ...(hasOwn(value, 'shared')
      ? { shared: requireArray(value.shared, `${label}.shared`, normalizeSharedWorkflow) }
      : {}),
    ...(hasOwn(value, 'parentFolder')
      ? {
          parentFolder: value.parentFolder === null ? null : normalizeFolder(value.parentFolder),
        }
      : {}),
    ...(hasOwn(value, 'activeVersion')
      ? {
          activeVersion:
            value.activeVersion === null
              ? null
              : (requireObject(
                  value.activeVersion,
                  `${label}.activeVersion`,
                ) as unknown as import('./types.js').ActiveVersion),
        }
      : {}),
  };
}

function normalizeOptionalStringOrNull(value: unknown, label: string): string | null {
  if (value === null) {
    return null;
  }

  return requireString(value, label);
}

function normalizeWorkflowStaticData(value: unknown, label: string): import('./types.js').JsonObject | string | null {
  if (value === null || typeof value === 'string') {
    return value as string | null;
  }

  return requireJsonObject(value, label);
}

function normalizeWorkflowPinData(value: unknown, label: string): import('./types.js').WorkflowPinData | null {
  if (value === null) {
    return null;
  }

  return requireJsonObject(value, label) as import('./types.js').WorkflowPinData;
}

function normalizeWorkflowMeta(value: unknown, label: string): import('./types.js').WorkflowMeta | null {
  if (value === null) {
    return null;
  }

  return requireObject(value, label) as import('./types.js').WorkflowMeta;
}

export function normalizeWorkflow(workflow: unknown): WorkflowDetail {
  const normalized = normalizeWorkflowCore(workflow, 'workflow');

  if (!hasOwn(normalized, 'description')) {
    throw new TypeError('workflow.description must be present on detailed workflow responses');
  }

  if (!hasOwn(normalized, 'versionCounter')) {
    throw new TypeError('workflow.versionCounter must be present on detailed workflow responses');
  }

  if (!hasOwn(normalized, 'sourceWorkflowId')) {
    throw new TypeError('workflow.sourceWorkflowId must be present on detailed workflow responses');
  }

  if (!hasOwn(normalized, 'tags')) {
    throw new TypeError('workflow.tags must be present on detailed workflow responses');
  }

  if (!hasOwn(normalized, 'shared')) {
    throw new TypeError('workflow.shared must be present on detailed workflow responses');
  }

  if (!hasOwn(normalized, 'activeVersion')) {
    throw new TypeError('workflow.activeVersion must be present on detailed workflow responses');
  }

  return normalized as WorkflowDetail;
}

export function normalizeWorkflowListItem(workflow: unknown): WorkflowListItem {
  return normalizeWorkflowCore(workflow, 'workflow list item');
}

export function normalizeWorkflowMutation(workflow: unknown): WorkflowMutationResult {
  const normalized = normalizeWorkflowCore(workflow, 'workflow mutation result');

  if (!hasOwn(normalized, 'description')) {
    throw new TypeError('workflow mutation result.description must be present');
  }

  if (!hasOwn(normalized, 'versionCounter')) {
    throw new TypeError('workflow mutation result.versionCounter must be present');
  }

  if (!hasOwn(normalized, 'sourceWorkflowId')) {
    throw new TypeError('workflow mutation result.sourceWorkflowId must be present');
  }

  return normalized as WorkflowMutationResult;
}

export function normalizeWorkflowListResponse(response: PaginatedInput<WorkflowListItem>): WorkflowListResponse {
  return normalizePaginatedResponse(response, normalizeWorkflowListItem);
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

function normalizeCredentialSharedItemValue(shared: unknown, label: string): CredentialSharedItem {
  const value = requireObject(shared, label);

  return {
    id: requireString(value.id, `${label}.id`),
    name: requireString(value.name, `${label}.name`),
    role: requireString(value.role, `${label}.role`),
    createdAt: requireString(value.createdAt, `${label}.createdAt`),
    updatedAt: requireString(value.updatedAt, `${label}.updatedAt`),
  };
}

export function normalizeCredentialSharedItem(shared: unknown): CredentialSharedItem {
  return normalizeCredentialSharedItemValue(shared, 'credential shared item');
}

function normalizeCredentialSummaryValue(credential: unknown, label: string): CredentialSummary {
  const value = requireObject(credential, label);
  const shared = readOptionalArray(value, 'shared', label, normalizeCredentialSharedItemValue);

  return {
    id: requireString(value.id, `${label}.id`),
    name: requireString(value.name, `${label}.name`),
    type: requireString(value.type, `${label}.type`),
    createdAt: requireString(value.createdAt, `${label}.createdAt`),
    updatedAt: requireString(value.updatedAt, `${label}.updatedAt`),
    ...(shared === undefined ? {} : { shared }),
  };
}

export function normalizeCredentialSummary(credential: unknown): CredentialSummary {
  return normalizeCredentialSummaryValue(credential, 'credential');
}

export function normalizeCredentialDetail(credential: unknown): CredentialDetail {
  const value = requireObject(credential, 'credential');
  const resolvableAllowFallback = readOptionalBoolean(value, 'resolvableAllowFallback', 'credential');
  const resolverId = readOptionalNullableString(value, 'resolverId', 'credential');

  return {
    id: requireString(value.id, 'credential.id'),
    name: requireString(value.name, 'credential.name'),
    type: requireString(value.type, 'credential.type'),
    isManaged: requireBoolean(value.isManaged, 'credential.isManaged'),
    isGlobal: requireBoolean(value.isGlobal, 'credential.isGlobal'),
    isResolvable: requireBoolean(value.isResolvable, 'credential.isResolvable'),
    createdAt: requireString(value.createdAt, 'credential.createdAt'),
    updatedAt: requireString(value.updatedAt, 'credential.updatedAt'),
    ...(resolvableAllowFallback === undefined ? {} : { resolvableAllowFallback }),
    ...(resolverId === undefined ? {} : { resolverId }),
  };
}

export function normalizeCredentialListResponse(response: PaginatedInput<CredentialSummary>): CredentialListResponse {
  return normalizePaginatedResponse(response, normalizeCredentialSummary);
}

export function normalizeCredentialSchema(schema: unknown): CredentialSchema {
  const value = requireObject(schema, 'credential schema');
  const properties = requireObject(value.properties, 'credential schema.properties');
  const required = requireArray(value.required, 'credential schema.required', (item, itemLabel) =>
    requireString(item, itemLabel),
  );

  return {
    additionalProperties: requireBoolean(value.additionalProperties, 'credential schema.additionalProperties'),
    type: requireString(value.type, 'credential schema.type'),
    properties: Object.fromEntries(
      Object.entries(properties).map(([key, property]) => [
        key,
        normalizeCredentialSchemaProperty(property, `credential schema.properties.${key}`),
      ]),
    ),
    required,
  };
}

function normalizeCredentialSchemaProperty(property: unknown, label: string): CredentialSchemaProperty {
  const value = requireObject(property, label);
  const enumValues = readOptionalArray(value, 'enum', label, (item, itemLabel) => requireString(item, itemLabel));

  return {
    type: requireString(value.type, `${label}.type`),
    ...(enumValues === undefined ? {} : { enum: enumValues }),
  };
}

export function normalizeTagListResponse(response: PaginatedInput<Tag>): TagListResponse {
  return normalizePaginatedResponse(response, normalizeTag);
}

export function normalizeUser(user: unknown): User {
  const value = requireObject(user, 'user');
  const firstName = readOptionalNullableString(value, 'firstName', 'user');
  const lastName = readOptionalNullableString(value, 'lastName', 'user');
  const role = readOptionalNullableString(value, 'role', 'user');
  const mfaEnabled = readOptionalBoolean(value, 'mfaEnabled', 'user');

  return {
    id: requireString(value.id, 'user.id'),
    email: requireString(value.email, 'user.email'),
    isPending: requireBoolean(value.isPending, 'user.isPending'),
    createdAt: requireString(value.createdAt, 'user.createdAt'),
    updatedAt: requireString(value.updatedAt, 'user.updatedAt'),
    ...(firstName === undefined ? {} : { firstName }),
    ...(lastName === undefined ? {} : { lastName }),
    ...(role === undefined ? {} : { role }),
    ...(mfaEnabled === undefined ? {} : { mfaEnabled }),
  };
}

function normalizeUserInvite(user: unknown): UserInvite {
  const value = requireObject(user, 'user invite');
  const inviteAcceptUrl = readOptionalNullableString(value, 'inviteAcceptUrl', 'user invite');
  const emailSent = readOptionalBoolean(value, 'emailSent', 'user invite');
  const role = readOptionalNullableString(value, 'role', 'user invite');

  return {
    id: requireString(value.id, 'user invite.id'),
    email: requireString(value.email, 'user invite.email'),
    ...(inviteAcceptUrl === undefined ? {} : { inviteAcceptUrl }),
    ...(emailSent === undefined ? {} : { emailSent }),
    ...(role === undefined ? {} : { role }),
  };
}

function normalizeUserCreateResult(result: unknown): UserCreateResult {
  const value = requireObject(result, 'user create result');
  const error = readOptionalString(value, 'error', 'user create result');

  return {
    user: normalizeUserInvite(value.user),
    ...(error === undefined ? {} : { error }),
  };
}

export function normalizeUserListResponse(response: PaginatedInput<User>): UserListResponse {
  return normalizePaginatedResponse(response, normalizeUser);
}

export function normalizeUserCreateResponse(response: unknown[] | null | undefined): UserCreateResponse {
  return (response ?? []).map(normalizeUserCreateResult);
}

function normalizeProjectIcon(icon: unknown, label: string): import('./types.js').ProjectIcon {
  const value = requireObject(icon, label);
  const color = readOptionalString(value, 'color', label);

  return {
    type: requireString(value.type, `${label}.type`) as import('./types.js').ProjectIcon['type'],
    value: requireString(value.value, `${label}.value`),
    ...(color === undefined ? {} : { color }),
  };
}

function normalizeProjectCustomTelemetryTag(
  tag: unknown,
  label: string,
): import('./types.js').ProjectCustomTelemetryTag {
  const value = requireObject(tag, label);

  return {
    key: requireString(value.key, `${label}.key`),
    value: requireString(value.value, `${label}.value`),
  };
}

function normalizeProjectSummaryValue(project: unknown, label: string): ProjectSummary {
  const value = requireObject(project, label);
  const icon = hasOwn(value, 'icon')
    ? value.icon === null
      ? null
      : normalizeProjectIcon(value.icon, `${label}.icon`)
    : undefined;
  const description = readOptionalNullableString(value, 'description', label);
  const customTelemetryTags = readOptionalArray(
    value,
    'customTelemetryTags',
    label,
    normalizeProjectCustomTelemetryTag,
  );

  return {
    id: requireString(value.id, `${label}.id`),
    name: requireString(value.name, `${label}.name`),
    type: requireString(value.type, `${label}.type`) as ProjectSummary['type'],
    creatorId: requireString(value.creatorId, `${label}.creatorId`),
    createdAt: requireString(value.createdAt, `${label}.createdAt`),
    updatedAt: requireString(value.updatedAt, `${label}.updatedAt`),
    ...(icon === undefined ? {} : { icon }),
    ...(description === undefined ? {} : { description }),
    ...(customTelemetryTags === undefined ? {} : { customTelemetryTags }),
  };
}

export function normalizeProjectSummary(project: unknown): ProjectSummary {
  return normalizeProjectSummaryValue(project, 'project');
}

export function normalizeProject(project: unknown): Project {
  const value = requireObject(project, 'project');
  const role = readOptionalString(value, 'role', 'project');
  const scopes = readOptionalArray(value, 'scopes', 'project', (item, itemLabel) => requireString(item, itemLabel)) as
    | ProjectEffectiveScope[]
    | undefined;

  return {
    ...normalizeProjectSummaryValue(value, 'project'),
    ...(role === undefined ? {} : { role }),
    ...(scopes === undefined ? {} : { scopes }),
  };
}

export function normalizeProjectCreateResult(project: unknown): ProjectCreateResult {
  return normalizeProject(project) as ProjectCreateResult;
}

export function normalizeProjectWithPermissions(project: unknown): ProjectWithPermissions {
  const normalized = normalizeProject(project);

  if (!hasOwn(normalized, 'role') || normalized.role === undefined) {
    throw new TypeError('project.role must be present on permission-bearing project responses');
  }

  if (!hasOwn(normalized, 'scopes') || normalized.scopes === undefined) {
    throw new TypeError('project.scopes must be present on permission-bearing project responses');
  }

  return normalized as ProjectWithPermissions;
}

export function normalizeProjectMember(member: unknown): ProjectMember {
  const value = requireObject(member, 'project member');
  const firstName = readOptionalNullableString(value, 'firstName', 'project member');
  const lastName = readOptionalNullableString(value, 'lastName', 'project member');

  return {
    id: requireString(value.id, 'project member.id'),
    email: requireString(value.email, 'project member.email'),
    createdAt: requireString(value.createdAt, 'project member.createdAt'),
    updatedAt: requireString(value.updatedAt, 'project member.updatedAt'),
    role: requireString(value.role, 'project member.role'),
    ...(firstName === undefined ? {} : { firstName }),
    ...(lastName === undefined ? {} : { lastName }),
  };
}

export function normalizeProjectListResponse(response: PaginatedInput<ProjectSummary>): ProjectListResponse {
  return normalizePaginatedResponse(response, normalizeProjectSummary);
}

export function normalizeProjectMemberListResponse(response: PaginatedInput<ProjectMember>): ProjectMemberListResponse {
  return normalizePaginatedResponse(response, normalizeProjectMember);
}

export function normalizeVariable(variable: unknown): Variable {
  const value = requireObject(variable, 'variable');
  const type = readOptionalNullableString(value, 'type', 'variable');
  const project = hasOwn(value, 'project')
    ? value.project === null
      ? null
      : normalizeProjectSummaryValue(value.project, 'variable.project')
    : undefined;

  return {
    id: requireString(value.id, 'variable.id'),
    key: requireString(value.key, 'variable.key'),
    value: requireString(value.value, 'variable.value'),
    ...(type === undefined ? {} : { type }),
    ...(project === undefined ? {} : { project }),
  };
}

export function normalizeVariableListResponse(response: PaginatedInput<Variable>): VariableListResponse {
  return normalizePaginatedResponse(response, normalizeVariable);
}

function normalizeFolderHomeProject(project: unknown, label: string): FolderHomeProject {
  const value = requireObject(project, label);
  const icon = hasOwn(value, 'icon')
    ? value.icon === null
      ? null
      : normalizeProjectIcon(value.icon, `${label}.icon`)
    : undefined;

  return {
    id: requireString(value.id, `${label}.id`),
    name: requireString(value.name, `${label}.name`),
    type: requireString(value.type, `${label}.type`) as FolderHomeProject['type'],
    ...(icon === undefined ? {} : { icon }),
  };
}

function normalizeFolderValue(folder: unknown, label: string): Folder {
  const value = requireObject(folder, label);
  const parentFolderId = readOptionalNullableString(value, 'parentFolderId', label);
  const workflowCount = readOptionalNullableNumber(value, 'workflowCount', label);
  const subFolderCount = readOptionalNullableNumber(value, 'subFolderCount', label);
  const tags = readOptionalArray(value, 'tags', label, normalizeTagValue);
  const parentFolder = hasOwn(value, 'parentFolder')
    ? value.parentFolder === null
      ? null
      : normalizeFolderValue(value.parentFolder, `${label}.parentFolder`)
    : undefined;
  const homeProject = hasOwn(value, 'homeProject')
    ? value.homeProject === null
      ? null
      : normalizeFolderHomeProject(value.homeProject, `${label}.homeProject`)
    : undefined;

  return {
    id: requireString(value.id, `${label}.id`),
    name: requireString(value.name, `${label}.name`),
    createdAt: requireString(value.createdAt, `${label}.createdAt`),
    updatedAt: requireString(value.updatedAt, `${label}.updatedAt`),
    ...(parentFolderId === undefined ? {} : { parentFolderId }),
    ...(parentFolder === undefined ? {} : { parentFolder }),
    ...(homeProject === undefined ? {} : { homeProject }),
    ...(tags === undefined ? {} : { tags }),
    ...(workflowCount === undefined ? {} : { workflowCount }),
    ...(subFolderCount === undefined ? {} : { subFolderCount }),
  };
}

export function normalizeFolder(folder: unknown): Folder {
  return normalizeFolderValue(folder, 'folder');
}

export function normalizeFolderCreateResult(folder: unknown): FolderCreateResult {
  const value = requireObject(folder, 'folder create result');
  const parentFolder = hasOwn(value, 'parentFolder')
    ? value.parentFolder === null
      ? null
      : normalizeFolderValue(value.parentFolder, 'folder create result.parentFolder')
    : undefined;

  return {
    id: requireString(value.id, 'folder create result.id'),
    name: requireString(value.name, 'folder create result.name'),
    createdAt: requireString(value.createdAt, 'folder create result.createdAt'),
    updatedAt: requireString(value.updatedAt, 'folder create result.updatedAt'),
    ...(hasOwn(value, 'parentFolderId')
      ? { parentFolderId: readOptionalNullableString(value, 'parentFolderId', 'folder create result') }
      : {}),
    ...(parentFolder === undefined ? {} : { parentFolder }),
  };
}

export function normalizeFolderListItem(folder: unknown): FolderListItem {
  return normalizeFolderValue(folder, 'folder list item');
}

export function normalizeFolderUpdateResult(folder: unknown): FolderUpdateResult {
  const value = requireObject(folder, 'folder update result');

  return {
    id: requireString(value.id, 'folder update result.id'),
    name: requireString(value.name, 'folder update result.name'),
    createdAt: requireString(value.createdAt, 'folder update result.createdAt'),
    updatedAt: requireString(value.updatedAt, 'folder update result.updatedAt'),
    ...(hasOwn(value, 'parentFolderId')
      ? { parentFolderId: readOptionalNullableString(value, 'parentFolderId', 'folder update result') }
      : {}),
  };
}

export function normalizeFolderDetail(folder: unknown): FolderDetail {
  const value = requireObject(folder, 'folder');

  return {
    ...normalizeFolderValue(value, 'folder'),
    totalSubFolders: requireNumber(value.totalSubFolders, 'folder.totalSubFolders'),
    totalWorkflows: requireNumber(value.totalWorkflows, 'folder.totalWorkflows'),
  };
}

export function normalizeFolderListResponse(response: unknown): FolderListResponse {
  const value = requireObject(response, 'folder list response');

  return {
    count: requireNumber(value.count, 'folder list response.count'),
    data: requireArray(value.data, 'folder list response.data', normalizeFolderListItem),
  };
}

function normalizeDataTableColumnValue(column: unknown, label: string, dataTableId?: string): DataTableColumn {
  const value = requireObject(column, label);
  const normalizedDataTableId = hasOwn(value, 'dataTableId')
    ? readOptionalNullableString(value, 'dataTableId', label)
    : dataTableId;
  const createdAt = readOptionalNullableString(value, 'createdAt', label);
  const updatedAt = readOptionalNullableString(value, 'updatedAt', label);

  return {
    id: requireString(value.id, `${label}.id`),
    name: requireString(value.name, `${label}.name`),
    type: requireString(value.type, `${label}.type`) as DataTableColumn['type'],
    index: requireNumber(value.index, `${label}.index`),
    ...(normalizedDataTableId === undefined ? {} : { dataTableId: normalizedDataTableId }),
    ...(createdAt === undefined ? {} : { createdAt }),
    ...(updatedAt === undefined ? {} : { updatedAt }),
  };
}

export function normalizeDataTableColumn(column: unknown): DataTableColumn {
  return normalizeDataTableColumnValue(column, 'data table column');
}

export function normalizeDataTable(dataTable: unknown): DataTable {
  const value = requireObject(dataTable, 'data table');
  const dataTableId = requireString(value.id, 'data table.id');

  return {
    id: dataTableId,
    name: requireString(value.name, 'data table.name'),
    columns: requireArray(value.columns, 'data table.columns', (column, label) =>
      normalizeDataTableColumnValue(column, label, dataTableId),
    ),
    projectId: requireString(value.projectId, 'data table.projectId'),
    createdAt: requireString(value.createdAt, 'data table.createdAt'),
    updatedAt: requireString(value.updatedAt, 'data table.updatedAt'),
  };
}

export function normalizeDataTableRow(row: unknown): DataTableRow {
  const value = requireObject(row, 'data table row');
  const createdAt = readOptionalNullableString(value, 'createdAt', 'data table row');
  const updatedAt = readOptionalNullableString(value, 'updatedAt', 'data table row');

  return {
    ...value,
    id: requireNumber(value.id, 'data table row.id'),
    ...(createdAt === undefined ? {} : { createdAt }),
    ...(updatedAt === undefined ? {} : { updatedAt }),
  } as DataTableRow;
}

export function normalizeDataTableListResponse(response: PaginatedInput<DataTable>): DataTableListResponse {
  return normalizePaginatedResponse(response, normalizeDataTable);
}

export function normalizeDataTableRowListResponse(response: PaginatedInput<DataTableRow>): DataTableRowListResponse {
  return normalizePaginatedResponse(response, normalizeDataTableRow);
}

function normalizeSharedWorkflow(shared: unknown, label: string): SharedWorkflow {
  const value = requireObject(shared, label);

  return {
    role: requireString(value.role, `${label}.role`),
    workflowId: requireString(value.workflowId, `${label}.workflowId`),
    projectId: requireString(value.projectId, `${label}.projectId`),
    createdAt: requireString(value.createdAt, `${label}.createdAt`),
    updatedAt: requireString(value.updatedAt, `${label}.updatedAt`),
    ...(hasOwn(value, 'project')
      ? {
          project: value.project === null ? null : normalizeProjectSummary(value.project),
        }
      : {}),
  };
}

function normalizeInsightsMetric(metric: unknown, label: string): InsightsMetric {
  const value = requireObject(metric, label);
  const deviation = readOptionalNullableNumber(value, 'deviation', label);

  return {
    value: requireNumber(value.value, `${label}.value`),
    deviation: deviation ?? null,
    unit: requireString(value.unit, `${label}.unit`),
  };
}

export function normalizeInsightsSummary(summary: unknown): InsightsSummary {
  const value = requireObject(summary, 'insights summary');

  return {
    total: normalizeInsightsMetric(value.total, 'insights summary.total'),
    failed: normalizeInsightsMetric(value.failed, 'insights summary.failed'),
    failureRate: normalizeInsightsMetric(value.failureRate, 'insights summary.failureRate'),
    timeSaved: normalizeInsightsMetric(value.timeSaved, 'insights summary.timeSaved'),
    averageRunTime: normalizeInsightsMetric(value.averageRunTime, 'insights summary.averageRunTime'),
  };
}

function normalizeDiscoverEndpoint(endpoint: unknown, label: string): DiscoverEndpoint {
  const value = requireObject(endpoint, label);

  return {
    method: requireString(value.method, `${label}.method`),
    path: requireString(value.path, `${label}.path`),
    operationId: requireString(value.operationId, `${label}.operationId`),
    ...(hasOwn(value, 'requestSchema')
      ? { requestSchema: requireJsonObject(value.requestSchema, `${label}.requestSchema`) }
      : {}),
  };
}

function normalizeDiscoverResource(resource: unknown, label: string): DiscoverResource {
  const value = requireObject(resource, label);

  return {
    operations: requireArray(value.operations, `${label}.operations`, (item, itemLabel) =>
      requireString(item, itemLabel),
    ),
    endpoints: requireArray(value.endpoints, `${label}.endpoints`, normalizeDiscoverEndpoint),
  };
}

function normalizeDiscoverFilter(filter: unknown, label: string): DiscoverFilter {
  const value = requireObject(filter, label);

  return {
    description: requireString(value.description, `${label}.description`),
    values: requireArray(value.values, `${label}.values`, (item, itemLabel) => requireString(item, itemLabel)),
  };
}

export function normalizeDiscoverResponse(response: unknown): DiscoverResponse {
  const value = requireObject(response, 'discover response');
  const data = requireObject(value.data, 'discover response.data');
  const resources = requireObject(data.resources, 'discover response.data.resources');
  const filters = requireObject(data.filters, 'discover response.data.filters');

  return {
    data: {
      apiKeyScopes: requireArray(data.scopes, 'discover response.data.scopes', (item, itemLabel) =>
        requireString(item, itemLabel),
      ) as ApiKeyScope[],
      resources: Object.fromEntries(
        Object.entries(resources).map(([key, resource]) => [
          key,
          normalizeDiscoverResource(resource, `discover response.data.resources.${key}`),
        ]),
      ),
      filters: Object.fromEntries(
        Object.entries(filters).map(([key, filter]) => [
          key,
          normalizeDiscoverFilter(filter, `discover response.data.filters.${key}`),
        ]),
      ),
      specUrl: requireString(data.specUrl, 'discover response.data.specUrl'),
    },
  };
}

function normalizeAuditRiskReport(report: unknown, label: string): import('./types.js').AuditRiskReport {
  const value = requireObject(report, label);

  return {
    risk: requireString(value.risk, `${label}.risk`) as import('./types.js').AuditRisk,
    sections: requireArray(
      value.sections,
      `${label}.sections`,
      (item, itemLabel) => requireObject(item, itemLabel) as unknown as import('./types.js').AuditRiskSection,
    ),
  };
}

export function normalizeAudit(audit: unknown): Audit {
  const value = requireObject(audit, 'audit');

  return {
    ...(hasOwn(value, 'Credentials Risk Report')
      ? {
          'Credentials Risk Report': normalizeAuditRiskReport(
            value['Credentials Risk Report'],
            'audit.Credentials Risk Report',
          ),
        }
      : {}),
    ...(hasOwn(value, 'Database Risk Report')
      ? {
          'Database Risk Report': normalizeAuditRiskReport(value['Database Risk Report'], 'audit.Database Risk Report'),
        }
      : {}),
    ...(hasOwn(value, 'Filesystem Risk Report')
      ? {
          'Filesystem Risk Report': normalizeAuditRiskReport(
            value['Filesystem Risk Report'],
            'audit.Filesystem Risk Report',
          ),
        }
      : {}),
    ...(hasOwn(value, 'Nodes Risk Report')
      ? { 'Nodes Risk Report': normalizeAuditRiskReport(value['Nodes Risk Report'], 'audit.Nodes Risk Report') }
      : {}),
    ...(hasOwn(value, 'Instance Risk Report')
      ? {
          'Instance Risk Report': normalizeAuditRiskReport(value['Instance Risk Report'], 'audit.Instance Risk Report'),
        }
      : {}),
  };
}
