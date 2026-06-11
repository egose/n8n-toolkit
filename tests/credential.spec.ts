import { describe, expect, test } from 'vitest';
import CredentialHandle from '../src/handles/credential';
import { createMockHttpClient } from './test-utils';

describe('Implementation Consistency: Credential', () => {
  test('list calls GET /credentials', async () => {
    const http = createMockHttpClient([{ body: { data: [], nextCursor: undefined } }]);
    const handle = new CredentialHandle(http);

    const result = await handle.list({ limit: 5 });

    expect(http.get).toHaveBeenCalledWith('/credentials', { limit: 5 });
    expect(result).toEqual({ data: [], nextCursor: undefined });
  });

  test('get calls GET /credentials/:id', async () => {
    const cred = {
      id: 'c-1',
      name: 'GitHub API',
      type: 'githubApi',
      isManaged: false,
      isGlobal: true,
      isResolvable: true,
      createdAt: '',
      updatedAt: '',
    };
    const http = createMockHttpClient([{ body: cred }]);
    const handle = new CredentialHandle(http);

    const result = await handle.get('c-1');

    expect(http.get).toHaveBeenCalledWith('/credentials/c-1');
    expect(result).toEqual(cred);
  });

  test('create calls POST /credentials', async () => {
    const created = {
      id: 'c-2',
      name: 'Slack',
      type: 'slackApi',
      isManaged: false,
      isGlobal: true,
      isResolvable: true,
      createdAt: '',
      updatedAt: '',
    };
    const http = createMockHttpClient([{ body: created }]);
    const handle = new CredentialHandle(http);

    const result = await handle.create({ name: 'Slack', type: 'slackApi', data: { token: 'xoxb-123' } });

    expect(http.post).toHaveBeenCalledWith('/credentials', {
      name: 'Slack',
      type: 'slackApi',
      data: { token: 'xoxb-123' },
    });
    expect(result).toEqual(created);
  });

  test('update calls PATCH /credentials/:id', async () => {
    const updated = {
      id: 'c-1',
      name: 'GitHub Updated',
      type: 'githubApi',
      isManaged: false,
      isGlobal: true,
      isResolvable: true,
      createdAt: '',
      updatedAt: '',
    };
    const http = createMockHttpClient([{ body: updated }]);
    const handle = new CredentialHandle(http);

    const result = await handle.update('c-1', { name: 'GitHub Updated' });

    expect(http.patch).toHaveBeenCalledWith('/credentials/c-1', { name: 'GitHub Updated' });
    expect(result).toEqual(updated);
  });

  test('delete calls DELETE /credentials/:id', async () => {
    const deleted = {
      id: 'c-1',
      name: 'GitHub API',
      type: 'githubApi',
      isResolvable: true,
      createdAt: '',
      updatedAt: '',
    };
    const http = createMockHttpClient([{ body: deleted }]);
    const handle = new CredentialHandle(http);

    const result = await handle.delete('c-1');

    expect(http.delete).toHaveBeenCalledWith('/credentials/c-1');
    expect(result).toEqual(deleted);
  });

  test('test calls POST /credentials/:id/test', async () => {
    const http = createMockHttpClient([{ body: { status: 'OK', message: 'Connection successful' } }]);
    const handle = new CredentialHandle(http);

    const result = await handle.test('c-1');

    expect(http.post).toHaveBeenCalledWith('/credentials/c-1/test');
    expect(result).toEqual({ status: 'OK', message: 'Connection successful' });
  });

  test('transfer calls PUT /credentials/:id/transfer', async () => {
    const http = createMockHttpClient([{ body: undefined }]);
    const handle = new CredentialHandle(http);

    await handle.transfer('c-1', 'proj-2');

    expect(http.put).toHaveBeenCalledWith('/credentials/c-1/transfer', { destinationProjectId: 'proj-2' });
  });

  test('getSchema calls GET /credentials/schema/:typeName', async () => {
    const schema = { type: 'object', properties: { token: { type: 'string' } } };
    const http = createMockHttpClient([{ body: schema }]);
    const handle = new CredentialHandle(http);

    const result = await handle.getSchema('githubApi');

    expect(http.get).toHaveBeenCalledWith('/credentials/schema/githubApi');
    expect(result).toEqual(schema);
  });
});
