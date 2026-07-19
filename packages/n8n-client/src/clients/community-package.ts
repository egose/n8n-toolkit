import { HttpError } from '../http-client.js';
import type { CommunityPackage, InstallCommunityPackageRequest, UpdateCommunityPackageRequest } from '../types.js';
import BaseClient from './base.js';
import CommunityPackageResource from '../resources/community-package.js';

export default class CommunityPackageClient extends BaseClient {
  async list(): Promise<CommunityPackage[]> {
    return this.http.get<CommunityPackage[]>('/community-packages');
  }

  async listResources(): Promise<CommunityPackageResource[]> {
    const communityPackages = await this.list();
    return communityPackages.map((communityPackage) => new CommunityPackageResource(this, communityPackage));
  }

  async getResource(name: string): Promise<CommunityPackageResource> {
    const communityPackages = await this.list();
    const communityPackage = communityPackages.find((entry) => entry.packageName === name);

    if (!communityPackage) {
      throw new HttpError(404, `Community package not found: ${name}`, { name });
    }

    return new CommunityPackageResource(this, communityPackage);
  }

  async install(data: InstallCommunityPackageRequest): Promise<CommunityPackage> {
    return this.http.post<CommunityPackage>('/community-packages', data);
  }

  async installResource(data: InstallCommunityPackageRequest): Promise<CommunityPackageResource> {
    return new CommunityPackageResource(this, await this.install(data));
  }

  async update(name: string, data?: UpdateCommunityPackageRequest): Promise<CommunityPackage> {
    return this.http.patch<CommunityPackage>(`/community-packages/${name}`, data);
  }

  async updateResource(name: string, data?: UpdateCommunityPackageRequest): Promise<CommunityPackageResource> {
    return new CommunityPackageResource(this, await this.update(name, data));
  }

  async uninstall(name: string): Promise<void> {
    await this.http.delete<void>(`/community-packages/${name}`);
  }
}
