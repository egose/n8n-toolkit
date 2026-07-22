import type { PaginatedResponse } from '../pagination.js';
import type {
  User,
  UserCreate,
  UserCreateResponse,
  UserListResponse,
  UserListParams,
  UserGetParams,
  UserRoleChangeRequest,
} from '../types.js';
import BaseClient from './base.js';
import UserResource from '../resources/user.js';
import { normalizeUser, normalizeUserCreateResponse, normalizeUserListResponse } from '../response-mappers.js';

export default class UserClient extends BaseClient {
  async list(params?: UserListParams): Promise<UserListResponse> {
    return normalizeUserListResponse(await this.http.get<UserListResponse>('/users', params));
  }

  async get(id: string, params?: UserGetParams): Promise<User> {
    return normalizeUser(await this.http.get<User>(`/users/${id}`, params));
  }

  async getResource(id: string, params?: UserGetParams): Promise<UserResource> {
    return new UserResource(this, await this.get(id, params), params);
  }

  async listResources(params?: UserListParams): Promise<PaginatedResponse<UserResource>> {
    const response = await this.list(params);

    return {
      data: response.data.map(
        (user) => new UserResource(this, user, params?.includeRole ? { includeRole: true } : undefined),
      ),
      nextCursor: response.nextCursor,
    };
  }

  async create(data: UserCreate[]): Promise<UserCreateResponse> {
    return normalizeUserCreateResponse(await this.http.post<UserCreateResponse>('/users', data));
  }

  async delete(id: string): Promise<void> {
    await this.http.delete<void>(`/users/${id}`);
  }

  async changeRole(id: string, newRoleName: string): Promise<void> {
    const data: UserRoleChangeRequest = { newRoleName };
    await this.http.patch<void>(`/users/${id}/role`, data);
  }
}
