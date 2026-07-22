import CredentialClient from '../clients/credential.js';
import type {
  Credential,
  CredentialResponse,
  CredentialSchema,
  CredentialTestResponse,
  CredentialUpdate,
} from '../types.js';
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

  async patch(data: CredentialUpdate): Promise<this> {
    return this.update({
      name: this.data.name,
      type: this.data.type,
      ...('data' in this.data && this.data.data ? { data: this.data.data } : {}),
      ...('isGlobal' in this.data ? { isGlobal: this.data.isGlobal } : {}),
      ...(this.data.isResolvable !== undefined ? { isResolvable: this.data.isResolvable } : {}),
      ...data,
    });
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

  async getSchema(): Promise<CredentialSchema> {
    return this.credentials.getSchema(this.type);
  }
}
