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

export default class N8nClient {
  readonly #http: HttpClient;

  constructor(config: N8nClientConfig) {
    this.#http = new HttpClient(config);
  }

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

  workflows() {
    return new WorkflowClient(this.#http);
  }

  executions() {
    return new ExecutionClient(this.#http);
  }

  credentials() {
    return new CredentialClient(this.#http);
  }

  tags() {
    return new TagClient(this.#http);
  }

  users() {
    return new UserClient(this.#http);
  }

  variables() {
    return new VariableClient(this.#http);
  }

  projects() {
    return new ProjectClient(this.#http);
  }

  dataTables() {
    return new DataTableClient(this.#http);
  }

  folders(projectId: string) {
    return new FolderClient(this.#http, projectId);
  }

  communityPackages() {
    return new CommunityPackageClient(this.#http);
  }

  audit() {
    return new AuditClient(this.#http);
  }

  insights() {
    return new InsightsClient(this.#http);
  }

  sourceControl() {
    return new SourceControlClient(this.#http);
  }

  discover() {
    return new DiscoverClient(this.#http);
  }

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
