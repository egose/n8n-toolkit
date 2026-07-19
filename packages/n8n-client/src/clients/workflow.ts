import type { PaginatedResponse } from '../pagination.js';
import ExecutionClient from './execution.js';
import type {
  Workflow,
  WorkflowCreate,
  WorkflowUpdate,
  WorkflowListResponse,
  WorkflowVersion,
  WorkflowListParams,
  WorkflowGetParams,
  WorkflowActivateRequest,
  Tag,
  TagId,
} from '../types.js';
import BaseClient from './base.js';
import WorkflowResource from '../resources/workflow.js';

export default class WorkflowClient extends BaseClient {
  async list(params?: WorkflowListParams): Promise<WorkflowListResponse> {
    return this.http.get<WorkflowListResponse>('/workflows', params);
  }

  async get(id: string, params?: WorkflowGetParams): Promise<Workflow> {
    return this.http.get<Workflow>(`/workflows/${id}`, params);
  }

  async getResource(id: string, params?: WorkflowGetParams): Promise<WorkflowResource> {
    return new WorkflowResource(this, new ExecutionClient(this.http), await this.get(id, params));
  }

  async listResources(params?: WorkflowListParams): Promise<PaginatedResponse<WorkflowResource>> {
    const response = await this.list(params);

    return {
      data: response.data.map((workflow) => new WorkflowResource(this, new ExecutionClient(this.http), workflow)),
      nextCursor: response.nextCursor,
    };
  }

  async create(data: WorkflowCreate): Promise<Workflow> {
    return this.http.post<Workflow>('/workflows', data);
  }

  async createResource(data: WorkflowCreate): Promise<WorkflowResource> {
    return new WorkflowResource(this, new ExecutionClient(this.http), await this.create(data));
  }

  async update(id: string, data: WorkflowUpdate): Promise<Workflow> {
    return this.http.put<Workflow>(`/workflows/${id}`, data);
  }

  async updateResource(id: string, data: WorkflowUpdate): Promise<WorkflowResource> {
    return new WorkflowResource(this, new ExecutionClient(this.http), await this.update(id, data));
  }

  async delete(id: string): Promise<Workflow> {
    return this.http.delete<Workflow>(`/workflows/${id}`);
  }

  async activate(id: string, data?: WorkflowActivateRequest): Promise<Workflow> {
    return this.http.post<Workflow>(`/workflows/${id}/activate`, data);
  }

  async deactivate(id: string): Promise<Workflow> {
    return this.http.post<Workflow>(`/workflows/${id}/deactivate`);
  }

  async archive(id: string): Promise<Workflow> {
    return this.http.post<Workflow>(`/workflows/${id}/archive`);
  }

  async unarchive(id: string): Promise<Workflow> {
    return this.http.post<Workflow>(`/workflows/${id}/unarchive`);
  }

  async transfer(id: string, destinationProjectId: string): Promise<void> {
    await this.http.put<void>(`/workflows/${id}/transfer`, { destinationProjectId });
  }

  async getTags(id: string): Promise<Tag[]> {
    return this.http.get<Tag[]>(`/workflows/${id}/tags`);
  }

  async updateTags(id: string, tags: TagId[]): Promise<Tag[]> {
    return this.http.put<Tag[]>(`/workflows/${id}/tags`, tags);
  }

  async getVersion(id: string, versionId: string): Promise<WorkflowVersion> {
    return this.http.get<WorkflowVersion>(`/workflows/${id}/${versionId}`);
  }
}
