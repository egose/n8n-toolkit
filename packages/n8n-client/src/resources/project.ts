import type { PaginatedResponse } from '../pagination.js';
import DataTableClient from '../clients/data-table.js';
import ExecutionClient from '../clients/execution.js';
import FolderClient, { type FolderResourcePage } from '../clients/folder.js';
import ProjectClient from '../clients/project.js';
import VariableClient from '../clients/variable.js';
import WorkflowClient from '../clients/workflow.js';
import { HttpError } from '../http-client.js';
import type {
  Folder,
  FolderCreate,
  FolderDetail,
  FolderListParams,
  FolderListResponse,
  FolderUpdate,
  FolderCreateResult,
  FolderUpdateResult,
  CreateDataTableRequest,
  DataTable,
  ExecutionGetParams,
  ExecutionListParams,
  ExecutionListResponse,
  PaginationParams,
  ProjectCreateResult,
  ProjectListItem,
  ProjectMemberListResponse,
  ProjectMemberRelation,
  ProjectUpdate,
  VariableCreate,
  VariableListParams,
  VariableListResponse,
  VariableUpdate,
  WorkflowCreate,
  WorkflowDetail,
  WorkflowListParams,
  WorkflowListResponse,
} from '../types.js';
import BaseResource from './base.js';
import DataTableResource from './data-table.js';
import ExecutionResource from './execution.js';
import FolderResource from './folder.js';
import VariableResource from './variable.js';
import WorkflowResource from './workflow.js';

export class ProjectWorkflowResourceCollection {
  constructor(
    private readonly projectId: string,
    private readonly workflowsClient: WorkflowClient,
    private readonly executionsClient: ExecutionClient,
    private readonly getProjectWorkflowOrThrow: (id: string) => Promise<WorkflowDetail>,
  ) {}

  list(params?: Omit<WorkflowListParams, 'projectId'>): Promise<WorkflowListResponse> {
    return this.workflowsClient.list({ ...params, projectId: this.projectId });
  }

  listResources(params?: Omit<WorkflowListParams, 'projectId'>): Promise<PaginatedResponse<WorkflowResource>> {
    return this.workflowsClient.listResources({ ...params, projectId: this.projectId });
  }

  get(id: string): Promise<WorkflowDetail> {
    return this.getProjectWorkflowOrThrow(id);
  }

  async getResource(id: string): Promise<WorkflowResource> {
    return new WorkflowResource(this.workflowsClient, this.executionsClient, await this.getProjectWorkflowOrThrow(id));
  }

  createResource(data: Omit<WorkflowCreate, 'projectId'>): Promise<WorkflowResource> {
    return this.workflowsClient.createResource({ ...data, projectId: this.projectId });
  }

  create(data: Omit<WorkflowCreate, 'projectId'>): Promise<import('../types.js').WorkflowDetail> {
    return this.workflowsClient.create({ ...data, projectId: this.projectId });
  }

  async update(
    id: string,
    data: import('../types.js').WorkflowUpdate,
  ): Promise<import('../types.js').WorkflowMutationResult> {
    await this.getProjectWorkflowOrThrow(id);
    return this.workflowsClient.update(id, data);
  }

  async patch(
    id: string,
    data: Partial<import('../types.js').WorkflowUpdate>,
  ): Promise<import('../types.js').Workflow> {
    return (await this.patchResource(id, data)).data;
  }

  async updateResource(id: string, data: import('../types.js').WorkflowUpdate): Promise<WorkflowResource> {
    await this.getProjectWorkflowOrThrow(id);
    return this.workflowsClient.updateResource(id, data);
  }

  async patchResource(id: string, data: Partial<import('../types.js').WorkflowUpdate>): Promise<WorkflowResource> {
    const workflow = await this.getResource(id);
    return workflow.patch(data);
  }
}

export class ProjectFolderResourceCollection {
  constructor(private readonly foldersClient: FolderClient) {}

  list(params?: FolderListParams): Promise<FolderListResponse> {
    return this.foldersClient.list(params);
  }

  listResources(params?: FolderListParams): Promise<FolderResourcePage> {
    return this.foldersClient.listResources(params);
  }

  getResource(id: string): Promise<FolderResource> {
    return this.foldersClient.getResource(id);
  }

  createResource(data: FolderCreate): Promise<FolderResource> {
    return this.foldersClient.createResource(data);
  }

  create(data: FolderCreate): Promise<FolderCreateResult> {
    return this.foldersClient.create(data);
  }

  get(id: string): Promise<FolderDetail> {
    return this.foldersClient.get(id);
  }

