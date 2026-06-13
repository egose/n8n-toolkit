import type { Variable, VariableCreate, VariableListResponse, VariableListParams } from '../types.js';
import BaseHandle from './base.js';

export default class VariableHandle extends BaseHandle {
  async list(params?: VariableListParams): Promise<VariableListResponse> {
    return this.http.get<VariableListResponse>('/variables', params);
  }

  async create(data: VariableCreate): Promise<void> {
    await this.http.post<void>('/variables', data);
  }

  async update(id: string, data: VariableCreate): Promise<void> {
    await this.http.put<void>(`/variables/${id}`, data);
  }

  async delete(id: string): Promise<void> {
    await this.http.delete<void>(`/variables/${id}`);
  }
}
