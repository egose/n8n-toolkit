import type { HttpClient } from '../http-client.js';
import type {
  Folder,
  FolderCreate,
  FolderDetail,
  FolderListParams,
  FolderListResponse,
  FolderUpdate,
} from '../types.js';
import BaseHandle from './base.js';

export default class FolderHandle extends BaseHandle {
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

  async create(data: FolderCreate): Promise<Folder> {
    return this.http.post<Folder>(`/projects/${this.projectId}/folders`, data);
  }

  async update(folderId: string, data: FolderUpdate): Promise<Folder> {
    return this.http.patch<Folder>(`/projects/${this.projectId}/folders/${folderId}`, data);
  }

  async delete(folderId: string, transferToFolderId?: string): Promise<void> {
    await this.http.delete<void>(
      `/projects/${this.projectId}/folders/${folderId}`,
      transferToFolderId ? { transferToFolderId } : undefined,
    );
  }
}
