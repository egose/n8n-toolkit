import { HttpError } from '../http-client.js';
import type { PaginatedResponse } from '../pagination.js';
import type {
  Project,
  ProjectCreate,
  ProjectListItem,
  ProjectListResponse,
  ProjectMemberListResponse,
  PaginationParams,
  ProjectMemberRelation,
  ProjectMemberRoleChangeRequest,
  ProjectUpdate,
} from '../types.js';
import BaseClient from './base.js';
import DataTableClient from './data-table.js';
import ExecutionClient from './execution.js';
import FolderClient from './folder.js';
import VariableClient from './variable.js';
import WorkflowClient from './workflow.js';
import ProjectResource from '../resources/project.js';

export default class ProjectClient extends BaseClient {
  async list(params?: PaginationParams): Promise<ProjectListResponse> {
    return this.http.get<ProjectListResponse>('/projects', params);
  }

  async getResource(id: string): Promise<ProjectResource> {
    const project = await this.findProject(id);

    if (!project) {
      throw new HttpError(404, `Project not found: ${id}`, { id });
    }

    return this.bindResource(project);
  }

  async listResources(params?: PaginationParams): Promise<PaginatedResponse<ProjectResource>> {
    const response = await this.list(params);

    return {
      data: response.data.map((project) => this.bindResource(project)),
      nextCursor: response.nextCursor,
    };
  }

  async create(data: ProjectCreate): Promise<Project> {
    return this.http.post<Project>('/projects', data);
  }

  async createResource(data: ProjectCreate): Promise<ProjectResource> {
    return this.bindResource(await this.create(data));
  }

  async update(id: string, data: ProjectUpdate): Promise<void> {
    await this.http.put<void>(`/projects/${id}`, data);
  }

  async updateResource(id: string, data: ProjectUpdate): Promise<ProjectResource> {
    await this.update(id, data);
    return this.getResource(id);
  }

  async delete(id: string, transferId?: string): Promise<void> {
    if (transferId) {
      await this.http.delete<void>(`/projects/${id}`, { transferId });
      return;
    }

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

  private bindResource(project: Project | ProjectListItem): ProjectResource {
    return new ProjectResource(
      this,
      new WorkflowClient(this.http),
      new FolderClient(this.http, project.id),
      new VariableClient(this.http),
      new DataTableClient(this.http),
      new ExecutionClient(this.http),
      project,
    );
  }

  private async findProject(id: string): Promise<ProjectListItem | undefined> {
    let cursor: string | undefined;

    do {
      const response = await this.list(cursor ? { cursor } : undefined);
      const project = response.data.find((entry) => entry.id === id);

      if (project) {
        return project;
      }

      cursor = response.nextCursor;
    } while (cursor);

    return undefined;
  }
}
