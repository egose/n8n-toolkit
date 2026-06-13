import { describe, expect, test } from 'vitest';
import N8nPackageHandle from '../src/handles/n8n-package';
import { createMockHttpClient } from './test-utils';

describe('Implementation Consistency: N8nPackage', () => {
  test('exportWorkflows calls POST /n8n-packages/export', async () => {
    const buffer = new ArrayBuffer(100);
    const http = createMockHttpClient([{ body: buffer }]);
    const handle = new N8nPackageHandle(http);

    const result = await handle.exportWorkflows({ workflowIds: ['wf-1', 'wf-2'] });

    expect(http.post).toHaveBeenCalledWith('/n8n-packages/export', { workflowIds: ['wf-1', 'wf-2'] }, undefined, {
      Accept: 'application/gzip',
    });
    expect(result).toBe(buffer);
  });

  test('importPackage sends required multipart fields', async () => {
    const response = {
      package: { sourceN8nVersion: '1.0.0', sourceId: 'src-1', exportedAt: '2024-01-01T00:00:00.000Z' },
      workflows: [],
      bindings: { workflows: {}, credentials: {} },
    };
    const http = createMockHttpClient([{ body: response }]);
    const handle = new N8nPackageHandle(http);
    const pkg = new Blob(['test']);

    const result = await handle.importPackage(pkg, {
      projectId: 'proj-1',
      workflowConflictPolicy: 'new-version',
    });

    expect(http.request).toHaveBeenCalledTimes(1);
    const request = http.request.mock.calls[0][0] as Record<string, unknown>;
    expect(request.method).toBe('POST');
    expect(request.path).toBe('/n8n-packages/import');
    expect(request.body).toBeInstanceOf(FormData);
    const body = request.body as FormData;
    const packageField = body.get('package');
    expect(packageField).toBeInstanceOf(Blob);
    expect((packageField as Blob).size).toBe(pkg.size);
    expect(body.get('projectId')).toBe('proj-1');
    expect(body.get('workflowConflictPolicy')).toBe('new-version');
    expect(result).toEqual(response);
  });
});
