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
    return this.snapshot.id;
  }

  get key(): string {
    return this.snapshot.key;
  }

  get value(): string {
    return this.snapshot.value;
  }

  async refresh(): Promise<this> {
    return this.replaceSnapshot((await this.variables.getResource(this.id, this.params)).data);
  }

  async update(data: VariableUpdate): Promise<this> {
    const scopedData = this.params?.projectId !== undefined ? { ...data, projectId: this.params.projectId } : data;
    await this.variables.update(this.id, scopedData);
    const { projectId: _projectId, ...snapshotPatch } = scopedData;
    void _projectId;
    return this.mergeSnapshot(snapshotPatch);
  }

  async patch(data: VariableUpdate): Promise<this> {
    return this.update(data);
  }

  async delete(): Promise<void> {
    await this.variables.delete(this.id);
  }
}
