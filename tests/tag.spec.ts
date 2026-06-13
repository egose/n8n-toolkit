import { describe, expect, test } from 'vitest';
import TagClient from '../src/clients/tag';
import TagResource from '../src/resources/tag';
import { createMockHttpClient } from './test-utils';

describe('Implementation Consistency: Tag', () => {
  test('list calls GET /tags', async () => {
    const http = createMockHttpClient([{ body: { data: [], nextCursor: undefined } }]);
    const handle = new TagClient(http);

    const result = await handle.list({ limit: 10 });

    expect(http.get).toHaveBeenCalledWith('/tags', { limit: 10 });
    expect(result).toEqual({ data: [], nextCursor: undefined });
  });

  test('get calls GET /tags/:id', async () => {
    const tag = { id: 't-1', name: 'Production', createdAt: '', updatedAt: '' };
    const http = createMockHttpClient([{ body: tag }]);
    const handle = new TagClient(http);

    const result = await handle.get('t-1');

    expect(http.get).toHaveBeenCalledWith('/tags/t-1');
    expect(result).toEqual(tag);
  });

  test('getResource returns a bound tag resource', async () => {
    const tag = { id: 't-1', name: 'Production', createdAt: '', updatedAt: '' };
    const http = createMockHttpClient([{ body: tag }]);
    const handle = new TagClient(http);

    const result = await handle.getResource('t-1');

    expect(result).toBeInstanceOf(TagResource);
  });

  test('listResources wraps tags as resources', async () => {
    const http = createMockHttpClient([
      { body: { data: [{ id: 't-1', name: 'Production', createdAt: '', updatedAt: '' }], nextCursor: undefined } },
    ]);
    const handle = new TagClient(http);

    const result = await handle.listResources({ limit: 1 });

    expect(result.data[0]).toBeInstanceOf(TagResource);
  });

  test('create calls POST /tags', async () => {
    const created = { id: 't-2', name: 'Staging', createdAt: '', updatedAt: '' };
    const http = createMockHttpClient([{ body: created }]);
    const handle = new TagClient(http);

    const result = await handle.create({ name: 'Staging' });

    expect(http.post).toHaveBeenCalledWith('/tags', { name: 'Staging' });
    expect(result).toEqual(created);
  });

  test('createResource wraps created tag as a resource', async () => {
    const created = { id: 't-2', name: 'Staging', createdAt: '', updatedAt: '' };
    const http = createMockHttpClient([{ body: created }]);
    const handle = new TagClient(http);

    const result = await handle.createResource({ name: 'Staging' });

    expect(result).toBeInstanceOf(TagResource);
    expect(result.data).toEqual(created);
  });

  test('update calls PUT /tags/:id', async () => {
    const updated = { id: 't-1', name: 'Prod', createdAt: '', updatedAt: '' };
    const http = createMockHttpClient([{ body: updated }]);
    const handle = new TagClient(http);

    const result = await handle.update('t-1', { name: 'Prod' });

    expect(http.put).toHaveBeenCalledWith('/tags/t-1', { name: 'Prod' });
    expect(result).toEqual(updated);
  });

  test('updateResource wraps updated tag as a resource', async () => {
    const updated = { id: 't-1', name: 'Prod', createdAt: '', updatedAt: '' };
    const http = createMockHttpClient([{ body: updated }]);
    const handle = new TagClient(http);

    const result = await handle.updateResource('t-1', { name: 'Prod' });

    expect(result).toBeInstanceOf(TagResource);
    expect(result.data).toEqual(updated);
  });

  test('delete calls DELETE /tags/:id', async () => {
    const http = createMockHttpClient([{ body: undefined }]);
    const handle = new TagClient(http);

    await handle.delete('t-1');

    expect(http.delete).toHaveBeenCalledWith('/tags/t-1');
  });

  test('tag resource methods use bound tag id', async () => {
    const updated = { id: 't-1', name: 'Prod', createdAt: '', updatedAt: '' };
    const deleted = { id: 't-1', name: 'Prod', createdAt: '', updatedAt: '' };
    const http = createMockHttpClient([{ body: updated }, { body: deleted }]);
    const handle = new TagClient(http);
    const resource = new TagResource(handle, { id: 't-1', name: 'Production', createdAt: '', updatedAt: '' });

    await resource.update({ name: 'Prod' });
    const result = await resource.delete();

    expect(resource.name).toBe('Prod');
    expect(result).toEqual(deleted);
  });
});
