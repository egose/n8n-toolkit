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
import BaseHandle from './base.js';

export default class WorkflowHandle extends BaseHandle {
  async list(params?: WorkflowListParams): Promise<WorkflowListResponse> {
    return this.http.get<WorkflowListResponse>('/workflows', params);
  }

  async get(id: string, params?: WorkflowGetParams): Promise<Workflow> {
    return this.http.get<Workflow>(`/workflows/${id}`, params);
  }

  async create(data: WorkflowCreate): Promise<Workflow> {
    return this.http.post<Workflow>('/workflows', data);
  }

  async update(id: string, data: WorkflowUpdate): Promise<Workflow> {
    return this.http.put<Workflow>(`/workflows/${id}`, data);
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
