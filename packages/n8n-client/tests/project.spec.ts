import { describe, expect, test } from 'vitest';
import DataTableClient from '../src/clients/data-table';
import ExecutionClient from '../src/clients/execution';
import FolderClient from '../src/clients/folder';
import ProjectClient from '../src/clients/project';
import VariableClient from '../src/clients/variable';
import WorkflowClient from '../src/clients/workflow';
import DataTableResource from '../src/resources/data-table';
import ExecutionResource from '../src/resources/execution';
import FolderResource from '../src/resources/folder';
import ProjectResource from '../src/resources/project';
import VariableResource from '../src/resources/variable';
import WorkflowResource from '../src/resources/workflow';
import { createMockHttpClient } from './test-utils';

function projectListItem(
  overrides: Partial<{
    id: string;
    name: string;
    type: 'personal' | 'team';
    creatorId: string;
    icon: null;
    description: null;
    customTelemetryTags: [];
    createdAt: string;
    updatedAt: string;
  }> = {},
) {
  return {
    id: 'p-1',
    name: 'Project One',
    type: 'team' as const,
    creatorId: 'user-1',
    icon: null,
    description: null,
    customTelemetryTags: [],
    createdAt: '',
    updatedAt: '',
    ...overrides,
  };
}

function projectDetail(
  overrides: Partial<{
    id: string;
    name: string;
    type: 'personal' | 'team';
    creatorId: string;
    icon: null;
    description: null;
    customTelemetryTags: [];
    createdAt: string;
    updatedAt: string;
    role: string;
    scopes: string[];
  }> = {},
) {
  return {
    ...projectListItem(overrides),
    role: 'project:admin',
    scopes: ['project:create', 'project:read', 'project:update', 'project:delete', 'project:list'],
    ...overrides,
  };
}

