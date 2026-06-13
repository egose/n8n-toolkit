import CredentialClient from '../clients/credential.js';
import type { Credential, CredentialResponse, CredentialTestResponse, CredentialUpdate, JsonObject } from '../types.js';
import BaseResource from './base.js';

export default class CredentialResource extends BaseResource<Credential | CredentialResponse> {
  constructor(
    private readonly credentials: CredentialClient,
    credential: Credential | CredentialResponse,
  ) {
    super(credential);
  }

  get id(): string {
    return this.data.id;
  }

  get name(): string {
    return this.data.name;
  }

  get type(): string {
    return this.data.type;
  }

  async update(data: CredentialUpdate): Promise<this> {
    return this.replaceSnapshot(await this.credentials.update(this.id, data));
  }

  async delete(): Promise<Credential> {
    return this.credentials.delete(this.id);
  }

  async test(): Promise<CredentialTestResponse> {
    return this.credentials.test(this.id);
  }

  async transfer(destinationProjectId: string): Promise<void> {
    await this.credentials.transfer(this.id, destinationProjectId);
  }

  async getSchema(): Promise<JsonObject> {
    return this.credentials.getSchema(this.type);
  }
}
