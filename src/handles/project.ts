import type {
  ProjectListResponse,
  ProjectMemberListResponse,
  PaginationParams,
  ProjectMutation,
  ProjectMemberRelation,
  ProjectMemberRoleChangeRequest,
} from '../types.js';
import BaseHandle from './base.js';

export default class ProjectHandle extends BaseHandle {
  async list(params?: PaginationParams): Promise<ProjectListResponse> {
    return this.http.get<ProjectListResponse>('/projects', params);
  }

  async create(data: ProjectMutation): Promise<void> {
    await this.http.post<void>('/projects', data);
  }

  async update(id: string, data: ProjectMutation): Promise<void> {
    await this.http.put<void>(`/projects/${id}`, data);
  }

  async delete(id: string): Promise<void> {
    await this.http.delete<void>(`/projects/${id}`);
  }

  async listMembers(projectId: string, params?: PaginationParams): Promise<ProjectMemberListResponse> {
    return this.http.get<ProjectMemberListResponse>(`/projects/${projectId}/users`, params);
  }

  async addMembers(projectId: string, relations: ProjectMemberRelation[]): Promise<void> {
    await this.http.post<void>(`/projects/${projectId}/users`, { relations });
  }

  async removeMember(projectId: string, userId: string): Promise<void> {
    await this.http.delete<void>(`/projects/${projectId}/users/${userId}`);
  }

  async changeMemberRole(projectId: string, userId: string, role: string): Promise<void> {
    const data: ProjectMemberRoleChangeRequest = { role };
    await this.http.patch<void>(`/projects/${projectId}/users/${userId}`, data);
  }
}
