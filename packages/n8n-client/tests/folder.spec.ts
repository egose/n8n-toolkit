import { describe, expect, test } from 'vitest';
import FolderClient from '../src/clients/folder';
import FolderResource from '../src/resources/folder';
import { createMockHttpClient } from './test-utils';

const normalizedFolder = <T extends Record<string, unknown>>(folder: T) => ({
  ...folder,
});

const normalizedFolderDetail = <T extends Record<string, unknown>>(folder: T) => ({
  ...folder,
});

describe('Implementation Consistency: Folder', () => {
  test('list calls GET /projects/:projectId/folders', async () => {
    const http = createMockHttpClient([{ body: { count: 0, data: [] } }]);
    const handle = new FolderClient(http, 'proj-1');

    const result = await handle.list({ skip: 0, take: 10 });

    expect(http.get).toHaveBeenCalledWith('/projects/proj-1/folders', { skip: 0, take: 10 });
    expect(result).toEqual({ count: 0, data: [] });
  });

  test('get calls GET /projects/:projectId/folders/:folderId', async () => {
    const folder = {
      id: 'f-1',
      name: 'My Folder',
      createdAt: '',
      updatedAt: '',
      totalSubFolders: 0,
      totalWorkflows: 0,
    };
    const http = createMockHttpClient([{ body: folder }]);
    const handle = new FolderClient(http, 'proj-1');

    const result = await handle.get('f-1');

    expect(http.get).toHaveBeenCalledWith('/projects/proj-1/folders/f-1');
    expect(result).toEqual(normalizedFolderDetail(folder));
  });

  test('getResource returns a bound folder resource', async () => {
    const folder = {
      id: 'f-1',
      name: 'My Folder',
      createdAt: '',
      updatedAt: '',
      totalSubFolders: 0,
      totalWorkflows: 0,
    };
    const http = createMockHttpClient([{ body: folder }]);
    const handle = new FolderClient(http, 'proj-1');

    const result = await handle.getResource('f-1');

    expect(result).toBeInstanceOf(FolderResource);
    expect(result.data).toEqual(normalizedFolderDetail(folder));
  });

  test('listResources wraps folder list items as resources and preserves count', async () => {
    const http = createMockHttpClient([
      { body: { count: 1, data: [{ id: 'f-1', name: 'My Folder', createdAt: '', updatedAt: '' }] } },
    ]);
    const handle = new FolderClient(http, 'proj-1');

    const result = await handle.listResources({ skip: 0, take: 10 });

    expect(result.count).toBe(1);
    expect(result.data[0]).toBeInstanceOf(FolderResource);
  });

  test('list forwards numeric skip and take boundaries unchanged', async () => {
    const http = createMockHttpClient([{ body: { count: 2, data: [] } }]);
    const handle = new FolderClient(http, 'proj-1');

    await handle.list({ skip: 0, take: 1 });

    expect(http.get).toHaveBeenCalledWith('/projects/proj-1/folders', { skip: 0, take: 1 });
  });

  test('create calls POST /projects/:projectId/folders', async () => {
    const created = { id: 'f-2', name: 'New Folder', createdAt: '', updatedAt: '' };
    const http = createMockHttpClient([{ body: created }]);
    const handle = new FolderClient(http, 'proj-1');

    const result = await handle.create({ name: 'New Folder' });

    expect(http.post).toHaveBeenCalledWith('/projects/proj-1/folders', { name: 'New Folder' });
    expect(result).toEqual(normalizedFolder(created));
  });

  test('createResource wraps created folder as a resource', async () => {
    const created = { id: 'f-2', name: 'New Folder', createdAt: '', updatedAt: '' };
    const http = createMockHttpClient([{ body: created }]);
    const handle = new FolderClient(http, 'proj-1');

    const result = await handle.createResource({ name: 'New Folder' });

    expect(result).toBeInstanceOf(FolderResource);
    expect(result.data).toEqual(normalizedFolder(created));
  });

  test('update calls PATCH /projects/:projectId/folders/:folderId', async () => {
    const updated = {
      id: 'f-1',
      name: 'Updated Folder',
      parentFolderId: null,
      createdAt: '',
      updatedAt: '',
    };
    const http = createMockHttpClient([{ body: updated }]);
    const handle = new FolderClient(http, 'proj-1');

    const result = await handle.update('f-1', { name: 'Updated Folder' });

    expect(http.patch).toHaveBeenCalledWith('/projects/proj-1/folders/f-1', { name: 'Updated Folder' });
    expect(result).toEqual(updated);
  });

  test('updateResource wraps updated folder as a resource', async () => {
    const current = {
      id: 'f-1',
      name: 'Folder',
      parentFolderId: null,
      parentFolder: null,
      homeProject: { id: 'proj-1', name: 'Project', type: 'team', icon: null },
      tags: [{ id: 't-1', name: 'tag' }],
      workflowCount: 3,
      subFolderCount: 1,
      createdAt: '',
      updatedAt: '',
      totalSubFolders: 1,
      totalWorkflows: 3,
    };
    const updated = {
      id: 'f-1',
      name: 'Updated Folder',
      parentFolderId: null,
      createdAt: '',
      updatedAt: '',
    };
    const http = createMockHttpClient([{ body: current }, { body: updated }]);
    const handle = new FolderClient(http, 'proj-1');

    const result = await handle.updateResource('f-1', { name: 'Updated Folder' });

    expect(result).toBeInstanceOf(FolderResource);
    expect(result.data).toEqual({
      ...current,
      ...updated,
    });
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
    const updated = {
      id: 'f-1',
      name: 'Renamed',
      parentFolderId: null,
      parentFolder: null,
      homeProject: null,
      tags: [],
      workflowCount: null,
      subFolderCount: null,
      createdAt: '',
      updatedAt: '',
    };
    const http = createMockHttpClient([{ body: updated }, { body: undefined }]);
    const handle = new FolderClient(http, 'proj-1');
    const resource = new FolderResource(handle, {
      id: 'f-1',
      name: 'Old',
      parentFolderId: null,
      parentFolder: null,
      homeProject: null,
      tags: [],
      workflowCount: null,
      subFolderCount: null,
      createdAt: '',
      updatedAt: '',
    });

    await resource.update({ name: 'Renamed' });
    await resource.delete('f-2');

    expect(resource.name).toBe('Renamed');
    expect(http.delete).toHaveBeenCalledWith('/projects/proj-1/folders/f-1', { transferToFolderId: 'f-2' });
  });

  test('folder resource patch forwards only the partial payload', async () => {
    const patched = {
      id: 'f-1',
      name: 'Old',
      parentFolderId: 'parent-1',
      parentFolder: null,
      homeProject: null,
      tags: [],
      workflowCount: null,
      subFolderCount: null,
      createdAt: '',
      updatedAt: '',
    };
    const http = createMockHttpClient([{ body: patched }]);
    const handle = new FolderClient(http, 'proj-1');
    const resource = new FolderResource(handle, {
      id: 'f-1',
      name: 'Old',
      parentFolderId: null,
      parentFolder: null,
      homeProject: null,
      tags: [],
      workflowCount: null,
      subFolderCount: null,
      createdAt: '',
      updatedAt: '',
    });

    await resource.patch({ parentFolderId: 'parent-1' });

    expect(http.patch).toHaveBeenCalledWith('/projects/proj-1/folders/f-1', { parentFolderId: 'parent-1' });
    expect(resource.parentFolderId).toBe('parent-1');
  });

  test('folder resource update preserves list metadata when the mutation response is compact', async () => {
    const http = createMockHttpClient([
      {
        body: {
          id: 'f-1',
          name: 'Folder Renamed',
          parentFolderId: null,
          createdAt: '',
          updatedAt: '',
        },
      },
    ]);
    const handle = new FolderClient(http, 'proj-1');
    const resource = new FolderResource(handle, {
      id: 'f-1',
      name: 'Folder',
      parentFolderId: null,
      parentFolder: null,
      homeProject: { id: 'proj-1', name: 'Project', type: 'team', icon: null },
      tags: [{ id: 't-1', name: 'tag' }],
      workflowCount: 3,
      subFolderCount: 1,
      createdAt: '',
      updatedAt: '',
    });

    await resource.update({ name: 'Folder Renamed' });

    expect(resource.data).toEqual({
      id: 'f-1',
      name: 'Folder Renamed',
      parentFolderId: null,
      parentFolder: null,
      homeProject: { id: 'proj-1', name: 'Project', type: 'team', icon: null },
      tags: [{ id: 't-1', name: 'tag' }],
      workflowCount: 3,
      subFolderCount: 1,
      createdAt: '',
      updatedAt: '',
    });
  });
});
