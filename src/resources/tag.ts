import TagClient from '../clients/tag.js';
import type { Tag, TagMutation } from '../types.js';
import BaseResource from './base.js';

export default class TagResource extends BaseResource<Tag> {
  constructor(
    private readonly tags: TagClient,
    tag: Tag,
  ) {
    super(tag);
  }

  get id(): string {
    return this.data.id;
  }

  get name(): string {
    return this.data.name;
  }

  async update(data: TagMutation): Promise<this> {
    return this.replaceSnapshot(await this.tags.update(this.id, data));
  }

  async delete(): Promise<Tag> {
    return this.tags.delete(this.id);
  }
}
