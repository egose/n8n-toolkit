import type { HttpClient } from '../http-client.js';
import { encodePathSegment } from '../path.js';
import type {
  FolderCreate,
  FolderCreateResult,
  FolderDetail,
  FolderListParams,
  FolderListResponse,
  FolderUpdate,
  FolderUpdateResult,
} from '../types.js';
import BaseClient from './base.js';
import FolderResource from '../resources/folder.js';
import {
  normalizeFolderCreateResult,
  normalizeFolderDetail,
  normalizeFolderListResponse,
  normalizeFolderUpdateResult,
} from '../response-mappers.js';

export interface FolderResourcePage {
  count: number;
  data: FolderResource[];
}

export default class FolderClient extends BaseClient {
  private readonly projectId: string;

  constructor(http: HttpClient, projectId: string) {
    super(http);
    this.projectId = projectId;
  }

  async list(params?: FolderListParams): Promise<FolderListResponse> {
    return normalizeFolderListResponse(
      await this.http.get<FolderListResponse>(`/projects/${encodePathSegment(this.projectId)}/folders`, params),
    );
  }

  async get(folderId: string): Promise<FolderDetail> {
    return normalizeFolderDetail(
      await this.http.get<FolderDetail>(
        `/projects/${encodePathSegment(this.projectId)}/folders/${encodePathSegment(folderId)}`,
      ),
    );
  }

  async getResource(folderId: string): Promise<FolderResource> {
    return new FolderResource(this, await this.get(folderId));
  }

  async listResources(params?: FolderListParams): Promise<FolderResourcePage> {
    const response = await this.list(params);

    return {
      count: response.count,
      data: response.data.map((folder) => new FolderResource(this, folder)),
    };
  }

  async create(data: FolderCreate): Promise<FolderCreateResult> {
    return normalizeFolderCreateResult(
      await this.http.post<FolderCreateResult>(`/projects/${encodePathSegment(this.projectId)}/folders`, data),
    );
  }

  async createResource(data: FolderCreate): Promise<FolderResource> {
    return new FolderResource(this, await this.create(data));
  }

  async update(folderId: string, data: FolderUpdate): Promise<FolderUpdateResult> {
    return normalizeFolderUpdateResult(
      await this.http.patch<FolderUpdateResult>(
        `/projects/${encodePathSegment(this.projectId)}/folders/${encodePathSegment(folderId)}`,
        data,
      ),
    );
  }

  async updateResource(folderId: string, data: FolderUpdate): Promise<FolderResource> {
    return (await this.getResource(folderId)).update(data);
  }

  async delete(folderId: string, transferToFolderId?: string): Promise<void> {
    await this.http.delete<void>(
      `/projects/${encodePathSegment(this.projectId)}/folders/${encodePathSegment(folderId)}`,
      transferToFolderId ? { transferToFolderId } : undefined,
    );
  }
}
