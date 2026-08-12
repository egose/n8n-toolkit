import FolderClient from '../clients/folder.js';
import type { Folder, FolderCreateResult, FolderDetail, FolderUpdate, FolderUpdateResult } from '../types.js';
import BaseResource from './base.js';

export default class FolderResource extends BaseResource<
  Folder | FolderCreateResult | FolderDetail | FolderUpdateResult
> {
  constructor(
    private readonly folders: FolderClient,
    folder: Folder | FolderCreateResult | FolderDetail | FolderUpdateResult,
  ) {
    super(folder);
  }

  get id(): string {
    return this.snapshot.id;
  }

  get name(): string {
    return this.snapshot.name;
  }

  get parentFolderId(): string | null | undefined {
    return this.snapshot.parentFolderId;
  }

  async update(data: FolderUpdate): Promise<this> {
    return this.mergeSnapshot(await this.folders.update(this.id, data));
  }

  async patch(data: FolderUpdate): Promise<this> {
    return this.update(data);
  }

  async delete(transferToFolderId?: string): Promise<void> {
    await this.folders.delete(this.id, transferToFolderId);
  }
}
