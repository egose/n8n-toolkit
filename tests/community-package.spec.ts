import { describe, expect, test } from 'vitest';
import CommunityPackageHandle from '../src/handles/community-package';
import { createMockHttpClient } from './test-utils';

describe('Implementation Consistency: CommunityPackage', () => {
  test('list calls GET /community-packages', async () => {
    const http = createMockHttpClient([{ body: [] }]);
    const handle = new CommunityPackageHandle(http);

    const result = await handle.list();

    expect(http.get).toHaveBeenCalledWith('/community-packages');
    expect(result).toEqual([]);
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
    const handle = new CommunityPackageHandle(http);

    const result = await handle.install({ name: 'n8n-nodes-foo' });

    expect(http.post).toHaveBeenCalledWith('/community-packages', { name: 'n8n-nodes-foo' });
    expect(result).toEqual(installed);
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
    const handle = new CommunityPackageHandle(http);

    const result = await handle.update('n8n-nodes-foo', { version: '2.0.0' });

    expect(http.patch).toHaveBeenCalledWith('/community-packages/n8n-nodes-foo', { version: '2.0.0' });
    expect(result).toEqual(updated);
  });

  test('uninstall calls DELETE /community-packages/:name', async () => {
    const http = createMockHttpClient([{ body: undefined }]);
    const handle = new CommunityPackageHandle(http);

    await handle.uninstall('n8n-nodes-foo');

    expect(http.delete).toHaveBeenCalledWith('/community-packages/n8n-nodes-foo');
  });
});
