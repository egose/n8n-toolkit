import { HttpClient } from './http-client.js';
import type { RequestOptions } from './http-client.js';
import type { N8nClientConfig } from './types.js';
import WorkflowHandle from './handles/workflow.js';
import ExecutionHandle from './handles/execution.js';
import CredentialHandle from './handles/credential.js';
import TagHandle from './handles/tag.js';
import UserHandle from './handles/user.js';
import VariableHandle from './handles/variable.js';
import ProjectHandle from './handles/project.js';
import DataTableHandle from './handles/data-table.js';
import FolderHandle from './handles/folder.js';
import CommunityPackageHandle from './handles/community-package.js';
import AuditHandle from './handles/audit.js';
import InsightsHandle from './handles/insights.js';
import SourceControlHandle from './handles/source-control.js';
import DiscoverHandle from './handles/discover.js';
import N8nPackageHandle from './handles/n8n-package.js';

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

  workflow() {
    return new WorkflowHandle(this.#http);
  }

  execution() {
    return new ExecutionHandle(this.#http);
  }

  credential() {
    return new CredentialHandle(this.#http);
  }

  tag() {
    return new TagHandle(this.#http);
  }

  user() {
    return new UserHandle(this.#http);
  }

  variable() {
    return new VariableHandle(this.#http);
  }

  project() {
    return new ProjectHandle(this.#http);
  }

  dataTable() {
    return new DataTableHandle(this.#http);
  }

  folder(projectId: string) {
    return new FolderHandle(this.#http, projectId);
  }

  communityPackage() {
    return new CommunityPackageHandle(this.#http);
  }

  audit() {
    return new AuditHandle(this.#http);
  }

  insights() {
    return new InsightsHandle(this.#http);
  }

  sourceControl() {
    return new SourceControlHandle(this.#http);
  }

  discover() {
    return new DiscoverHandle(this.#http);
  }

  n8nPackage() {
    return new N8nPackageHandle(this.#http);
  }
}

export { HttpClient } from './http-client.js';
export { HttpError } from './http-client.js';
export type { RequestOptions } from './http-client.js';
export type * from './types.js';
export type { PaginationParams, PaginatedResponse } from './pagination.js';
