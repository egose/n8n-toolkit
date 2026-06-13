import type {
  Execution,
  ExecutionListResponse,
  ExecutionListParams,
  ExecutionGetParams,
  ExecutionRetryRequest,
  StopManyExecutionsRequest,
  StopManyExecutionsResponse,
  Tag,
  TagId,
} from '../types.js';
import BaseHandle from './base.js';

export default class ExecutionHandle extends BaseHandle {
  async list(params?: ExecutionListParams): Promise<ExecutionListResponse> {
    return this.http.get<ExecutionListResponse>('/executions', params);
  }

  async get(id: number, params?: ExecutionGetParams): Promise<Execution> {
    return this.http.get<Execution>(`/executions/${id}`, params);
  }

  async delete(id: number): Promise<Execution> {
    return this.http.delete<Execution>(`/executions/${id}`);
  }

  async retry(id: number, data?: ExecutionRetryRequest): Promise<Execution> {
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
