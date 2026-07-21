import type { PaginatedResponse } from '../pagination.js';
import DataTableClient from '../clients/data-table.js';
import ExecutionClient from '../clients/execution.js';
import FolderClient from '../clients/folder.js';
import ProjectClient from '../clients/project.js';
import VariableClient from '../clients/variable.js';
import WorkflowClient from '../clients/workflow.js';
import { HttpError } from '../http-client.js';
import type {
  FolderCreate,
  FolderDetail,
  FolderListParams,
  FolderListResponse,
  FolderUpdate,
  CreateDataTableRequest,
  DataTable,
  DataTableListParams,
  DataTableListResponse,
  ExecutionGetParams,
  ExecutionListParams,
  ExecutionListResponse,
  PaginationParams,
  Project,
  ProjectListItem,
  ProjectMemberListResponse,
  ProjectMemberRelation,
  ProjectUpdate,
  VariableCreate,
  VariableListParams,
  VariableListResponse,
  VariableUpdate,
  WorkflowCreate,
  WorkflowListParams,
  WorkflowListResponse,
} from '../types.js';
import BaseResource from './base.js';
import DataTableResource from './data-table.js';
import ExecutionResource from './execution.js';
import FolderResource from './folder.js';
import VariableResource from './variable.js';
import WorkflowResource from './workflow.js';

export interface ProjectWorkflowResourceCollection {
  list(params?: Omit<WorkflowListParams, 'projectId'>): Promise<WorkflowListResponse>;
  listResources(params?: Omit<WorkflowListParams, 'projectId'>): Promise<PaginatedResponse<WorkflowResource>>;
  get(id: string): Promise<import('../types.js').Workflow>;
  getResource(id: string): Promise<WorkflowResource>;
  createResource(data: Omit<WorkflowCreate, 'projectId'>): Promise<WorkflowResource>;
  create(data: Omit<WorkflowCreate, 'projectId'>): Promise<import('../types.js').Workflow>;
  update(id: string, data: import('../types.js').WorkflowUpdate): Promise<import('../types.js').Workflow>;
  patch(id: string, data: Partial<import('../types.js').WorkflowUpdate>): Promise<import('../types.js').Workflow>;
  updateResource(id: string, data: import('../types.js').WorkflowUpdate): Promise<WorkflowResource>;
  patchResource(id: string, data: Partial<import('../types.js').WorkflowUpdate>): Promise<WorkflowResource>;
}

export interface ProjectFolderResourceCollection {
  list(params?: FolderListParams): Promise<FolderListResponse>;
  listResources(params?: FolderListParams): Promise<PaginatedResponse<FolderResource>>;
  getResource(id: string): Promise<FolderResource>;
  createResource(data: FolderCreate): Promise<FolderResource>;
  create(data: FolderCreate): Promise<import('../types.js').Folder>;
  get(id: string): Promise<FolderDetail>;
  update(id: string, data: FolderUpdate): Promise<import('../types.js').Folder>;
  patch(id: string, data: FolderUpdate): Promise<import('../types.js').Folder | FolderDetail>;
  updateResource(id: string, data: FolderUpdate): Promise<FolderResource>;
  patchResource(id: string, data: FolderUpdate): Promise<FolderResource>;
  delete(id: string, transferToFolderId?: string): Promise<void>;
}

export interface ProjectVariableResourceCollection {
  list(params?: Omit<VariableListParams, 'projectId'>): Promise<VariableListResponse>;
  listResources(params?: Omit<VariableListParams, 'projectId'>): Promise<PaginatedResponse<VariableResource>>;
  get(id: string): Promise<import('../types.js').Variable>;
  getResource(id: string): Promise<VariableResource>;
  create(data: Omit<VariableCreate, 'projectId'>): Promise<void>;
  update(id: string, data: Omit<VariableUpdate, 'projectId'>): Promise<void>;
  patch(id: string, data: Partial<Omit<VariableUpdate, 'projectId'>>): Promise<void>;
  updateResource(id: string, data: Omit<VariableUpdate, 'projectId'>): Promise<VariableResource>;
  patchResource(id: string, data: Partial<Omit<VariableUpdate, 'projectId'>>): Promise<VariableResource>;
  delete(id: string): Promise<void>;
}

