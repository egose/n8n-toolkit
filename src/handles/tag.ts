import type { Tag, TagListResponse, PaginationParams, TagMutation } from '../types.js';
import BaseHandle from './base.js';

export default class TagHandle extends BaseHandle {
  async list(params?: PaginationParams): Promise<TagListResponse> {
    return this.http.get<TagListResponse>('/tags', params);
  }

  async get(id: string): Promise<Tag> {
    return this.http.get<Tag>(`/tags/${id}`);
  }

  async create(data: TagMutation): Promise<Tag> {
    return this.http.post<Tag>('/tags', data);
  }

  async update(id: string, data: TagMutation): Promise<Tag> {
    return this.http.put<Tag>(`/tags/${id}`, data);
  }

  async delete(id: string): Promise<Tag> {
    return this.http.delete<Tag>(`/tags/${id}`);
  }
}
