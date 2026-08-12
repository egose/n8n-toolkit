import type { PaginatedResponse } from '../pagination.js';
import { encodePathSegment } from '../path.js';
import type { Tag, TagListResponse, PaginationParams, TagMutation, TagMutationResult } from '../types.js';
import BaseClient from './base.js';
import TagResource from '../resources/tag.js';
import { normalizeTag, normalizeTagListResponse, normalizeTagMutationResult } from '../response-mappers.js';

export default class TagClient extends BaseClient {
  async list(params?: PaginationParams): Promise<TagListResponse> {
    return normalizeTagListResponse(await this.http.get<TagListResponse>('/tags', params));
  }

  async get(id: string): Promise<Tag> {
    return normalizeTag(await this.http.get<Tag>(`/tags/${encodePathSegment(id)}`));
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

  async update(id: string, data: TagMutation): Promise<TagMutationResult> {
    return normalizeTagMutationResult(await this.http.put<TagMutationResult>(`/tags/${encodePathSegment(id)}`, data));
  }

  async updateResource(id: string, data: TagMutation): Promise<TagResource> {
    return (await this.getResource(id)).update(data);
  }

  async delete(id: string): Promise<TagMutationResult> {
    return normalizeTagMutationResult(await this.http.delete<TagMutationResult>(`/tags/${encodePathSegment(id)}`));
  }
}
