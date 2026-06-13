import type {
  User,
  UserCreate,
  UserCreateResponse,
  UserListResponse,
  UserListParams,
  UserGetParams,
  UserRoleChangeRequest,
} from '../types.js';
import BaseHandle from './base.js';

export default class UserHandle extends BaseHandle {
  async list(params?: UserListParams): Promise<UserListResponse> {
    return this.http.get<UserListResponse>('/users', params);
  }

  async get(id: string, params?: UserGetParams): Promise<User> {
    return this.http.get<User>(`/users/${id}`, params);
  }

  async create(data: UserCreate[]): Promise<UserCreateResponse> {
    return this.http.post<UserCreateResponse>('/users', data);
  }

  async delete(id: string): Promise<void> {
    await this.http.delete<void>(`/users/${id}`);
  }

  async changeRole(id: string, newRoleName: string): Promise<void> {
    const data: UserRoleChangeRequest = { newRoleName };
    await this.http.patch<void>(`/users/${id}/role`, data);
  }
}
