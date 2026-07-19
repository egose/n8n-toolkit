import UserClient from '../clients/user.js';
import type { User, UserGetParams } from '../types.js';
import BaseResource from './base.js';

export default class UserResource extends BaseResource<User> {
  constructor(
    private readonly users: UserClient,
    user: User,
    private readonly params?: UserGetParams,
  ) {
    super(user);
  }

  get id(): string {
    return this.data.id;
  }

  get email(): string {
    return this.data.email;
  }

  async refresh(): Promise<this> {
    return this.replaceSnapshot(await this.users.get(this.id, this.params));
  }

  async delete(): Promise<void> {
    await this.users.delete(this.id);
  }

  async changeRole(newRoleName: string): Promise<this> {
    await this.users.changeRole(this.id, newRoleName);
    return this.mergeSnapshot({ role: newRoleName });
  }
}
