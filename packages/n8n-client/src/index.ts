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

/**
 * Root client for the n8n Public API v1.
 *
 * Creates an HTTP client and provides access to all 15 resource clients.
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

  /**
   * Create a new client instance.
   *
   * @param config - Client configuration. Must include `baseUrl` and exactly one of `apiKey` or `bearerToken`.
   * @throws {Error} If both or neither auth method is provided.
   */
  constructor(config: N8nClientConfig) {
    this.#http = new HttpClient(config);
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
    return new WorkflowClient(this.#http);
  }

  /** Execution monitoring — list, get, delete, retry, stop, tags. */
  executions() {
    return new ExecutionClient(this.#http);
  }

  /** Credential management — list, get, create, update, delete, test, transfer, schema. */
  credentials() {
    return new CredentialClient(this.#http);
  }

  /** Tag management — list, get, create, update, delete. */
  tags() {
    return new TagClient(this.#http);
  }

  /** User management — list, get, create, delete, role changes. */
  users() {
    return new UserClient(this.#http);
  }

  /** Variable management — list, get (paginated search), create, update, delete. */
  variables() {
    return new VariableClient(this.#http);
  }

  /** Project management — list, create, update, delete, members. No `get(id)` — use `list()` to find projects. */
  projects() {
    return new ProjectClient(this.#http);
  }

  /** Data table management — list, get, create, update, delete, rows, columns. */
  dataTables() {
    return new DataTableClient(this.#http);
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
    return new FolderClient(this.#http, projectId);
  }

  /** Community package management — list, install, update, uninstall. */
  communityPackages() {
    return new CommunityPackageClient(this.#http);
  }

  /** Audit report generation (singleton — no `list`/`get`). */
  audit() {
    return new AuditClient(this.#http);
  }

  /** Execution insights summary (singleton — no `list`/`get`). */
  insights() {
    return new InsightsClient(this.#http);
  }

  /** Source control operations — pull, list files (singleton). */
  sourceControl() {
    return new SourceControlClient(this.#http);
  }

  /** Resource discovery — list available API resources, operations, and filters (singleton). */
  discover() {
    return new DiscoverClient(this.#http);
  }

  /** n8n package import/export — export workflows as gzipped packages, import packages (singleton). */
  n8nPackage() {
    return new N8nPackageClient(this.#http);
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
