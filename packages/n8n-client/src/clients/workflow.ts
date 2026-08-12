import type { PaginatedResponse, PaginationParams } from '../pagination.js';
import { encodePathSegment } from '../path.js';
import ExecutionClient from './execution.js';
import type {
  Workflow,
  WorkflowDetail,
  WorkflowCreate,
  WorkflowMutationResult,
  WorkflowUpdate,
  WorkflowListResponse,
  WorkflowVersion,
  WorkflowListParams,
  WorkflowGetParams,
  WorkflowActivateRequest,
  Tag,
  TagId,
  TestRunListParams,
  TestRunListResponse,
  TestRunSummary,
  TestCaseExecutionListResponse,
} from '../types.js';
import BaseClient from './base.js';
import WorkflowResource from '../resources/workflow.js';
import {
  normalizeTag,
  normalizeTestCaseExecutionListResponse,
  normalizeTestRunListResponse,
  normalizeWorkflow,
  normalizeWorkflowListResponse,
  normalizeWorkflowMutation,
} from '../response-mappers.js';

export default class WorkflowClient extends BaseClient {
  private readonly executions = new ExecutionClient(this.http);

  async list(params?: WorkflowListParams): Promise<WorkflowListResponse> {
    return normalizeWorkflowListResponse(await this.http.get<WorkflowListResponse>('/workflows', params));
  }

  async get(id: string, params?: WorkflowGetParams): Promise<WorkflowDetail> {
    return normalizeWorkflow(await this.http.get<WorkflowDetail>(`/workflows/${encodePathSegment(id)}`, params));
  }

  async getResource(id: string, params?: WorkflowGetParams): Promise<WorkflowResource> {
    return new WorkflowResource(this, this.executions, await this.get(id, params));
  }

  async listResources(params?: WorkflowListParams): Promise<PaginatedResponse<WorkflowResource>> {
    const response = await this.list(params);

    return {
      data: response.data.map((workflow) => new WorkflowResource(this, this.executions, workflow)),
      nextCursor: response.nextCursor,
    };
  }

  async create(data: WorkflowCreate): Promise<WorkflowDetail> {
    return normalizeWorkflow(await this.http.post<WorkflowDetail>('/workflows', data));
  }

  async createResource(data: WorkflowCreate): Promise<WorkflowResource> {
    return new WorkflowResource(this, this.executions, await this.create(data));
  }

  async update(id: string, data: WorkflowUpdate): Promise<WorkflowMutationResult> {
    return normalizeWorkflowMutation(
      await this.http.put<WorkflowMutationResult>(`/workflows/${encodePathSegment(id)}`, data),
    );
  }

  async updateResource(id: string, data: WorkflowUpdate): Promise<WorkflowResource> {
    await this.update(id, data);
    return this.getResource(id);
  }

  async delete(id: string): Promise<Workflow> {
    return normalizeWorkflow(await this.http.delete<Workflow>(`/workflows/${encodePathSegment(id)}`));
  }

  async activate(id: string, data?: WorkflowActivateRequest): Promise<WorkflowMutationResult> {
    return normalizeWorkflowMutation(
      await this.http.post<WorkflowMutationResult>(`/workflows/${encodePathSegment(id)}/activate`, data),
    );
  }

  async deactivate(id: string): Promise<WorkflowMutationResult> {
    return normalizeWorkflowMutation(
      await this.http.post<WorkflowMutationResult>(`/workflows/${encodePathSegment(id)}/deactivate`),
    );
  }

  async archive(id: string): Promise<WorkflowMutationResult> {
    return normalizeWorkflowMutation(
      await this.http.post<WorkflowMutationResult>(`/workflows/${encodePathSegment(id)}/archive`),
    );
  }

  async unarchive(id: string): Promise<WorkflowMutationResult> {
    return normalizeWorkflowMutation(
      await this.http.post<WorkflowMutationResult>(`/workflows/${encodePathSegment(id)}/unarchive`),
    );
  }

  async transfer(id: string, destinationProjectId: string): Promise<void> {
    await this.http.put<void>(`/workflows/${encodePathSegment(id)}/transfer`, { destinationProjectId });
  }

  async getTags(id: string): Promise<Tag[]> {
    return ((await this.http.get<Tag[]>(`/workflows/${encodePathSegment(id)}/tags`)) ?? []).map(normalizeTag);
  }

  async updateTags(id: string, tags: TagId[]): Promise<Tag[]> {
    return ((await this.http.put<Tag[]>(`/workflows/${encodePathSegment(id)}/tags`, tags)) ?? []).map(normalizeTag);
  }

  async getVersion(id: string, versionId: string): Promise<WorkflowVersion> {
    return this.http.get<WorkflowVersion>(`/workflows/${encodePathSegment(id)}/${encodePathSegment(versionId)}`);
  }

  async listTestRuns(id: string, params?: TestRunListParams): Promise<TestRunListResponse> {
    return normalizeTestRunListResponse(
      await this.http.get<TestRunListResponse>(`/workflows/${encodePathSegment(id)}/test-runs`, params),
    );
  }

  async getTestRun(id: string, runId: string): Promise<TestRunSummary> {
    return this.http.get<TestRunSummary>(`/workflows/${encodePathSegment(id)}/test-runs/${encodePathSegment(runId)}`);
  }

  async listTestCases(id: string, runId: string, params?: PaginationParams): Promise<TestCaseExecutionListResponse> {
    return normalizeTestCaseExecutionListResponse(
      await this.http.get<TestCaseExecutionListResponse>(
        `/workflows/${encodePathSegment(id)}/test-runs/${encodePathSegment(runId)}/test-cases`,
        params,
      ),
    );
  }
}