export interface ProjectDataTableResourceCollection {
  get(id: string): Promise<DataTable>;
  getResource(id: string): Promise<DataTableResource>;
  create(data: Omit<CreateDataTableRequest, 'projectId'>): Promise<DataTable>;
  createResource(data: Omit<CreateDataTableRequest, 'projectId'>): Promise<DataTableResource>;
  update(id: string, data: import('../types.js').UpdateDataTableRequest): Promise<DataTable>;
  patch(id: string, data: Partial<import('../types.js').UpdateDataTableRequest>): Promise<DataTable>;
  updateResource(id: string, data: import('../types.js').UpdateDataTableRequest): Promise<DataTableResource>;
  patchResource(id: string, data: Partial<import('../types.js').UpdateDataTableRequest>): Promise<DataTableResource>;
  delete(id: string): Promise<void>;
}

export interface ProjectExecutionResourceCollection {
  list(params?: Omit<ExecutionListParams, 'projectId'>): Promise<ExecutionListResponse>;
  listResources(params?: Omit<ExecutionListParams, 'projectId'>): Promise<PaginatedResponse<ExecutionResource>>;
  get(id: number, params?: ExecutionGetParams): Promise<import('../types.js').Execution>;
  getResource(id: number, params?: ExecutionGetParams): Promise<ExecutionResource>;
}

interface ProjectRelations {
  workflows: WorkflowClient;
  folders: FolderClient;
  variables: VariableClient;
  dataTables: DataTableClient;
  executions: ExecutionClient;
}

export default class ProjectResource extends BaseResource<Project | ProjectListItem> {
  private readonly relations: ProjectRelations;

  constructor(
    private readonly projects: ProjectClient,
    workflowsClient: WorkflowClient,
    foldersClient: FolderClient,
    variablesClient: VariableClient,
    dataTablesClient: DataTableClient,
    executionsClient: ExecutionClient,
    project: Project | ProjectListItem,
  ) {
    super(project);
    this.relations = {
      workflows: workflowsClient,
      folders: foldersClient,
      variables: variablesClient,
      dataTables: dataTablesClient,
      executions: executionsClient,
    };
  }

  get id(): string {
    return this.data.id;
  }

  get name(): string {
    return this.data.name;
  }

  get type(): 'personal' | 'team' {
    return this.data.type;
  }

  async update(data: ProjectUpdate): Promise<this> {
    await this.projects.update(this.id, data);
    return this.mergeSnapshot(data);
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
    return {
      list: (params) => this.relations.workflows.list({ ...params, projectId: this.id }),
      listResources: async (params) => {
        const response = await this.relations.workflows.listResources({ ...params, projectId: this.id });
        return response;
      },
      get: async (id) => {
        if (
          !(await this.hasResourceInProject({
            listPage: (cursor) => this.relations.workflows.list({ projectId: this.id, cursor }),
            matches: (workflow) => workflow.id === id,
          }))
        ) {
          throw new HttpError(404, `Workflow not found in project: ${id}`, { id, projectId: this.id });
        }

        return this.relations.workflows.get(id);
      },
      getResource: async (id) => {
        if (
          !(await this.hasResourceInProject({
            listPage: (cursor) => this.relations.workflows.list({ projectId: this.id, cursor }),
            matches: (workflow) => workflow.id === id,
          }))
        ) {
          throw new HttpError(404, `Workflow not found in project: ${id}`, { id, projectId: this.id });
        }

        return this.relations.workflows.getResource(id);
      },
      createResource: (data) => this.relations.workflows.createResource({ ...data, projectId: this.id }),
      create: (data) => this.relations.workflows.create({ ...data, projectId: this.id }),
      update: async (id, data) => {
        if (
          !(await this.hasResourceInProject({
            listPage: (cursor) => this.relations.workflows.list({ projectId: this.id, cursor }),
            matches: (workflow) => workflow.id === id,
          }))
        ) {
          throw new HttpError(404, `Workflow not found in project: ${id}`, { id, projectId: this.id });
        }

        return this.relations.workflows.update(id, data);
      },
      patch: async (id, data) => (await this.workflows().patchResource(id, data)).data,
      updateResource: async (id, data) => {
        if (
          !(await this.hasResourceInProject({
            listPage: (cursor) => this.relations.workflows.list({ projectId: this.id, cursor }),
            matches: (workflow) => workflow.id === id,
          }))
        ) {
          throw new HttpError(404, `Workflow not found in project: ${id}`, { id, projectId: this.id });
        }

        return this.relations.workflows.updateResource(id, data);
      },
      patchResource: async (id, data) => {
        const workflow = await this.workflows().getResource(id);
        return workflow.patch(data);
      },
    };
  }

