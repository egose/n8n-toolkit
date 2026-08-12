import TagClient from '../clients/tag.js';
import type { Tag, TagMutation, TagMutationResult } from '../types.js';
import BaseResource from './base.js';

export default class TagResource extends BaseResource<Tag | TagMutationResult> {
  constructor(
    private readonly tags: TagClient,
    tag: Tag | TagMutationResult,
  ) {
    super(tag);
  }

  get id(): string {
    return this.snapshot.id;
  }

  get name(): string {
    return this.snapshot.name;
  }

  async update(data: TagMutation): Promise<this> {
    return this.mergeSnapshot(await this.tags.update(this.id, data));
  }

  async patch(data: Partial<TagMutation>): Promise<this> {
    const snapshot = this.snapshot;

    return this.update({
      name: snapshot.name,
      ...data,
    });
  }

  async delete(): Promise<Tag> {
    return this.tags.delete(this.id);
  }
}
