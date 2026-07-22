import type { PaginatedResponse } from '../pagination.js';
import type { HttpClient } from '../http-client.js';
import type {
  Credential,
  CredentialCreate,
  CredentialDetail,
  CredentialListResponse,
  CredentialSchema,
  CredentialTestResponse,
  CredentialUpdate,
  PaginationParams,
} from '../types.js';
import BaseClient from './base.js';
import CredentialResource from '../resources/credential.js';
import {
  normalizeCredentialDetail,
  normalizeCredentialListResponse,
  normalizeCredentialSchema,
} from '../response-mappers.js';

export default class CredentialClient extends BaseClient {
  async list(params?: PaginationParams): Promise<CredentialListResponse> {
    return normalizeCredentialListResponse(await this.http.get<CredentialListResponse>('/credentials', params));
  }

  async get(id: string): Promise<CredentialDetail> {
    return normalizeCredentialDetail(await this.http.get<CredentialDetail>(`/credentials/${id}`));
  }

  async getResource(id: string): Promise<CredentialResource> {
    return new CredentialResource(this, await this.get(id));
  }

  async listResources(params?: PaginationParams): Promise<PaginatedResponse<CredentialResource>> {
    const response = await this.list(params);

    return {
      data: response.data.map((credential) => new CredentialResource(this, credential)),
      nextCursor: response.nextCursor,
    };
  }

  async create(data: CredentialCreate): Promise<CredentialDetail> {
    return normalizeCredentialDetail(await this.http.post<CredentialDetail>('/credentials', data));
  }

  async createResource(data: CredentialCreate): Promise<CredentialResource> {
    return new CredentialResource(this, await this.create(data));
  }

  async update(id: string, data: CredentialUpdate): Promise<CredentialDetail> {
    return normalizeCredentialDetail(await this.http.patch<CredentialDetail>(`/credentials/${id}`, data));
  }

  async updateResource(id: string, data: CredentialUpdate): Promise<CredentialResource> {
    return new CredentialResource(this, await this.update(id, data));
  }

  async delete(id: string): Promise<Credential> {
    return this.http.delete<Credential>(`/credentials/${id}`);
  }

  async test(id: string): Promise<CredentialTestResponse> {
    return this.http.post<CredentialTestResponse>(`/credentials/${id}/test`);
  }

  async transfer(id: string, destinationProjectId: string): Promise<void> {
    await this.http.put<void>(`/credentials/${id}/transfer`, { destinationProjectId });
  }

  async getSchema(credentialTypeName: string): Promise<CredentialSchema> {
    return normalizeCredentialSchema(
      await this.http.get<CredentialSchema>(`/credentials/schema/${credentialTypeName}`),
    );
  }
}
