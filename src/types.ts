import type { PaginationParams } from './pagination.js';

export type { PaginationParams, PaginatedResponse } from './pagination.js';

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;
export interface JsonObject {
  [key: string]: JsonValue;
}
export interface JsonArray extends Array<JsonValue> {}

export type N8nClientConfig = {
  baseUrl: string;
} & (
  | {
      apiKey: string;
      bearerToken?: never;
    }
  | {
      bearerToken: string;
      apiKey?: never;
    }
);

export interface N8nApiError extends Error {
  status: number;
  data: unknown;
}

// ─── Workflow ────────────────────────────────────────────────────────────────

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  isArchived: boolean;
  versionId: string;
  triggerCount: number;
  nodes: WorkflowNode[];
  connections: WorkflowConnections;
  settings?: WorkflowSettings;
  staticData?: string | JsonObject | null;
  pinData?: WorkflowPinData | null;
  meta?: WorkflowMeta | null;
  tags?: Tag[];
  shared?: SharedWorkflow[];
  activeVersion?: ActiveVersion | null;
}

export interface ActiveVersion {
  versionId: string;
  workflowId: string;
  nodes: WorkflowNode[];
  connections: WorkflowConnections;
  authors: string;
  name?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowCreate {
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  connections: WorkflowConnections;
  settings: WorkflowSettings;
  staticData?: string | JsonObject | null;
  pinData?: WorkflowPinData | null;
  projectId?: string;
}

export interface WorkflowUpdate {
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  connections: WorkflowConnections;
  settings: WorkflowSettings;
  staticData?: string | JsonObject | null;
  pinData?: WorkflowPinData | null;
}

export interface WorkflowSettings {
  saveExecutionProgress?: boolean;
  saveManualExecutions?: boolean;
  saveDataErrorExecution?: 'all' | 'none';
  saveDataSuccessExecution?: 'all' | 'none';
  executionTimeout?: number;
  errorWorkflow?: string;
  timezone?: string;
  executionOrder?: string;
  callerPolicy?: 'any' | 'none' | 'workflowsFromAList' | 'workflowsFromSameOwner';
  callerIds?: string;
  timeSavedPerExecution?: number;
  redactionPolicy?: 'none' | 'non-manual' | 'manual-only' | 'all';
  availableInMCP?: boolean;
  customTelemetryTags?: WorkflowTelemetryTag[];
}

export interface WorkflowNode {
  id?: string;
  name: string;
  type: string;
  typeVersion?: number;
  position: number[];
  parameters?: JsonObject;
  credentials?: JsonObject;
  disabled?: boolean;
  notesInFlow?: boolean;
  notes?: string;
  webhookId?: string;
  executeOnce?: boolean;
  alwaysOutputData?: boolean;
  retryOnFail?: boolean;
  maxTries?: number;
  waitBetweenTries?: number;
  continueOnFail?: boolean;
  onError?: string;
  customTelemetryTags?: WorkflowNodeTelemetryTags;
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkflowConnection {
  node: string;
  type: string;
  index: number;
}

export type WorkflowConnectionBranch = WorkflowConnection[];

export interface WorkflowConnectionTypeMap {
  [connectionType: string]: WorkflowConnectionBranch[];
}

export interface WorkflowConnections {
  [sourceNode: string]: WorkflowConnectionTypeMap;
}

export interface WorkflowTelemetryTag {
  key: string;
  value: string;
}

export interface WorkflowNodeTelemetryTags {
  tag?: WorkflowTelemetryTag[];
}

export interface WorkflowPinData {
  [nodeName: string]: JsonValue;
}

export interface WorkflowMeta {
  onboardingId?: string;
  templateId?: string;
  instanceId?: string;
  templateCredsSetupCompleted?: boolean;
}

export interface SharedWorkflow {
  role: string;
  workflowId: string;
  projectId: string;
  project?: SharedWorkflowProject;
  createdAt: string;
  updatedAt: string;
}

export interface SharedWorkflowProject {
  id: string;
  name: string;
  type: string;
}

export interface WorkflowVersion {
  versionId: string;
  workflowId: string;
  nodes: WorkflowNode[];
  connections: WorkflowConnections;
  authors: string;
  name?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowListResponse {
  data: Workflow[];
  nextCursor?: string;
}

export interface WorkflowListParams extends PaginationParams {
  active?: boolean;
  tags?: string;
  name?: string;
  projectId?: string;
  excludePinnedData?: boolean;
}

export interface WorkflowGetParams {
  excludePinnedData?: boolean;
}

export interface WorkflowActivateRequest {
  versionId?: string;
  name?: string;
  description?: string;
}

// ─── Execution ───────────────────────────────────────────────────────────────

export type ExecutionStatus = 'canceled' | 'crashed' | 'error' | 'new' | 'running' | 'success' | 'unknown' | 'waiting';
export type ExecutionMode =
  | 'cli'
  | 'error'
  | 'integrated'
  | 'internal'
  | 'manual'
  | 'retry'
  | 'trigger'
  | 'webhook'
  | 'evaluation'
  | 'chat';

export interface Execution {
  id: number;
  data?: JsonObject;
  finished: boolean;
  mode: ExecutionMode;
  retryOf?: number;
  retrySuccessId?: number;
  startedAt: string;
  stoppedAt?: string;
  workflowId: number;
  waitTill?: string;
  customData?: JsonObject;
  status: ExecutionStatus;
}

export interface ExecutionListResponse {
  data: Execution[];
  nextCursor?: string;
}

export interface StopManyExecutionsRequest {
  status: Array<'queued' | 'running' | 'waiting'>;
  workflowId?: string;
  startedAfter?: string;
  startedBefore?: string;
}

export interface StopManyExecutionsResponse {
  stopped: number;
}

export interface ExecutionListParams extends PaginationParams {
  includeData?: boolean;
  redactExecutionData?: boolean;
  status?: ExecutionStatus;
  workflowId?: string;
  projectId?: string;
}

export interface ExecutionGetParams {
  includeData?: boolean;
  redactExecutionData?: boolean;
}

export interface ExecutionRetryRequest {
  loadWorkflow?: boolean;
}

// ─── Credential ──────────────────────────────────────────────────────────────

export interface Credential {
  id: string;
  name: string;
  type: string;
  data?: JsonObject;
  isResolvable?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CredentialCreate {
  name: string;
  type: string;
  data: JsonObject;
  projectId?: string;
}

export interface CredentialUpdate {
  name?: string;
  type?: string;
  data?: JsonObject;
  isGlobal?: boolean;
  isResolvable?: boolean;
  isPartialData?: boolean;
}

export interface CredentialResponse {
  id: string;
  name: string;
  type: string;
  isManaged: boolean;
  isGlobal: boolean;
  isResolvable: boolean;
  resolvableAllowFallback?: boolean;
  resolverId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CredentialListItem extends CredentialResponse {
  shared: CredentialSharedItem[];
}

export interface CredentialSharedItem {
  id: string;
  name: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface CredentialTestResponse {
  status: 'OK' | 'Error';
  message: string;
}

export interface CredentialListResponse {
  data: CredentialListItem[];
  nextCursor?: string;
}

// ─── Tag ─────────────────────────────────────────────────────────────────────

export interface Tag {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface TagId {
  id: string;
}

export interface TagListResponse {
  data: Tag[];
  nextCursor?: string;
}

export interface TagMutation {
  name: string;
}

// ─── User ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isPending: boolean;
  createdAt: string;
  updatedAt: string;
  role?: string;
  mfaEnabled?: boolean;
}

export interface UserCreate {
  email: string;
  role?: string;
}

export interface UserCreateResponse {
  user: { id: string; email: string; inviteAcceptUrl?: string; emailSent?: boolean };
  error?: string;
}

export interface UserListResponse {
  data: User[];
  nextCursor?: string;
}

export interface UserListParams extends PaginationParams {
  offset?: number;
  includeRole?: boolean;
  projectId?: string;
}

export interface UserGetParams {
  includeRole?: boolean;
}

export interface UserRoleChangeRequest {
  newRoleName: string;
}

// ─── Variable ────────────────────────────────────────────────────────────────

export interface Variable {
  id: string;
  key: string;
  value: string;
  type?: string;
  project?: Project;
}

export interface VariableCreate {
  key: string;
  value: string;
  projectId?: string;
}

export interface VariableListResponse {
  data: Variable[];
  nextCursor?: string;
}

export interface VariableListParams extends PaginationParams {
  projectId?: string;
  state?: 'empty';
}

// ─── Project ─────────────────────────────────────────────────────────────────

export interface Project {
  id: string;
  name: string;
  type?: string;
}

export interface ProjectMember {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  createdAt: string;
  updatedAt: string;
  role: string;
}

export interface ProjectListResponse {
  data: Project[];
  nextCursor?: string;
}

export interface ProjectMemberListResponse {
  data: ProjectMember[];
  nextCursor?: string;
}

export interface ProjectMutation {
  name: string;
}

export interface ProjectMemberRelation {
  userId: string;
  role: string;
}

export interface ProjectMemberRoleChangeRequest {
  role: string;
}

// ─── DataTable ───────────────────────────────────────────────────────────────

export interface DataTable {
  id: string;
  name: string;
  columns: DataTableColumn[];
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

export interface DataTableColumn {
  id: string;
  name: string;
  dataTableId: string;
  type: 'string' | 'number' | 'boolean' | 'date';
  index: number;
}

export interface DataTableRow {
  id: number;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: JsonValue | undefined;
}

export interface CreateDataTableRequest {
  name: string;
  columns: Array<{ name: string; type: 'string' | 'number' | 'boolean' | 'date' | 'json' }>;
  projectId?: string;
}

export interface UpdateDataTableRequest {
  name: string;
}

export interface CreateColumnRequest {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date';
  index?: number;
}

export interface UpdateColumnRequest {
  name?: string;
  index?: number;
}

export interface DataTableListParams extends PaginationParams {
  filter?: string;
  sortBy?: string;
}

export interface DataTableRowListParams extends PaginationParams {
  filter?: string;
  sortBy?: string;
  search?: string;
}

export interface InsertRowsRequest {
  data: JsonObject[];
  returnType?: 'count' | 'id' | 'all';
}

export interface InsertRowsCountRequest extends InsertRowsRequest {
  returnType?: 'count';
}

export interface InsertRowsIdsRequest extends InsertRowsRequest {
  returnType: 'id';
}

export interface InsertRowsAllRequest extends InsertRowsRequest {
  returnType: 'all';
}

export interface DataTableFilter {
  type?: 'and' | 'or';
  filters: Array<{
    columnName: string;
    condition: 'eq' | 'neq' | 'like' | 'ilike' | 'gt' | 'gte' | 'lt' | 'lte';
    value: JsonValue;
  }>;
}

export interface UpdateRowsRequest {
  filter: DataTableFilter;
  data: JsonObject;
  returnData?: boolean;
  dryRun?: boolean;
}

export interface UpdateRowsBooleanRequest extends UpdateRowsRequest {
  returnData?: false;
}

export interface UpdateRowsDataRequest extends UpdateRowsRequest {
  returnData: true;
}

export interface UpsertRowRequest {
  filter: DataTableFilter;
  data: JsonObject;
  returnData?: boolean;
  dryRun?: boolean;
}

export interface UpsertRowBooleanRequest extends UpsertRowRequest {
  returnData?: false;
}

export interface UpsertRowDataRequest extends UpsertRowRequest {
  returnData: true;
}

export interface DeleteRowsParams {
  filter: string;
  returnData?: boolean;
  dryRun?: boolean;
  [key: string]: unknown;
}

export interface DeleteRowsBooleanParams extends DeleteRowsParams {
  returnData?: false;
}

export interface DeleteRowsDataParams extends DeleteRowsParams {
  returnData: true;
}

export interface DataTableListResponse {
  data: DataTable[];
  nextCursor?: string;
}

export interface DataTableRowListResponse {
  data: DataTableRow[];
  nextCursor?: string;
}

// ─── Folder ──────────────────────────────────────────────────────────────────

export interface Folder {
  id: string;
  name: string;
  parentFolderId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FolderCreate {
  name: string;
  parentFolderId?: string;
}

export interface FolderUpdate {
  name?: string;
  parentFolderId?: string;
}

export interface FolderListResponse {
  count: number;
  data: Folder[];
}

export interface FolderDetail extends Folder {
  totalSubFolders?: number;
  totalWorkflows?: number;
}

export interface FolderListParams extends PaginationParams {
  filter?: string;
  select?: string;
  sortBy?: 'name:asc' | 'name:desc' | 'createdAt:asc' | 'createdAt:desc' | 'updatedAt:asc' | 'updatedAt:desc';
  skip?: string;
  take?: string;
}

// ─── Community Package ───────────────────────────────────────────────────────

export interface CommunityPackage {
  packageName: string;
  installedVersion: string;
  authorName: string;
  authorEmail: string;
  installedNodes: CommunityPackageNode[];
  createdAt: string;
  updatedAt: string;
  updateAvailable?: string;
  failedLoading?: boolean;
}

export interface CommunityPackageNode {
  name: string;
  type: string;
  latestVersion: number;
}

export interface InstallCommunityPackageRequest {
  name: string;
  version?: string;
  verify?: boolean;
}

export interface UpdateCommunityPackageRequest {
  version?: string;
  verify?: boolean;
}

// ─── Audit ───────────────────────────────────────────────────────────────────

export interface AuditAdditionalOptions {
  daysAbandonedWorkflow?: number;
  categories?: Array<'credentials' | 'database' | 'nodes' | 'filesystem' | 'instance'>;
}

export interface AuditRequest {
  additionalOptions?: AuditAdditionalOptions;
}

export interface AuditRiskSection {
  title: string;
  description: string;
  recommendation: string;
  location?: AuditRiskLocation[];
}

export interface AuditRiskReport {
  risk: AuditRisk;
  sections: AuditRiskSection[];
}

export type AuditRisk = 'credentials' | 'database' | 'filesystem' | 'nodes' | 'execution';

export interface AuditCredentialLocation {
  kind: 'credential';
  id: string;
  name: string;
}

export interface AuditNodeLocation {
  kind: 'node';
  workflowId: string;
  workflowName: string;
  nodeId: string;
  nodeName: string;
  nodeType: string;
}

export interface AuditCommunityLocation {
  kind: 'community';
  nodeType: string;
  packageUrl: string;
}

export type AuditRiskLocation = AuditCredentialLocation | AuditNodeLocation | AuditCommunityLocation;

export interface Audit {
  'Credentials Risk Report'?: AuditRiskReport;
  'Database Risk Report'?: AuditRiskReport;
  'Filesystem Risk Report'?: AuditRiskReport;
  'Nodes Risk Report'?: AuditRiskReport;
  'Instance Risk Report'?: AuditRiskReport;
}

// ─── Insights ────────────────────────────────────────────────────────────────

export interface InsightsMetric {
  value: number;
  deviation: number | null;
  unit: string;
}

export interface InsightsSummary {
  total: InsightsMetric;
  failed: InsightsMetric;
  failureRate: InsightsMetric;
  timeSaved: InsightsMetric;
  averageRunTime: InsightsMetric;
}

export interface InsightsSummaryParams {
  startDate?: string;
  endDate?: string;
  projectId?: string;
}

// ─── Source Control ──────────────────────────────────────────────────────────

export interface PullRequest {
  force?: boolean;
  autoPublish?: 'none' | 'all' | 'published';
}

export interface SourceControlledFile {
  file: string;
  id: string;
  name: string;
  type: 'credential' | 'workflow' | 'tags' | 'variables' | 'file' | 'folders' | 'project' | 'datatable';
  status: 'new' | 'modified' | 'deleted' | 'created' | 'renamed' | 'conflicted' | 'ignored' | 'staged' | 'unknown';
  location: 'local' | 'remote';
  conflict: boolean;
  updatedAt: string;
  pushed?: boolean;
  isLocalPublished?: boolean;
  isRemoteArchived?: boolean;
  parentFolderId?: string | null;
  folderPath?: string[];
  owner?: SourceControlledOwner;
  publishingError?: string;
}

export interface SourceControlledOwner {
  type: 'personal' | 'team';
  projectId: string;
  projectName: string;
}

// ─── Discover ────────────────────────────────────────────────────────────────

export interface DiscoverEndpoint {
  method: string;
  path: string;
  operationId: string;
  requestSchema?: JsonObject;
}

export interface DiscoverResource {
  operations: string[];
  endpoints: DiscoverEndpoint[];
}

export interface DiscoverFilter {
  description: string;
  values: string[];
}

export interface DiscoverResponse {
  data: {
    scopes: string[];
    resources: Record<string, DiscoverResource>;
    filters: Record<string, DiscoverFilter>;
    specUrl: string;
  };
}

export interface DiscoverParams {
  include?: 'schemas';
  resource?: string;
  operation?: string;
}

// ─── N8n Package (Beta) ─────────────────────────────────────────────────────

export interface ExportWorkflowsRequest {
  workflowIds: string[];
}

export interface ImportPackageWorkflow {
  sourceWorkflowId: string;
  localId: string;
  name: string;
  projectId: string;
  parentFolderId: string | null;
  activeVersionId: string | null;
  status: 'created' | 'updated' | 'skipped';
}

export interface ImportPackageBindings {
  workflows: Record<string, string>;
  credentials: Record<string, string>;
}

export interface ImportPackageResponse {
  package: { sourceN8nVersion: string; sourceId: string; exportedAt: string };
  workflows: ImportPackageWorkflow[];
  bindings: ImportPackageBindings;
}

export interface ImportPackageOptions {
  projectId?: string;
  folderId?: string;
  credentialMatchingMode?: 'id-only';
  credentialMissingMode?: 'must-preexist';
  workflowConflictPolicy: 'new-version' | 'fail' | 'skip';
}

export interface ImportPackageConflictError {
  code: number;
  message: string;
  meta: {
    code: 'WORKFLOW_CONFLICT';
    conflicts: Array<{ sourceWorkflowId: string; existingWorkflowId: string; name: string }>;
  };
}

export interface ImportPackageUnprocessableError {
  message: string;
  failures: Array<{
    kind: 'not_found' | 'unknown_type';
    sourceId: string;
    usedByWorkflows: string[];
  }>;
}
