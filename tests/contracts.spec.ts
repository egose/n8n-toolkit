import { describe, expectTypeOf, test } from 'vitest';
import N8nClient from '../src/index';
import ProjectHandle from '../src/handles/project';
import DataTableHandle from '../src/handles/data-table';
import type { DataTableRow, DiscoverResponse } from '../src/types';
import { createMockHttpClient } from './test-utils';

describe('Public API contracts', () => {
  test('N8nClient does not expose the transport field', () => {
    type ClientHasHttp = 'http' extends keyof N8nClient ? true : false;
    expectTypeOf<ClientHasHttp>().toEqualTypeOf<false>();
  });

  test('ProjectHandle does not expose unsupported get()', () => {
    type ProjectHandleHasGet = 'get' extends keyof ProjectHandle ? true : false;
    expectTypeOf<ProjectHandleHasGet>().toEqualTypeOf<false>();
  });

  test('DiscoverResponse nests filters and specUrl under data', () => {
    expectTypeOf<DiscoverResponse>().toEqualTypeOf<{
      data: {
        scopes: string[];
        resources: Record<string, unknown>;
        filters: Record<string, { description: string; values: string[] }>;
        specUrl: string;
      };
    }>();
  });

  test('DataTableHandle row methods narrow return types from request flags', () => {
    const handle = new DataTableHandle(createMockHttpClient());

    expectTypeOf(handle.insertRows('dt-1', { data: [], returnType: 'id' })).toEqualTypeOf<Promise<number[]>>();
    expectTypeOf(handle.insertRows('dt-1', { data: [], returnType: 'all' })).toEqualTypeOf<Promise<DataTableRow[]>>();
    expectTypeOf(handle.updateRows('dt-1', { filter: { filters: [] }, data: {}, returnData: true })).toEqualTypeOf<
      Promise<DataTableRow[]>
    >();
    expectTypeOf(handle.upsertRow('dt-1', { filter: { filters: [] }, data: {}, returnData: true })).toEqualTypeOf<
      Promise<DataTableRow>
    >();
    expectTypeOf(handle.deleteRows('dt-1', { filter: '{}', returnData: true })).toEqualTypeOf<
      Promise<DataTableRow[]>
    >();
  });

  test('N8nClient exposes low-level request helpers', () => {
    const client = new N8nClient({ baseUrl: 'http://localhost:5678', apiKey: 'test-key' }); // pragma: allowlist secret

    expectTypeOf(client.get).toBeFunction();
    expectTypeOf(client.post).toBeFunction();
    expectTypeOf(client.put).toBeFunction();
    expectTypeOf(client.patch).toBeFunction();
    expectTypeOf(client.delete).toBeFunction();
    expectTypeOf(client.request).toBeFunction();
  });
});
