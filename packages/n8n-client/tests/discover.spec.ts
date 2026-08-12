import { describe, expect, test, vi } from 'vitest';
import N8nClient from '../src/index';
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
    expect(result).toEqual({
      data: { apiKeyScopes: [], resources: {}, filters: {}, specUrl: '/api/v1/spec' },
    });
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

  test('get rejects malformed discover responses at the response boundary', async () => {
    const http = createMockHttpClient([{ body: { data: null } }]);
    const handle = new DiscoverClient(http);

    await expect(handle.get()).rejects.toThrow('discover response.data must be an object');
  });

  test('bearer-auth clients fail clearly before calling the API', async () => {
    const fetch = vi.fn();
    const client = new N8nClient({
      baseUrl: 'http://localhost:5678',
      bearerToken: 'jwt-token',
      transport: { fetch: fetch as typeof globalThis.fetch },
    });

    await expect(client.discover().get()).rejects.toThrow(
      'GET /discover is only supported with API key authentication for the reviewed n8n Public API 1.1.1 contract',
    );
    expect(fetch).not.toHaveBeenCalled();
  });
});
