import { HttpClient } from './http-client.js';
import type { RequestOptions } from './http-client.js';
import type { N8nClientConfig } from './types.js';
import WorkflowClient from './clients/workflow.js';
import ExecutionClient from './clients/execution.js';
import CredentialClient from './clients/credential.js';
import TagClient from './clients/tag.js';
import UserClient from './clients/user.js';
import VariableClient from './clients/variable.js';
import ProjectClient from './clients/project.js';
import DataTableClient from './clients/data-table.js';
import FolderClient from './clients/folder.js';
import CommunityPackageClient from './clients/community-package.js';
import AuditClient from './clients/audit.js';
import InsightsClient from './clients/insights.js';
import SourceControlClient from './clients/source-control.js';
import DiscoverClient from './clients/discover.js';
import N8nPackageClient from './clients/n8n-package.js';
import SecurityPolicyClient from './clients/security-policy.js';

/**
 * Root client for the n8n Public API v1.
 *
 * Creates an HTTP client and provides access to all 16 resource clients.
 *
 * @example
 * ```ts
 * import N8nClient from '@egose/n8n-client';
 *
 * const client = new N8nClient({
 *   baseUrl: 'http://localhost:5678',
 *   apiKey: process.env.N8N_API_KEY,
 * });
 *
 * const { data } = await client.workflows().list({ limit: 10 });
 * ```
 */
export default class N8nClient {
  readonly #http: HttpClient;
  readonly #workflows: WorkflowClient;
  readonly #executions: ExecutionClient;
  readonly #credentials: CredentialClient;
  readonly #tags: TagClient;
  readonly #users: UserClient;
  readonly #variables: VariableClient;
  readonly #projects: ProjectClient;
  readonly #dataTables: DataTableClient;
  readonly #communityPackages: CommunityPackageClient;
  readonly #audit: AuditClient;
  readonly #insights: InsightsClient;
  readonly #sourceControl: SourceControlClient;
  readonly #securityPolicy: SecurityPolicyClient;
  readonly #discover: DiscoverClient;
  readonly #n8nPackage: N8nPackageClient;
  readonly #folders = new Map<string, FolderClient>();

  /**
   * Create a new client instance.
   *
   * @param config - Client configuration. Must include `baseUrl` and exactly one of `apiKey` or `bearerToken`.
   * @throws {Error} If both or neither auth method is provided.
   */
  constructor(config: N8nClientConfig) {
    this.#http = new HttpClient(config);
    this.#workflows = new WorkflowClient(this.#http);
    this.#executions = new ExecutionClient(this.#http);
    this.#credentials = new CredentialClient(this.#http);
    this.#tags = new TagClient(this.#http);
    this.#users = new UserClient(this.#http);
    this.#variables = new VariableClient(this.#http);
    this.#projects = new ProjectClient(this.#http);
    this.#dataTables = new DataTableClient(this.#http);
    this.#communityPackages = new CommunityPackageClient(this.#http);
    this.#audit = new AuditClient(this.#http);
    this.#insights = new InsightsClient(this.#http);
    this.#sourceControl = new SourceControlClient(this.#http);
    this.#securityPolicy = new SecurityPolicyClient(this.#http);
    this.#discover = new DiscoverClient(this.#http);
    this.#n8nPackage = new N8nPackageClient(this.#http);
  }

  /**
   * Send an arbitrary HTTP request through the client's transport layer.
   *
   * @example
   * ```ts
   * const result = await client.request<Workflow>({
   *   method: 'GET',
   *   path: '/workflows',
   *   query: { limit: 5 },
   * });
   * ```
   */
  request<T>(options: RequestOptions): Promise<T> {
    return this.#http.request<T>(options);
  }

  get<T>(path: string, query?: object, headers?: Record<string, string>): Promise<T> {
    return this.#http.get<T>(path, query, headers);
  }

  post<T>(path: string, body?: unknown, query?: object, headers?: Record<string, string>): Promise<T> {
    return this.#http.post<T>(path, body, query, headers);
  }

