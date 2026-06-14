import type { PaginationParams } from './pagination.js';

export type { PaginationParams, PaginatedResponse } from './pagination.js';

/** JSON primitive value — string, number, boolean, or null. */
export type JsonPrimitive = string | number | boolean | null;
/** Any valid JSON value — primitives, objects, or arrays. */
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;
/** JSON object — arbitrary key-value map with JSON values. */
export interface JsonObject {
  [key: string]: JsonValue;
}
/** JSON array of arbitrary JSON values. */
export interface JsonArray extends Array<JsonValue> {}

/**
 * Constructor config for `N8nClient`. Exactly one auth method must be provided.
 *
 * @example
 * ```ts
 * const config: N8nClientConfig = {
 *   baseUrl: 'http://localhost:5678',
 *   apiKey: process.env.N8N_API_KEY,
 * };
 * ```
 */
export type N8nClientConfig = {
  /** Base URL of the n8n instance (e.g. `http://localhost:5678`). */
  baseUrl: string;
} & (
  | {
      /** n8n API key — sent as `X-N8N-API-KEY` header. Mutually exclusive with `bearerToken`. */
      apiKey: string;
      bearerToken?: never;
    }
  | {
      /** JWT bearer token — sent as `Authorization: Bearer` header. Mutually exclusive with `apiKey`. */
      bearerToken: string;
      apiKey?: never;
    }
);

/**
 * Error thrown by the client for non-2xx HTTP responses.
 *
 * @property status - HTTP status code
 * @property data - Raw error response body from the n8n API
 */
export interface N8nApiError extends Error {
  status: number;
  data: unknown;
}

// ─── Workflow ────────────────────────────────────────────────────────────────

/**
 * Full workflow object returned by the n8n API.
 *
 * This is a read-only representation. For creating or updating workflows,
 * use `WorkflowCreate` or `WorkflowUpdate`.
 */
