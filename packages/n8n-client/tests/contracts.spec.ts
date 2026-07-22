import { describe, expectTypeOf, test } from 'vitest';
import N8nClient from '../src/index';
import AuditClient from '../src/clients/audit';
import CommunityPackageClient from '../src/clients/community-package';
import CredentialClient from '../src/clients/credential';
import ProjectClient from '../src/clients/project';
import DataTableClient from '../src/clients/data-table';
import DiscoverClient from '../src/clients/discover';
import ExecutionClient from '../src/clients/execution';
import FolderClient from '../src/clients/folder';
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
  FolderCreate,
  FolderDetail,
  FolderListParams,
  FolderListResponse,
  FolderUpdate,
  ImportPackageOptions,
  ImportPackageResponse,
  InsightsSummary,
  InsightsSummaryParams,
  InstallCommunityPackageRequest,
  PaginationParams,
  Project,
  ProjectCreate,
  ProjectListResponse,
  ProjectMemberListResponse,
  ProjectUpdate,
  PullRequest,
  SecurityPolicy,
  SecurityPolicyUpdate,
  SourceControlledFile,
  StopManyExecutionsRequest,
  StopManyExecutionsResponse,
  Tag,
  TagListResponse,
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
  WorkflowActivateRequest,
  WorkflowConnections,
  WorkflowCreate,
  WorkflowGetParams,
  WorkflowListParams,
  WorkflowListResponse,
  WorkflowNodeTelemetryTags,
  WorkflowPinData,
  WorkflowTelemetryTag,
  WorkflowUpdate,
  WorkflowVersion,
} from '../src/types';
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
        scopes: string[];
        resources: Record<string, DiscoverResource>;
        filters: Record<string, DiscoverFilter>;
        specUrl: string;
      };
    }>();
  });

  test('DataTableClient row methods narrow return types from request flags', () => {
    const handle = new DataTableClient(createMockHttpClient());

    expectTypeOf(handle.insertRows('dt-1', { data: [], returnType: 'id' })).toEqualTypeOf<Promise<number[]>>();
    expectTypeOf(handle.insertRows('dt-1', { data: [], returnType: 'all' })).toEqualTypeOf<Promise<DataTableRow[]>>();
    expectTypeOf(handle.updateRows('dt-1', { filter: { filters: [] }, data: {}, returnData: true })).toEqualTypeOf<
      Promise<DataTableRow[]>
    >();
    expectTypeOf(handle.upsertRow('dt-1', { filter: { filters: [] }, data: {}, returnData: true })).toEqualTypeOf<
      Promise<DataTableRow>
    >();
    expectTypeOf(handle.deleteRows('dt-1', { filter: '{}', returnData: true })).toEqualTypeOf<
      Promise<DataTableRow[]>
    >();
  });

  test('N8nClient exposes low-level request helpers', () => {
    const client = new N8nClient({ baseUrl: 'http://localhost:5678', apiKey: 'test-key' }); // pragma: allowlist secret

    expectTypeOf(client.get).toBeFunction();
    expectTypeOf(client.post).toBeFunction();
    expectTypeOf(client.put).toBeFunction();
    expectTypeOf(client.patch).toBeFunction();
    expectTypeOf(client.delete).toBeFunction();
    expectTypeOf(client.request).toBeFunction();
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
      Promise<{ data: WorkflowResource[]; nextCursor?: string }>
    >();
    expectTypeOf(handle.get('wf-1', {} satisfies WorkflowGetParams)).toEqualTypeOf<Promise<Workflow>>();
    expectTypeOf<ReturnType<WorkflowClient['getResource']>>().toEqualTypeOf<Promise<WorkflowResource>>();
    expectTypeOf(handle.create({} as WorkflowCreate)).toEqualTypeOf<Promise<Workflow>>();
    expectTypeOf<ReturnType<WorkflowClient['createResource']>>().toEqualTypeOf<Promise<WorkflowResource>>();
    expectTypeOf(handle.update('wf-1', {} as WorkflowUpdate)).toEqualTypeOf<Promise<Workflow>>();
    expectTypeOf<ReturnType<WorkflowClient['updateResource']>>().toEqualTypeOf<Promise<WorkflowResource>>();
    expectTypeOf(handle.activate('wf-1', {} satisfies WorkflowActivateRequest)).toEqualTypeOf<Promise<Workflow>>();
    expectTypeOf(handle.transfer('wf-1', 'proj-1')).toEqualTypeOf<Promise<void>>();
    expectTypeOf(handle.getTags('wf-1')).toEqualTypeOf<Promise<Tag[]>>();
    expectTypeOf(handle.updateTags('wf-1', [{ id: 'tag-1' }])).toEqualTypeOf<Promise<Tag[]>>();
    expectTypeOf(handle.getVersion('wf-1', 'ver-1')).toEqualTypeOf<Promise<WorkflowVersion>>();
    expectTypeOf(handle.listTestRuns('wf-1', {} satisfies TestRunListParams)).toEqualTypeOf<
      Promise<TestRunListResponse>
    >();
    expectTypeOf(handle.getTestRun('wf-1', 'run-1')).toEqualTypeOf<Promise<TestRunSummary>>();
    expectTypeOf(handle.listTestCases('wf-1', 'run-1', {} satisfies PaginationParams)).toEqualTypeOf<
      Promise<TestCaseExecutionListResponse>
    >();
  });

  test('Workflow nested graph types stay structured', () => {
    expectTypeOf<Workflow['connections']>().toEqualTypeOf<WorkflowConnections>();
    expectTypeOf<WorkflowVersion['connections']>().toEqualTypeOf<WorkflowConnections>();
    expectTypeOf<WorkflowCreate['connections']>().toEqualTypeOf<WorkflowConnections>();
    expectTypeOf<WorkflowUpdate['connections']>().toEqualTypeOf<WorkflowConnections>();
    expectTypeOf<Workflow['pinData']>().toEqualTypeOf<WorkflowPinData | null | undefined>();
    expectTypeOf<Workflow['settings']>().toMatchTypeOf<{ customTelemetryTags?: WorkflowTelemetryTag[] } | undefined>();
    expectTypeOf<Workflow['nodes'][number]>().toMatchTypeOf<{ customTelemetryTags?: WorkflowNodeTelemetryTags }>();
  });

  test('ExecutionClient method signatures stay stable', () => {
    const handle = new ExecutionClient(createMockHttpClient());

    expectTypeOf(handle.list({} satisfies ExecutionListParams)).toEqualTypeOf<Promise<ExecutionListResponse>>();
    expectTypeOf<ReturnType<ExecutionClient['listResources']>>().toEqualTypeOf<
      Promise<{ data: ExecutionResource[]; nextCursor?: string }>
    >();
    expectTypeOf(handle.get(1, {} satisfies ExecutionGetParams)).toEqualTypeOf<Promise<Execution>>();
    expectTypeOf<ReturnType<ExecutionClient['getResource']>>().toEqualTypeOf<Promise<ExecutionResource>>();
    expectTypeOf(handle.retry(1, {} satisfies ExecutionRetryRequest)).toEqualTypeOf<Promise<Execution>>();
    expectTypeOf(handle.stopMany({ status: ['running'] } satisfies StopManyExecutionsRequest)).toEqualTypeOf<
      Promise<StopManyExecutionsResponse>
    >();
    expectTypeOf(handle.getTags(1)).toEqualTypeOf<Promise<Tag[]>>();
    expectTypeOf(handle.updateTags(1, [{ id: 'tag-1' }])).toEqualTypeOf<Promise<Tag[]>>();
  });

  test('CredentialClient method signatures stay stable', () => {
    const handle = new CredentialClient(createMockHttpClient());

    expectTypeOf(handle.list({} satisfies PaginationParams)).toEqualTypeOf<Promise<CredentialListResponse>>();
    expectTypeOf<ReturnType<CredentialClient['listResources']>>().toEqualTypeOf<
      Promise<{ data: CredentialResource[]; nextCursor?: string | null }>
    >();
    expectTypeOf(handle.get('cred-1')).toEqualTypeOf<Promise<CredentialResponse>>();
    expectTypeOf<ReturnType<CredentialClient['getResource']>>().toEqualTypeOf<Promise<CredentialResource>>();
    expectTypeOf(handle.create({} as CredentialCreate)).toEqualTypeOf<Promise<CredentialResponse>>();
    expectTypeOf<ReturnType<CredentialClient['createResource']>>().toEqualTypeOf<Promise<CredentialResource>>();
    expectTypeOf(handle.update('cred-1', {} as CredentialUpdate)).toEqualTypeOf<Promise<CredentialResponse>>();
    expectTypeOf<ReturnType<CredentialClient['updateResource']>>().toEqualTypeOf<Promise<CredentialResource>>();
    expectTypeOf(handle.delete('cred-1')).toEqualTypeOf<Promise<Credential>>();
    expectTypeOf(handle.test('cred-1')).toEqualTypeOf<Promise<CredentialTestResponse>>();
    expectTypeOf(handle.transfer('cred-1', 'proj-1')).toEqualTypeOf<Promise<void>>();
    expectTypeOf(handle.getSchema('slackApi')).toEqualTypeOf<Promise<CredentialSchema>>();
  });

  test('ProjectClient method signatures stay stable', () => {
    const handle = new ProjectClient(createMockHttpClient());

    expectTypeOf(handle.list({} satisfies PaginationParams)).toEqualTypeOf<Promise<ProjectListResponse>>();
    expectTypeOf<ReturnType<ProjectClient['listResources']>>().toEqualTypeOf<
      Promise<{ data: ProjectResource[]; nextCursor?: string | null }>
    >();
    expectTypeOf<ReturnType<ProjectClient['getResource']>>().toEqualTypeOf<Promise<ProjectResource>>();
    expectTypeOf(handle.create({ name: 'Project' } satisfies ProjectCreate)).toEqualTypeOf<Promise<Project>>();
    expectTypeOf<ReturnType<ProjectClient['createResource']>>().toEqualTypeOf<Promise<ProjectResource>>();
    expectTypeOf(handle.update('proj-1', { name: 'Renamed' } satisfies ProjectUpdate)).toEqualTypeOf<Promise<void>>();
    expectTypeOf<ReturnType<ProjectClient['updateResource']>>().toEqualTypeOf<Promise<ProjectResource>>();
    expectTypeOf(handle.delete('proj-1')).toEqualTypeOf<Promise<void>>();
    expectTypeOf(handle.delete('proj-1', 'proj-2')).toEqualTypeOf<Promise<void>>();
    expectTypeOf(handle.listMembers('proj-1', {} satisfies PaginationParams)).toEqualTypeOf<
      Promise<ProjectMemberListResponse>
    >();
    expectTypeOf(handle.addMembers('proj-1', [{ userId: 'user-1', role: 'project:editor' }])).toEqualTypeOf<
      Promise<void>
    >();
    expectTypeOf(handle.removeMember('proj-1', 'user-1')).toEqualTypeOf<Promise<void>>();
    expectTypeOf(handle.changeMemberRole('proj-1', 'user-1', 'project:admin')).toEqualTypeOf<Promise<void>>();
  });

  test('DataTableClient method signatures stay stable', () => {
    const handle = new DataTableClient(createMockHttpClient());

    expectTypeOf(handle.list({} satisfies DataTableListParams)).toEqualTypeOf<Promise<DataTableListResponse>>();
    expectTypeOf<ReturnType<DataTableClient['listResources']>>().toEqualTypeOf<
      Promise<{ data: DataTableResource[]; nextCursor?: string | null }>
    >();
    expectTypeOf(handle.get('dt-1')).toEqualTypeOf<Promise<DataTable>>();
    expectTypeOf<ReturnType<DataTableClient['getResource']>>().toEqualTypeOf<Promise<DataTableResource>>();
    expectTypeOf(handle.create({ name: 'Table', columns: [] } satisfies CreateDataTableRequest)).toEqualTypeOf<
      Promise<DataTable>
    >();
    expectTypeOf<ReturnType<DataTableClient['createResource']>>().toEqualTypeOf<Promise<DataTableResource>>();
    expectTypeOf(handle.update('dt-1', { name: 'Renamed' } satisfies UpdateDataTableRequest)).toEqualTypeOf<
      Promise<DataTable>
    >();
    expectTypeOf<ReturnType<DataTableClient['updateResource']>>().toEqualTypeOf<Promise<DataTableResource>>();
    expectTypeOf(handle.delete('dt-1')).toEqualTypeOf<Promise<void>>();
    expectTypeOf(handle.listRows('dt-1', {} satisfies DataTableRowListParams)).toEqualTypeOf<
      Promise<DataTableRowListResponse>
    >();
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
    expectTypeOf(
      handle.upsertRow('dt-1', { filter: { filters: [] }, data: {} } satisfies UpsertRowBooleanRequest),
    ).toEqualTypeOf<Promise<boolean>>();
    expectTypeOf(
      handle.upsertRow('dt-1', { filter: { filters: [] }, data: {}, returnData: true } satisfies UpsertRowDataRequest),
    ).toEqualTypeOf<Promise<DataTableRow>>();
    expectTypeOf(handle.deleteRows('dt-1', { filter: '{}' } satisfies DeleteRowsBooleanParams)).toEqualTypeOf<
      Promise<boolean>
    >();
    expectTypeOf(
      handle.deleteRows('dt-1', { filter: '{}', returnData: true } satisfies DeleteRowsDataParams),
    ).toEqualTypeOf<Promise<DataTableRow[]>>();
    expectTypeOf(handle.clearRows('dt-1')).toEqualTypeOf<Promise<ClearRowsResponse>>();
    expectTypeOf(handle.listColumns('dt-1')).toEqualTypeOf<Promise<DataTableColumn[]>>();
    expectTypeOf(handle.createColumn('dt-1', { name: 'col', type: 'string' })).toEqualTypeOf<
      Promise<DataTableColumn>
    >();
    expectTypeOf(handle.deleteColumn('dt-1', 'col-1')).toEqualTypeOf<Promise<void>>();
    expectTypeOf(handle.updateColumn('dt-1', 'col-1', {} satisfies UpdateColumnRequest)).toEqualTypeOf<
      Promise<DataTableColumn>
    >();
  });

  test('FolderClient method signatures stay stable', () => {
    const handle = new FolderClient(createMockHttpClient(), 'proj-1');

    expectTypeOf(handle.list({} satisfies FolderListParams)).toEqualTypeOf<Promise<FolderListResponse>>();
    expectTypeOf<ReturnType<FolderClient['listResources']>>().toEqualTypeOf<
      Promise<{ data: FolderResource[]; nextCursor?: string | null }>
    >();
    expectTypeOf(handle.get('folder-1')).toEqualTypeOf<Promise<FolderDetail>>();
    expectTypeOf<ReturnType<FolderClient['getResource']>>().toEqualTypeOf<Promise<FolderResource>>();
    expectTypeOf(handle.create({ name: 'Folder' } satisfies FolderCreate)).toEqualTypeOf<Promise<Folder>>();
    expectTypeOf<ReturnType<FolderClient['createResource']>>().toEqualTypeOf<Promise<FolderResource>>();
    expectTypeOf(handle.update('folder-1', {} satisfies FolderUpdate)).toEqualTypeOf<Promise<Folder>>();
    expectTypeOf<ReturnType<FolderClient['updateResource']>>().toEqualTypeOf<Promise<FolderResource>>();
    expectTypeOf(handle.delete('folder-1')).toEqualTypeOf<Promise<void>>();
  });

  test('TagClient method signatures stay stable', () => {
    const handle = new TagClient(createMockHttpClient());

    expectTypeOf(handle.list({} satisfies PaginationParams)).toEqualTypeOf<Promise<TagListResponse>>();
    expectTypeOf<ReturnType<TagClient['listResources']>>().toEqualTypeOf<
      Promise<{ data: TagResource[]; nextCursor?: string | null }>
    >();
    expectTypeOf(handle.get('tag-1')).toEqualTypeOf<Promise<Tag>>();
    expectTypeOf<ReturnType<TagClient['getResource']>>().toEqualTypeOf<Promise<TagResource>>();
    expectTypeOf(handle.create({ name: 'Tag' } satisfies TagMutation)).toEqualTypeOf<Promise<Tag>>();
    expectTypeOf<ReturnType<TagClient['createResource']>>().toEqualTypeOf<Promise<TagResource>>();
    expectTypeOf(handle.update('tag-1', { name: 'Renamed' } satisfies TagMutation)).toEqualTypeOf<Promise<Tag>>();
    expectTypeOf<ReturnType<TagClient['updateResource']>>().toEqualTypeOf<Promise<TagResource>>();
    expectTypeOf(handle.delete('tag-1')).toEqualTypeOf<Promise<Tag>>();
  });

  test('UserClient method signatures stay stable', () => {
    const handle = new UserClient(createMockHttpClient());

    expectTypeOf(handle.list({} satisfies UserListParams)).toEqualTypeOf<Promise<UserListResponse>>();
    expectTypeOf<ReturnType<UserClient['listResources']>>().toEqualTypeOf<
      Promise<{ data: UserResource[]; nextCursor?: string | null }>
    >();
    expectTypeOf(handle.get('user-1', {} satisfies UserGetParams)).toEqualTypeOf<Promise<User>>();
    expectTypeOf<ReturnType<UserClient['getResource']>>().toEqualTypeOf<Promise<UserResource>>();
    expectTypeOf(handle.create([{ email: 'user@example.com' }] satisfies UserCreate[])).toEqualTypeOf<
      Promise<UserCreateResponse>
    >();
    expectTypeOf(handle.delete('user-1')).toEqualTypeOf<Promise<void>>();
    expectTypeOf(handle.changeRole('user-1', 'global:admin')).toEqualTypeOf<Promise<void>>();
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
    expectTypeOf(handle.install({ name: 'n8n-nodes-test' } satisfies InstallCommunityPackageRequest)).toEqualTypeOf<
      Promise<CommunityPackage>
    >();
    expectTypeOf<ReturnType<CommunityPackageClient['installResource']>>().toEqualTypeOf<
      Promise<CommunityPackageResource>
    >();
    expectTypeOf(handle.update('n8n-nodes-test', {} satisfies UpdateCommunityPackageRequest)).toEqualTypeOf<
      Promise<CommunityPackage>
    >();
    expectTypeOf<ReturnType<CommunityPackageClient['updateResource']>>().toEqualTypeOf<
      Promise<CommunityPackageResource>
    >();
    expectTypeOf(handle.uninstall('n8n-nodes-test')).toEqualTypeOf<Promise<void>>();
  });

  test('AuditClient, InsightsClient, SecurityPolicyClient, SourceControlClient, DiscoverClient, and N8nPackageClient stay stable', () => {
    const audit = new AuditClient(createMockHttpClient());
    const insights = new InsightsClient(createMockHttpClient());
    const securityPolicy = new SecurityPolicyClient(createMockHttpClient());
    const sourceControl = new SourceControlClient(createMockHttpClient());
    const discover = new DiscoverClient(createMockHttpClient());
    const n8nPackage = new N8nPackageClient(createMockHttpClient());

    expectTypeOf(audit.generate({} satisfies AuditRequest)).toEqualTypeOf<Promise<Audit>>();
    expectTypeOf(insights.getSummary({} satisfies InsightsSummaryParams)).toEqualTypeOf<Promise<InsightsSummary>>();
    expectTypeOf(securityPolicy.get()).toEqualTypeOf<Promise<SecurityPolicy>>();
    expectTypeOf(
      securityPolicy.update({
        personalSpacePublishing: true,
        personalSpaceSharing: true,
        redactionEnforcement: { floor: 'production' },
      } satisfies SecurityPolicyUpdate),
    ).toEqualTypeOf<Promise<SecurityPolicy>>();
    expectTypeOf(sourceControl.pull({} satisfies PullRequest)).toEqualTypeOf<Promise<SourceControlledFile[]>>();
    expectTypeOf(discover.get({} satisfies DiscoverParams)).toEqualTypeOf<Promise<DiscoverResponse>>();
    expectTypeOf(n8nPackage.exportWorkflows({ workflowIds: [] } satisfies ExportWorkflowsRequest)).toEqualTypeOf<
      Promise<ArrayBuffer>
    >();
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
    expectTypeOf<ReturnType<ProjectWorkflowResourceCollection['get']>>().toEqualTypeOf<Promise<Workflow>>();
    expectTypeOf<ReturnType<ProjectWorkflowResourceCollection['create']>>().toEqualTypeOf<Promise<Workflow>>();
    expectTypeOf<ReturnType<ProjectWorkflowResourceCollection['update']>>().toEqualTypeOf<Promise<Workflow>>();
    expectTypeOf<ReturnType<ProjectWorkflowResourceCollection['patch']>>().toEqualTypeOf<Promise<Workflow>>();
    expectTypeOf<ReturnType<ProjectVariableResourceCollection['get']>>().toEqualTypeOf<Promise<Variable>>();
    expectTypeOf<ReturnType<ProjectVariableResourceCollection['patch']>>().toEqualTypeOf<Promise<void>>();
    expectTypeOf<ReturnType<ProjectFolderResourceCollection['create']>>().toEqualTypeOf<Promise<Folder>>();
    expectTypeOf<ReturnType<ProjectFolderResourceCollection['update']>>().toEqualTypeOf<Promise<Folder>>();
    expectTypeOf<ReturnType<ProjectFolderResourceCollection['patch']>>().toEqualTypeOf<
      Promise<Folder | FolderDetail>
    >();
    expectTypeOf<ReturnType<ProjectDataTableResourceCollection['get']>>().toEqualTypeOf<Promise<DataTable>>();
    expectTypeOf<ReturnType<ProjectDataTableResourceCollection['create']>>().toEqualTypeOf<Promise<DataTable>>();
    expectTypeOf<ReturnType<ProjectDataTableResourceCollection['update']>>().toEqualTypeOf<Promise<DataTable>>();
    expectTypeOf<ReturnType<ProjectDataTableResourceCollection['patch']>>().toEqualTypeOf<Promise<DataTable>>();
    expectTypeOf<ReturnType<ProjectExecutionResourceCollection['get']>>().toEqualTypeOf<Promise<Execution>>();
    expectTypeOf(project.update({ name: 'Renamed' })).toEqualTypeOf<Promise<ProjectResource>>();
    expectTypeOf(project.patch({ name: 'Renamed' })).toEqualTypeOf<Promise<ProjectResource>>();
    expectTypeOf(workflow.activate()).toEqualTypeOf<Promise<WorkflowResource>>();
    expectTypeOf(workflow.update({ name: 'Updated', nodes: [], connections: {}, settings: {} })).toEqualTypeOf<
      Promise<WorkflowResource>
    >();
    expectTypeOf(workflow.patch({ name: 'Updated' })).toEqualTypeOf<Promise<WorkflowResource>>();
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

    expectTypeOf(credential.update({ name: 'Renamed' })).toEqualTypeOf<Promise<CredentialResource>>();
    expectTypeOf(credential.patch({ name: 'Renamed' })).toEqualTypeOf<Promise<CredentialResource>>();
    expectTypeOf(folder.update({ name: 'Renamed' })).toEqualTypeOf<Promise<FolderResource>>();
    expectTypeOf(folder.patch({ name: 'Renamed' })).toEqualTypeOf<Promise<FolderResource>>();
    expectTypeOf(tag.update({ name: 'Renamed' })).toEqualTypeOf<Promise<TagResource>>();
    expectTypeOf(tag.patch({ name: 'Renamed' })).toEqualTypeOf<Promise<TagResource>>();
    expectTypeOf(user.changeRole('global:admin')).toEqualTypeOf<Promise<UserResource>>();
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

    expectTypeOf(execution.retry()).toEqualTypeOf<Promise<ExecutionResource>>();
    expectTypeOf(variable.update({ key: 'KEY', value: 'NEXT' })).toEqualTypeOf<Promise<VariableResource>>();
    expectTypeOf(variable.patch({ value: 'NEXT' })).toEqualTypeOf<Promise<VariableResource>>();
    expectTypeOf(dataTable.update({ name: 'Renamed' })).toEqualTypeOf<Promise<DataTableResource>>();
    expectTypeOf(dataTable.patch({ name: 'Renamed' })).toEqualTypeOf<Promise<DataTableResource>>();
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

    expectTypeOf(communityPackage.update({ version: '2.0.0' })).toEqualTypeOf<Promise<CommunityPackageResource>>();
    expectTypeOf(communityPackage.patch({ version: '2.0.0' })).toEqualTypeOf<Promise<CommunityPackageResource>>();
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
});
