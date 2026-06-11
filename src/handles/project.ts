import type { HttpClient } from '../http-client.js';
import type { ProjectListResponse, ProjectMemberListResponse, PaginationParams } from '../types.js';

export default class ProjectHandle {
  protected http: HttpClient;

  constructor(http: HttpClient) {
    this.http = http;
  }

  async list(params?: PaginationParams): Promise<ProjectListResponse> {
    return this.http.get<ProjectListResponse>('/projects', params);
  }

  async create(data: { name: string }): Promise<void> {
    await this.http.post<void>('/projects', data);
  }

  async update(id: string, data: { name: string }): Promise<void> {
    await this.http.put<void>(`/projects/${id}`, data);
  }

  async delete(id: string): Promise<void> {
    await this.http.delete<void>(`/projects/${id}`);
  }

  async listMembers(projectId: string, params?: PaginationParams): Promise<ProjectMemberListResponse> {
    return this.http.get<ProjectMemberListResponse>(`/projects/${projectId}/users`, params);
  }

  async addMembers(projectId: string, relations: Array<{ userId: string; role: string }>): Promise<void> {
    await this.http.post<void>(`/projects/${projectId}/users`, { relations });
  }

  async removeMember(projectId: string, userId: string): Promise<void> {
    await this.http.delete<void>(`/projects/${projectId}/users/${userId}`);
  }

  async changeMemberRole(projectId: string, userId: string, role: string): Promise<void> {
    await this.http.patch<void>(`/projects/${projectId}/users/${userId}`, { role });
  }
}
