import { describe, expect, test } from 'vitest';
import DiscoverClient from '../src/clients/discover';
import { createMockHttpClient } from './test-utils';

describe('Implementation Consistency: Discover', () => {
  test('get calls GET /discover', async () => {
    const discover = {
      data: { scopes: [], resources: {}, filters: {}, specUrl: '/api/v1/spec' },
    };
    const http = createMockHttpClient([{ body: discover }]);
    const handle = new DiscoverClient(http);

    const result = await handle.get();

    expect(http.get).toHaveBeenCalledWith('/discover', undefined);
    expect(result).toEqual(discover);
  });

  test('get with params passes query', async () => {
    const http = createMockHttpClient([{ body: { data: { scopes: [], resources: {}, filters: {}, specUrl: '' } } }]);
    const handle = new DiscoverClient(http);

    await handle.get({ include: 'schemas', resource: 'workflows', operation: 'getWorkflows' });

    expect(http.get).toHaveBeenCalledWith('/discover', {
      include: 'schemas',
      resource: 'workflows',
      operation: 'getWorkflows',
    });
  });
});
