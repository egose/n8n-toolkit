import CommunityPackageClient from '../clients/community-package.js';
import type { CommunityPackage, UpdateCommunityPackageRequest } from '../types.js';
import BaseResource from './base.js';

export default class CommunityPackageResource extends BaseResource<CommunityPackage> {
  constructor(
    private readonly communityPackages: CommunityPackageClient,
    communityPackage: CommunityPackage,
  ) {
    super(communityPackage);
  }

  get packageName(): string {
    return this.data.packageName;
  }

  get installedVersion(): string {
    return this.data.installedVersion;
  }

  async refresh(): Promise<this> {
    return this.replaceSnapshot((await this.communityPackages.getResource(this.packageName)).data);
  }

  async update(data?: UpdateCommunityPackageRequest): Promise<this> {
    return this.replaceSnapshot(await this.communityPackages.update(this.packageName, data));
  }

  async uninstall(): Promise<void> {
    await this.communityPackages.uninstall(this.packageName);
  }
}
