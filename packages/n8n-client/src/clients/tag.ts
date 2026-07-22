import type { PaginatedResponse } from '../pagination.js';
import type { Tag, TagListResponse, PaginationParams, TagMutation } from '../types.js';
import BaseClient from './base.js';
import TagResource from '../resources/tag.js';
import { normalizeTag, normalizeTagListResponse } from '../response-mappers.js';

export default class TagClient extends BaseClient {
  async list(params?: PaginationParams): Promise<TagListResponse> {
    return normalizeTagListResponse(await this.http.get<TagListResponse>('/tags', params));
  }

  async get(id: string): Promise<Tag> {
    return normalizeTag(await this.http.get<Tag>(`/tags/${id}`));
  }

  async getResource(id: string): Promise<TagResource> {
    return new TagResource(this, await this.get(id));
  }

  async listResources(params?: PaginationParams): Promise<PaginatedResponse<TagResource>> {
    const response = await this.list(params);

    return {
      data: response.data.map((tag) => new TagResource(this, tag)),
      nextCursor: response.nextCursor,
    };
  }

  async create(data: TagMutation): Promise<Tag> {
    return normalizeTag(await this.http.post<Tag>('/tags', data));
  }

  async createResource(data: TagMutation): Promise<TagResource> {
    return new TagResource(this, await this.create(data));
  }

  async update(id: string, data: TagMutation): Promise<Tag> {
    return normalizeTag(await this.http.put<Tag>(`/tags/${id}`, data));
  }

  async updateResource(id: string, data: TagMutation): Promise<TagResource> {
    return new TagResource(this, await this.update(id, data));
  }

  async delete(id: string): Promise<Tag> {
    return normalizeTag(await this.http.delete<Tag>(`/tags/${id}`));
  }
}
