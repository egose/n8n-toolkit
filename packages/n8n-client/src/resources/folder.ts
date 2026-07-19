import FolderClient from '../clients/folder.js';
import type { Folder, FolderDetail, FolderUpdate } from '../types.js';
import BaseResource from './base.js';

export default class FolderResource extends BaseResource<Folder | FolderDetail> {
  constructor(
    private readonly folders: FolderClient,
    folder: Folder | FolderDetail,
  ) {
    super(folder);
  }

  get id(): string {
    return this.data.id;
  }

  get name(): string {
    return this.data.name;
  }

  get parentFolderId(): string | undefined {
    return this.data.parentFolderId;
  }

  async update(data: FolderUpdate): Promise<this> {
    return this.replaceSnapshot(await this.folders.update(this.id, data));
  }

  async patch(data: FolderUpdate): Promise<this> {
    return this.update({
      name: this.data.name,
      parentFolderId: this.data.parentFolderId,
      ...data,
    });
  }

  async delete(transferToFolderId?: string): Promise<void> {
    await this.folders.delete(this.id, transferToFolderId);
  }
}
