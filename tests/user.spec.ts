import { describe, expect, test } from 'vitest';
import UserClient from '../src/clients/user';
import UserResource from '../src/resources/user';
import { createMockHttpClient } from './test-utils';

describe('Implementation Consistency: User', () => {
  test('list calls GET /users', async () => {
    const http = createMockHttpClient([{ body: { data: [], nextCursor: undefined } }]);
    const handle = new UserClient(http);

    const result = await handle.list({ limit: 10 });

    expect(http.get).toHaveBeenCalledWith('/users', { limit: 10 });
    expect(result).toEqual({ data: [], nextCursor: undefined });
  });

  test('get calls GET /users/:id', async () => {
    const user = { id: 'u-1', email: 'alice@example.com', isPending: false, createdAt: '', updatedAt: '' };
    const http = createMockHttpClient([{ body: user }]);
    const handle = new UserClient(http);

    const result = await handle.get('u-1');

    expect(http.get).toHaveBeenCalledWith('/users/u-1', undefined);
    expect(result).toEqual(user);
  });

  test('getResource returns a bound user resource', async () => {
    const user = { id: 'u-1', email: 'alice@example.com', isPending: false, createdAt: '', updatedAt: '' };
    const http = createMockHttpClient([{ body: user }]);
    const handle = new UserClient(http);

    const result = await handle.getResource('u-1');

    expect(result).toBeInstanceOf(UserResource);
  });

  test('listResources wraps users as resources', async () => {
    const http = createMockHttpClient([
      {
        body: {
          data: [{ id: 'u-1', email: 'alice@example.com', isPending: false, createdAt: '', updatedAt: '' }],
          nextCursor: undefined,
        },
      },
    ]);
    const handle = new UserClient(http);

    const result = await handle.listResources({ limit: 1 });

    expect(result.data[0]).toBeInstanceOf(UserResource);
  });

  test('create calls POST /users', async () => {
    const created = { user: { id: 'u-2', email: 'bob@example.com' } };
    const http = createMockHttpClient([{ body: created }]);
    const handle = new UserClient(http);

    const result = await handle.create([{ email: 'bob@example.com', role: 'global:member' }]);

    expect(http.post).toHaveBeenCalledWith('/users', [{ email: 'bob@example.com', role: 'global:member' }]);
    expect(result).toEqual(created);
  });

  test('delete calls DELETE /users/:id', async () => {
    const http = createMockHttpClient([{ body: undefined }]);
    const handle = new UserClient(http);

    await handle.delete('u-1');

    expect(http.delete).toHaveBeenCalledWith('/users/u-1');
  });

  test('changeRole calls PATCH /users/:id/role', async () => {
    const http = createMockHttpClient([{ body: undefined }]);
    const handle = new UserClient(http);

    await handle.changeRole('u-1', 'global:admin');

    expect(http.patch).toHaveBeenCalledWith('/users/u-1/role', { newRoleName: 'global:admin' });
  });

  test('user resource methods use bound user id and refresh local role', async () => {
    const refreshed = {
      id: 'u-1',
      email: 'alice@example.com',
      isPending: false,
      role: 'global:admin',
      createdAt: '',
      updatedAt: '',
    };
    const http = createMockHttpClient([{ body: undefined }, { body: refreshed }, { body: undefined }]);
    const handle = new UserClient(http);
    const resource = new UserResource(handle, {
      id: 'u-1',
      email: 'alice@example.com',
      isPending: false,
      createdAt: '',
      updatedAt: '',
    });

    await resource.changeRole('global:admin');
    await resource.refresh();
    await resource.delete();

    expect(resource.data.role).toBe('global:admin');
    expect(http.delete).toHaveBeenCalledWith('/users/u-1');
  });
});
