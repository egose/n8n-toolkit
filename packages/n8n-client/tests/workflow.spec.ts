import { describe, expect, test, vi } from 'vitest';
import ExecutionClient from '../src/clients/execution';
import WorkflowClient from '../src/clients/workflow';
import ExecutionResource from '../src/resources/execution';
import WorkflowResource from '../src/resources/workflow';
import { createMockHttpClient } from './test-utils';

const baseWorkflow = {
  createdAt: '',
  updatedAt: '',
  isArchived: false,
  triggerCount: 0,
  nodes: [],
  connections: {},
  settings: {},
  staticData: null,
  pinData: null,
  meta: null,
  nodeGroups: [],
  activeVersionId: null,
};

const detailedWorkflow = <T extends Record<string, unknown>>(workflow: T) => ({
  ...baseWorkflow,
  description: null,
  versionCounter: null,
  sourceWorkflowId: null,
  tags: [],
  shared: [],
  activeVersion: null,
  ...workflow,
});

const compactWorkflow = <T extends Record<string, unknown>>(workflow: T) => ({
  ...baseWorkflow,
  description: null,
  versionCounter: null,
  sourceWorkflowId: null,
  ...workflow,
});

const listedWorkflow = <T extends Record<string, unknown>>(workflow: T) => ({
  ...baseWorkflow,
  ...workflow,
});

