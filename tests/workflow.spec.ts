import { describe, expect, test, vi } from 'vitest';
import ExecutionClient from '../src/clients/execution';
import WorkflowClient from '../src/clients/workflow';
import ExecutionResource from '../src/resources/execution';
import WorkflowResource from '../src/resources/workflow';
import { createMockHttpClient } from './test-utils';

describe('Implementation Consistency: Workflow', () => {
  test('list calls GET /workflows with query params', async () => {
    const http = createMockHttpClient([{ body: { data: [], nextCursor: undefined } }]);
    const handle = new WorkflowClient(http);

    const result = await handle.list({ limit: 10, active: true });

    expect(http.get).toHaveBeenCalledWith('/workflows', { limit: 10, active: true });
    expect(result).toEqual({ data: [], nextCursor: undefined });
  });

  test('get calls GET /workflows/:id', async () => {
    const workflow = { id: 'wf-1', name: 'My Workflow', active: false };
    const http = createMockHttpClient([{ body: workflow }]);
    const handle = new WorkflowClient(http);

    const result = await handle.get('wf-1');

    expect(http.get).toHaveBeenCalledWith('/workflows/wf-1', undefined);
    expect(result).toEqual(workflow);
  });

  test('getResource returns a bound workflow resource', async () => {
    const workflow = { id: 'wf-1', name: 'My Workflow', active: false, isArchived: false, versionId: 'v1' };
    const http = createMockHttpClient([{ body: workflow }]);
    const handle = new WorkflowClient(http);

    const result = await handle.getResource('wf-1');

    expect(http.get).toHaveBeenCalledWith('/workflows/wf-1', undefined);
    expect(result).toBeInstanceOf(WorkflowResource);
    expect(result.data).toEqual(workflow);
  });

  test('listResources wraps list response items as workflow resources', async () => {
    const http = createMockHttpClient([
      {
        body: {
          data: [
            { id: 'wf-1', name: 'One', active: false, isArchived: false, versionId: 'v1' },
            { id: 'wf-2', name: 'Two', active: true, isArchived: false, versionId: 'v2' },
          ],
          nextCursor: 'next',
        },
      },
    ]);
    const handle = new WorkflowClient(http);

    const result = await handle.listResources({ limit: 2 });

    expect(http.get).toHaveBeenCalledWith('/workflows', { limit: 2 });
    expect(result.nextCursor).toBe('next');
    expect(result.data).toHaveLength(2);
    expect(result.data[0]).toBeInstanceOf(WorkflowResource);
    expect(result.data[0].id).toBe('wf-1');
  });

  test('create calls POST /workflows', async () => {
    const created = { id: 'wf-2', name: 'New Workflow', active: false };
    const http = createMockHttpClient([{ body: created }]);
    const handle = new WorkflowClient(http);

    const payload = { name: 'New Workflow', nodes: [], connections: {}, settings: {} };
    const result = await handle.create(payload);

    expect(http.post).toHaveBeenCalledWith('/workflows', payload);
    expect(result).toEqual(created);
  });

  test('createResource wraps created workflow as a resource', async () => {
    const created = { id: 'wf-2', name: 'New Workflow', active: false, isArchived: false, versionId: 'v1' };
    const http = createMockHttpClient([{ body: created }]);
    const handle = new WorkflowClient(http);

    const result = await handle.createResource({ name: 'New Workflow', nodes: [], connections: {}, settings: {} });

    expect(result).toBeInstanceOf(WorkflowResource);
    expect(result.data).toEqual(created);
  });

  test('update calls PUT /workflows/:id', async () => {
    const updated = { id: 'wf-1', name: 'Updated', active: true };
    const http = createMockHttpClient([{ body: updated }]);
    const handle = new WorkflowClient(http);

    const payload = { name: 'Updated', nodes: [], connections: {}, settings: {} };
    const result = await handle.update('wf-1', payload);

    expect(http.put).toHaveBeenCalledWith('/workflows/wf-1', payload);
    expect(result).toEqual(updated);
  });

  test('updateResource wraps updated workflow as a resource', async () => {
    const updated = { id: 'wf-1', name: 'Updated', active: true, isArchived: false, versionId: 'v2' };
    const http = createMockHttpClient([{ body: updated }]);
    const handle = new WorkflowClient(http);

    const result = await handle.updateResource('wf-1', { name: 'Updated', nodes: [], connections: {}, settings: {} });

    expect(result).toBeInstanceOf(WorkflowResource);
    expect(result.data).toEqual(updated);
  });

  test('delete calls DELETE /workflows/:id', async () => {
    const deleted = { id: 'wf-1', name: 'My Workflow', active: false };
    const http = createMockHttpClient([{ body: deleted }]);
    const handle = new WorkflowClient(http);

    const result = await handle.delete('wf-1');

    expect(http.delete).toHaveBeenCalledWith('/workflows/wf-1');
    expect(result).toEqual(deleted);
  });

  test('activate calls POST /workflows/:id/activate', async () => {
    const activated = { id: 'wf-1', name: 'My Workflow', active: true };
    const http = createMockHttpClient([{ body: activated }]);
    const handle = new WorkflowClient(http);

    const result = await handle.activate('wf-1');

    expect(http.post).toHaveBeenCalledWith('/workflows/wf-1/activate', undefined);
    expect(result).toEqual(activated);
  });

  test('deactivate calls POST /workflows/:id/deactivate', async () => {
    const deactivated = { id: 'wf-1', name: 'My Workflow', active: false };
    const http = createMockHttpClient([{ body: deactivated }]);
    const handle = new WorkflowClient(http);

    const result = await handle.deactivate('wf-1');

    expect(http.post).toHaveBeenCalledWith('/workflows/wf-1/deactivate');
    expect(result).toEqual(deactivated);
  });

  test('archive calls POST /workflows/:id/archive', async () => {
    const archived = { id: 'wf-1', name: 'My Workflow', active: false, isArchived: true };
    const http = createMockHttpClient([{ body: archived }]);
    const handle = new WorkflowClient(http);

    const result = await handle.archive('wf-1');

    expect(http.post).toHaveBeenCalledWith('/workflows/wf-1/archive');
    expect(result).toEqual(archived);
  });

  test('transfer calls PUT /workflows/:id/transfer', async () => {
    const http = createMockHttpClient([{ body: undefined }]);
    const handle = new WorkflowClient(http);

    await handle.transfer('wf-1', 'proj-2');

    expect(http.put).toHaveBeenCalledWith('/workflows/wf-1/transfer', { destinationProjectId: 'proj-2' });
  });

  test('getTags calls GET /workflows/:id/tags', async () => {
    const tags = [{ id: 't-1', name: 'production', createdAt: '', updatedAt: '' }];
    const http = createMockHttpClient([{ body: tags }]);
    const handle = new WorkflowClient(http);

    const result = await handle.getTags('wf-1');

    expect(http.get).toHaveBeenCalledWith('/workflows/wf-1/tags');
    expect(result).toEqual(tags);
  });

  test('updateTags calls PUT /workflows/:id/tags', async () => {
    const tags = [{ id: 't-1', name: 'production', createdAt: '', updatedAt: '' }];
    const http = createMockHttpClient([{ body: tags }]);
    const handle = new WorkflowClient(http);

    const result = await handle.updateTags('wf-1', [{ id: 't-1' }]);

    expect(http.put).toHaveBeenCalledWith('/workflows/wf-1/tags', [{ id: 't-1' }]);
    expect(result).toEqual(tags);
  });

  test('getVersion calls GET /workflows/:id/:versionId', async () => {
    const version = { versionId: 'v-1', workflowId: 'wf-1', nodes: [], connections: {}, authors: 'admin' };
    const http = createMockHttpClient([{ body: version }]);
    const handle = new WorkflowClient(http);

    const result = await handle.getVersion('wf-1', 'v-1');

    expect(http.get).toHaveBeenCalledWith('/workflows/wf-1/v-1');
    expect(result).toEqual(version);
  });

  test('workflow resource methods use bound id and update local state', async () => {
    const workflow = { id: 'wf-1', name: 'My Workflow', active: false, isArchived: false, versionId: 'v1' };
    const updated = { id: 'wf-1', name: 'Updated', active: false, isArchived: false, versionId: 'v2' };
    const activated = { id: 'wf-1', name: 'Updated', active: true, isArchived: false, versionId: 'v2' };
    const archived = { id: 'wf-1', name: 'Updated', active: true, isArchived: true, versionId: 'v2' };
    const http = createMockHttpClient([{ body: updated }, { body: activated }, { body: archived }]);
    const handle = new WorkflowClient(http);
    const resource = new WorkflowResource(handle, new ExecutionClient(http), workflow as never);

    await resource.update({ name: 'Updated', nodes: [], connections: {}, settings: {} });
    expect(resource.data).toEqual(updated);

    await resource.activate();
    expect(resource.active).toBe(true);

    await resource.archive();
    expect(resource.isArchived).toBe(true);
  });

  test('workflow resource execution helpers inject workflowId filter', async () => {
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
      {
        body: {
          data: [{ id: 3, finished: true, mode: 'manual', startedAt: '', workflowId: 1, status: 'success' }],
          nextCursor: undefined,
        },
      },
      { body: { id: 3, finished: true, mode: 'manual', startedAt: '', workflowId: 1, status: 'success' } },
    ]);
    const workflowClient = new WorkflowClient(http);
    const resource = new WorkflowResource(workflowClient, new ExecutionClient(http), {
      id: 'wf-1',
      name: 'Workflow',
      active: false,
      isArchived: false,
      versionId: 'v1',
    } as never);

    const listed = await resource.executions().list({ status: 'success', limit: 10 });
    const listedResources = await resource.executions().listResources({ limit: 1 });
    const rawExecution = await resource.executions().get(3, { includeData: true });
    const execution = await resource.executions().getResource(3, { includeData: true });

    expect(http.get).toHaveBeenNthCalledWith(1, '/executions', { status: 'success', limit: 10, workflowId: 'wf-1' });
    expect(http.get).toHaveBeenNthCalledWith(2, '/executions', { limit: 1, workflowId: 'wf-1' });
    expect(http.get).toHaveBeenNthCalledWith(3, '/executions', { workflowId: 'wf-1', cursor: undefined });
    expect(http.get).toHaveBeenNthCalledWith(4, '/executions/3', { includeData: true });
    expect(http.get).toHaveBeenNthCalledWith(5, '/executions', { workflowId: 'wf-1', cursor: undefined });
    expect(http.get).toHaveBeenNthCalledWith(6, '/executions/3', { includeData: true });
    expect(listed.data[0].id).toBe(1);
    expect(listedResources.data[0]).toBeInstanceOf(ExecutionResource);
    expect(rawExecution.id).toBe(3);
    expect(execution).toBeInstanceOf(ExecutionResource);
  });

  test('workflow resource execution getResource verifies workflow scope across pages', async () => {
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
    const workflowClient = new WorkflowClient(http);
    const resource = new WorkflowResource(workflowClient, new ExecutionClient(http), {
      id: 'wf-1',
      name: 'Workflow',
      active: false,
      isArchived: false,
      versionId: 'v1',
    } as never);

    const execution = await resource.executions().getResource(3, { includeData: true });

    expect(http.get).toHaveBeenNthCalledWith(1, '/executions', { workflowId: 'wf-1', cursor: undefined });
    expect(http.get).toHaveBeenNthCalledWith(2, '/executions', { workflowId: 'wf-1', cursor: 'next-page' });
    expect(http.get).toHaveBeenNthCalledWith(3, '/executions/3', { includeData: true });
    expect(execution).toBeInstanceOf(ExecutionResource);
  });
});