describe('Implementation Consistency: Project', () => {
  test('list calls GET /projects', async () => {
    const http = createMockHttpClient([{ body: { data: [], nextCursor: undefined } }]);
    const handle = new ProjectClient(http);

    const result = await handle.list({ limit: 5 });

    expect(http.get).toHaveBeenCalledWith('/projects', { limit: 5 });
    expect(result).toEqual({ data: [], nextCursor: null });
  });

  test('getResource finds a project through list pagination', async () => {
    const http = createMockHttpClient([
      { body: { data: [projectListItem({ id: 'p-1', name: 'One' })], nextCursor: 'next' } },
      { body: { data: [projectListItem({ id: 'p-2', name: 'Two' })], nextCursor: undefined } },
    ]);
    const handle = new ProjectClient(http);

    const result = await handle.getResource('p-2');

    expect(http.get).toHaveBeenNthCalledWith(1, '/projects', undefined);
    expect(http.get).toHaveBeenNthCalledWith(2, '/projects', { cursor: 'next' });
    expect(result).toBeInstanceOf(ProjectResource);
    expect(result.id).toBe('p-2');
  });

  test('listResources wraps projects as project resources', async () => {
    const http = createMockHttpClient([
      { body: { data: [projectListItem({ id: 'p-1', name: 'One' })], nextCursor: 'next' } },
    ]);
    const handle = new ProjectClient(http);

    const result = await handle.listResources({ limit: 1 });

    expect(http.get).toHaveBeenCalledWith('/projects', { limit: 1 });
    expect(result.data[0]).toBeInstanceOf(ProjectResource);
    expect(result.nextCursor).toBe('next');
  });

  test('create calls POST /projects and returns the created project body', async () => {
    const created = projectDetail({ id: 'p-2', name: 'New Project' });
    const http = createMockHttpClient([{ body: created }]);
    const handle = new ProjectClient(http);

    const result = await handle.create({ name: 'New Project', uiContext: 'sidebar' });

    expect(http.post).toHaveBeenCalledWith('/projects', { name: 'New Project', uiContext: 'sidebar' });
    expect(result).toEqual(created);
  });

  test('createResource wraps the created project as a resource', async () => {
    const created = projectDetail({ id: 'p-2', name: 'New Project' });
    const http = createMockHttpClient([{ body: created }]);
    const handle = new ProjectClient(http);

    const result = await handle.createResource({ name: 'New Project' });

    expect(http.post).toHaveBeenCalledWith('/projects', { name: 'New Project' });
    expect(result).toBeInstanceOf(ProjectResource);
    expect(result.id).toBe('p-2');
  });

  test('update calls PUT /projects/:id', async () => {
    const http = createMockHttpClient([{ body: undefined }]);
    const handle = new ProjectClient(http);

    await handle.update('p-1', { name: 'Updated Project' });

    expect(http.put).toHaveBeenCalledWith('/projects/p-1', { name: 'Updated Project' });
  });

  test('updateResource refreshes the project through list pagination and returns a bound resource', async () => {
    const http = createMockHttpClient([
      { body: undefined },
      { body: { data: [projectListItem({ id: 'p-1', name: 'Updated Project' })], nextCursor: undefined } },
    ]);
    const handle = new ProjectClient(http);

    const result = await handle.updateResource('p-1', { name: 'Updated Project' });

    expect(http.put).toHaveBeenNthCalledWith(1, '/projects/p-1', { name: 'Updated Project' });
    expect(http.get).toHaveBeenNthCalledWith(1, '/projects', undefined);
    expect(result).toBeInstanceOf(ProjectResource);
    expect(result.name).toBe('Updated Project');
  });

  test('delete calls DELETE /projects/:id', async () => {
    const http = createMockHttpClient([{ body: undefined }]);
    const handle = new ProjectClient(http);

    await handle.delete('p-1');

    expect(http.delete).toHaveBeenCalledWith('/projects/p-1');
  });

  test('delete forwards optional transferId query param', async () => {
    const http = createMockHttpClient([{ body: undefined }]);
    const handle = new ProjectClient(http);

    await handle.delete('p-1', 'p-2');

    expect(http.delete).toHaveBeenCalledWith('/projects/p-1', { transferId: 'p-2' });
  });

  test('listMembers calls GET /projects/:id/users', async () => {
    const http = createMockHttpClient([{ body: { data: [], nextCursor: undefined } }]);
    const handle = new ProjectClient(http);

    const result = await handle.listMembers('p-1', { limit: 10 });

    expect(http.get).toHaveBeenCalledWith('/projects/p-1/users', { limit: 10 });
    expect(result).toEqual({ data: [], nextCursor: null });
  });

  test('addMembers calls POST /projects/:id/users', async () => {
    const http = createMockHttpClient([{ body: undefined }]);
    const handle = new ProjectClient(http);

    await handle.addMembers('p-1', [{ userId: 'u-1', role: 'project:viewer' }]);

    expect(http.post).toHaveBeenCalledWith('/projects/p-1/users', {
      relations: [{ userId: 'u-1', role: 'project:viewer' }],
    });
  });

  test('removeMember calls DELETE /projects/:id/users/:userId', async () => {
    const http = createMockHttpClient([{ body: undefined }]);
    const handle = new ProjectClient(http);

    await handle.removeMember('p-1', 'u-1');

    expect(http.delete).toHaveBeenCalledWith('/projects/p-1/users/u-1');
  });

  test('changeMemberRole calls PATCH /projects/:id/users/:userId', async () => {
    const http = createMockHttpClient([{ body: undefined }]);
    const handle = new ProjectClient(http);

    await handle.changeMemberRole('p-1', 'u-1', 'project:editor');

    expect(http.patch).toHaveBeenCalledWith('/projects/p-1/users/u-1', { role: 'project:editor' });
  });

  test('project resource workflow helpers inject projectId', async () => {
    const http = createMockHttpClient([
      {
        body: {
          data: [{ id: 'wf-1', name: 'One', active: false, isArchived: false, versionId: 'v1' }],
          nextCursor: undefined,
        },
      },
      { body: { id: 'wf-2', name: 'Two', active: false, isArchived: false, versionId: 'v1' } },
      {
        body: {
          data: [{ id: 'wf-3', name: 'Three', active: true, isArchived: false, versionId: 'v2' }],
          nextCursor: 'next',
        },
      },
    ]);
    const handle = new ProjectClient(http);
    const resource = new ProjectResource(
      handle,
      new WorkflowClient(http),
      new FolderClient(http, 'p-1'),
      new VariableClient(http),
      new DataTableClient(http),
      new ExecutionClient(http),
      projectListItem(),
    );

    const listed = await resource.workflows().list({ limit: 5, active: true });
    const created = await resource.workflows().create({ name: 'Two', nodes: [], connections: {}, settings: {} });
    const listedResources = await resource.workflows().listResources({ limit: 1 });

    expect(http.get).toHaveBeenNthCalledWith(1, '/workflows', { limit: 5, active: true, projectId: 'p-1' });
    expect(http.post).toHaveBeenCalledWith('/workflows', {
      name: 'Two',
      nodes: [],
      connections: {},
      settings: {},
      projectId: 'p-1',
    });
    expect(http.get).toHaveBeenNthCalledWith(2, '/workflows', { limit: 1, projectId: 'p-1' });
    expect(listed.data[0].id).toBe('wf-1');
    expect(created.id).toBe('wf-2');
    expect(listedResources.data[0]).toBeInstanceOf(WorkflowResource);
  });

  test('project resource workflow getResource returns a bound workflow resource', async () => {
    const http = createMockHttpClient([
      { body: { data: [], nextCursor: 'next-page' } },
      {
        body: {
          data: [{ id: 'wf-1', name: 'One', active: false, isArchived: false, versionId: 'v1' }],
          nextCursor: undefined,
        },
      },
      { body: { id: 'wf-1', name: 'One', active: false, isArchived: false, versionId: 'v1' } },
    ]);
    const handle = new ProjectClient(http);
    const resource = new ProjectResource(
      handle,
      new WorkflowClient(http),
      new FolderClient(http, 'p-1'),
      new VariableClient(http),
      new DataTableClient(http),
      new ExecutionClient(http),
      projectListItem(),
    );

    const workflow = await resource.workflows().getResource('wf-1');

    expect(http.get).toHaveBeenNthCalledWith(1, '/workflows', { projectId: 'p-1', cursor: undefined });
    expect(http.get).toHaveBeenNthCalledWith(2, '/workflows', { projectId: 'p-1', cursor: 'next-page' });
    expect(http.get).toHaveBeenNthCalledWith(3, '/workflows/wf-1', undefined);
    expect(workflow).toBeInstanceOf(WorkflowResource);
  });

  test('project resource workflow get/update helpers return raw and resource variants', async () => {
    const http = createMockHttpClient([
      {
        body: {
          data: [{ id: 'wf-1', name: 'One', active: false, isArchived: false, versionId: 'v1' }],
          nextCursor: undefined,
        },
      },
      { body: { id: 'wf-1', name: 'One', active: false, isArchived: false, versionId: 'v1' } },
      {
        body: {
          data: [{ id: 'wf-1', name: 'One', active: false, isArchived: false, versionId: 'v1' }],
          nextCursor: undefined,
        },
      },
      { body: { id: 'wf-1', name: 'Updated', active: false, isArchived: false, versionId: 'v2' } },
      {
        body: {
          data: [{ id: 'wf-1', name: 'Updated', active: false, isArchived: false, versionId: 'v2' }],
          nextCursor: undefined,
        },
      },
      { body: { id: 'wf-1', name: 'Updated Again', active: true, isArchived: false, versionId: 'v3' } },
    ]);
    const handle = new ProjectClient(http);
    const resource = new ProjectResource(
      handle,
      new WorkflowClient(http),
      new FolderClient(http, 'p-1'),
      new VariableClient(http),
      new DataTableClient(http),
      new ExecutionClient(http),
      projectListItem(),
    );

    const workflow = await resource.workflows().get('wf-1');
    const updated = await resource
      .workflows()
      .update('wf-1', { name: 'Updated', nodes: [], connections: {}, settings: {} });
    const updatedResource = await resource
      .workflows()
      .updateResource('wf-1', { name: 'Updated Again', nodes: [], connections: {}, settings: {} });

    expect(http.get).toHaveBeenNthCalledWith(1, '/workflows', { projectId: 'p-1', cursor: undefined });
    expect(http.get).toHaveBeenNthCalledWith(2, '/workflows/wf-1', undefined);
    expect(http.get).toHaveBeenNthCalledWith(3, '/workflows', { projectId: 'p-1', cursor: undefined });
    expect(http.put).toHaveBeenNthCalledWith(1, '/workflows/wf-1', {
      name: 'Updated',
      nodes: [],
      connections: {},
      settings: {},
    });
    expect(http.get).toHaveBeenNthCalledWith(4, '/workflows', { projectId: 'p-1', cursor: undefined });
    expect(http.put).toHaveBeenNthCalledWith(2, '/workflows/wf-1', {
      name: 'Updated Again',
      nodes: [],
      connections: {},
      settings: {},
    });
    expect(workflow.id).toBe('wf-1');
    expect(updated.name).toBe('Updated');
    expect(updatedResource).toBeInstanceOf(WorkflowResource);
  });

  test('project resource workflow patch helpers merge partial changes', async () => {
    const workflow = {
      id: 'wf-1',
      name: 'One',
      description: 'Original',
      active: false,
      createdAt: '',
      updatedAt: '',
      isArchived: false,
      versionId: 'v1',
      triggerCount: 0,
      nodes: [],
      connections: {},
      settings: { executionOrder: 'v1' },
    };
    const http = createMockHttpClient([
      { body: { data: [workflow], nextCursor: undefined } },
      { body: workflow },
      { body: { ...workflow, name: 'Patched', versionId: 'v2' } },
      { body: { data: [{ ...workflow, name: 'Patched', versionId: 'v2' }], nextCursor: undefined } },
      { body: { ...workflow, name: 'Patched', versionId: 'v2' } },
      { body: { ...workflow, name: 'Patched Again', versionId: 'v3' } },
    ]);
    const resource = new ProjectResource(
      new ProjectClient(http),
      new WorkflowClient(http),
      new FolderClient(http, 'p-1'),
      new VariableClient(http),
      new DataTableClient(http),
      new ExecutionClient(http),
      projectListItem(),
    );

    const patched = await resource.workflows().patch('wf-1', { name: 'Patched' });
    const patchedResource = await resource.workflows().patchResource('wf-1', { name: 'Patched Again' });

    expect(http.put).toHaveBeenNthCalledWith(1, '/workflows/wf-1', {
      name: 'Patched',
      description: 'Original',
      nodes: [],
      connections: {},
      settings: { executionOrder: 'v1' },
      staticData: null,
      pinData: null,
    });
    expect(http.put).toHaveBeenNthCalledWith(2, '/workflows/wf-1', {
      name: 'Patched Again',
      description: 'Original',
      nodes: [],
      connections: {},
      settings: { executionOrder: 'v1' },
      staticData: null,
      pinData: null,
    });
    expect(patched.name).toBe('Patched');
    expect(patchedResource).toBeInstanceOf(WorkflowResource);
    expect(patchedResource.name).toBe('Patched Again');
  });

  test('project resource update mutates local snapshot', async () => {
    const http = createMockHttpClient([{ body: undefined }]);
    const handle = new ProjectClient(http);
    const resource = new ProjectResource(
      handle,
      new WorkflowClient(http),
      new FolderClient(http, 'p-1'),
      new VariableClient(http),
      new DataTableClient(http),
      new ExecutionClient(http),
      projectListItem({ name: 'Old Name' }),
    );

    await resource.update({ name: 'New Name' });

    expect(resource.name).toBe('New Name');
    expect(resource.data).toEqual(projectListItem({ name: 'New Name' }));
  });

  test('project resource patch sends only the partial payload', async () => {
    const http = createMockHttpClient([{ body: undefined }]);
    const handle = new ProjectClient(http);
    const resource = new ProjectResource(
      handle,
      new WorkflowClient(http),
      new FolderClient(http, 'p-1'),
      new VariableClient(http),
      new DataTableClient(http),
      new ExecutionClient(http),
      projectListItem({ name: 'Existing Name' }),
    );

    await resource.patch({ description: 'Updated description' });

    expect(http.put).toHaveBeenCalledWith('/projects/p-1', { description: 'Updated description' });
    expect(resource.name).toBe('Existing Name');
  });

  test('project resource folder helpers use project-scoped folder client', async () => {
    const http = createMockHttpClient([
      { body: { count: 1, data: [{ id: 'f-1', name: 'One', createdAt: '', updatedAt: '' }] } },
      { body: { id: 'f-2', name: 'Two', createdAt: '', updatedAt: '' } },
      { body: { count: 1, data: [{ id: 'f-3', name: 'Three', createdAt: '', updatedAt: '' }] } },
      { body: { id: 'f-4', name: 'Four', createdAt: '', updatedAt: '' } },
      { body: { id: 'f-5', name: 'Five', createdAt: '', updatedAt: '' } },
      { body: undefined },
    ]);
    const handle = new ProjectClient(http);
    const resource = new ProjectResource(
      handle,
      new WorkflowClient(http),
      new FolderClient(http, 'p-1'),
      new VariableClient(http),
      new DataTableClient(http),
      new ExecutionClient(http),
      projectListItem(),
    );

    const listed = await resource.folders().list({ take: '10' });
    const created = await resource.folders().create({ name: 'Two' });
    const listedResources = await resource.folders().listResources({ take: '5' });
    const fetched = await resource.folders().getResource('f-4');
    const updated = await resource.folders().update('f-5', { name: 'Five Updated' });
    const updatedResource = await resource.folders().updateResource('f-5', { name: 'Five Updated Again' });
    await resource.folders().delete('f-5', 'f-1');

    expect(http.get).toHaveBeenNthCalledWith(1, '/projects/p-1/folders', { take: '10' });
    expect(http.post).toHaveBeenCalledWith('/projects/p-1/folders', { name: 'Two' });
    expect(http.get).toHaveBeenNthCalledWith(2, '/projects/p-1/folders', { take: '5' });
    expect(http.get).toHaveBeenNthCalledWith(3, '/projects/p-1/folders/f-4');
    expect(http.patch).toHaveBeenNthCalledWith(1, '/projects/p-1/folders/f-5', { name: 'Five Updated' });
    expect(http.patch).toHaveBeenNthCalledWith(2, '/projects/p-1/folders/f-5', { name: 'Five Updated Again' });
    expect(http.delete).toHaveBeenCalledWith('/projects/p-1/folders/f-5', { transferToFolderId: 'f-1' });
    expect(listed.data[0].id).toBe('f-1');
    expect(created.id).toBe('f-2');
    expect(listedResources.data[0]).toBeInstanceOf(FolderResource);
    expect(fetched).toBeInstanceOf(FolderResource);
    expect(updated.id).toBe('f-5');
    expect(updatedResource).toBeInstanceOf(FolderResource);
  });

  test('project resource folder patch helpers merge partial changes', async () => {
    const http = createMockHttpClient([
      { body: { id: 'f-1', name: 'Folder One', parentFolderId: 'parent-1', createdAt: '', updatedAt: '' } },
      { body: { id: 'f-1', name: 'Folder One', parentFolderId: 'parent-2', createdAt: '', updatedAt: '' } },
      { body: { id: 'f-1', name: 'Folder One', parentFolderId: 'parent-2', createdAt: '', updatedAt: '' } },
      { body: { id: 'f-1', name: 'Folder Renamed', parentFolderId: 'parent-2', createdAt: '', updatedAt: '' } },
    ]);
    const resource = new ProjectResource(
      new ProjectClient(http),
      new WorkflowClient(http),
      new FolderClient(http, 'p-1'),
      new VariableClient(http),
      new DataTableClient(http),
      new ExecutionClient(http),
      projectListItem(),
    );

    const patched = await resource.folders().patch('f-1', { parentFolderId: 'parent-2' });
    const patchedResource = await resource.folders().patchResource('f-1', { name: 'Folder Renamed' });

    expect(http.patch).toHaveBeenNthCalledWith(1, '/projects/p-1/folders/f-1', {
      name: 'Folder One',
      parentFolderId: 'parent-2',
    });
    expect(http.patch).toHaveBeenNthCalledWith(2, '/projects/p-1/folders/f-1', {
      name: 'Folder Renamed',
      parentFolderId: 'parent-2',
    });
    expect(patched.parentFolderId).toBe('parent-2');
    expect(patchedResource).toBeInstanceOf(FolderResource);
    expect(patchedResource.name).toBe('Folder Renamed');
  });

  test('project resource variable helpers inject projectId filter', async () => {
    const http = createMockHttpClient([
      { body: { data: [{ id: 'v-1', key: 'FIRST', value: 'one' }], nextCursor: undefined } },
      { body: { data: [{ id: 'v-2', key: 'SECOND', value: 'two' }], nextCursor: undefined } },
      { body: { data: [{ id: 'v-3', key: 'THIRD', value: 'three' }], nextCursor: undefined } },
      { body: undefined },
    ]);
    const handle = new ProjectClient(http);
    const resource = new ProjectResource(
      handle,
      new WorkflowClient(http),
      new FolderClient(http, 'p-1'),
      new VariableClient(http),
      new DataTableClient(http),
      new ExecutionClient(http),
      projectListItem(),
    );

    const listed = await resource.variables().list({ state: 'empty' });
    const listedResources = await resource.variables().listResources({ limit: 1 });
    const variable = await resource.variables().getResource('v-3');
    await resource.variables().create({ key: 'FOURTH', value: 'four' });

    expect(http.get).toHaveBeenNthCalledWith(1, '/variables', { state: 'empty', projectId: 'p-1' });
    expect(http.get).toHaveBeenNthCalledWith(2, '/variables', { limit: 1, projectId: 'p-1' });
    expect(http.get).toHaveBeenNthCalledWith(3, '/variables', { projectId: 'p-1', cursor: undefined });
    expect(http.post).toHaveBeenCalledWith('/variables', { key: 'FOURTH', value: 'four', projectId: 'p-1' });
    expect(listed.data[0].id).toBe('v-1');
    expect(listedResources.data[0]).toBeInstanceOf(VariableResource);
    expect(variable).toBeInstanceOf(VariableResource);
  });

  test('project resource variable get/update helpers return raw and resource variants', async () => {
    const http = createMockHttpClient([
      { body: { data: [{ id: 'v-1', key: 'FIRST', value: 'one' }], nextCursor: undefined } },
      { body: undefined },
      { body: undefined },
      { body: { data: [{ id: 'v-1', key: 'FIRST', value: 'three' }], nextCursor: undefined } },
    ]);
    const handle = new ProjectClient(http);
    const resource = new ProjectResource(
      handle,
      new WorkflowClient(http),
      new FolderClient(http, 'p-1'),
      new VariableClient(http),
      new DataTableClient(http),
      new ExecutionClient(http),
      projectListItem(),
    );

    const variable = await resource.variables().get('v-1');
    await resource.variables().update('v-1', { key: 'FIRST', value: 'two' });
    const updatedResource = await resource.variables().updateResource('v-1', { key: 'FIRST', value: 'three' });

    expect(http.get).toHaveBeenNthCalledWith(1, '/variables', { projectId: 'p-1', cursor: undefined });
    expect(http.put).toHaveBeenNthCalledWith(1, '/variables/v-1', { key: 'FIRST', value: 'two', projectId: 'p-1' });
    expect(http.put).toHaveBeenNthCalledWith(2, '/variables/v-1', { key: 'FIRST', value: 'three', projectId: 'p-1' });
    expect(variable.id).toBe('v-1');
    expect(updatedResource).toBeInstanceOf(VariableResource);
    expect(updatedResource.value).toBe('three');
  });

  test('project resource variable patch helpers merge partial changes', async () => {
    const http = createMockHttpClient([
      { body: { data: [{ id: 'v-1', key: 'FIRST', value: 'one' }], nextCursor: undefined } },
      { body: undefined },
      { body: { data: [{ id: 'v-1', key: 'FIRST', value: 'one' }], nextCursor: undefined } },
      { body: undefined },
    ]);
    const resource = new ProjectResource(
      new ProjectClient(http),
      new WorkflowClient(http),
      new FolderClient(http, 'p-1'),
      new VariableClient(http),
      new DataTableClient(http),
      new ExecutionClient(http),
      projectListItem(),
    );

    await resource.variables().patch('v-1', { value: 'two' });
    const patchedResource = await resource.variables().patchResource('v-1', { value: 'three' });

    expect(http.put).toHaveBeenNthCalledWith(1, '/variables/v-1', { value: 'two' });
    expect(http.put).toHaveBeenNthCalledWith(2, '/variables/v-1', { value: 'three' });
    expect(patchedResource).toBeInstanceOf(VariableResource);
    expect(patchedResource.value).toBe('three');
  });

  test('project resource data table creation injects projectId', async () => {
    const http = createMockHttpClient([
      { body: { id: 'dt-3', name: 'Three', columns: [], projectId: 'p-1', createdAt: '', updatedAt: '' } },
      { body: { id: 'dt-4', name: 'Four', columns: [], projectId: 'p-1', createdAt: '', updatedAt: '' } },
    ]);
    const handle = new ProjectClient(http);
    const resource = new ProjectResource(
      handle,
      new WorkflowClient(http),
      new FolderClient(http, 'p-1'),
      new VariableClient(http),
      new DataTableClient(http),
      new ExecutionClient(http),
      projectListItem(),
    );

    const created = await resource.dataTables().create({ name: 'Three', columns: [] });
    const createdResource = await resource.dataTables().createResource({ name: 'Four', columns: [] });

    expect(http.post).toHaveBeenNthCalledWith(1, '/data-tables', { name: 'Three', columns: [], projectId: 'p-1' });
    expect(http.post).toHaveBeenNthCalledWith(2, '/data-tables', { name: 'Four', columns: [], projectId: 'p-1' });
    expect(created.id).toBe('dt-3');
    expect(createdResource).toBeInstanceOf(DataTableResource);
  });

  test('project resource data table get/update helpers return raw and resource variants', async () => {
    const http = createMockHttpClient([
      { body: { id: 'dt-1', name: 'One', columns: [], projectId: 'p-1', createdAt: '', updatedAt: '' } },
      { body: { id: 'dt-1', name: 'One', columns: [], projectId: 'p-1', createdAt: '', updatedAt: '' } },
      { body: { id: 'dt-1', name: 'Updated Again', columns: [], projectId: 'p-1', createdAt: '', updatedAt: '' } },
      { body: { id: 'dt-1', name: 'One', columns: [], projectId: 'p-1', createdAt: '', updatedAt: '' } },
      { body: { id: 'dt-1', name: 'Updated Resource', columns: [], projectId: 'p-1', createdAt: '', updatedAt: '' } },
      { body: { id: 'dt-1', name: 'One', columns: [], projectId: 'p-1', createdAt: '', updatedAt: '' } },
      { body: undefined },
    ]);
    const handle = new ProjectClient(http);
    const resource = new ProjectResource(
      handle,
      new WorkflowClient(http),
      new FolderClient(http, 'p-1'),
      new VariableClient(http),
      new DataTableClient(http),
      new ExecutionClient(http),
      projectListItem(),
    );

    const dataTable = await resource.dataTables().get('dt-1');
    const updated = await resource.dataTables().update('dt-1', { name: 'Updated Again' });
    const updatedResource = await resource.dataTables().updateResource('dt-1', { name: 'Updated Resource' });
    await resource.dataTables().delete('dt-1');

    expect(http.get).toHaveBeenNthCalledWith(1, '/data-tables/dt-1');
    expect(http.patch).toHaveBeenNthCalledWith(1, '/data-tables/dt-1', { name: 'Updated Again' });
    expect(http.patch).toHaveBeenNthCalledWith(2, '/data-tables/dt-1', { name: 'Updated Resource' });
    expect(http.delete).toHaveBeenCalledWith('/data-tables/dt-1');
    expect(dataTable.id).toBe('dt-1');
    expect(updated.name).toBe('Updated Again');
    expect(updatedResource).toBeInstanceOf(DataTableResource);
  });

  test('project resource data table patch helpers merge partial changes', async () => {
    const table = { id: 'dt-1', name: 'One', columns: [], projectId: 'p-1', createdAt: '', updatedAt: '' };
    const http = createMockHttpClient([
      { body: table },
      { body: { ...table, name: 'Patched' } },
      { body: table },
      { body: { ...table, name: 'Patched Resource' } },
    ]);
    const resource = new ProjectResource(
      new ProjectClient(http),
      new WorkflowClient(http),
      new FolderClient(http, 'p-1'),
      new VariableClient(http),
      new DataTableClient(http),
      new ExecutionClient(http),
      projectListItem(),
    );

    const patched = await resource.dataTables().patch('dt-1', {});
    const patchedResource = await resource.dataTables().patchResource('dt-1', { name: 'Patched Resource' });

    expect(http.patch).toHaveBeenNthCalledWith(1, '/data-tables/dt-1', { name: 'One' });
    expect(http.patch).toHaveBeenNthCalledWith(2, '/data-tables/dt-1', { name: 'Patched Resource' });
    expect(patched.name).toBe('Patched');
    expect(patchedResource).toBeInstanceOf(DataTableResource);
    expect(patchedResource.name).toBe('Patched Resource');
  });

  test('project resource execution helpers inject projectId filter', async () => {
    const http = createMockHttpClient([
      {
        body: {
          data: [{ id: 1, finished: true, mode: 'manual', startedAt: '', workflowId: 1, status: 'success' }],
          nextCursor: undefined,
        },
      },
      {
        body: {
          data: [{ id: 2, finished: false, mode: 'retry', startedAt: '', workflowId: 1, status: 'running' }],
          nextCursor: 'next',
        },
      },
      {
        body: {
          data: [{ id: 3, finished: true, mode: 'manual', startedAt: '', workflowId: 1, status: 'success' }],
          nextCursor: undefined,
        },
      },
      { body: { id: 3, finished: true, mode: 'manual', startedAt: '', workflowId: 1, status: 'success' } },
    ]);
    const handle = new ProjectClient(http);
    const resource = new ProjectResource(
      handle,
      new WorkflowClient(http),
      new FolderClient(http, 'p-1'),
      new VariableClient(http),
      new DataTableClient(http),
      new ExecutionClient(http),
      projectListItem(),
    );

    const listed = await resource.executions().list({ status: 'success', limit: 10 });
    const listedResources = await resource.executions().listResources({ limit: 1 });
    const execution = await resource.executions().getResource(3, { includeData: true });

    expect(http.get).toHaveBeenNthCalledWith(1, '/executions', { status: 'success', limit: 10, projectId: 'p-1' });
    expect(http.get).toHaveBeenNthCalledWith(2, '/executions', { limit: 1, projectId: 'p-1' });
    expect(http.get).toHaveBeenNthCalledWith(3, '/executions', { projectId: 'p-1', cursor: undefined });
    expect(http.get).toHaveBeenNthCalledWith(4, '/executions/3', { includeData: true });
    expect(listed.data[0].id).toBe(1);
    expect(listedResources.data[0]).toBeInstanceOf(ExecutionResource);
    expect(execution).toBeInstanceOf(ExecutionResource);
  });

  test('project resource execution getResource verifies project scope before fetching', async () => {
    const http = createMockHttpClient([
      { body: { data: [], nextCursor: 'next-page' } },
      {
        body: {
          data: [{ id: 3, finished: true, mode: 'manual', startedAt: '', workflowId: 1, status: 'success' }],
          nextCursor: undefined,
        },
      },
      { body: { id: 3, finished: true, mode: 'manual', startedAt: '', workflowId: 1, status: 'success' } },
    ]);
    const handle = new ProjectClient(http);
    const resource = new ProjectResource(
      handle,
      new WorkflowClient(http),
      new FolderClient(http, 'p-1'),
      new VariableClient(http),
      new DataTableClient(http),
      new ExecutionClient(http),
      projectListItem(),
    );

    const execution = await resource.executions().getResource(3, { includeData: true });

    expect(http.get).toHaveBeenNthCalledWith(1, '/executions', { projectId: 'p-1', cursor: undefined });
    expect(http.get).toHaveBeenNthCalledWith(2, '/executions', { projectId: 'p-1', cursor: 'next-page' });
    expect(http.get).toHaveBeenNthCalledWith(3, '/executions/3', { includeData: true });
    expect(execution).toBeInstanceOf(ExecutionResource);
  });

  test('project resource executions get returns raw execution after scope verification', async () => {
    const http = createMockHttpClient([
      {
        body: {
          data: [{ id: 3, finished: true, mode: 'manual', startedAt: '', workflowId: 1, status: 'success' }],
          nextCursor: undefined,
        },
      },
      { body: { id: 3, finished: true, mode: 'manual', startedAt: '', workflowId: 1, status: 'success' } },
    ]);
    const handle = new ProjectClient(http);
    const resource = new ProjectResource(
      handle,
      new WorkflowClient(http),
      new FolderClient(http, 'p-1'),
      new VariableClient(http),
      new DataTableClient(http),
      new ExecutionClient(http),
      projectListItem(),
    );

    const execution = await resource.executions().get(3, { includeData: true });

    expect(http.get).toHaveBeenNthCalledWith(1, '/executions', { projectId: 'p-1', cursor: undefined });
    expect(http.get).toHaveBeenNthCalledWith(2, '/executions/3', { includeData: true });
    expect(execution.id).toBe(3);
  });
});
