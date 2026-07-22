import { describe, expect, test } from 'vitest';
import VariableClient from '../src/clients/variable';
import VariableResource from '../src/resources/variable';
import { createMockHttpClient } from './test-utils';

describe('Implementation Consistency: Variable', () => {
  test('list calls GET /variables', async () => {
    const http = createMockHttpClient([{ body: { data: [], nextCursor: undefined } }]);
    const handle = new VariableClient(http);

    const result = await handle.list({ limit: 10 });

    expect(http.get).toHaveBeenCalledWith('/variables', { limit: 10 });
    expect(result).toEqual({ data: [], nextCursor: null });
  });

  test('getResource finds a variable through list pagination', async () => {
    const http = createMockHttpClient([
      { body: { data: [{ id: 'v-1', key: 'FIRST', value: 'one' }], nextCursor: 'next' } },
      { body: { data: [{ id: 'v-2', key: 'SECOND', value: 'two' }], nextCursor: undefined } },
    ]);
    const handle = new VariableClient(http);

    const result = await handle.getResource('v-2');

    expect(http.get).toHaveBeenNthCalledWith(1, '/variables', { cursor: undefined });
    expect(http.get).toHaveBeenNthCalledWith(2, '/variables', { cursor: 'next' });
    expect(result).toBeInstanceOf(VariableResource);
    expect(result.id).toBe('v-2');
  });

  test('get finds a variable through list pagination', async () => {
    const http = createMockHttpClient([
      { body: { data: [{ id: 'v-1', key: 'FIRST', value: 'one' }], nextCursor: 'next' } },
      { body: { data: [{ id: 'v-2', key: 'SECOND', value: 'two' }], nextCursor: undefined } },
    ]);
    const handle = new VariableClient(http);

    const result = await handle.get('v-2');

    expect(http.get).toHaveBeenNthCalledWith(1, '/variables', { cursor: undefined });
    expect(http.get).toHaveBeenNthCalledWith(2, '/variables', { cursor: 'next' });
    expect(result.id).toBe('v-2');
  });

  test('listResources wraps variables as resources', async () => {
    const http = createMockHttpClient([
      { body: { data: [{ id: 'v-1', key: 'FIRST', value: 'one' }], nextCursor: undefined } },
    ]);
    const handle = new VariableClient(http);

    const result = await handle.listResources({ limit: 1 });

    expect(result.data[0]).toBeInstanceOf(VariableResource);
  });

  test('create calls POST /variables', async () => {
    const http = createMockHttpClient([{ body: undefined }]);
    const handle = new VariableClient(http);

    await handle.create({ key: 'MY_API_KEY', value: 'secret123' });

    expect(http.post).toHaveBeenCalledWith('/variables', { key: 'MY_API_KEY', value: 'secret123' });
  });

  test('update calls PUT /variables/:id', async () => {
    const http = createMockHttpClient([{ body: undefined }]);
    const handle = new VariableClient(http);

    await handle.update('v-1', { key: 'MY_API_KEY', value: 'newsecret' });

    expect(http.put).toHaveBeenCalledWith('/variables/v-1', { key: 'MY_API_KEY', value: 'newsecret' });
  });

  test('delete calls DELETE /variables/:id', async () => {
    const http = createMockHttpClient([{ body: undefined }]);
    const handle = new VariableClient(http);

    await handle.delete('v-1');

    expect(http.delete).toHaveBeenCalledWith('/variables/v-1');
  });

  test('variable resource methods use bound variable id', async () => {
    const http = createMockHttpClient([
      { body: undefined },
      {
        body: {
          data: [{ id: 'v-1', key: 'MY_API_KEY', value: 'newsecret', type: 'string', project: null }],
          nextCursor: null,
        },
      },
      { body: undefined },
    ]);
    const handle = new VariableClient(http);
    const resource = new VariableResource(handle, {
      id: 'v-1',
      key: 'MY_API_KEY',
      value: 'secret123',
      type: 'string',
      project: null,
    });

    await resource.update({ key: 'MY_API_KEY', value: 'newsecret' });
    await resource.refresh();
    await resource.delete();

    expect(resource.value).toBe('newsecret');
    expect(http.delete).toHaveBeenCalledWith('/variables/v-1');
  });

  test('variable resource patch sends only the partial payload (handler accepts partial updates)', async () => {
    const http = createMockHttpClient([{ body: undefined }]);
    const handle = new VariableClient(http);
    const resource = new VariableResource(handle, {
      id: 'v-1',
      key: 'MY_API_KEY',
      value: 'secret123',
      type: 'string',
      project: null,
    });

    await resource.patch({ value: 'newsecret' });

    expect(http.put).toHaveBeenCalledWith('/variables/v-1', { value: 'newsecret' });
    expect(resource.value).toBe('newsecret');
  });
});
