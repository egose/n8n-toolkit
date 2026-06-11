import type { HttpClient } from '../http-client.js';
import type {
  Execution,
  ExecutionListResponse,
  ExecutionStatus,
  PaginationParams,
  StopManyExecutionsRequest,
  StopManyExecutionsResponse,
  Tag,
  TagId,
} from '../types.js';

export default class ExecutionHandle {
  protected http: HttpClient;

  constructor(http: HttpClient) {
    this.http = http;
  }

  async list(
    params?: PaginationParams & {
      includeData?: boolean;
      redactExecutionData?: boolean;
      status?: ExecutionStatus;
      workflowId?: string;
      projectId?: string;
    },
  ): Promise<ExecutionListResponse> {
    return this.http.get<ExecutionListResponse>('/executions', params);
  }

  async get(id: number, params?: { includeData?: boolean; redactExecutionData?: boolean }): Promise<Execution> {
    return this.http.get<Execution>(`/executions/${id}`, params);
  }

  async delete(id: number): Promise<Execution> {
    return this.http.delete<Execution>(`/executions/${id}`);
  }

  async retry(id: number, data?: { loadWorkflow?: boolean }): Promise<Execution> {
    return this.http.post<Execution>(`/executions/${id}/retry`, data);
  }

  async stop(id: number): Promise<Execution> {
    return this.http.post<Execution>(`/executions/${id}/stop`);
  }

  async stopMany(data: StopManyExecutionsRequest): Promise<StopManyExecutionsResponse> {
    return this.http.post<StopManyExecutionsResponse>('/executions/stop', data);
  }

  async getTags(id: number): Promise<Tag[]> {
    return this.http.get<Tag[]>(`/executions/${id}/tags`);
  }

  async updateTags(id: number, tags: TagId[]): Promise<Tag[]> {
    return this.http.put<Tag[]>(`/executions/${id}/tags`, tags);
  }
}
