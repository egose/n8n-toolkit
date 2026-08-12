import type { PaginatedResponse } from '../pagination.js';
import ExecutionClient from '../clients/execution.js';
import WorkflowClient from '../clients/workflow.js';
import { HttpError } from '../http-client.js';
import type {
  Execution,
  ExecutionGetParams,
  ExecutionListParams,
  ExecutionListResponse,
  Tag,
  TagId,
  Workflow,
  WorkflowActivateRequest,
  WorkflowUpdate,
  WorkflowVersion,
} from '../types.js';
import BaseResource from './base.js';
import ExecutionResource from './execution.js';

function hasOwn(record: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(record, key);
}

export class WorkflowExecutionResourceCollection {
  constructor(
    private readonly workflowId: string,
    private readonly executionsClient: ExecutionClient,
    private readonly assertExecutionInWorkflow: (execution: Execution) => void,
  ) {}

  list(params?: Omit<ExecutionListParams, 'workflowId'>): Promise<ExecutionListResponse> {
    return this.executionsClient.list({ ...params, workflowId: this.workflowId });
  }

  listResources(params?: Omit<ExecutionListParams, 'workflowId'>): Promise<PaginatedResponse<ExecutionResource>> {
    return this.executionsClient.listResources({ ...params, workflowId: this.workflowId });
  }

  async get(id: number, params?: ExecutionGetParams): Promise<import('../types.js').Execution> {
    const execution = await this.executionsClient.get(id, params);
    this.assertExecutionInWorkflow(execution);
    return execution;
  }

  async getResource(id: number, params?: ExecutionGetParams): Promise<ExecutionResource> {
    const execution = await this.executionsClient.get(id, params);
    this.assertExecutionInWorkflow(execution);
    return new ExecutionResource(this.executionsClient, execution, params);
  }
}

export default class WorkflowResource extends BaseResource<Workflow> {
  private readonly executionCollection: WorkflowExecutionResourceCollection;

  constructor(
    private readonly workflows: WorkflowClient,
    private readonly executionsClient: ExecutionClient,
    workflow: Workflow,
  ) {
    super(workflow);
    this.executionCollection = new WorkflowExecutionResourceCollection(this.id, this.executionsClient, (execution) =>
      this.assertExecutionInWorkflow(execution),
    );
  }

  get id(): string {
    return this.snapshot.id;
  }

  get name(): string {
    return this.snapshot.name;
  }

  get active(): boolean {
    return this.snapshot.active;
  }

  get isArchived(): boolean {
    return this.snapshot.isArchived;
  }

  get versionId(): string {
    return this.snapshot.versionId;
  }

  async update(data: WorkflowUpdate): Promise<this> {
    return this.mergeSnapshot(await this.workflows.update(this.id, data));
  }

  async patch(data: Partial<WorkflowUpdate>): Promise<this> {
    const snapshot = this.snapshot;

    return this.update({
      name: snapshot.name,
      nodes: snapshot.nodes,
      connections: snapshot.connections,
      settings: snapshot.settings,
      ...(hasOwn(snapshot, 'description') ? { description: snapshot.description } : {}),
      ...(hasOwn(snapshot, 'staticData') ? { staticData: snapshot.staticData } : {}),
      ...(hasOwn(snapshot, 'pinData') ? { pinData: snapshot.pinData } : {}),
      ...data,
    });
  }

  async delete(): Promise<Workflow> {
    return this.workflows.delete(this.id);
  }

  async activate(data?: WorkflowActivateRequest): Promise<this> {
    return this.mergeSnapshot(await this.workflows.activate(this.id, data));
  }

  async deactivate(): Promise<this> {
    return this.mergeSnapshot(await this.workflows.deactivate(this.id));
  }

  async archive(): Promise<this> {
    return this.mergeSnapshot(await this.workflows.archive(this.id));
  }

  async unarchive(): Promise<this> {
    return this.mergeSnapshot(await this.workflows.unarchive(this.id));
  }

  async transfer(destinationProjectId: string): Promise<void> {
    await this.workflows.transfer(this.id, destinationProjectId);
  }

  async getTags(): Promise<Tag[]> {
    return this.workflows.getTags(this.id);
  }

  async updateTags(tags: TagId[]): Promise<Tag[]> {
    const updatedTags = await this.workflows.updateTags(this.id, tags);
    this.mergeSnapshot({ tags: updatedTags });
    return updatedTags;
  }

  async getVersion(versionId: string): Promise<WorkflowVersion> {
    return this.workflows.getVersion(this.id, versionId);
  }

  executions(): WorkflowExecutionResourceCollection {
    return this.executionCollection;
  }

  private assertExecutionInWorkflow(execution: Execution): void {
    if (String(execution.workflowId) === this.id) {
      return;
    }

    throw new HttpError(404, `Execution not found in workflow: ${execution.id}`, {
      id: execution.id,
      workflowId: this.id,
    });
  }
}
