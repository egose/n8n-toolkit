import type { CommunityPackage, InstallCommunityPackageRequest, UpdateCommunityPackageRequest } from '../types.js';
import BaseHandle from './base.js';

export default class CommunityPackageHandle extends BaseHandle {
  async list(): Promise<CommunityPackage[]> {
    return this.http.get<CommunityPackage[]>('/community-packages');
  }

  async install(data: InstallCommunityPackageRequest): Promise<CommunityPackage> {
    return this.http.post<CommunityPackage>('/community-packages', data);
  }

  async update(name: string, data?: UpdateCommunityPackageRequest): Promise<CommunityPackage> {
    return this.http.patch<CommunityPackage>(`/community-packages/${name}`, data);
  }

  async uninstall(name: string): Promise<void> {
    await this.http.delete<void>(`/community-packages/${name}`);
  }
}