describe('Implementation Consistency: Workflow', () => {
  test('list calls GET /workflows with query params', async () => {
    const http = createMockHttpClient([{ body: { data: [], nextCursor: undefined } }]);
    const handle = new WorkflowClient(http);

    const result = await handle.list({ limit: 10, active: true });

    expect(http.get).toHaveBeenCalledWith('/workflows', { limit: 10, active: true });
    expect(result).toEqual({ data: [], nextCursor: null });
  });

  test('get calls GET /workflows/:id', async () => {
    const workflow = detailedWorkflow({ id: 'wf-1', name: 'My Workflow', active: false, versionId: 'v1' });
    const http = createMockHttpClient([{ body: workflow }]);
    const handle = new WorkflowClient(http);

    const result = await handle.get('wf-1');

    expect(http.get).toHaveBeenCalledWith('/workflows/wf-1', undefined);
    expect(result).toEqual(workflow);
  });

  test('getResource returns a bound workflow resource', async () => {
    const workflow = detailedWorkflow({ id: 'wf-1', name: 'My Workflow', active: false, versionId: 'v1' });
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
            listedWorkflow({ id: 'wf-1', name: 'One', active: false, versionId: 'v1' }),
            listedWorkflow({ id: 'wf-2', name: 'Two', active: true, versionId: 'v2' }),
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
    const created = detailedWorkflow({ id: 'wf-2', name: 'New Workflow', active: false, versionId: 'v1' });
    const http = createMockHttpClient([{ body: created }]);
    const handle = new WorkflowClient(http);

    const payload = { name: 'New Workflow', nodes: [], connections: {}, settings: {} };
    const result = await handle.create(payload);

    expect(http.post).toHaveBeenCalledWith('/workflows', payload);
    expect(result).toEqual(detailedWorkflow(created));
  });

  test('createResource wraps created workflow as a resource', async () => {
    const created = detailedWorkflow({ id: 'wf-2', name: 'New Workflow', active: false, versionId: 'v1' });
    const http = createMockHttpClient([{ body: created }]);
    const handle = new WorkflowClient(http);

    const result = await handle.createResource({ name: 'New Workflow', nodes: [], connections: {}, settings: {} });

    expect(result).toBeInstanceOf(WorkflowResource);
    expect(result.data).toEqual(detailedWorkflow(created));
  });

  test('update calls PUT /workflows/:id', async () => {
    const updated = compactWorkflow({ id: 'wf-1', name: 'Updated', active: true, versionId: 'v2' });
    const http = createMockHttpClient([{ body: updated }]);
    const handle = new WorkflowClient(http);

    const payload = { name: 'Updated', nodes: [], connections: {}, settings: {} };
    const result = await handle.update('wf-1', payload);

    expect(http.put).toHaveBeenCalledWith('/workflows/wf-1', payload);
    expect(result).toEqual(compactWorkflow(updated));
  });

  test('updateResource wraps updated workflow as a resource', async () => {
    const updated = compactWorkflow({ id: 'wf-1', name: 'Updated', active: true, versionId: 'v2' });
    const refreshed = {
      ...detailedWorkflow({ id: 'wf-1', name: 'Updated', active: true, versionId: 'v2' }),
      versionCounter: 2,
    };
    const http = createMockHttpClient([{ body: updated }, { body: refreshed }]);
    const handle = new WorkflowClient(http);

    const result = await handle.updateResource('wf-1', { name: 'Updated', nodes: [], connections: {}, settings: {} });

    expect(result).toBeInstanceOf(WorkflowResource);
    expect(http.get).toHaveBeenCalledWith('/workflows/wf-1', undefined);
    expect(result.data).toEqual(detailedWorkflow(refreshed));
  });

  test('delete calls DELETE /workflows/:id', async () => {
    const deleted = detailedWorkflow({ id: 'wf-1', name: 'My Workflow', active: false, versionId: 'v1' });
    const http = createMockHttpClient([{ body: deleted }]);
    const handle = new WorkflowClient(http);

    const result = await handle.delete('wf-1');

    expect(http.delete).toHaveBeenCalledWith('/workflows/wf-1');
    expect(result).toEqual(detailedWorkflow(deleted));
  });

  test('activate calls POST /workflows/:id/activate', async () => {
    const activated = compactWorkflow({ id: 'wf-1', name: 'My Workflow', active: true, versionId: 'v2' });
    const http = createMockHttpClient([{ body: activated }]);
    const handle = new WorkflowClient(http);

    const result = await handle.activate('wf-1');

    expect(http.post).toHaveBeenCalledWith('/workflows/wf-1/activate', undefined);
    expect(result).toEqual(compactWorkflow(activated));
  });

  test('deactivate calls POST /workflows/:id/deactivate', async () => {
    const deactivated = compactWorkflow({ id: 'wf-1', name: 'My Workflow', active: false, versionId: 'v2' });
    const http = createMockHttpClient([{ body: deactivated }]);
    const handle = new WorkflowClient(http);

    const result = await handle.deactivate('wf-1');

    expect(http.post).toHaveBeenCalledWith('/workflows/wf-1/deactivate');
    expect(result).toEqual(compactWorkflow(deactivated));
  });

  test('archive calls POST /workflows/:id/archive', async () => {
    const archived = compactWorkflow({
      id: 'wf-1',
      name: 'My Workflow',
      active: false,
      isArchived: true,
      versionId: 'v2',
    });
    const http = createMockHttpClient([{ body: archived }]);
    const handle = new WorkflowClient(http);

    const result = await handle.archive('wf-1');

    expect(http.post).toHaveBeenCalledWith('/workflows/wf-1/archive');
    expect(result).toEqual(compactWorkflow(archived));
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
    const workflow = detailedWorkflow({
      id: 'wf-1',
      name: 'My Workflow',
      active: false,
      versionId: 'v1',
      parentFolder: null,
    });
    const updated = compactWorkflow({ id: 'wf-1', name: 'Updated', active: false, versionId: 'v2' });
    const activated = compactWorkflow({ id: 'wf-1', name: 'Updated', active: true, versionId: 'v2' });
    const archived = compactWorkflow({ id: 'wf-1', name: 'Updated', active: true, isArchived: true, versionId: 'v2' });
    const http = createMockHttpClient([{ body: updated }, { body: activated }, { body: archived }]);
    const handle = new WorkflowClient(http);
    const resource = new WorkflowResource(handle, new ExecutionClient(http), workflow);

    await resource.update({ name: 'Updated', nodes: [], connections: {}, settings: {} });
    expect(resource.data).toEqual({
      ...detailedWorkflow(workflow),
      ...compactWorkflow(updated),
      parentFolder: null,
    });

    await resource.activate();
    expect(resource.active).toBe(true);

    await resource.archive();
    expect(resource.isArchived).toBe(true);
  });

  test('workflow resource reuses scoped execution handle', () => {
    const http = createMockHttpClient();
    const resource = new WorkflowResource(
      new WorkflowClient(http),
      new ExecutionClient(http),
      listedWorkflow({ id: '1', name: 'Workflow', active: false, versionId: 'v1' }),
    );

    expect(resource.executions()).toBe(resource.executions());
  });

  test('workflow resource patch merges partial changes with current workflow data', async () => {
    const patched = {
      id: 'wf-1',
      name: 'Patched',
      description: 'Original description',
      active: false,
      createdAt: '',
      updatedAt: '',
      isArchived: false,
      versionId: 'v2',
      triggerCount: 0,
      nodes: [],
      connections: {},
      settings: { executionOrder: 'v1' },
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
    const http = createMockHttpClient([{ body: patched }]);
    const handle = new WorkflowClient(http);
    const resource = new WorkflowResource(handle, new ExecutionClient(http), {
      id: 'wf-1',
      name: 'Original',
      description: 'Original description',
      active: false,
      createdAt: '',
      updatedAt: '',
      isArchived: false,
      versionId: 'v1',
      triggerCount: 0,
      nodes: [],
      connections: {},
      settings: { executionOrder: 'v1' },
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

    await resource.patch({ name: 'Patched' });

    expect(http.put).toHaveBeenCalledWith('/workflows/wf-1', {
      name: 'Patched',
      description: 'Original description',
      nodes: [],
      connections: {},
      settings: { executionOrder: 'v1' },
      staticData: null,
      pinData: null,
    });
    expect(resource.name).toBe('Patched');
  });

  test('workflow resource patch builds its request without cloning the public snapshot', async () => {
    const patched = {
      id: 'wf-1',
      name: 'Patched',
      description: 'Original description',
      active: false,
      createdAt: '',
      updatedAt: '',
      isArchived: false,
      versionId: 'v2',
      triggerCount: 0,
      nodes: [{ id: 'node-1', name: 'Start', type: 'n8n-nodes-base.manualTrigger', position: [0, 0], parameters: {} }],
      connections: {},
      settings: { executionOrder: 'v1' },
      staticData: { runs: 1 },
      pinData: { Start: [{ json: { ok: true } }] },
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
    const http = createMockHttpClient([{ body: patched }]);
    const handle = new WorkflowClient(http);
    const cloneSpy = vi.spyOn(globalThis, 'structuredClone');

    try {
      const resource = new WorkflowResource(handle, new ExecutionClient(http), {
        id: 'wf-1',
        name: 'Original',
        description: 'Original description',
        active: false,
        createdAt: '',
        updatedAt: '',
        isArchived: false,
        versionId: 'v1',
        triggerCount: 0,
        nodes: [
          { id: 'node-1', name: 'Start', type: 'n8n-nodes-base.manualTrigger', position: [0, 0], parameters: {} },
        ],
        connections: {},
        settings: { executionOrder: 'v1' },
        staticData: { runs: 1 },
        pinData: { Start: [{ json: { ok: true } }] },
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

      cloneSpy.mockClear();

      await resource.patch({ name: 'Patched' });

      expect(cloneSpy).toHaveBeenCalledTimes(1);
      expect(http.put).toHaveBeenCalledWith('/workflows/wf-1', {
        name: 'Patched',
        description: 'Original description',
        nodes: [
          { id: 'node-1', name: 'Start', type: 'n8n-nodes-base.manualTrigger', position: [0, 0], parameters: {} },
        ],
        connections: {},
        settings: { executionOrder: 'v1' },
        staticData: { runs: 1 },
        pinData: { Start: [{ json: { ok: true } }] },
      });
    } finally {
      cloneSpy.mockRestore();
    }
  });

  test('workflow resource clones mutation responses before storing them', async () => {
    const updated = {
      ...baseWorkflow,
      id: 'wf-1',
      name: 'Updated',
      description: null,
      active: true,
      createdAt: '',
      updatedAt: '',
      isArchived: false,
      versionId: 'v2',
      triggerCount: 0,
      nodes: [],
      connections: {},
      settings: { executionOrder: 'v1' },
      staticData: { runs: 1 },
      pinData: { Start: [{ json: { ok: true } }] },
      meta: null,
      nodeGroups: [],
      activeVersionId: null,
      versionCounter: null,
      sourceWorkflowId: null,
    };
    const http = createMockHttpClient([{ body: updated }]);
    const handle = new WorkflowClient(http);
    const resource = new WorkflowResource(
      handle,
      new ExecutionClient(http),
      detailedWorkflow({ id: 'wf-1', name: 'Original', active: false, versionId: 'v1' }),
    );

    await resource.update({ name: 'Updated', nodes: [], connections: {}, settings: { executionOrder: 'v1' } });
    updated.name = 'Mutated outside';
    updated.settings.executionOrder = 'v0';
    (updated.staticData as { runs: number }).runs = 99;
    ((updated.pinData as { Start: Array<{ json: { ok: boolean } }> }).Start[0] as { json: { ok: boolean } }).json.ok =
      false;

    expect(resource.name).toBe('Updated');
    expect(resource.data.settings).toEqual({ executionOrder: 'v1' });
    expect(resource.data.staticData).toEqual({ runs: 1 });
    expect(resource.data.pinData).toEqual({ Start: [{ json: { ok: true } }] });
  });

  test('workflow resource preserves known enrichment when compact mutation responses omit it', async () => {
    const http = createMockHttpClient([
      {
        body: {
          id: 'wf-1',
          name: 'Workflow',
          description: null,
          active: false,
          createdAt: '',
          updatedAt: '',
          isArchived: false,
          versionId: 'v2',
          triggerCount: 0,
          nodes: [],
          connections: {},
          settings: {},
          staticData: null,
          pinData: null,
          meta: null,
          nodeGroups: [],
          activeVersionId: null,
          versionCounter: 2,
          sourceWorkflowId: null,
        },
      },
    ]);
    const handle = new WorkflowClient(http);
    const resource = new WorkflowResource(handle, new ExecutionClient(http), {
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
      versionCounter: 1,
      sourceWorkflowId: null,
      tags: [{ id: 'tag-1', name: 'prod', createdAt: '', updatedAt: '' }],
      shared: [
        {
          role: 'workflow:owner',
          workflowId: 'wf-1',
          projectId: 'proj-1',
          createdAt: '',
          updatedAt: '',
        },
      ],
      parentFolder: { id: 'folder-1', name: 'Root' } as never,
      activeVersion: null,
    });

    await resource.update({ name: 'Workflow', nodes: [], connections: {}, settings: {} });

    expect(resource.data.tags).toEqual([{ id: 'tag-1', name: 'prod', createdAt: '', updatedAt: '' }]);
    expect(resource.data.shared).toHaveLength(1);
    expect(resource.data.parentFolder).toEqual({ id: 'folder-1', name: 'Root' });
  });

  test('workflow resource honors explicit clears from compact mutation responses', async () => {
    const http = createMockHttpClient([
      {
        body: {
          id: 'wf-1',
          name: 'Workflow',
          description: null,
          active: false,
          createdAt: '',
          updatedAt: '',
          isArchived: false,
          versionId: 'v2',
          triggerCount: 0,
          nodes: [],
          connections: {},
          settings: {},
          staticData: null,
          pinData: null,
          meta: null,
          nodeGroups: [],
          activeVersionId: null,
          versionCounter: 2,
          sourceWorkflowId: null,
          tags: [],
          shared: [],
          parentFolder: null,
        },
      },
    ]);
    const handle = new WorkflowClient(http);
    const resource = new WorkflowResource(handle, new ExecutionClient(http), {
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
      versionCounter: 1,
      sourceWorkflowId: null,
      tags: [{ id: 'tag-1', name: 'prod', createdAt: '', updatedAt: '' }],
      shared: [
        {
          role: 'workflow:owner',
          workflowId: 'wf-1',
          projectId: 'proj-1',
          createdAt: '',
          updatedAt: '',
        },
      ],
      parentFolder: { id: 'folder-1', name: 'Root' } as never,
      activeVersion: null,
    });

    await resource.update({ name: 'Workflow', nodes: [], connections: {}, settings: {} });

    expect(resource.data.tags).toEqual([]);
    expect(resource.data.shared).toEqual([]);
    expect(resource.data.parentFolder).toBeNull();
  });

  test('workflow mapping rejects missing core identity fields', async () => {
    const http = createMockHttpClient([{ body: { name: 'Broken', active: false } }]);
    const handle = new WorkflowClient(http);

    await expect(handle.get('wf-1')).rejects.toThrow('workflow.id must be a string');
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
      { body: { id: 3, finished: true, mode: 'manual', startedAt: '', workflowId: 1, status: 'success' } },
      { body: { id: 3, finished: true, mode: 'manual', startedAt: '', workflowId: 1, status: 'success' } },
    ]);
    const workflowClient = new WorkflowClient(http);
    const resource = new WorkflowResource(
      workflowClient,
      new ExecutionClient(http),
      listedWorkflow({ id: '1', name: 'Workflow', active: false, versionId: 'v1' }),
    );

    const listed = await resource.executions().list({ status: 'success', limit: 10 });
    const listedResources = await resource.executions().listResources({ limit: 1 });
    const rawExecution = await resource.executions().get(3, { includeData: true });
    const execution = await resource.executions().getResource(3, { includeData: true });

    expect(http.get).toHaveBeenNthCalledWith(1, '/executions', { status: 'success', limit: 10, workflowId: '1' });
    expect(http.get).toHaveBeenNthCalledWith(2, '/executions', { limit: 1, workflowId: '1' });
    expect(http.get).toHaveBeenNthCalledWith(3, '/executions/3', { includeData: true });
    expect(http.get).toHaveBeenNthCalledWith(4, '/executions/3', { includeData: true });
    expect(listed.data[0].id).toBe(1);
    expect(listedResources.data[0]).toBeInstanceOf(ExecutionResource);
    expect(rawExecution.id).toBe(3);
    expect(execution).toBeInstanceOf(ExecutionResource);
  });

  test('workflow resource execution getResource uses a direct execution lookup', async () => {
    const http = createMockHttpClient([
      { body: { id: 3, finished: true, mode: 'manual', startedAt: '', workflowId: 1, status: 'success' } },
    ]);
    const workflowClient = new WorkflowClient(http);
    const resource = new WorkflowResource(
      workflowClient,
      new ExecutionClient(http),
      listedWorkflow({ id: '1', name: 'Workflow', active: false, versionId: 'v1' }),
    );

    const execution = await resource.executions().getResource(3, { includeData: true });

    expect(http.get).toHaveBeenCalledTimes(1);
    expect(http.get).toHaveBeenNthCalledWith(1, '/executions/3', { includeData: true });
    expect(execution).toBeInstanceOf(ExecutionResource);
  });

  test('workflow resource execution get returns 404 when direct execution detail belongs to another workflow', async () => {
    const http = createMockHttpClient([
      { body: { id: 3, finished: true, mode: 'manual', startedAt: '', workflowId: 2, status: 'success' } },
    ]);
    const resource = new WorkflowResource(
      new WorkflowClient(http),
      new ExecutionClient(http),
      listedWorkflow({ id: '1', name: 'Workflow', active: false, versionId: 'v1' }),
    );

    await expect(resource.executions().get(3, { includeData: true })).rejects.toMatchObject({
      status: 404,
      data: { id: 3, workflowId: '1' },
    });
    expect(http.get).toHaveBeenCalledTimes(1);
    expect(http.get).toHaveBeenCalledWith('/executions/3', { includeData: true });
  });
});
