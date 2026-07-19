import { describe, expect, test } from 'vitest';
import CommunityPackageClient from '../src/clients/community-package';
import CommunityPackageResource from '../src/resources/community-package';
import { createMockHttpClient } from './test-utils';

describe('Implementation Consistency: CommunityPackage', () => {
  test('list calls GET /community-packages', async () => {
    const http = createMockHttpClient([{ body: [] }]);
    const handle = new CommunityPackageClient(http);

    const result = await handle.list();

    expect(http.get).toHaveBeenCalledWith('/community-packages');
    expect(result).toEqual([]);
  });

  test('listResources wraps packages as resources', async () => {
    const http = createMockHttpClient([
      {
        body: [
          {
            packageName: 'n8n-nodes-foo',
            installedVersion: '1.0.0',
            authorName: '',
            authorEmail: '',
            installedNodes: [],
            createdAt: '',
            updatedAt: '',
          },
        ],
      },
    ]);
    const handle = new CommunityPackageClient(http);

    const result = await handle.listResources();

    expect(result[0]).toBeInstanceOf(CommunityPackageResource);
  });

  test('getResource resolves a package by name from list()', async () => {
    const http = createMockHttpClient([
      {
        body: [
          {
            packageName: 'n8n-nodes-foo',
            installedVersion: '1.0.0',
            authorName: '',
            authorEmail: '',
            installedNodes: [],
            createdAt: '',
            updatedAt: '',
          },
        ],
      },
    ]);
    const handle = new CommunityPackageClient(http);

    const result = await handle.getResource('n8n-nodes-foo');

    expect(result).toBeInstanceOf(CommunityPackageResource);
    expect(result.packageName).toBe('n8n-nodes-foo');
  });

  test('install calls POST /community-packages', async () => {
    const installed = {
      packageName: 'n8n-nodes-foo',
      installedVersion: '1.0.0',
      authorName: '',
      authorEmail: '',
      installedNodes: [],
      createdAt: '',
      updatedAt: '',
    };
    const http = createMockHttpClient([{ body: installed }]);
    const handle = new CommunityPackageClient(http);

    const result = await handle.install({ name: 'n8n-nodes-foo' });

    expect(http.post).toHaveBeenCalledWith('/community-packages', { name: 'n8n-nodes-foo' });
    expect(result).toEqual(installed);
  });

  test('installResource wraps installed package as a resource', async () => {
    const installed = {
      packageName: 'n8n-nodes-foo',
      installedVersion: '1.0.0',
      authorName: '',
      authorEmail: '',
      installedNodes: [],
      createdAt: '',
      updatedAt: '',
    };
    const http = createMockHttpClient([{ body: installed }]);
    const handle = new CommunityPackageClient(http);

    const result = await handle.installResource({ name: 'n8n-nodes-foo' });

    expect(result).toBeInstanceOf(CommunityPackageResource);
    expect(result.data).toEqual(installed);
  });

  test('update calls PATCH /community-packages/:name', async () => {
    const updated = {
      packageName: 'n8n-nodes-foo',
      installedVersion: '2.0.0',
      authorName: '',
      authorEmail: '',
      installedNodes: [],
      createdAt: '',
      updatedAt: '',
    };
    const http = createMockHttpClient([{ body: updated }]);
    const handle = new CommunityPackageClient(http);

    const result = await handle.update('n8n-nodes-foo', { version: '2.0.0' });

    expect(http.patch).toHaveBeenCalledWith('/community-packages/n8n-nodes-foo', { version: '2.0.0' });
    expect(result).toEqual(updated);
  });

  test('updateResource wraps updated package as a resource', async () => {
    const updated = {
      packageName: 'n8n-nodes-foo',
      installedVersion: '2.0.0',
      authorName: '',
      authorEmail: '',
      installedNodes: [],
      createdAt: '',
      updatedAt: '',
    };
    const http = createMockHttpClient([{ body: updated }]);
    const handle = new CommunityPackageClient(http);

    const result = await handle.updateResource('n8n-nodes-foo', { version: '2.0.0' });

    expect(result).toBeInstanceOf(CommunityPackageResource);
    expect(result.data).toEqual(updated);
  });

  test('uninstall calls DELETE /community-packages/:name', async () => {
    const http = createMockHttpClient([{ body: undefined }]);
    const handle = new CommunityPackageClient(http);

    await handle.uninstall('n8n-nodes-foo');

    expect(http.delete).toHaveBeenCalledWith('/community-packages/n8n-nodes-foo');
  });

  test('community package resource methods use bound package name', async () => {
    const updated = {
      packageName: 'n8n-nodes-foo',
      installedVersion: '2.0.0',
      authorName: '',
      authorEmail: '',
      installedNodes: [],
      createdAt: '',
      updatedAt: '',
    };
    const refreshed = {
      packageName: 'n8n-nodes-foo',
      installedVersion: '2.1.0',
      authorName: '',
      authorEmail: '',
      installedNodes: [],
      createdAt: '',
      updatedAt: '',
    };
    const http = createMockHttpClient([{ body: updated }, { body: [refreshed] }, { body: undefined }]);
    const handle = new CommunityPackageClient(http);
    const resource = new CommunityPackageResource(handle, {
      packageName: 'n8n-nodes-foo',
      installedVersion: '1.0.0',
      authorName: '',
      authorEmail: '',
      installedNodes: [],
      createdAt: '',
      updatedAt: '',
    });

    await resource.update({ version: '2.0.0' });
    await resource.refresh();
    await resource.uninstall();

    expect(resource.installedVersion).toBe('2.1.0');
    expect(http.delete).toHaveBeenCalledWith('/community-packages/n8n-nodes-foo');
  });

  test('community package resource patch uses the installed version as the base payload', async () => {
    const patched = {
      packageName: 'n8n-nodes-foo',
      installedVersion: '1.0.0',
      authorName: '',
      authorEmail: '',
      installedNodes: [],
      createdAt: '',
      updatedAt: '',
    };
    const http = createMockHttpClient([{ body: patched }]);
    const handle = new CommunityPackageClient(http);
    const resource = new CommunityPackageResource(handle, patched);

    await resource.patch({ verify: true });

    expect(http.patch).toHaveBeenCalledWith('/community-packages/n8n-nodes-foo', {
      version: '1.0.0',
      verify: true,
    });
    expect(resource.installedVersion).toBe('1.0.0');
  });
});
