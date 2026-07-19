import { describe, expect, test } from 'vitest';
import SourceControlClient from '../src/clients/source-control';
import { createMockHttpClient } from './test-utils';

describe('Implementation Consistency: SourceControl', () => {
  test('pull calls POST /source-control/pull', async () => {
    const files = [
      {
        file: 'workflow.json',
        id: 'wf-1',
        name: 'My Workflow',
        type: 'workflow',
        status: 'new',
        location: 'remote',
        conflict: false,
        updatedAt: '',
      },
    ];
    const http = createMockHttpClient([{ body: files }]);
    const handle = new SourceControlClient(http);

    const result = await handle.pull({ force: false, autoPublish: 'none' });

    expect(http.post).toHaveBeenCalledWith('/source-control/pull', { force: false, autoPublish: 'none' });
    expect(result).toEqual(files);
  });

  test('pull requires a request body', async () => {
    const http = createMockHttpClient([{ body: [] }]);
    const handle = new SourceControlClient(http);

    await handle.pull({});

    expect(http.post).toHaveBeenCalledWith('/source-control/pull', {});
  });
});
