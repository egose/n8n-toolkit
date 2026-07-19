import { describe, expect, test } from 'vitest';
import CredentialClient from '../src/clients/credential';
import CredentialResource from '../src/resources/credential';
import { createMockHttpClient } from './test-utils';

describe('Implementation Consistency: Credential', () => {
  test('list calls GET /credentials', async () => {
    const http = createMockHttpClient([{ body: { data: [], nextCursor: undefined } }]);
    const handle = new CredentialClient(http);

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
    const handle = new CredentialClient(http);

    const result = await handle.get('c-1');

    expect(http.get).toHaveBeenCalledWith('/credentials/c-1');
    expect(result).toEqual(cred);
  });

  test('getResource returns a bound credential resource', async () => {
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
    const handle = new CredentialClient(http);

    const result = await handle.getResource('c-1');

    expect(result).toBeInstanceOf(CredentialResource);
    expect(result.data).toEqual(cred);
  });

  test('listResources wraps credential list items as resources', async () => {
    const http = createMockHttpClient([
      {
        body: {
          data: [
            {
              id: 'c-1',
              name: 'GitHub API',
              type: 'githubApi',
              isManaged: false,
              isGlobal: true,
              isResolvable: true,
              createdAt: '',
              updatedAt: '',
              shared: [],
            },
          ],
          nextCursor: undefined,
        },
      },
    ]);
    const handle = new CredentialClient(http);

    const result = await handle.listResources({ limit: 1 });

    expect(result.data[0]).toBeInstanceOf(CredentialResource);
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
    const handle = new CredentialClient(http);

    const result = await handle.create({ name: 'Slack', type: 'slackApi', data: { token: 'xoxb-123' } });

    expect(http.post).toHaveBeenCalledWith('/credentials', {
      name: 'Slack',
      type: 'slackApi',
      data: { token: 'xoxb-123' },
    });
    expect(result).toEqual(created);
  });

  test('createResource wraps created credential as a resource', async () => {
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
    const handle = new CredentialClient(http);

    const result = await handle.createResource({ name: 'Slack', type: 'slackApi', data: { token: 'xoxb-123' } });

    expect(result).toBeInstanceOf(CredentialResource);
    expect(result.data).toEqual(created);
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
    const handle = new CredentialClient(http);

    const result = await handle.update('c-1', { name: 'GitHub Updated' });

    expect(http.patch).toHaveBeenCalledWith('/credentials/c-1', { name: 'GitHub Updated' });
    expect(result).toEqual(updated);
  });

  test('updateResource wraps updated credential as a resource', async () => {
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
    const handle = new CredentialClient(http);

    const result = await handle.updateResource('c-1', { name: 'GitHub Updated' });

    expect(result).toBeInstanceOf(CredentialResource);
    expect(result.data).toEqual(updated);
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
    const handle = new CredentialClient(http);

    const result = await handle.delete('c-1');

    expect(http.delete).toHaveBeenCalledWith('/credentials/c-1');
    expect(result).toEqual(deleted);
  });

  test('test calls POST /credentials/:id/test', async () => {
    const http = createMockHttpClient([{ body: { status: 'OK', message: 'Connection successful' } }]);
    const handle = new CredentialClient(http);

    const result = await handle.test('c-1');

    expect(http.post).toHaveBeenCalledWith('/credentials/c-1/test');
    expect(result).toEqual({ status: 'OK', message: 'Connection successful' });
  });

  test('transfer calls PUT /credentials/:id/transfer', async () => {
    const http = createMockHttpClient([{ body: undefined }]);
    const handle = new CredentialClient(http);

    await handle.transfer('c-1', 'proj-2');

    expect(http.put).toHaveBeenCalledWith('/credentials/c-1/transfer', { destinationProjectId: 'proj-2' });
  });

  test('getSchema calls GET /credentials/schema/:typeName', async () => {
    const schema = { type: 'object', properties: { token: { type: 'string' } } };
    const http = createMockHttpClient([{ body: schema }]);
    const handle = new CredentialClient(http);

    const result = await handle.getSchema('githubApi');

    expect(http.get).toHaveBeenCalledWith('/credentials/schema/githubApi');
    expect(result).toEqual(schema);
  });

  test('credential resource methods use bound credential id and type', async () => {
    const updated = {
      id: 'c-1',
      name: 'Updated',
      type: 'githubApi',
      isManaged: false,
      isGlobal: true,
      isResolvable: true,
      createdAt: '',
      updatedAt: '',
    };
    const schema = { type: 'object' };
    const http = createMockHttpClient([
      { body: updated },
      { body: { status: 'OK', message: 'Connection successful' } },
      { body: undefined },
      { body: schema },
      { body: { id: 'c-1', name: 'Updated', type: 'githubApi', createdAt: '', updatedAt: '' } },
    ]);
    const handle = new CredentialClient(http);
    const resource = new CredentialResource(handle, {
      id: 'c-1',
      name: 'GitHub API',
      type: 'githubApi',
      isManaged: false,
      isGlobal: true,
      isResolvable: true,
      createdAt: '',
      updatedAt: '',
    });

    await resource.update({ name: 'Updated' });
    const testResult = await resource.test();
    await resource.transfer('proj-2');
    const resultSchema = await resource.getSchema();
    const deleted = await resource.delete();

    expect(resource.name).toBe('Updated');
    expect(testResult).toEqual({ status: 'OK', message: 'Connection successful' });
    expect(http.put).toHaveBeenCalledWith('/credentials/c-1/transfer', { destinationProjectId: 'proj-2' });
    expect(resultSchema).toEqual(schema);
    expect(deleted.id).toBe('c-1');
  });

  test('credential resource patch merges writable fields from the current snapshot', async () => {
    const patched = {
      id: 'c-1',
      name: 'Patched',
      type: 'githubApi',
      isManaged: false,
      isGlobal: true,
      isResolvable: true,
      createdAt: '',
      updatedAt: '',
    };
    const http = createMockHttpClient([{ body: patched }]);
    const handle = new CredentialClient(http);
    const resource = new CredentialResource(handle, {
      id: 'c-1',
      name: 'GitHub API',
      type: 'githubApi',
      isManaged: false,
      isGlobal: true,
      isResolvable: true,
      createdAt: '',
      updatedAt: '',
    });

    await resource.patch({ name: 'Patched' });

    expect(http.patch).toHaveBeenCalledWith('/credentials/c-1', {
      name: 'Patched',
      type: 'githubApi',
      isGlobal: true,
      isResolvable: true,
    });
    expect(resource.name).toBe('Patched');
  });
});
