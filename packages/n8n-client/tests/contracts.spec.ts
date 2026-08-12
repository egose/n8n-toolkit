import { describe, expectTypeOf, test } from 'vitest';
import N8nClient from '../src/index';
import AuditClient from '../src/clients/audit';
import CommunityPackageClient from '../src/clients/community-package';
import CredentialClient from '../src/clients/credential';
import ProjectClient from '../src/clients/project';
import DataTableClient from '../src/clients/data-table';
import DiscoverClient from '../src/clients/discover';
import ExecutionClient from '../src/clients/execution';
import FolderClient, { type FolderResourcePage } from '../src/clients/folder';
import InsightsClient from '../src/clients/insights';
import N8nPackageClient from '../src/clients/n8n-package';
import SecurityPolicyClient from '../src/clients/security-policy';
import SourceControlClient from '../src/clients/source-control';
import TagClient from '../src/clients/tag';
import UserClient from '../src/clients/user';
import VariableClient from '../src/clients/variable';
import WorkflowClient from '../src/clients/workflow';
import CredentialResource from '../src/resources/credential';
import CommunityPackageResource from '../src/resources/community-package';
import DataTableResource from '../src/resources/data-table';
import ExecutionResource from '../src/resources/execution';
import FolderResource from '../src/resources/folder';
import type { ProjectDataTableResourceCollection } from '../src/resources/project';
import type { ProjectExecutionResourceCollection } from '../src/resources/project';
import ProjectResource from '../src/resources/project';
import type { ProjectFolderResourceCollection } from '../src/resources/project';
import type { ProjectVariableResourceCollection } from '../src/resources/project';
import type { ProjectWorkflowResourceCollection } from '../src/resources/project';
import TagResource from '../src/resources/tag';
import UserResource from '../src/resources/user';
import VariableResource from '../src/resources/variable';
import type { WorkflowExecutionResourceCollection } from '../src/resources/workflow';
import WorkflowResource from '../src/resources/workflow';
import type {
  ApiKeyScope,
  Audit,
  AuditCommunityLocation,
  AuditCredentialLocation,
  AuditNodeLocation,
  AuditRisk,
  AuditRequest,
  CommunityPackage,
  CommunityPackageNode,
  CreateDataTableRequest,
  Credential,
  CredentialCreate,
  CredentialListResponse,
  CredentialResponse,
  CredentialSchema,
  CredentialTestResponse,
  CredentialUpdate,
  DataTable,
  DataTableColumn,
  DataTableListParams,
  DataTableListResponse,
  DataTableRow,
  DataTableRowListParams,
  DataTableRowListResponse,
  DeleteRowsBooleanParams,
  DeleteRowsDataParams,
  DiscoverFilter,
  DiscoverParams,
  DiscoverResource,
  DiscoverResponse,
  Execution,
  ExecutionGetParams,
  ExecutionListParams,
  ExecutionListResponse,
  ExecutionRetryRequest,
  ExportWorkflowsRequest,
  Folder,
  FolderCreateResult,
  FolderCreate,
  FolderDetail,
  FolderListParams,
  FolderListResponse,
  FolderUpdate,
  FolderUpdateResult,
  ImportPackageOptions,
  ImportPackageResponse,
  InsightsSummary,
  InsightsSummaryParams,
  InstallCommunityPackageRequest,
  PaginationParams,
  Project,
  ProjectCreateResult,
  ProjectEffectiveScope,
  ProjectCreate,
  ProjectListResponse,
  ProjectMemberListResponse,
  ProjectWithPermissions,
  ProjectUpdate,
  PullRequest,
  SecurityPolicy,
  SecurityPolicyUpdate,
  SourceControlledFile,
  StopManyExecutionsRequest,
  StopManyExecutionsResponse,
  Tag,
  TagListResponse,
  TagMutationResult,
  TagMutation,
  User,
  UserCreate,
  UserCreateResponse,
  UserGetParams,
  UserListParams,
  UserListResponse,
  ClearRowsResponse,
  TestCaseExecutionListResponse,
  TestRunListParams,
  TestRunListResponse,
  TestRunSummary,
  UpdateColumnRequest,
  UpdateCommunityPackageRequest,
  UpdateDataTableRequest,
  UpdateRowsBooleanRequest,
  UpdateRowsDataRequest,
  UpsertRowBooleanRequest,
  UpsertRowDataRequest,
  Variable,
  VariableCreate,
  VariableListParams,
  VariableListResponse,
  VariableUpdate,
  Workflow,
  WorkflowDetail,
  WorkflowActivateRequest,
  WorkflowConnections,
  WorkflowCreate,
  WorkflowGetParams,
  WorkflowMutationResult,
  WorkflowListParams,
  WorkflowListItem,
  WorkflowListResponse,
  WorkflowNodeTelemetryTags,
  WorkflowPinData,
  WorkflowTelemetryTag,
  WorkflowUpdate,
  WorkflowVersion,
} from '../src/types';
import type { PaginatedResponse } from '../src/pagination';
import { createMockHttpClient } from './test-utils';

