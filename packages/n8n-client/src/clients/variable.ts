import { HttpError } from '../http-client.js';
import type { PaginatedResponse } from '../pagination.js';
import { encodePathSegment } from '../path.js';
import type { Variable, VariableCreate, VariableListResponse, VariableListParams, VariableUpdate } from '../types.js';
import BaseClient from './base.js';
import VariableResource from '../resources/variable.js';
import { normalizeVariableListResponse } from '../response-mappers.js';

function getVariableResourceScope(params?: VariableListParams): Pick<VariableListParams, 'projectId'> | undefined {
  return params?.projectId === undefined ? undefined : { projectId: params.projectId };
}

export default class VariableClient extends BaseClient {
  async list(params?: VariableListParams): Promise<VariableListResponse> {
    return normalizeVariableListResponse(await this.http.get<VariableListResponse>('/variables', params));
  }

  async get(id: string, params?: VariableListParams): Promise<Variable> {
    const variable = await this.findVariable(id, params);

    if (!variable) {
      throw new HttpError(404, `Variable not found: ${id}`, { id });
    }

    return variable;
  }

  async getResource(id: string, params?: VariableListParams): Promise<VariableResource> {
    return new VariableResource(this, await this.get(id, params), getVariableResourceScope(params));
  }

  async listResources(params?: VariableListParams): Promise<PaginatedResponse<VariableResource>> {
    const response = await this.list(params);

    return {
      data: response.data.map((variable) => new VariableResource(this, variable, getVariableResourceScope(params))),
      nextCursor: response.nextCursor,
    };
  }

  async create(data: VariableCreate): Promise<void> {
    await this.http.post<void>('/variables', data);
  }

  async update(id: string, data: VariableUpdate): Promise<void> {
    await this.http.put<void>(`/variables/${encodePathSegment(id)}`, data);
  }

  async delete(id: string): Promise<void> {
    await this.http.delete<void>(`/variables/${encodePathSegment(id)}`);
  }

  private async findVariable(id: string, params?: VariableListParams): Promise<Variable | undefined> {
    let cursor: string | null | undefined = params?.cursor;

    do {
      const response = await this.list({ ...params, ...(cursor ? { cursor } : {}) });
      const variable = response.data.find((entry) => entry.id === id);

      if (variable) {
        return variable;
      }

      cursor = response.nextCursor;
    } while (cursor);

    return undefined;
  }
}
