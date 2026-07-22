import type { PaginatedResponse } from '../pagination.js';
import ExecutionClient from '../clients/execution.js';
import WorkflowClient from '../clients/workflow.js';
import { HttpError } from '../http-client.js';
import type {
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

export interface WorkflowExecutionResourceCollection {
  list(params?: Omit<ExecutionListParams, 'workflowId'>): Promise<ExecutionListResponse>;
  listResources(params?: Omit<ExecutionListParams, 'workflowId'>): Promise<PaginatedResponse<ExecutionResource>>;
  get(id: number, params?: ExecutionGetParams): Promise<import('../types.js').Execution>;
  getResource(id: number, params?: ExecutionGetParams): Promise<ExecutionResource>;
}

export default class WorkflowResource extends BaseResource<Workflow> {
  constructor(
    private readonly workflows: WorkflowClient,
    private readonly executionsClient: ExecutionClient,
    workflow: Workflow,
  ) {
    super(workflow);
  }

  get id(): string {
    return this.data.id;
  }

  get name(): string {
    return this.data.name;
  }

  get active(): boolean {
    return this.data.active;
  }

  get isArchived(): boolean {
    return this.data.isArchived;
  }

  get versionId(): string {
    return this.data.versionId;
  }

  async update(data: WorkflowUpdate): Promise<this> {
    return this.replaceSnapshot(await this.workflows.update(this.id, data));
  }

  async patch(data: Partial<WorkflowUpdate>): Promise<this> {
    return this.update({
      name: this.data.name,
      description: this.data.description,
      nodes: this.data.nodes,
      connections: this.data.connections,
      settings: this.data.settings ?? {},
      staticData: this.data.staticData,
      pinData: this.data.pinData,
      ...data,
    });
  }

  async delete(): Promise<Workflow> {
    return this.workflows.delete(this.id);
  }

  async activate(data?: WorkflowActivateRequest): Promise<this> {
    return this.replaceSnapshot(await this.workflows.activate(this.id, data));
  }

  async deactivate(): Promise<this> {
    return this.replaceSnapshot(await this.workflows.deactivate(this.id));
  }

  async archive(): Promise<this> {
    return this.replaceSnapshot(await this.workflows.archive(this.id));
  }

  async unarchive(): Promise<this> {
    return this.replaceSnapshot(await this.workflows.unarchive(this.id));
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
    return {
      list: (params) => this.executionsClient.list({ ...params, workflowId: this.id }),
      listResources: (params) => this.executionsClient.listResources({ ...params, workflowId: this.id }),
      get: async (id, params) => {
        if (!(await this.hasExecutionInWorkflow(id))) {
          throw new HttpError(404, `Execution not found in workflow: ${id}`, { id, workflowId: this.id });
        }

        return this.executionsClient.get(id, params);
      },
      getResource: async (id, params) => {
        if (!(await this.hasExecutionInWorkflow(id))) {
          throw new HttpError(404, `Execution not found in workflow: ${id}`, { id, workflowId: this.id });
        }

        return this.executionsClient.getResource(id, params);
      },
    };
  }

  private async hasExecutionInWorkflow(id: number): Promise<boolean> {
    let cursor: string | null | undefined;

    do {
      const response = await this.executionsClient.list({ workflowId: this.id, ...(cursor ? { cursor } : {}) });
      if (response.data.some((execution) => execution.id === id)) {
        return true;
      }

      cursor = response.nextCursor;
    } while (cursor);

    return false;
  }
}