  put<T>(path: string, body?: unknown, query?: object, headers?: Record<string, string>): Promise<T> {
    return this.#http.put<T>(path, body, query, headers);
  }

  patch<T>(path: string, body?: unknown, query?: object, headers?: Record<string, string>): Promise<T> {
    return this.#http.patch<T>(path, body, query, headers);
  }

  delete<T>(path: string, query?: object, headers?: Record<string, string>): Promise<T> {
    return this.#http.delete<T>(path, query, headers);
  }

  /** Workflow management — list, get, create, update, delete, activate, deactivate, archive, transfer, tags, versions. */
  workflows() {
    return this.#workflows;
  }

  /** Execution monitoring — list, get, delete, retry, stop, tags. */
  executions() {
    return this.#executions;
  }

  /** Credential management — list, get, create, update, delete, test, transfer, schema. */
  credentials() {
    return this.#credentials;
  }

  /** Tag management — list, get, create, update, delete. */
  tags() {
    return this.#tags;
  }

  /** User management — list, get, create, delete, role changes. */
  users() {
    return this.#users;
  }

  /** Variable management — list, get (paginated search), create, update, delete. */
  variables() {
    return this.#variables;
  }

  /** Project management — list, create, update, delete, members. No `get(id)` — use `list()` to find projects. */
  projects() {
    return this.#projects;
  }

  /** Data table management — list, get, create, update, delete, rows, columns. */
  dataTables() {
    return this.#dataTables;
  }

  /**
   * Folder management — requires `projectId` because folder endpoints are project-scoped.
   *
   * @example
   * ```ts
   * const folders = client.folders('project-id');
   * await folders.list();
   * ```
   */
  folders(projectId: string) {
    let folders = this.#folders.get(projectId);
    if (!folders) {
      folders = new FolderClient(this.#http, projectId);
      this.#folders.set(projectId, folders);
    }

    return folders;
  }

  /** Community package management — list, install, update, uninstall. */
  communityPackages() {
    return this.#communityPackages;
  }

  /** Audit report generation (singleton — no `list`/`get`). */
  audit() {
    return this.#audit;
  }

  /** Execution insights summary (singleton — no `list`/`get`). */
  insights() {
    return this.#insights;
  }

  /** Source control operations — pull, list files (singleton). */
  sourceControl() {
    return this.#sourceControl;
  }

  /** Security policy settings (singleton). */
  securityPolicy() {
    return this.#securityPolicy;
  }

  /** Resource discovery — list available API resources, operations, and filters (singleton). */
  discover() {
    return this.#discover;
  }

  /** n8n package import/export — export workflows as gzipped packages, import packages (singleton). */
  n8nPackage() {
    return this.#n8nPackage;
  }
}

export { HttpClient } from './http-client.js';
export { HttpError } from './http-client.js';
export { default as CredentialResource } from './resources/credential.js';
export { default as CommunityPackageResource } from './resources/community-package.js';
export { default as DataTableResource } from './resources/data-table.js';
export { default as ExecutionResource } from './resources/execution.js';
export { default as FolderResource } from './resources/folder.js';
export { default as ProjectResource } from './resources/project.js';
export type { ProjectDataTableResourceCollection } from './resources/project.js';
export type { ProjectExecutionResourceCollection } from './resources/project.js';
export type { ProjectFolderResourceCollection } from './resources/project.js';
export type { ProjectVariableResourceCollection } from './resources/project.js';
export type { ProjectWorkflowResourceCollection } from './resources/project.js';
export { default as TagResource } from './resources/tag.js';
export { default as UserResource } from './resources/user.js';
export { default as VariableResource } from './resources/variable.js';
export type { WorkflowExecutionResourceCollection } from './resources/workflow.js';
export { default as WorkflowResource } from './resources/workflow.js';
export type { RequestOptions } from './http-client.js';
export type * from './types.js';
export type { PaginationParams, PaginatedResponse } from './pagination.js';
