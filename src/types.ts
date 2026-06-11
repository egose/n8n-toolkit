export type { PaginationParams, PaginatedResponse } from './pagination.js';

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
  connections: Record<string, unknown>;
  settings?: WorkflowSettings;
  staticData?: unknown;
  pinData?: Record<string, unknown>;
  meta?: Record<string, unknown>;
  tags?: Tag[];
  shared?: SharedWorkflow[];
  activeVersion?: ActiveVersion | null;
}

export interface ActiveVersion {
  versionId: string;
  workflowId: string;
  nodes: WorkflowNode[];
  connections: Record<string, unknown>;
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
  connections: Record<string, unknown>;
  settings: WorkflowSettings;
  staticData?: unknown;
  pinData?: Record<string, unknown>;
  projectId?: string;
}

export interface WorkflowUpdate {
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  connections: Record<string, unknown>;
  settings: WorkflowSettings;
  staticData?: unknown;
  pinData?: Record<string, unknown>;
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
  customTelemetryTags?: Array<{ key: string; value: string }>;
}

export interface WorkflowNode {
  id?: string;
  name: string;
  type: string;
  typeVersion?: number;
  position: number[];
  parameters?: Record<string, unknown>;
  credentials?: Record<string, unknown>;
  disabled?: boolean;
  notesInFlow?: boolean;
  notes?: string;
  webhookId?: string;
  executeOnce?: boolean;
  alwaysOutputData?: boolean;
  retryOnFail?: boolean;
  maxTries?: number;
  waitBetweenTries?: number;
  onError?: string;
  customTelemetryTags?: { tag?: Array<{ key: string; value: string }> };
  createdAt?: string;
  updatedAt?: string;
}

export interface SharedWorkflow {
  role: string;
  workflowId: string;
  projectId: string;
  project?: { id: string; name: string; type: string };
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowVersion {
  versionId: string;
  workflowId: string;
  nodes: WorkflowNode[];
  connections: Record<string, unknown>;
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
  data?: Record<string, unknown>;
  finished: boolean;
  mode: ExecutionMode;
  retryOf?: number;
  retrySuccessId?: number;
  startedAt: string;
  stoppedAt?: string;
  workflowId: number;
  waitTill?: string;
  customData?: Record<string, unknown>;
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

// ─── Credential ──────────────────────────────────────────────────────────────

export interface Credential {
  id: string;
  name: string;
  type: string;
  data?: Record<string, unknown>;
  isResolvable?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CredentialCreate {
  name: string;
  type: string;
  data: Record<string, unknown>;
  projectId?: string;
}

export interface CredentialUpdate {
  name?: string;
  type?: string;
  data?: Record<string, unknown>;
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
  [key: string]: unknown;
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

export interface InsertRowsRequest {
  data: Record<string, unknown>[];
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
    value: unknown;
  }>;
}

export interface UpdateRowsRequest {
  filter: DataTableFilter;
  data: Record<string, unknown>;
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
  data: Record<string, unknown>;
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

// ─── Community Package ───────────────────────────────────────────────────────

export interface CommunityPackage {
  packageName: string;
  installedVersion: string;
  authorName: string;
  authorEmail: string;
  installedNodes: Array<{ name: string; type: string; latestVersion: number }>;
  createdAt: string;
  updatedAt: string;
  updateAvailable?: string;
  failedLoading?: boolean;
}

export interface InstallCommunityPackageRequest {
  name: string;
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
  location?: Array<Record<string, unknown>>;
}

export interface AuditRiskReport {
  risk: string;
  sections: AuditRiskSection[];
}

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
  parentFolderId?: string;
  folderPath?: string[];
  owner?: { type: 'personal' | 'team'; projectId: string; projectName: string };
  publishingError?: string;
}

// ─── Discover ────────────────────────────────────────────────────────────────

export interface DiscoverEndpoint {
  method: string;
  path: string;
  operationId: string;
  requestSchema?: unknown;
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
