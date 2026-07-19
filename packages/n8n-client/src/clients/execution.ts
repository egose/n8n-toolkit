import type { PaginatedResponse } from '../pagination.js';
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
import BaseClient from './base.js';
import ExecutionResource from '../resources/execution.js';

export default class ExecutionClient extends BaseClient {
  async list(params?: ExecutionListParams): Promise<ExecutionListResponse> {
    return this.http.get<ExecutionListResponse>('/executions', params);
  }

  async get(id: number, params?: ExecutionGetParams): Promise<Execution> {
    return this.http.get<Execution>(`/executions/${id}`, params);
  }

  async getResource(id: number, params?: ExecutionGetParams): Promise<ExecutionResource> {
    return new ExecutionResource(this, await this.get(id, params), params);
  }

  async listResources(params?: ExecutionListParams): Promise<PaginatedResponse<ExecutionResource>> {
    const response = await this.list(params);
    const getParams = params
      ? {
          includeData: params.includeData,
          redactExecutionData: params.redactExecutionData,
        }
      : undefined;

    return {
      data: response.data.map((execution) => new ExecutionResource(this, execution, getParams)),
      nextCursor: response.nextCursor,
    };
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
