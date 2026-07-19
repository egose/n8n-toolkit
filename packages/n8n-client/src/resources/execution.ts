import ExecutionClient from '../clients/execution.js';
import type { Execution, ExecutionRetryRequest, ExecutionGetParams, Tag, TagId } from '../types.js';
import BaseResource from './base.js';

export default class ExecutionResource extends BaseResource<Execution> {
  constructor(
    private readonly executions: ExecutionClient,
    execution: Execution,
    private readonly params?: ExecutionGetParams,
  ) {
    super(execution);
  }

  get id(): number {
    return this.data.id;
  }

  get status(): Execution['status'] {
    return this.data.status;
  }

  async refresh(): Promise<this> {
    return this.replaceSnapshot(await this.executions.get(this.id, this.params));
  }

  async delete(): Promise<Execution> {
    return this.executions.delete(this.id);
  }

  async retry(data?: ExecutionRetryRequest): Promise<this> {
    return this.replaceSnapshot(await this.executions.retry(this.id, data));
  }

  async stop(): Promise<this> {
    return this.replaceSnapshot(await this.executions.stop(this.id));
  }

  async getTags(): Promise<Tag[]> {
    return this.executions.getTags(this.id);
  }

  async updateTags(tags: TagId[]): Promise<Tag[]> {
    return this.executions.updateTags(this.id, tags);
  }
}