  folders(): ProjectFolderResourceCollection {
    return {
      list: (params) => this.relations.folders.list(params),
      listResources: (params) => this.relations.folders.listResources(params),
      getResource: (id) => this.relations.folders.getResource(id),
      createResource: (data) => this.relations.folders.createResource(data),
      create: (data) => this.relations.folders.create(data),
      get: (id) => this.relations.folders.get(id),
      update: (id, data) => this.relations.folders.update(id, data),
      patch: async (id, data) => (await this.folders().patchResource(id, data)).data,
      updateResource: (id, data) => this.relations.folders.updateResource(id, data),
      patchResource: async (id, data) => {
        const folder = await this.relations.folders.getResource(id);
        return folder.patch(data);
      },
      delete: (id, transferToFolderId) => this.relations.folders.delete(id, transferToFolderId),
    };
  }

  variables(): ProjectVariableResourceCollection {
    return {
      list: (params) => this.relations.variables.list({ ...params, projectId: this.id }),
      listResources: (params) => this.relations.variables.listResources({ ...params, projectId: this.id }),
      get: (id) => this.relations.variables.get(id, { projectId: this.id }),
      getResource: (id) => this.relations.variables.getResource(id, { projectId: this.id }),
      create: (data) => this.relations.variables.create({ ...data, projectId: this.id }),
      update: (id, data) => this.relations.variables.update(id, { ...data, projectId: this.id }),
      patch: async (id, data) => {
        await (await this.variables().getResource(id)).patch(data);
      },
      updateResource: async (id, data) => {
        await this.relations.variables.update(id, { ...data, projectId: this.id });
        return this.relations.variables.getResource(id, { projectId: this.id });
      },
      patchResource: async (id, data) => {
        const variable = await this.relations.variables.getResource(id, { projectId: this.id });
        return variable.patch(data);
      },
      delete: (id) => this.relations.variables.delete(id),
    };
  }

  dataTables(): ProjectDataTableResourceCollection {
    return {
      get: (id) => this.getProjectDataTableOrThrow(id),
      getResource: async (id) =>
        new DataTableResource(this.relations.dataTables, await this.getProjectDataTableOrThrow(id)),
      create: (data) => this.relations.dataTables.create({ ...data, projectId: this.id }),
      createResource: (data) => this.relations.dataTables.createResource({ ...data, projectId: this.id }),
      update: async (id, data) => {
        await this.getProjectDataTableOrThrow(id);
        return this.relations.dataTables.update(id, data);
      },
      patch: async (id, data) => (await this.dataTables().patchResource(id, data)).data,
      updateResource: async (id, data) => {
        await this.getProjectDataTableOrThrow(id);
        return this.relations.dataTables.updateResource(id, data);
      },
      patchResource: async (id, data) => {
        const dataTable = await this.dataTables().getResource(id);
        return dataTable.patch(data);
      },
      delete: async (id) => {
        await this.getProjectDataTableOrThrow(id);
        await this.relations.dataTables.delete(id);
      },
    };
  }

  executions(): ProjectExecutionResourceCollection {
    return {
      list: (params) => this.relations.executions.list({ ...params, projectId: this.id }),
      listResources: (params) => this.relations.executions.listResources({ ...params, projectId: this.id }),
      get: async (id, params) => {
        if (
          !(await this.hasResourceInProject({
            listPage: (cursor) => this.relations.executions.list({ projectId: this.id, cursor }),
            matches: (execution) => execution.id === id,
          }))
        ) {
          throw new HttpError(404, `Execution not found in project: ${id}`, { id, projectId: this.id });
        }

        return this.relations.executions.get(id, params);
      },
      getResource: async (id, params) => {
        if (
          !(await this.hasResourceInProject({
            listPage: (cursor) => this.relations.executions.list({ projectId: this.id, cursor }),
            matches: (execution) => execution.id === id,
          }))
        ) {
          throw new HttpError(404, `Execution not found in project: ${id}`, { id, projectId: this.id });
        }

        return this.relations.executions.getResource(id, params);
      },
    };
  }

  private async getProjectDataTableOrThrow(id: string): Promise<DataTable> {
    const dataTable = await this.relations.dataTables.get(id);
    if (dataTable.projectId !== this.id) {
      throw new HttpError(404, `Data table not found in project: ${id}`, { id, projectId: this.id });
    }

    return dataTable;
  }

  private async hasResourceInProject<T>(options: {
    listPage: (cursor?: string) => Promise<{ data: T[]; nextCursor?: string }>;
    matches: (resource: T) => boolean;
  }): Promise<boolean> {
    let cursor: string | undefined;

    do {
      const response = await options.listPage(cursor);
      if (response.data.some(options.matches)) {
        return true;
      }

      cursor = response.nextCursor;
    } while (cursor);

    return false;
  }
}