export interface Workflow {
  /** Unique workflow identifier. */
  id: string;
  /** Display name of the workflow. */
  name: string;
  /** Optional description. */
  description?: string;
  /** Whether the workflow is currently active (has active triggers). */
  active: boolean;
  /** ISO 8601 timestamp of creation. */
  createdAt: string;
  /** ISO 8601 timestamp of last update. */
  updatedAt: string;
  /** Whether the workflow has been archived. */
  isArchived: boolean;
  /** Current version identifier — change on every save. */
  versionId: string;
  /** Number of active triggers in the workflow. */
  triggerCount: number;
  /** Array of workflow nodes (steps). */
  nodes: WorkflowNode[];
  /** Node connection graph — maps source nodes to their output connections. */
  connections: WorkflowConnections;
  /** Workflow-level settings. */
  settings?: WorkflowSettings;
  /** Static data persisted between executions. */
  staticData?: string | JsonObject | null;
  /** Pinned input data keyed by node name. */
  pinData?: WorkflowPinData | null;
  /** Workflow metadata (template IDs, onboarding state). */
  meta?: WorkflowMeta | null;
  /** Tags attached to the workflow. */
  tags?: Tag[];
  /** Projects this workflow is shared with. */
  shared?: SharedWorkflow[];
  /** Active version details, if versioning is enabled. */
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

/**
 * Payload for creating a new workflow.
 *
 * All fields except `description`, `staticData`, `pinData`, and `projectId` are required.
 * The API does not accept partial updates — see `WorkflowUpdate` for the update shape.
 *
 * @example
 * ```ts
 * await client.workflows().create({
 *   name: 'My Workflow',
 *   nodes: [{ name: 'Start', type: 'n8n-nodes-base.start', position: [0, 0], parameters: {} }],
 *   connections: {},
 *   settings: { executionOrder: 'v1' },
 * });
 * ```
 */
export interface WorkflowCreate {
  /** Display name for the workflow. */
  name: string;
  /** Optional description. */
  description?: string;
  /** Array of workflow nodes (steps). At minimum, include a start node. */
  nodes: WorkflowNode[];
  /** Node connection graph — maps source nodes to their output connections. */
  connections: WorkflowConnections;
  /** Workflow-level execution settings. */
  settings: WorkflowSettings;
  /** Static data persisted between executions. */
  staticData?: string | JsonObject | null;
  /** Pinned input data keyed by node name. */
  pinData?: WorkflowPinData | null;
  /** Target project ID — if omitted, the workflow is created in the caller's personal space. */
  projectId?: string;
}

/**
 * Full workflow update body. The n8n API requires the complete workflow object,
 * not a partial patch. Always fetch the current workflow first, modify it, then
 * pass the full body to `update()`.
 *
 * @example
 * ```ts
 * const current = await client.workflows().get('wf-1');
 * await client.workflows().update('wf-1', {
 *   name: 'New Name',
 *   nodes: current.nodes,
 *   connections: current.connections,
 *   settings: current.settings ?? {},
 * });
 * ```
 */
export interface WorkflowUpdate {
  /** Display name for the workflow. */
  name: string;
  /** Optional description. */
  description?: string;
  /** Array of workflow nodes (steps). */
  nodes: WorkflowNode[];
  /** Node connection graph. */
  connections: WorkflowConnections;
  /** Workflow-level execution settings. */
  settings: WorkflowSettings;
  /** Static data persisted between executions. */
  staticData?: string | JsonObject | null;
  /** Pinned input data keyed by node name. */
  pinData?: WorkflowPinData | null;
}

/**
 * Workflow-level execution settings.
 *
 * All fields are optional. Common patterns:
 * - `executionOrder: 'v1'` — required for new workflows
 * - `errorWorkflow: 'wf-id'` — workflow to run on execution failure
 * - `timezone: 'America/New_York'` — override instance timezone
 */
export interface WorkflowSettings {
  /** Save execution progress for long-running workflows. */
  saveExecutionProgress?: boolean;
  /** Save manually triggered executions. */
  saveManualExecutions?: boolean;
  /** Whether to save execution data on error: `'all'` or `'none'`. */
  saveDataErrorExecution?: 'all' | 'none';
  /** Whether to save execution data on success: `'all'` or `'none'`. */
  saveDataSuccessExecution?: 'all' | 'none';
  /** Execution timeout in seconds. */
  executionTimeout?: number;
  /** ID of the workflow to execute on error. */
  errorWorkflow?: string;
  /** Workflow timezone (e.g. `'America/New_York'`). */
  timezone?: string;
  /** Execution order — use `'v1'` for new workflows. */
  executionOrder?: string;
  /** Which workflows can call this one: `'any'`, `'none'`, `'workflowsFromAList'`, `'workflowsFromSameOwner'`. */
  callerPolicy?: 'any' | 'none' | 'workflowsFromAList' | 'workflowsFromSameOwner';
  /** Comma-separated list of workflow IDs allowed to call this one (when `callerPolicy` is `'workflowsFromAList'`). */
  callerIds?: string;
  /** Time saved per execution in milliseconds. */
  timeSavedPerExecution?: number;
  /** Data redaction policy for execution logs. */
  redactionPolicy?: 'none' | 'non-manual' | 'manual-only' | 'all';
  /** Whether this workflow is available in the MCP interface. */
  availableInMCP?: boolean;
  /** Custom telemetry tags attached to executions. */
  customTelemetryTags?: WorkflowTelemetryTag[];
}

/**
 * A single node (step) in a workflow graph.
 *
 * Nodes are the building blocks of n8n workflows. Each node has a `type`
 * that determines its behavior (e.g. `'n8n-nodes-base.httpRequest'`).
 */
export interface WorkflowNode {
  /** Optional node identifier — auto-generated if omitted. */
  id?: string;
  /** Display name for the node (must be unique within the workflow). */
  name: string;
  /** Node type identifier (e.g. `'n8n-nodes-base.httpRequest'`, `'n8n-nodes-base.start'`). */
  type: string;
  /** Node type version — determines which parameter schema to use. */
  typeVersion?: number;
  /** Canvas position as `[x, y]` coordinates. */
  position: number[];
  /** Node-specific parameters — shape varies by node type. */
  parameters?: JsonObject;
  /** Credentials required by this node, keyed by credential type name. */
  credentials?: JsonObject;
  /** Whether the node is disabled (skipped during execution). */
  disabled?: boolean;
  /** Whether to show notes in the flow diagram. */
  notesInFlow?: boolean;
  /** User-facing notes about this node. */
  notes?: string;
  /** Webhook ID for webhook trigger nodes. */
  webhookId?: string;
  /** Whether to execute this node only once per execution. */
  executeOnce?: boolean;
  /** Whether to always output data, even on empty results. */
  alwaysOutputData?: boolean;
  /** Whether to retry on failure. */
  retryOnFail?: boolean;
  /** Maximum number of retry attempts (when `retryOnFail` is true). */
  maxTries?: number;
  /** Wait time between retries in milliseconds. */
  waitBetweenTries?: number;
  /** Whether to continue execution even if this node fails. */
  continueOnFail?: boolean;
  /** Error handling strategy: `'continueRegularOutput'`, `'continueErrorOutput'`, `'stopWorkflow'`. */
  onError?: string;
  /** Custom telemetry tags for this node. */
  customTelemetryTags?: WorkflowNodeTelemetryTags;
  /** ISO 8601 timestamp of creation (read-only). */
  createdAt?: string;
  /** ISO 8601 timestamp of last update (read-only). */
  updatedAt?: string;
}

/**
 * A single connection between two nodes.
 *
 * @property node - Target node name
 * @property type - Connection type (e.g. `'main'`, `'ai_tool'`)
 * @property index - Output index on the source node
 */
export interface WorkflowConnection {
  /** Name of the target node. */
  node: string;
  /** Connection type — typically `'main'` for standard data flow. */
  type: string;
  /** Output index on the source node (0-based). */
  index: number;
}

/** Array of connections from a single output. */
export type WorkflowConnectionBranch = WorkflowConnection[];

/** Maps connection type names to arrays of connection branches. */
export interface WorkflowConnectionTypeMap {
  [connectionType: string]: WorkflowConnectionBranch[];
}

/**
 * Workflow connection graph. Maps source node names to their output connections.
 *
 * @example
 * ```ts
 * const connections: WorkflowConnections = {
 *   'Start': { 'main': [[{ node: 'HTTP Request', type: 'main', index: 0 }]] },
 *   'HTTP Request': { 'main': [[{ node: 'End', type: 'main', index: 0 }]] },
 * };
 * ```
 */
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

/**
 * Execution status enum — the current state of a workflow run.
 *
 * | Status | Meaning |
 * |--------|---------|
 * | `'success'` | Completed without errors |
 * | `'error'` | Completed with errors |
 * | `'running'` | Currently executing |
 * | `'waiting'` | Waiting for input or a webhook callback |
 * | `'new'` | Created but not yet started |
 * | `'canceled'` | Manually canceled |
 * | `'crashed'` | Fatal error during execution |
 * | `'unknown'` | Status could not be determined |
 */
export type ExecutionStatus = 'canceled' | 'crashed' | 'error' | 'new' | 'running' | 'success' | 'unknown' | 'waiting';
/** How the execution was triggered. */
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

/**
 * A single workflow execution record.
 *
 * Use `includeData: true` in list/get params to include full execution data (input/output for each node).
 */
export interface Execution {
  /** Numeric execution ID. */
  id: number;
  /** Full execution data — only populated when `includeData: true`. */
  data?: JsonObject;
  /** Whether the execution completed (success or error). */
  finished: boolean;
  /** How the execution was triggered. */
  mode: ExecutionMode;
  /** ID of the original execution this one retried, if applicable. */
  retryOf?: number;
  /** ID of the successful retry, if this execution was retried. */
  retrySuccessId?: number;
  /** ISO 8601 timestamp of when the execution started. */
  startedAt: string;
  /** ISO 8601 timestamp of when the execution stopped. */
  stoppedAt?: string;
  /** ID of the workflow that was executed. */
  workflowId: number;
  /** ISO 8601 timestamp when a wait node should resume. */
  waitTill?: string;
  /** Custom data attached to the execution. */
  customData?: JsonObject;
  /** Current execution status. */
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

/**
 * A stored credential — authentication material for external services.
 *
 * The `data` field contains the actual secrets and its shape varies by credential type.
 * Use `type` to determine which fields are expected.
 */
export interface Credential {
  /** Unique credential identifier. */
  id: string;
  /** Display name. */
  name: string;
  /** Credential type (e.g. `'httpHeaderAuth'`, `'aws'`, `'slackOAuth2Api'`). */
  type: string;
  /** Secret data — shape depends on `type`. Omitted in most list responses. */
  data?: JsonObject;
  /** Whether this credential can be resolved by other credentials. */
  isResolvable?: boolean;
  /** ISO 8601 timestamp of creation. */
  createdAt: string;
  /** ISO 8601 timestamp of last update. */
  updatedAt: string;
}

/**
 * Payload for creating a new credential.
 *
 * @example
 * ```ts
 * await client.credentials().create({
 *   name: 'AWS Credentials',
 *   type: 'aws',
 *   data: { accessKey: 'AKIA...', secretKey: '...' },
 *   projectId: 'proj-1',  // optional — target project
 * });
 * ```
 */
export interface CredentialCreate {
  /** Display name for the credential. */
  name: string;
  /** Credential type identifier (e.g. `'httpHeaderAuth'`). */
  type: string;
  /** Secret data — shape depends on `type`. */
  data: JsonObject;
  /** Target project ID — if omitted, credential is created in the caller's personal space. */
  projectId?: string;
}

/**
 * Payload for updating a credential. All fields are optional (partial patch).
 */
export interface CredentialUpdate {
  /** New display name. */
  name?: string;
  /** New credential type. */
  type?: string;
  /** New secret data — shape depends on `type`. */
  data?: JsonObject;
  /** Whether the credential is global (shared across projects). */
  isGlobal?: boolean;
  /** Whether the credential can be resolved by other credentials. */
  isResolvable?: boolean;
  /** Whether the credential has partial data (for staged updates). */
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

/**
 * Filter expression for data table row operations.
 *
 * Supports AND/OR logic with multiple filter conditions.
 *
 * @example
 * ```ts
 * const filter: DataTableFilter = {
 *   type: 'and',
 *   filters: [
 *     { columnName: 'status', condition: 'eq', value: 'active' },
 *     { columnName: 'age', condition: 'gte', value: 18 },
 *   ],
 * };
 * ```
 */
export interface DataTableFilter {
  /** Logic operator for combining filters: `'and'` (default) or `'or'`. */
  type?: 'and' | 'or';
  /** Array of filter conditions. */
  filters: Array<{
    /** Column name to filter on. */
    columnName: string;
    /** Comparison operator: `'eq'`, `'neq'`, `'like'`, `'ilike'`, `'gt'`, `'gte'`, `'lt'`, `'lte'`. */
    condition: 'eq' | 'neq' | 'like' | 'ilike' | 'gt' | 'gte' | 'lt' | 'lte';
    /** Value to compare against. */
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

/**
 * Options for `N8nPackageClient.importPackage()`.
 *
 * `workflowConflictPolicy` is required — there is no default.
 *
 * @example
 * ```ts
 * await client.n8nPackage().importPackage(fileBlob, {
 *   projectId: 'proj-123',
 *   workflowConflictPolicy: 'new-version',
 * });
 * ```
 */
export interface ImportPackageOptions {
  /** Target project for imported workflows. */
  projectId?: string;
  /** Target folder for imported workflows. */
  folderId?: string;
  /** How to match existing credentials: `'id-only'`. */
  credentialMatchingMode?: 'id-only';
  /** Fail if referenced credentials are missing: `'must-preexist'`. */
  credentialMissingMode?: 'must-preexist';
  /** How to handle workflow name conflicts: `'new-version'`, `'fail'`, or `'skip'`. Required. */
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
