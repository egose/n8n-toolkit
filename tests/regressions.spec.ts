import { describe, expect, test } from 'vitest';
import WorkflowHandle from '../src/handles/workflow';
import ExecutionHandle from '../src/handles/execution';
import CredentialHandle from '../src/handles/credential';
import { createMockHttpClient } from './test-utils';

describe('Implementation Consistency: Regressions', () => {
  test('workflow list passes all filter params correctly', async () => {
    const http = createMockHttpClient([{ body: { data: [], nextCursor: undefined } }]);
    const handle = new WorkflowHandle(http);

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
    const handle = new ExecutionHandle(http);

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
    const handle = new CredentialHandle(http);

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
    const http = createMockHttpClient([{ body: { id: 'wf-1', active: true } }]);
    const handle = new WorkflowHandle(http);

    await handle.activate('wf-1', { versionId: 'v-2', name: 'Updated Name', description: 'New desc' });

    expect(http.post).toHaveBeenCalledWith('/workflows/wf-1/activate', {
      versionId: 'v-2',
      name: 'Updated Name',
      description: 'New desc',
    });
  });

  test('execution stopMany passes complex filter', async () => {
    const http = createMockHttpClient([{ body: { stopped: 3 } }]);
    const handle = new ExecutionHandle(http);

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
});