describe('Public API contracts', () => {
  test('N8nClient does not expose the transport field', () => {
    type ClientHasHttp = 'http' extends keyof N8nClient ? true : false;
    expectTypeOf<ClientHasHttp>().toEqualTypeOf<false>();
  });

  test('ProjectClient does not expose unsupported get()', () => {
    type ProjectClientHasGet = 'get' extends keyof ProjectClient ? true : false;
    expectTypeOf<ProjectClientHasGet>().toEqualTypeOf<false>();
  });

  test('DiscoverResponse nests filters and specUrl under data', () => {
    expectTypeOf<DiscoverResponse>().toEqualTypeOf<{
      data: {
        apiKeyScopes: ApiKeyScope[];
        resources: Record<string, DiscoverResource>;
        filters: Record<string, DiscoverFilter>;
        specUrl: string;
      };
    }>();
  });

  test('API-key scopes and project-effective scopes stay distinct in the public types', () => {
    type ApiKeyScopesExtendProjectScopes = ApiKeyScope[] extends ProjectEffectiveScope[] ? true : false;
    type ProjectScopesExtendApiKeyScopes = ProjectEffectiveScope[] extends ApiKeyScope[] ? true : false;

    expectTypeOf<ApiKeyScopesExtendProjectScopes>().toEqualTypeOf<false>();
    expectTypeOf<ProjectScopesExtendApiKeyScopes>().toEqualTypeOf<false>();
  });

  test('DataTableClient row methods narrow return types from request flags', () => {
    const handle = new DataTableClient(
      createMockHttpClient([
        { body: [1] },
        { body: [{ id: 1 }] },
        { body: [{ id: 1 }] },
        { body: { id: 1 } },
        { body: [{ id: 1 }] },
      ]),
    );

    expectTypeOf(handle.insertRows('dt-1', { data: [], returnType: 'id' })).toEqualTypeOf<Promise<number[]>>();
    expectTypeOf(handle.insertRows('dt-1', { data: [], returnType: 'all' })).toEqualTypeOf<Promise<DataTableRow[]>>();
    expectTypeOf(handle.updateRows('dt-1', { filter: { filters: [] }, data: {}, returnData: true })).toEqualTypeOf<
      Promise<DataTableRow[]>
    >();
    expectTypeOf(handle.upsertRow('dt-1', { filter: { filters: [] }, data: {}, returnData: true })).toEqualTypeOf<
      Promise<DataTableRow>
    >();
    expectTypeOf(handle.deleteRows('dt-1', { filter: { filters: [] }, returnData: true })).toEqualTypeOf<
      Promise<DataTableRow[]>
    >();
  });

  test('N8nClient exposes low-level request helpers', () => {
    const client = new N8nClient({ baseUrl: 'http://localhost:5678', apiKey: 'test-key' }); // pragma: allowlist secret
    const signal = new AbortController().signal;

    expectTypeOf(client.get).toBeFunction();
    expectTypeOf(client.post).toBeFunction();
    expectTypeOf(client.put).toBeFunction();
    expectTypeOf(client.patch).toBeFunction();
    expectTypeOf(client.delete).toBeFunction();
    expectTypeOf(client.request).toBeFunction();
    expectTypeOf(client.request<{ ok: boolean }>({ method: 'GET', path: '/health', signal })).toEqualTypeOf<
      Promise<{ ok: boolean }>
    >();
  });

  test('N8nClient client factories return the expected client types', () => {
    const client = new N8nClient({ baseUrl: 'http://localhost:5678', apiKey: 'test-key' }); // pragma: allowlist secret

    expectTypeOf(client.workflows()).toEqualTypeOf<WorkflowClient>();
    expectTypeOf(client.executions()).toEqualTypeOf<ExecutionClient>();
    expectTypeOf(client.credentials()).toEqualTypeOf<CredentialClient>();
    expectTypeOf(client.tags()).toEqualTypeOf<TagClient>();
    expectTypeOf(client.users()).toEqualTypeOf<UserClient>();
    expectTypeOf(client.variables()).toEqualTypeOf<VariableClient>();
    expectTypeOf(client.projects()).toEqualTypeOf<ProjectClient>();
    expectTypeOf(client.dataTables()).toEqualTypeOf<DataTableClient>();
    expectTypeOf(client.folders('proj-1')).toEqualTypeOf<FolderClient>();
    expectTypeOf(client.communityPackages()).toEqualTypeOf<CommunityPackageClient>();
    expectTypeOf(client.audit()).toEqualTypeOf<AuditClient>();
    expectTypeOf(client.insights()).toEqualTypeOf<InsightsClient>();
    expectTypeOf(client.sourceControl()).toEqualTypeOf<SourceControlClient>();
    expectTypeOf(client.securityPolicy()).toEqualTypeOf<SecurityPolicyClient>();
    expectTypeOf(client.discover()).toEqualTypeOf<DiscoverClient>();
    expectTypeOf(client.n8nPackage()).toEqualTypeOf<N8nPackageClient>();
  });

  test('WorkflowClient method signatures stay stable', () => {
    const handle = new WorkflowClient(createMockHttpClient());

    expectTypeOf(handle.list({} satisfies WorkflowListParams)).toEqualTypeOf<Promise<WorkflowListResponse>>();
    expectTypeOf<ReturnType<WorkflowClient['listResources']>>().toEqualTypeOf<
      Promise<PaginatedResponse<WorkflowResource>>
    >();
    expectTypeOf<ReturnType<WorkflowClient['get']>>().toEqualTypeOf<Promise<WorkflowDetail>>();
    expectTypeOf<ReturnType<WorkflowClient['getResource']>>().toEqualTypeOf<Promise<WorkflowResource>>();
    expectTypeOf<ReturnType<WorkflowClient['create']>>().toEqualTypeOf<Promise<WorkflowDetail>>();
    expectTypeOf<ReturnType<WorkflowClient['createResource']>>().toEqualTypeOf<Promise<WorkflowResource>>();
    expectTypeOf<ReturnType<WorkflowClient['update']>>().toEqualTypeOf<Promise<WorkflowMutationResult>>();
    expectTypeOf<ReturnType<WorkflowClient['updateResource']>>().toEqualTypeOf<Promise<WorkflowResource>>();
    expectTypeOf<ReturnType<WorkflowClient['activate']>>().toEqualTypeOf<Promise<WorkflowMutationResult>>();
    expectTypeOf<ReturnType<WorkflowClient['transfer']>>().toEqualTypeOf<Promise<void>>();
    expectTypeOf<ReturnType<WorkflowClient['getTags']>>().toEqualTypeOf<Promise<Tag[]>>();
    expectTypeOf<ReturnType<WorkflowClient['updateTags']>>().toEqualTypeOf<Promise<Tag[]>>();
    expectTypeOf<ReturnType<WorkflowClient['getVersion']>>().toEqualTypeOf<Promise<WorkflowVersion>>();
    expectTypeOf<ReturnType<WorkflowClient['listTestRuns']>>().toEqualTypeOf<Promise<TestRunListResponse>>();
    expectTypeOf<ReturnType<WorkflowClient['getTestRun']>>().toEqualTypeOf<Promise<TestRunSummary>>();
    expectTypeOf<ReturnType<WorkflowClient['listTestCases']>>().toEqualTypeOf<Promise<TestCaseExecutionListResponse>>();
  });

  test('Workflow nested graph types stay structured', () => {
    expectTypeOf<Workflow['connections']>().toEqualTypeOf<WorkflowConnections>();
    expectTypeOf<WorkflowVersion['connections']>().toEqualTypeOf<WorkflowConnections>();
    expectTypeOf<WorkflowCreate['connections']>().toEqualTypeOf<WorkflowConnections>();
    expectTypeOf<WorkflowUpdate['connections']>().toEqualTypeOf<WorkflowConnections>();
    expectTypeOf<Workflow['pinData']>().toEqualTypeOf<WorkflowPinData | null>();
    expectTypeOf<Workflow['settings']>().toMatchTypeOf<{ customTelemetryTags?: WorkflowTelemetryTag[] } | undefined>();
    expectTypeOf<Workflow['nodes'][number]>().toMatchTypeOf<{ customTelemetryTags?: WorkflowNodeTelemetryTags }>();
    expectTypeOf<WorkflowDetail>().toMatchTypeOf<Workflow>();
    expectTypeOf<WorkflowMutationResult>().toMatchTypeOf<Workflow>();
    expectTypeOf<WorkflowListItem>().toMatchTypeOf<Workflow>();
    expectTypeOf<ProjectWithPermissions>().toMatchTypeOf<Project>();
    expectTypeOf<ProjectCreateResult>().toMatchTypeOf<Project>();
  });

  test('ExecutionClient method signatures stay stable', () => {
    const handle = new ExecutionClient(createMockHttpClient());

    expectTypeOf(handle.list({} satisfies ExecutionListParams)).toEqualTypeOf<Promise<ExecutionListResponse>>();
    expectTypeOf<ReturnType<ExecutionClient['listResources']>>().toEqualTypeOf<
      Promise<PaginatedResponse<ExecutionResource>>
    >();
    expectTypeOf<ReturnType<ExecutionClient['get']>>().toEqualTypeOf<Promise<Execution>>();
    expectTypeOf<ReturnType<ExecutionClient['getResource']>>().toEqualTypeOf<Promise<ExecutionResource>>();
    expectTypeOf<ReturnType<ExecutionClient['retry']>>().toEqualTypeOf<Promise<Execution>>();
    expectTypeOf<ReturnType<ExecutionClient['stopMany']>>().toEqualTypeOf<Promise<StopManyExecutionsResponse>>();
    expectTypeOf<ReturnType<ExecutionClient['getTags']>>().toEqualTypeOf<Promise<Tag[]>>();
    expectTypeOf<ReturnType<ExecutionClient['updateTags']>>().toEqualTypeOf<Promise<Tag[]>>();
  });

  test('CredentialClient method signatures stay stable', () => {
    const handle = new CredentialClient(createMockHttpClient());

    expectTypeOf(handle.list({} satisfies PaginationParams)).toEqualTypeOf<Promise<CredentialListResponse>>();
    expectTypeOf<ReturnType<CredentialClient['listResources']>>().toEqualTypeOf<
      Promise<{ data: CredentialResource[]; nextCursor?: string | null }>
    >();
    expectTypeOf<ReturnType<CredentialClient['get']>>().toEqualTypeOf<Promise<CredentialResponse>>();
    expectTypeOf<ReturnType<CredentialClient['getResource']>>().toEqualTypeOf<Promise<CredentialResource>>();
    expectTypeOf<ReturnType<CredentialClient['create']>>().toEqualTypeOf<Promise<CredentialResponse>>();
    expectTypeOf<ReturnType<CredentialClient['createResource']>>().toEqualTypeOf<Promise<CredentialResource>>();
    expectTypeOf<ReturnType<CredentialClient['update']>>().toEqualTypeOf<Promise<CredentialResponse>>();
    expectTypeOf<ReturnType<CredentialClient['updateResource']>>().toEqualTypeOf<Promise<CredentialResource>>();
    expectTypeOf<ReturnType<CredentialClient['delete']>>().toEqualTypeOf<Promise<Credential>>();
    expectTypeOf<ReturnType<CredentialClient['test']>>().toEqualTypeOf<Promise<CredentialTestResponse>>();
    expectTypeOf<ReturnType<CredentialClient['transfer']>>().toEqualTypeOf<Promise<void>>();
    expectTypeOf<ReturnType<CredentialClient['getSchema']>>().toEqualTypeOf<Promise<CredentialSchema>>();
  });

  test('ProjectClient method signatures stay stable', () => {
    const handle = new ProjectClient(createMockHttpClient());

    expectTypeOf(handle.list({} satisfies PaginationParams)).toEqualTypeOf<Promise<ProjectListResponse>>();
    expectTypeOf<ReturnType<ProjectClient['listResources']>>().toEqualTypeOf<
      Promise<{ data: ProjectResource[]; nextCursor?: string | null }>
    >();
    expectTypeOf<ReturnType<ProjectClient['getResource']>>().toEqualTypeOf<Promise<ProjectResource>>();
    expectTypeOf<ReturnType<ProjectClient['create']>>().toEqualTypeOf<Promise<ProjectCreateResult>>();
    expectTypeOf<ReturnType<ProjectClient['createResource']>>().toEqualTypeOf<Promise<ProjectResource>>();
    expectTypeOf<ReturnType<ProjectClient['update']>>().toEqualTypeOf<Promise<void>>();
    expectTypeOf<ReturnType<ProjectClient['updateResource']>>().toEqualTypeOf<Promise<ProjectResource>>();
    expectTypeOf<ReturnType<ProjectClient['delete']>>().toEqualTypeOf<Promise<void>>();
    expectTypeOf<ReturnType<ProjectClient['listMembers']>>().toEqualTypeOf<Promise<ProjectMemberListResponse>>();
    expectTypeOf<ReturnType<ProjectClient['addMembers']>>().toEqualTypeOf<Promise<void>>();
    expectTypeOf<ReturnType<ProjectClient['removeMember']>>().toEqualTypeOf<Promise<void>>();
    expectTypeOf<ReturnType<ProjectClient['changeMemberRole']>>().toEqualTypeOf<Promise<void>>();
  });

  test('DataTableClient method signatures stay stable', () => {
    const handle = new DataTableClient(
      createMockHttpClient([
        { body: { data: [], nextCursor: null } },
        { body: true },
        { body: [{ id: 1 }] },
        { body: { id: 1 } },
        { body: true },
        { body: [{ id: 1 }] },
      ]),
    );

    expectTypeOf(handle.list({} satisfies DataTableListParams)).toEqualTypeOf<Promise<DataTableListResponse>>();
    expectTypeOf<ReturnType<DataTableClient['listResources']>>().toEqualTypeOf<
      Promise<{ data: DataTableResource[]; nextCursor?: string | null }>
    >();
    expectTypeOf<ReturnType<DataTableClient['get']>>().toEqualTypeOf<Promise<DataTable>>();
    expectTypeOf<ReturnType<DataTableClient['getResource']>>().toEqualTypeOf<Promise<DataTableResource>>();
    expectTypeOf<ReturnType<DataTableClient['create']>>().toEqualTypeOf<Promise<DataTable>>();
    expectTypeOf<ReturnType<DataTableClient['createResource']>>().toEqualTypeOf<Promise<DataTableResource>>();
    expectTypeOf<ReturnType<DataTableClient['update']>>().toEqualTypeOf<Promise<DataTable>>();
    expectTypeOf<ReturnType<DataTableClient['updateResource']>>().toEqualTypeOf<Promise<DataTableResource>>();
    expectTypeOf<ReturnType<DataTableClient['delete']>>().toEqualTypeOf<Promise<void>>();
    expectTypeOf<ReturnType<DataTableClient['listRows']>>().toEqualTypeOf<Promise<DataTableRowListResponse>>();
    expectTypeOf(
      handle.updateRows('dt-1', { filter: { filters: [] }, data: {} } satisfies UpdateRowsBooleanRequest),
    ).toEqualTypeOf<Promise<boolean>>();
    expectTypeOf(
      handle.updateRows('dt-1', {
        filter: { filters: [] },
        data: {},
        returnData: true,
      } satisfies UpdateRowsDataRequest),
    ).toEqualTypeOf<Promise<DataTableRow[]>>();
    expectTypeOf<ReturnType<DataTableClient['upsertRow']>>().toMatchTypeOf<Promise<boolean | DataTableRow>>();
    expectTypeOf(
      handle.upsertRow('dt-1', { filter: { filters: [] }, data: {}, returnData: true } satisfies UpsertRowDataRequest),
    ).toEqualTypeOf<Promise<DataTableRow>>();
    expectTypeOf(
      handle.deleteRows('dt-1', { filter: { filters: [] } } satisfies DeleteRowsBooleanParams),
    ).toEqualTypeOf<Promise<boolean>>();
    expectTypeOf(
      handle.deleteRows('dt-1', { filter: { filters: [] }, returnData: true } satisfies DeleteRowsDataParams),
    ).toEqualTypeOf<Promise<DataTableRow[]>>();
    expectTypeOf<ReturnType<DataTableClient['clearRows']>>().toEqualTypeOf<Promise<ClearRowsResponse>>();
    expectTypeOf<ReturnType<DataTableClient['listColumns']>>().toEqualTypeOf<Promise<DataTableColumn[]>>();
    expectTypeOf<ReturnType<DataTableClient['createColumn']>>().toEqualTypeOf<Promise<DataTableColumn>>();
    expectTypeOf<ReturnType<DataTableClient['deleteColumn']>>().toEqualTypeOf<Promise<void>>();
    expectTypeOf<ReturnType<DataTableClient['updateColumn']>>().toEqualTypeOf<Promise<DataTableColumn>>();
  });

  test('FolderClient method signatures stay stable', () => {
    const handle = new FolderClient(createMockHttpClient(), 'proj-1');

    expectTypeOf<FolderListParams>().toMatchTypeOf<{ skip?: number; take?: number }>();
    expectTypeOf<ReturnType<FolderClient['list']>>().toEqualTypeOf<Promise<FolderListResponse>>();
    expectTypeOf<ReturnType<FolderClient['listResources']>>().toEqualTypeOf<Promise<FolderResourcePage>>();
    expectTypeOf<ReturnType<FolderClient['get']>>().toEqualTypeOf<Promise<FolderDetail>>();
    expectTypeOf<ReturnType<FolderClient['getResource']>>().toEqualTypeOf<Promise<FolderResource>>();
    expectTypeOf<ReturnType<FolderClient['create']>>().toEqualTypeOf<Promise<FolderCreateResult>>();
    expectTypeOf<ReturnType<FolderClient['createResource']>>().toEqualTypeOf<Promise<FolderResource>>();
    expectTypeOf<ReturnType<FolderClient['update']>>().toEqualTypeOf<Promise<FolderUpdateResult>>();
    expectTypeOf<ReturnType<FolderClient['updateResource']>>().toEqualTypeOf<Promise<FolderResource>>();
    expectTypeOf<ReturnType<FolderClient['delete']>>().toEqualTypeOf<Promise<void>>();
  });

  test('TagClient method signatures stay stable', () => {
    const handle = new TagClient(createMockHttpClient());

    expectTypeOf(handle.list({} satisfies PaginationParams)).toEqualTypeOf<Promise<TagListResponse>>();
    expectTypeOf<ReturnType<TagClient['listResources']>>().toEqualTypeOf<
      Promise<{ data: TagResource[]; nextCursor?: string | null }>
    >();
    expectTypeOf<ReturnType<TagClient['get']>>().toEqualTypeOf<Promise<Tag>>();
    expectTypeOf<ReturnType<TagClient['getResource']>>().toEqualTypeOf<Promise<TagResource>>();
    expectTypeOf<ReturnType<TagClient['create']>>().toEqualTypeOf<Promise<Tag>>();
    expectTypeOf<ReturnType<TagClient['createResource']>>().toEqualTypeOf<Promise<TagResource>>();
    expectTypeOf<ReturnType<TagClient['update']>>().toEqualTypeOf<Promise<TagMutationResult>>();
    expectTypeOf<ReturnType<TagClient['updateResource']>>().toEqualTypeOf<Promise<TagResource>>();
    expectTypeOf<ReturnType<TagClient['delete']>>().toEqualTypeOf<Promise<TagMutationResult>>();
  });

  test('UserClient method signatures stay stable', () => {
    const handle = new UserClient(createMockHttpClient());

    expectTypeOf(handle.list({} satisfies UserListParams)).toEqualTypeOf<Promise<UserListResponse>>();
    expectTypeOf<ReturnType<UserClient['listResources']>>().toEqualTypeOf<
      Promise<{ data: UserResource[]; nextCursor?: string | null }>
    >();
    expectTypeOf<ReturnType<UserClient['get']>>().toEqualTypeOf<Promise<User>>();
    expectTypeOf<ReturnType<UserClient['getResource']>>().toEqualTypeOf<Promise<UserResource>>();
    expectTypeOf<ReturnType<UserClient['create']>>().toEqualTypeOf<Promise<UserCreateResponse>>();
    expectTypeOf<ReturnType<UserClient['delete']>>().toEqualTypeOf<Promise<void>>();
    expectTypeOf<ReturnType<UserClient['changeRole']>>().toEqualTypeOf<Promise<void>>();
  });

  test('VariableClient method signatures stay stable', () => {
    const handle = new VariableClient(createMockHttpClient());

    expectTypeOf(handle.list({} satisfies VariableListParams)).toEqualTypeOf<Promise<VariableListResponse>>();
    expectTypeOf<ReturnType<VariableClient['listResources']>>().toEqualTypeOf<
      Promise<{ data: VariableResource[]; nextCursor?: string | null }>
    >();
    expectTypeOf<ReturnType<VariableClient['get']>>().toEqualTypeOf<Promise<Variable>>();
    expectTypeOf<ReturnType<VariableClient['getResource']>>().toEqualTypeOf<Promise<VariableResource>>();
    expectTypeOf(handle.create({ key: 'x', value: 'y' } satisfies VariableCreate)).toEqualTypeOf<Promise<void>>();
    expectTypeOf(handle.update('var-1', { key: 'x', value: 'y' } satisfies VariableUpdate)).toEqualTypeOf<
      Promise<void>
    >();
    expectTypeOf(handle.delete('var-1')).toEqualTypeOf<Promise<void>>();
  });

  test('CommunityPackageClient method signatures stay stable', () => {
    const handle = new CommunityPackageClient(createMockHttpClient());

    expectTypeOf(handle.list()).toEqualTypeOf<Promise<CommunityPackage[]>>();
    expectTypeOf<ReturnType<CommunityPackageClient['listResources']>>().toEqualTypeOf<
      Promise<CommunityPackageResource[]>
    >();
    expectTypeOf<ReturnType<CommunityPackageClient['getResource']>>().toEqualTypeOf<
      Promise<CommunityPackageResource>
    >();
    expectTypeOf<ReturnType<CommunityPackageClient['install']>>().toEqualTypeOf<Promise<CommunityPackage>>();
    expectTypeOf<ReturnType<CommunityPackageClient['installResource']>>().toEqualTypeOf<
      Promise<CommunityPackageResource>
    >();
    expectTypeOf<ReturnType<CommunityPackageClient['update']>>().toEqualTypeOf<Promise<CommunityPackage>>();
    expectTypeOf<ReturnType<CommunityPackageClient['updateResource']>>().toEqualTypeOf<
      Promise<CommunityPackageResource>
    >();
    expectTypeOf<ReturnType<CommunityPackageClient['uninstall']>>().toEqualTypeOf<Promise<void>>();
  });

  test('AuditClient, InsightsClient, SecurityPolicyClient, SourceControlClient, DiscoverClient, and N8nPackageClient stay stable', () => {
    const audit = new AuditClient(createMockHttpClient());
    const insights = new InsightsClient(createMockHttpClient());
    const securityPolicy = new SecurityPolicyClient(createMockHttpClient());
    const sourceControl = new SourceControlClient(createMockHttpClient());
    const discover = new DiscoverClient(createMockHttpClient());
    const n8nPackage = new N8nPackageClient(createMockHttpClient());

    expectTypeOf<ReturnType<AuditClient['generate']>>().toEqualTypeOf<Promise<Audit>>();
    expectTypeOf<ReturnType<InsightsClient['getSummary']>>().toEqualTypeOf<Promise<InsightsSummary>>();
    expectTypeOf(securityPolicy.get()).toEqualTypeOf<Promise<SecurityPolicy>>();
    expectTypeOf(
      securityPolicy.update({
        personalSpacePublishing: true,
        personalSpaceSharing: true,
        redactionEnforcement: { floor: 'production' },
      } satisfies SecurityPolicyUpdate),
    ).toEqualTypeOf<Promise<SecurityPolicy>>();
    expectTypeOf<ReturnType<SourceControlClient['pull']>>().toEqualTypeOf<Promise<SourceControlledFile[]>>();
    expectTypeOf<ReturnType<DiscoverClient['get']>>().toEqualTypeOf<Promise<DiscoverResponse>>();
    expectTypeOf<ReturnType<N8nPackageClient['exportWorkflows']>>().toEqualTypeOf<Promise<ArrayBuffer>>();
    expectTypeOf(
      n8nPackage.importPackage(new Blob(['pkg']), { workflowConflictPolicy: 'fail' } satisfies ImportPackageOptions),
    ).toEqualTypeOf<Promise<ImportPackageResponse>>();
  });

  test('Audit and community package nested response types stay structured', () => {
    expectTypeOf<CommunityPackage['installedNodes'][number]>().toEqualTypeOf<CommunityPackageNode>();
    expectTypeOf<Audit['Credentials Risk Report']>().toMatchTypeOf<
      | {
          risk: AuditRisk;
          sections: Array<{ location?: Array<AuditCredentialLocation | AuditNodeLocation | AuditCommunityLocation> }>;
        }
      | undefined
    >();
    expectTypeOf<AuditCredentialLocation>().toEqualTypeOf<{ kind: 'credential'; id: string; name: string }>();
    expectTypeOf<AuditNodeLocation>().toEqualTypeOf<{
      kind: 'node';
      workflowId: string;
      workflowName: string;
      nodeId: string;
      nodeName: string;
      nodeType: string;
    }>();
    expectTypeOf<AuditCommunityLocation>().toEqualTypeOf<{
      kind: 'community';
      nodeType: string;
      packageUrl: string;
    }>();
  });

  test('ProjectResource and WorkflowResource bind single-resource operations', () => {
    const projects = new ProjectClient(createMockHttpClient());
    const workflows = new WorkflowClient(createMockHttpClient());
    const folders = new FolderClient(createMockHttpClient(), 'proj-1');
    const variables = new VariableClient(createMockHttpClient());
    const dataTables = new DataTableClient(createMockHttpClient());
    const executions = new ExecutionClient(createMockHttpClient());
    const project = new ProjectResource(projects, workflows, folders, variables, dataTables, executions, {
      id: 'proj-1',
      name: 'Project',
      type: 'team',
      creatorId: 'user-1',
      icon: null,
      description: null,
      customTelemetryTags: [],
      createdAt: '',
      updatedAt: '',
    });
    const workflow = new WorkflowResource(workflows, executions, {
      id: 'wf-1',
      name: 'Workflow',
      description: null,
      active: false,
      createdAt: '',
      updatedAt: '',
      isArchived: false,
      versionId: 'v1',
      triggerCount: 0,
      nodes: [],
      connections: {},
      settings: {},
      staticData: null,
      pinData: null,
      meta: null,
      nodeGroups: [],
      activeVersionId: null,
      versionCounter: null,
      sourceWorkflowId: null,
      tags: [],
      shared: [],
      parentFolder: null,
      activeVersion: null,
    });

    expectTypeOf(project.workflows()).toEqualTypeOf<ProjectWorkflowResourceCollection>();
    expectTypeOf(project.folders()).toEqualTypeOf<ProjectFolderResourceCollection>();
    expectTypeOf(project.variables()).toEqualTypeOf<ProjectVariableResourceCollection>();
    expectTypeOf(project.dataTables()).toEqualTypeOf<ProjectDataTableResourceCollection>();
    expectTypeOf(project.executions()).toEqualTypeOf<ProjectExecutionResourceCollection>();
    expectTypeOf<ReturnType<ProjectWorkflowResourceCollection['getResource']>>().toEqualTypeOf<
      Promise<WorkflowResource>
    >();
    expectTypeOf<ReturnType<ProjectWorkflowResourceCollection['createResource']>>().toEqualTypeOf<
      Promise<WorkflowResource>
    >();
    expectTypeOf<ReturnType<ProjectWorkflowResourceCollection['updateResource']>>().toEqualTypeOf<
      Promise<WorkflowResource>
    >();
    expectTypeOf<ReturnType<ProjectWorkflowResourceCollection['patchResource']>>().toEqualTypeOf<
      Promise<WorkflowResource>
    >();
    expectTypeOf<ReturnType<ProjectFolderResourceCollection['getResource']>>().toEqualTypeOf<Promise<FolderResource>>();
    expectTypeOf<ReturnType<ProjectFolderResourceCollection['listResources']>>().toEqualTypeOf<
      Promise<FolderResourcePage>
    >();
    expectTypeOf<ReturnType<ProjectFolderResourceCollection['updateResource']>>().toEqualTypeOf<
      Promise<FolderResource>
    >();
    expectTypeOf<ReturnType<ProjectFolderResourceCollection['patchResource']>>().toEqualTypeOf<
      Promise<FolderResource>
    >();
    expectTypeOf<ReturnType<ProjectVariableResourceCollection['getResource']>>().toEqualTypeOf<
      Promise<VariableResource>
    >();
    expectTypeOf<ReturnType<ProjectVariableResourceCollection['updateResource']>>().toEqualTypeOf<
      Promise<VariableResource>
    >();
    expectTypeOf<ReturnType<ProjectVariableResourceCollection['patchResource']>>().toEqualTypeOf<
      Promise<VariableResource>
    >();
    expectTypeOf<ReturnType<ProjectDataTableResourceCollection['getResource']>>().toEqualTypeOf<
      Promise<DataTableResource>
    >();
    expectTypeOf<ReturnType<ProjectDataTableResourceCollection['createResource']>>().toEqualTypeOf<
      Promise<DataTableResource>
    >();
    expectTypeOf<ReturnType<ProjectDataTableResourceCollection['updateResource']>>().toEqualTypeOf<
      Promise<DataTableResource>
    >();
    expectTypeOf<ReturnType<ProjectDataTableResourceCollection['patchResource']>>().toEqualTypeOf<
      Promise<DataTableResource>
    >();
    expectTypeOf<ReturnType<ProjectExecutionResourceCollection['getResource']>>().toEqualTypeOf<
      Promise<ExecutionResource>
    >();
    expectTypeOf(workflow.executions()).toEqualTypeOf<WorkflowExecutionResourceCollection>();
    expectTypeOf<ReturnType<WorkflowExecutionResourceCollection['get']>>().toEqualTypeOf<Promise<Execution>>();
    expectTypeOf<ReturnType<WorkflowExecutionResourceCollection['getResource']>>().toEqualTypeOf<
      Promise<ExecutionResource>
    >();
    expectTypeOf<ReturnType<ProjectWorkflowResourceCollection['get']>>().toEqualTypeOf<Promise<WorkflowDetail>>();
    expectTypeOf<ReturnType<ProjectWorkflowResourceCollection['create']>>().toEqualTypeOf<Promise<WorkflowDetail>>();
    expectTypeOf<ReturnType<ProjectWorkflowResourceCollection['update']>>().toEqualTypeOf<
      Promise<WorkflowMutationResult>
    >();
    expectTypeOf<ReturnType<ProjectWorkflowResourceCollection['patch']>>().toEqualTypeOf<Promise<Workflow>>();
    expectTypeOf<ReturnType<ProjectVariableResourceCollection['get']>>().toEqualTypeOf<Promise<Variable>>();
    expectTypeOf<ReturnType<ProjectVariableResourceCollection['patch']>>().toEqualTypeOf<Promise<void>>();
    expectTypeOf<ReturnType<ProjectFolderResourceCollection['create']>>().toEqualTypeOf<Promise<FolderCreateResult>>();
    expectTypeOf<ReturnType<ProjectFolderResourceCollection['update']>>().toEqualTypeOf<Promise<FolderUpdateResult>>();
    expectTypeOf<ReturnType<ProjectFolderResourceCollection['patch']>>().toEqualTypeOf<
      Promise<Folder | FolderCreateResult | FolderDetail | FolderUpdateResult>
    >();
    expectTypeOf<ReturnType<ProjectDataTableResourceCollection['get']>>().toEqualTypeOf<Promise<DataTable>>();
    expectTypeOf<ReturnType<ProjectDataTableResourceCollection['create']>>().toEqualTypeOf<Promise<DataTable>>();
    expectTypeOf<ReturnType<ProjectDataTableResourceCollection['update']>>().toEqualTypeOf<Promise<DataTable>>();
    expectTypeOf<ReturnType<ProjectDataTableResourceCollection['patch']>>().toEqualTypeOf<Promise<DataTable>>();
    expectTypeOf<ReturnType<ProjectExecutionResourceCollection['get']>>().toEqualTypeOf<Promise<Execution>>();
    expectTypeOf<ReturnType<ProjectResource['update']>>().toEqualTypeOf<Promise<ProjectResource>>();
    expectTypeOf<ReturnType<ProjectResource['patch']>>().toEqualTypeOf<Promise<ProjectResource>>();
    expectTypeOf<ReturnType<WorkflowResource['activate']>>().toEqualTypeOf<Promise<WorkflowResource>>();
    expectTypeOf<ReturnType<WorkflowResource['update']>>().toEqualTypeOf<Promise<WorkflowResource>>();
    expectTypeOf<ReturnType<WorkflowResource['patch']>>().toEqualTypeOf<Promise<WorkflowResource>>();
  });

  test('CredentialResource, FolderResource, TagResource, and UserResource bind single-resource operations', () => {
    const credentials = new CredentialClient(createMockHttpClient());
    const folders = new FolderClient(createMockHttpClient(), 'proj-1');
    const tags = new TagClient(createMockHttpClient());
    const users = new UserClient(createMockHttpClient());

    const credential = new CredentialResource(credentials, {
      id: 'cred-1',
      name: 'Credential',
      type: 'githubApi',
      isManaged: false,
      isGlobal: true,
      isResolvable: true,
      resolvableAllowFallback: false,
      resolverId: null,
      createdAt: '',
      updatedAt: '',
    });
    const folder = new FolderResource(folders, {
      id: 'folder-1',
      name: 'Folder',
      parentFolderId: null,
      parentFolder: null,
      homeProject: null,
      tags: [],
      workflowCount: null,
      subFolderCount: null,
      createdAt: '',
      updatedAt: '',
    });
    const tag = new TagResource(tags, { id: 'tag-1', name: 'Tag', createdAt: '', updatedAt: '' });
    const user = new UserResource(users, {
      id: 'user-1',
      email: 'user@example.com',
      firstName: null,
      lastName: null,
      isPending: false,
      createdAt: '',
      updatedAt: '',
      role: null,
      mfaEnabled: false,
    });

    expectTypeOf<ReturnType<CredentialResource['update']>>().toEqualTypeOf<Promise<CredentialResource>>();
    expectTypeOf<ReturnType<CredentialResource['patch']>>().toEqualTypeOf<Promise<CredentialResource>>();
    expectTypeOf<ReturnType<FolderResource['update']>>().toEqualTypeOf<Promise<FolderResource>>();
    expectTypeOf<ReturnType<FolderResource['patch']>>().toEqualTypeOf<Promise<FolderResource>>();
    expectTypeOf<ReturnType<TagResource['update']>>().toEqualTypeOf<Promise<TagResource>>();
    expectTypeOf<ReturnType<TagResource['patch']>>().toEqualTypeOf<Promise<TagResource>>();
    expectTypeOf<ReturnType<UserResource['changeRole']>>().toEqualTypeOf<Promise<UserResource>>();
  });

  test('ExecutionResource, VariableResource, and DataTableResource bind single-resource operations', () => {
    const executions = new ExecutionClient(createMockHttpClient());
    const variables = new VariableClient(createMockHttpClient());
    const dataTables = new DataTableClient(createMockHttpClient());

    const execution = new ExecutionResource(executions, {
      id: 1,
      finished: false,
      mode: 'manual',
      startedAt: '',
      workflowId: 1,
      status: 'new',
    });
    const variable = new VariableResource(variables, {
      id: 'var-1',
      key: 'KEY',
      value: 'VALUE',
      type: 'string',
      project: null,
    });
    const dataTable = new DataTableResource(dataTables, {
      id: 'dt-1',
      name: 'Table',
      columns: [],
      projectId: 'proj-1',
      createdAt: '',
      updatedAt: '',
    });

    expectTypeOf<ReturnType<ExecutionResource['retry']>>().toEqualTypeOf<Promise<ExecutionResource>>();
    expectTypeOf<ReturnType<VariableResource['update']>>().toEqualTypeOf<Promise<VariableResource>>();
    expectTypeOf<ReturnType<VariableResource['patch']>>().toEqualTypeOf<Promise<VariableResource>>();
    expectTypeOf<ReturnType<DataTableResource['update']>>().toEqualTypeOf<Promise<DataTableResource>>();
    expectTypeOf<ReturnType<DataTableResource['patch']>>().toEqualTypeOf<Promise<DataTableResource>>();
  });

  test('CommunityPackageResource binds package-level operations', () => {
    const communityPackages = new CommunityPackageClient(createMockHttpClient());
    const communityPackage = new CommunityPackageResource(communityPackages, {
      packageName: 'n8n-nodes-test',
      installedVersion: '1.0.0',
      authorName: '',
      authorEmail: '',
      installedNodes: [],
      createdAt: '',
      updatedAt: '',
    });

    expectTypeOf<ReturnType<CommunityPackageResource['update']>>().toEqualTypeOf<Promise<CommunityPackageResource>>();
    expectTypeOf<ReturnType<CommunityPackageResource['patch']>>().toEqualTypeOf<Promise<CommunityPackageResource>>();
  });

  test('resources expose toObject() and keep toJSON() as an alias', () => {
    const executions = new ExecutionClient(createMockHttpClient());
    const workflow = new WorkflowResource(new WorkflowClient(createMockHttpClient()), executions, {
      id: 'wf-1',
      name: 'Workflow',
      description: null,
      active: false,
      createdAt: '',
      updatedAt: '',
      isArchived: false,
      versionId: 'v1',
      triggerCount: 0,
      nodes: [],
      connections: {},
      settings: {},
      staticData: null,
      pinData: null,
      meta: null,
      nodeGroups: [],
      activeVersionId: null,
      versionCounter: null,
      sourceWorkflowId: null,
      tags: [],
      shared: [],
      parentFolder: null,
      activeVersion: null,
    });

    expectTypeOf(workflow.toObject()).toEqualTypeOf<Workflow>();
    expectTypeOf(workflow.toJSON()).toEqualTypeOf<Workflow>();
  });

  test('resource snapshots are isolated from caller mutation', () => {
    const source: Workflow = {
      id: 'wf-1',
      name: 'Workflow',
      description: null,
      active: false,
      createdAt: '',
      updatedAt: '',
      isArchived: false,
      versionId: 'v1',
      triggerCount: 0,
      nodes: [],
      connections: {},
      settings: {},
      staticData: null,
      pinData: null,
      meta: null,
      nodeGroups: [],
      activeVersionId: null,
      versionCounter: null,
      sourceWorkflowId: null,
      tags: [],
      shared: [],
      parentFolder: null,
      activeVersion: null,
    };
    const workflow = new WorkflowResource(
      new WorkflowClient(createMockHttpClient()),
      new ExecutionClient(createMockHttpClient()),
      source,
    );

    source.name = 'Mutated outside';
    source.nodes.push({} as never);
    const publicData = workflow.data;
    publicData.nodes.push({} as never);
    const cloned = workflow.toObject();
    cloned.name = 'Mutated clone';
    cloned.nodes.push({} as never);

    expect(workflow.name).toBe('Workflow');
    expect(workflow.data.name).toBe('Workflow');
    expect(workflow.data.nodes).toEqual([]);
  });
});
