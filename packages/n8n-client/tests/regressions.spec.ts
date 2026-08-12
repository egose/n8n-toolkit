import { describe, expect, test } from 'vitest';
import CommunityPackageClient from '../src/clients/community-package';
import FolderClient from '../src/clients/folder';
import WorkflowClient from '../src/clients/workflow';
import ExecutionClient from '../src/clients/execution';
import CredentialClient from '../src/clients/credential';
import { createMockHttpClient } from './test-utils';

describe('Implementation Consistency: Regressions', () => {
  test('workflow list passes all filter params correctly', async () => {
    const http = createMockHttpClient([{ body: { data: [], nextCursor: undefined } }]);
    const handle = new WorkflowClient(http);

    await handle.list({
      limit: 25,
      active: true,
      tags: 'production',
      name: 'deploy',
      projectId: 'proj-1',
      excludePinnedData: true,
    });

    expect(http.get).toHaveBeenCalledWith('/workflows', {
      limit: 25,
      active: true,
      tags: 'production',
      name: 'deploy',
      projectId: 'proj-1',
      excludePinnedData: true,
    });
  });

  test('execution list passes all filter params correctly', async () => {
    const http = createMockHttpClient([{ body: { data: [], nextCursor: undefined } }]);
    const handle = new ExecutionClient(http);

    await handle.list({
      limit: 50,
      status: 'error',
      workflowId: 'wf-1',
      projectId: 'proj-1',
      includeData: true,
      redactExecutionData: false,
    });

    expect(http.get).toHaveBeenCalledWith('/executions', {
      limit: 50,
      status: 'error',
      workflowId: 'wf-1',
      projectId: 'proj-1',
      includeData: true,
      redactExecutionData: false,
    });
  });

  test('credential create passes nested data correctly', async () => {
    const http = createMockHttpClient([
      {
        body: {
          id: 'c-1',
          name: 'AWS',
          type: 'aws',
          isManaged: false,
          isGlobal: true,
          isResolvable: true,
          createdAt: '',
          updatedAt: '',
        },
      },
    ]);
    const handle = new CredentialClient(http);

    await handle.create({
      name: 'AWS Credentials',
      type: 'aws',
      data: { accessKey: 'AKIA123', secretKey: 'secret456' }, // pragma: allowlist secret
      projectId: 'proj-1',
    });

    expect(http.post).toHaveBeenCalledWith('/credentials', {
      name: 'AWS Credentials',
      type: 'aws',
      data: { accessKey: 'AKIA123', secretKey: 'secret456' }, // pragma: allowlist secret
      projectId: 'proj-1',
    });
  });

  test('workflow activate passes optional body', async () => {
    const http = createMockHttpClient([
      {
        body: {
          id: 'wf-1',
          name: 'Updated Name',
          description: 'New desc',
          active: true,
          createdAt: '',
          updatedAt: '',
          isArchived: false,
          versionId: 'v-2',
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

    await handle.activate('wf-1', { versionId: 'v-2', name: 'Updated Name', description: 'New desc' });

    expect(http.post).toHaveBeenCalledWith('/workflows/wf-1/activate', {
      versionId: 'v-2',
      name: 'Updated Name',
      description: 'New desc',
    });
  });

  test('execution stopMany passes complex filter', async () => {
    const http = createMockHttpClient([{ body: { stopped: 3 } }]);
    const handle = new ExecutionClient(http);

    await handle.stopMany({
      status: ['running', 'queued', 'waiting'],
      workflowId: 'wf-1',
      startedAfter: '2024-01-01T00:00:00Z',
      startedBefore: '2024-01-02T00:00:00Z',
    });

    expect(http.post).toHaveBeenCalledWith('/executions/stop', {
      status: ['running', 'queued', 'waiting'],
      workflowId: 'wf-1',
      startedAfter: '2024-01-01T00:00:00Z',
      startedBefore: '2024-01-02T00:00:00Z',
    });
  });

  test('community package update and uninstall encode scoped package names as one segment', async () => {
    const http = createMockHttpClient([
      {
        body: {
          packageName: '@scope/n8n-nodes-example',
          installedVersion: '1.2.3',
          authorName: '',
          authorEmail: '',
          installedNodes: [],
          createdAt: '',
          updatedAt: '',
        },
      },
      { body: undefined },
    ]);
    const handle = new CommunityPackageClient(http);

    await handle.update('@scope/n8n-nodes-example', { version: '1.2.3' });
    await handle.uninstall('@scope/n8n-nodes-example');

    expect(http.patch).toHaveBeenCalledWith('/community-packages/%40scope%2Fn8n-nodes-example', { version: '1.2.3' });
    expect(http.delete).toHaveBeenCalledWith('/community-packages/%40scope%2Fn8n-nodes-example');
  });

  test('folder paths encode project and folder ids without changing static separators', async () => {
    const http = createMockHttpClient([
      { body: { id: 'folder', name: 'Folder', createdAt: '', updatedAt: '', totalSubFolders: 0, totalWorkflows: 0 } },
    ]);
    const handle = new FolderClient(http, 'proj/1?members#x');

    await handle.get('folder/2?tab=users#frag');

    expect(http.get).toHaveBeenCalledWith('/projects/proj%2F1%3Fmembers%23x/folders/folder%2F2%3Ftab%3Dusers%23frag');
  });

  test('workflow paths encode reserved characters, unicode, and percent-looking input per segment', async () => {
    const version = { versionId: 'v', workflowId: 'wf', nodes: [], connections: {}, authors: 'admin' };
    const http = createMockHttpClient([{ body: version }]);
    const handle = new WorkflowClient(http);
    const workflowId = 'wf/part?query#frag%2F snowman ☃';
    const versionId = 'v/1?draft#hash%2F snowman ☃';

    await handle.getVersion(workflowId, versionId);

    expect(http.get).toHaveBeenCalledWith(
      '/workflows/wf%2Fpart%3Fquery%23frag%252F%20snowman%20%E2%98%83/v%2F1%3Fdraft%23hash%252F%20snowman%20%E2%98%83',
    );
  });
});
