import VariableClient from '../clients/variable.js';
import type { Variable, VariableListParams, VariableUpdate } from '../types.js';
import BaseResource from './base.js';

export default class VariableResource extends BaseResource<Variable> {
  constructor(
    private readonly variables: VariableClient,
    variable: Variable,
    private readonly params?: VariableListParams,
  ) {
    super(variable);
  }

  get id(): string {
    return this.data.id;
  }

  get key(): string {
    return this.data.key;
  }

  get value(): string {
    return this.data.value;
  }

  async refresh(): Promise<this> {
    return this.replaceSnapshot((await this.variables.getResource(this.id, this.params)).data);
  }

  async update(data: VariableUpdate): Promise<this> {
    await this.variables.update(this.id, data);
    return this.mergeSnapshot(data);
  }

  async patch(data: VariableUpdate): Promise<this> {
    await this.variables.update(this.id, data);
    return this.mergeSnapshot(data);
  }

  async delete(): Promise<void> {
    await this.variables.delete(this.id);
  }
}
