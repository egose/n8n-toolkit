import type { PaginatedResponse } from '../pagination.js';
import type { HttpClient } from '../http-client.js';
import type {
  Folder,
  FolderCreate,
  FolderDetail,
  FolderListParams,
  FolderListResponse,
  FolderUpdate,
} from '../types.js';
import BaseClient from './base.js';
import FolderResource from '../resources/folder.js';

export default class FolderClient extends BaseClient {
  private readonly projectId: string;

  constructor(http: HttpClient, projectId: string) {
    super(http);
    this.projectId = projectId;
  }

  async list(params?: FolderListParams): Promise<FolderListResponse> {
    return this.http.get<FolderListResponse>(`/projects/${this.projectId}/folders`, params);
  }

  async get(folderId: string): Promise<FolderDetail> {
    return this.http.get<FolderDetail>(`/projects/${this.projectId}/folders/${folderId}`);
  }

  async getResource(folderId: string): Promise<FolderResource> {
    return new FolderResource(this, await this.get(folderId));
  }

  async listResources(params?: FolderListParams): Promise<PaginatedResponse<FolderResource>> {
    const response = await this.list(params);

    return {
      data: response.data.map((folder) => new FolderResource(this, folder)),
      nextCursor: undefined,
    };
  }

  async create(data: FolderCreate): Promise<Folder> {
    return this.http.post<Folder>(`/projects/${this.projectId}/folders`, data);
  }

  async createResource(data: FolderCreate): Promise<FolderResource> {
    return new FolderResource(this, await this.create(data));
  }

  async update(folderId: string, data: FolderUpdate): Promise<Folder> {
    return this.http.patch<Folder>(`/projects/${this.projectId}/folders/${folderId}`, data);
  }

  async updateResource(folderId: string, data: FolderUpdate): Promise<FolderResource> {
    return new FolderResource(this, await this.update(folderId, data));
  }

  async delete(folderId: string, transferToFolderId?: string): Promise<void> {
    await this.http.delete<void>(
      `/projects/${this.projectId}/folders/${folderId}`,
      transferToFolderId ? { transferToFolderId } : undefined,
    );
  }
}