  update(id: string, data: FolderUpdate): Promise<FolderUpdateResult> {
    return this.foldersClient.update(id, data);
  }

  async patch(
    id: string,
    data: FolderUpdate,
  ): Promise<Folder | FolderCreateResult | FolderDetail | FolderUpdateResult> {
    return (await this.patchResource(id, data)).data;
  }

  updateResource(id: string, data: FolderUpdate): Promise<FolderResource> {
    return this.foldersClient.updateResource(id, data);
  }

  async patchResource(id: string, data: FolderUpdate): Promise<FolderResource> {
    const folder = await this.foldersClient.getResource(id);
    return folder.patch(data);
  }

  delete(id: string, transferToFolderId?: string): Promise<void> {
    return this.foldersClient.delete(id, transferToFolderId);
  }
}

export class ProjectVariableResourceCollection {
  constructor(
    private readonly projectId: string,
    private readonly variablesClient: VariableClient,
  ) {}

  list(params?: Omit<VariableListParams, 'projectId'>): Promise<VariableListResponse> {
    return this.variablesClient.list({ ...params, projectId: this.projectId });
  }

  listResources(params?: Omit<VariableListParams, 'projectId'>): Promise<PaginatedResponse<VariableResource>> {
    return this.variablesClient.listResources({ ...params, projectId: this.projectId });
  }

  get(id: string): Promise<import('../types.js').Variable> {
    return this.variablesClient.get(id, { projectId: this.projectId });
  }

  getResource(id: string): Promise<VariableResource> {
    return this.variablesClient.getResource(id, { projectId: this.projectId });
  }

  create(data: Omit<VariableCreate, 'projectId'>): Promise<void> {
    return this.variablesClient.create({ ...data, projectId: this.projectId });
  }

  update(id: string, data: Omit<VariableUpdate, 'projectId'>): Promise<void> {
    return this.variablesClient.update(id, { ...data, projectId: this.projectId });
  }

  async patch(id: string, data: Partial<Omit<VariableUpdate, 'projectId'>>): Promise<void> {
    await (await this.getResource(id)).patch(data);
  }

  async updateResource(id: string, data: Omit<VariableUpdate, 'projectId'>): Promise<VariableResource> {
    await this.variablesClient.update(id, { ...data, projectId: this.projectId });
    return this.variablesClient.getResource(id, { projectId: this.projectId });
  }

  async patchResource(id: string, data: Partial<Omit<VariableUpdate, 'projectId'>>): Promise<VariableResource> {
    const variable = await this.variablesClient.getResource(id, { projectId: this.projectId });
    return variable.patch(data);
  }

  async delete(id: string): Promise<void> {
    await this.get(id);
    await this.variablesClient.delete(id);
  }
}

export class ProjectDataTableResourceCollection {
  constructor(
    private readonly projectId: string,
    private readonly dataTablesClient: DataTableClient,
    private readonly getProjectDataTableOrThrow: (id: string) => Promise<DataTable>,
  ) {}

  get(id: string): Promise<DataTable> {
    return this.getProjectDataTableOrThrow(id);
  }

  async getResource(id: string): Promise<DataTableResource> {
    return new DataTableResource(this.dataTablesClient, await this.getProjectDataTableOrThrow(id));
  }

  create(data: Omit<CreateDataTableRequest, 'projectId'>): Promise<DataTable> {
    return this.dataTablesClient.create({ ...data, projectId: this.projectId });
  }

  createResource(data: Omit<CreateDataTableRequest, 'projectId'>): Promise<DataTableResource> {
    return this.dataTablesClient.createResource({ ...data, projectId: this.projectId });
  }

  async update(id: string, data: import('../types.js').UpdateDataTableRequest): Promise<DataTable> {
    await this.getProjectDataTableOrThrow(id);
    return this.dataTablesClient.update(id, data);
  }

  async patch(id: string, data: Partial<import('../types.js').UpdateDataTableRequest>): Promise<DataTable> {
    return (await this.patchResource(id, data)).data;
  }

  async updateResource(id: string, data: import('../types.js').UpdateDataTableRequest): Promise<DataTableResource> {
    await this.getProjectDataTableOrThrow(id);
    return this.dataTablesClient.updateResource(id, data);
  }

  async patchResource(
    id: string,
    data: Partial<import('../types.js').UpdateDataTableRequest>,
  ): Promise<DataTableResource> {
    const dataTable = await this.getResource(id);
    return dataTable.patch(data);
  }

  async delete(id: string): Promise<void> {
    await this.getProjectDataTableOrThrow(id);
    await this.dataTablesClient.delete(id);
  }
}

export class ProjectExecutionResourceCollection {
  constructor(
    private readonly projectId: string,
    private readonly executionsClient: ExecutionClient,
  ) {}

