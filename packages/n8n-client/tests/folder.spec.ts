import { describe, expect, test } from 'vitest';
import FolderClient from '../src/clients/folder';
import FolderResource from '../src/resources/folder';
import { createMockHttpClient } from './test-utils';

describe('Implementation Consistency: Folder', () => {
  test('list calls GET /projects/:projectId/folders', async () => {
    const http = createMockHttpClient([{ body: { count: 0, data: [] } }]);
    const handle = new FolderClient(http, 'proj-1');

    const result = await handle.list({ take: '10' });

    expect(http.get).toHaveBeenCalledWith('/projects/proj-1/folders', { take: '10' });
    expect(result).toEqual({ count: 0, data: [] });
  });

  test('get calls GET /projects/:projectId/folders/:folderId', async () => {
    const folder = { id: 'f-1', name: 'My Folder', createdAt: '', updatedAt: '' };
    const http = createMockHttpClient([{ body: folder }]);
    const handle = new FolderClient(http, 'proj-1');

    const result = await handle.get('f-1');

    expect(http.get).toHaveBeenCalledWith('/projects/proj-1/folders/f-1');
    expect(result).toEqual(folder);
  });

  test('getResource returns a bound folder resource', async () => {
    const folder = { id: 'f-1', name: 'My Folder', createdAt: '', updatedAt: '' };
    const http = createMockHttpClient([{ body: folder }]);
    const handle = new FolderClient(http, 'proj-1');

    const result = await handle.getResource('f-1');

    expect(result).toBeInstanceOf(FolderResource);
    expect(result.data).toEqual(folder);
  });

  test('listResources wraps folder list items as resources', async () => {
    const http = createMockHttpClient([
      { body: { count: 1, data: [{ id: 'f-1', name: 'My Folder', createdAt: '', updatedAt: '' }] } },
    ]);
    const handle = new FolderClient(http, 'proj-1');

    const result = await handle.listResources({ take: '10' });

    expect(result.data[0]).toBeInstanceOf(FolderResource);
  });

  test('create calls POST /projects/:projectId/folders', async () => {
    const created = { id: 'f-2', name: 'New Folder', createdAt: '', updatedAt: '' };
    const http = createMockHttpClient([{ body: created }]);
    const handle = new FolderClient(http, 'proj-1');

    const result = await handle.create({ name: 'New Folder' });

    expect(http.post).toHaveBeenCalledWith('/projects/proj-1/folders', { name: 'New Folder' });
    expect(result).toEqual(created);
  });

  test('createResource wraps created folder as a resource', async () => {
    const created = { id: 'f-2', name: 'New Folder', createdAt: '', updatedAt: '' };
    const http = createMockHttpClient([{ body: created }]);
    const handle = new FolderClient(http, 'proj-1');

    const result = await handle.createResource({ name: 'New Folder' });

    expect(result).toBeInstanceOf(FolderResource);
    expect(result.data).toEqual(created);
  });

  test('update calls PATCH /projects/:projectId/folders/:folderId', async () => {
    const updated = { id: 'f-1', name: 'Updated Folder', createdAt: '', updatedAt: '' };
    const http = createMockHttpClient([{ body: updated }]);
    const handle = new FolderClient(http, 'proj-1');

    const result = await handle.update('f-1', { name: 'Updated Folder' });

    expect(http.patch).toHaveBeenCalledWith('/projects/proj-1/folders/f-1', { name: 'Updated Folder' });
    expect(result).toEqual(updated);
  });

  test('updateResource wraps updated folder as a resource', async () => {
    const updated = { id: 'f-1', name: 'Updated Folder', createdAt: '', updatedAt: '' };
    const http = createMockHttpClient([{ body: updated }]);
    const handle = new FolderClient(http, 'proj-1');

    const result = await handle.updateResource('f-1', { name: 'Updated Folder' });

    expect(result).toBeInstanceOf(FolderResource);
    expect(result.data).toEqual(updated);
  });

  test('delete calls DELETE /projects/:projectId/folders/:folderId', async () => {
    const http = createMockHttpClient([{ body: undefined }]);
    const handle = new FolderClient(http, 'proj-1');

    await handle.delete('f-1');

    expect(http.delete).toHaveBeenCalledWith('/projects/proj-1/folders/f-1', undefined);
  });

  test('delete with transferToFolderId passes query param', async () => {
    const http = createMockHttpClient([{ body: undefined }]);
    const handle = new FolderClient(http, 'proj-1');

    await handle.delete('f-1', 'f-2');

    expect(http.delete).toHaveBeenCalledWith('/projects/proj-1/folders/f-1', { transferToFolderId: 'f-2' });
  });

  test('folder resource methods use bound folder id', async () => {
    const updated = { id: 'f-1', name: 'Renamed', createdAt: '', updatedAt: '' };
    const http = createMockHttpClient([{ body: updated }, { body: undefined }]);
    const handle = new FolderClient(http, 'proj-1');
    const resource = new FolderResource(handle, { id: 'f-1', name: 'Old', createdAt: '', updatedAt: '' });

    await resource.update({ name: 'Renamed' });
    await resource.delete('f-2');

    expect(resource.name).toBe('Renamed');
    expect(http.delete).toHaveBeenCalledWith('/projects/proj-1/folders/f-1', { transferToFolderId: 'f-2' });
  });

  test('folder resource patch merges partial changes with the current folder data', async () => {
    const patched = { id: 'f-1', name: 'Old', parentFolderId: 'parent-1', createdAt: '', updatedAt: '' };
    const http = createMockHttpClient([{ body: patched }]);
    const handle = new FolderClient(http, 'proj-1');
    const resource = new FolderResource(handle, { id: 'f-1', name: 'Old', createdAt: '', updatedAt: '' });

    await resource.patch({ parentFolderId: 'parent-1' });

    expect(http.patch).toHaveBeenCalledWith('/projects/proj-1/folders/f-1', {
      name: 'Old',
      parentFolderId: 'parent-1',
    });
    expect(resource.parentFolderId).toBe('parent-1');
  });
});