  list(params?: Omit<ExecutionListParams, 'projectId'>): Promise<ExecutionListResponse> {
    return this.executionsClient.list({ ...params, projectId: this.projectId });
  }

  listResources(params?: Omit<ExecutionListParams, 'projectId'>): Promise<PaginatedResponse<ExecutionResource>> {
    return this.executionsClient.listResources({ ...params, projectId: this.projectId });
  }

  get(id: number, params?: ExecutionGetParams): Promise<import('../types.js').Execution> {
    return this.executionsClient.get(id, params);
  }

  getResource(id: number, params?: ExecutionGetParams): Promise<ExecutionResource> {
    return this.executionsClient.getResource(id, params);
  }
}

export default class ProjectResource extends BaseResource<ProjectCreateResult | ProjectListItem> {
  private readonly workflowCollection: ProjectWorkflowResourceCollection;
  private readonly folderCollection: ProjectFolderResourceCollection;
  private readonly variableCollection: ProjectVariableResourceCollection;
  private readonly dataTableCollection: ProjectDataTableResourceCollection;
  private readonly executionCollection: ProjectExecutionResourceCollection;

  constructor(
    private readonly projects: ProjectClient,
    private readonly workflowsClient: WorkflowClient,
    foldersClient: FolderClient,
    variablesClient: VariableClient,
    private readonly dataTablesClient: DataTableClient,
    executionsClient: ExecutionClient,
    project: ProjectCreateResult | ProjectListItem,
  ) {
    super(project);
    this.workflowCollection = new ProjectWorkflowResourceCollection(
      this.id,
      this.workflowsClient,
      executionsClient,
      (id) => this.getProjectWorkflowOrThrow(id),
    );
    this.folderCollection = new ProjectFolderResourceCollection(foldersClient);
    this.variableCollection = new ProjectVariableResourceCollection(this.id, variablesClient);
    this.dataTableCollection = new ProjectDataTableResourceCollection(this.id, this.dataTablesClient, (id) =>
      this.getProjectDataTableOrThrow(id),
    );
    // Execution detail payloads do not expose project ownership, so scoped direct
    // gets rely on server authorization instead of a hidden list scan.
    this.executionCollection = new ProjectExecutionResourceCollection(this.id, executionsClient);
  }

  get id(): string {
    return this.snapshot.id;
  }

  get name(): string {
    return this.snapshot.name;
  }

  get type(): 'personal' | 'team' {
    return this.snapshot.type;
  }

  async refresh(): Promise<this> {
    return this.replaceSnapshot((await this.projects.getResource(this.id)).snapshot);
  }

  async update(data: ProjectUpdate): Promise<this> {
    await this.projects.update(this.id, data);
    return this.refresh();
  }

  async patch(data: ProjectUpdate): Promise<this> {
    return this.update(data);
  }

  async delete(transferId?: string): Promise<void> {
    await this.projects.delete(this.id, transferId);
  }

  async listMembers(params?: PaginationParams): Promise<ProjectMemberListResponse> {
    return this.projects.listMembers(this.id, params);
  }

  async addMembers(relations: ProjectMemberRelation[]): Promise<void> {
    await this.projects.addMembers(this.id, relations);
  }

  async removeMember(userId: string): Promise<void> {
    await this.projects.removeMember(this.id, userId);
  }

  async changeMemberRole(userId: string, role: string): Promise<void> {
    await this.projects.changeMemberRole(this.id, userId, role);
  }

  workflows(): ProjectWorkflowResourceCollection {
    return this.workflowCollection;
  }

  folders(): ProjectFolderResourceCollection {
    return this.folderCollection;
  }

  variables(): ProjectVariableResourceCollection {
    return this.variableCollection;
  }

  dataTables(): ProjectDataTableResourceCollection {
    return this.dataTableCollection;
  }

  executions(): ProjectExecutionResourceCollection {
    return this.executionCollection;
  }

  private async getProjectDataTableOrThrow(id: string): Promise<DataTable> {
    const dataTable = await this.dataTablesClient.get(id);
    if (dataTable.projectId !== this.id) {
      throw new HttpError(404, `Data table not found in project: ${id}`, { id, projectId: this.id });
    }

    return dataTable;
  }

  private async getProjectWorkflowOrThrow(id: string): Promise<WorkflowDetail> {
    const workflow = await this.workflowsClient.get(id);
    if (workflow.shared.some((entry) => entry.projectId === this.id)) {
      return workflow;
    }

    throw new HttpError(404, `Workflow not found in project: ${id}`, { id, projectId: this.id });
  }
}
