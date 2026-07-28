import { afterEach, describe, expect, test, vi } from 'vitest';
import N8nClient, { HttpError } from '../src/index';
import { HttpClient } from '../src/http-client';

describe('N8nClient', () => {
  test('creates client with API key config', () => {
    const client = new N8nClient({ baseUrl: 'http://localhost:5678', apiKey: 'test-key' }); // pragma: allowlist secret
    expect(client.workflows()).toBeDefined();
  });

  test('creates client with bearer token config', () => {
    const client = new N8nClient({ baseUrl: 'http://localhost:5678', bearerToken: 'test-token' });
    expect(client.executions()).toBeDefined();
  });

  test('rejects config with both auth methods', () => {
    expect(
      () => new N8nClient({ baseUrl: 'http://localhost:5678', apiKey: 'test-key', bearerToken: 'test-token' } as never), // pragma: allowlist secret
    ).toThrow('Provide either apiKey or bearerToken, not both');
  });

  test('rejects config without auth', () => {
    expect(() => new N8nClient({ baseUrl: 'http://localhost:5678' } as never)).toThrow(
      'Either apiKey or bearerToken must be provided',
    );
  });

  test('resource clients are created from client', () => {
    const client = new N8nClient({ baseUrl: 'http://localhost:5678', apiKey: 'test-key' }); // pragma: allowlist secret
    expect(client.workflows()).toBeDefined();
    expect(client.executions()).toBeDefined();
    expect(client.credentials()).toBeDefined();
    expect(client.tags()).toBeDefined();
    expect(client.users()).toBeDefined();
    expect(client.variables()).toBeDefined();
    expect(client.projects()).toBeDefined();
    expect(client.dataTables()).toBeDefined();
    expect(client.folders('proj-1')).toBeDefined();
    expect(client.communityPackages()).toBeDefined();
    expect(client.audit()).toBeDefined();
    expect(client.insights()).toBeDefined();
    expect(client.sourceControl()).toBeDefined();
    expect(client.discover()).toBeDefined();
    expect(client.n8nPackage()).toBeDefined();
  });

  test('reuses stateless client accessors and project-scoped folder clients', () => {
    const client = new N8nClient({ baseUrl: 'http://localhost:5678', apiKey: 'test-key' }); // pragma: allowlist secret

    expect(client.workflows()).toBe(client.workflows());
    expect(client.projects()).toBe(client.projects());
    expect(client.folders('proj-1')).toBe(client.folders('proj-1'));
    expect(client.folders('proj-1')).not.toBe(client.folders('proj-2'));
  });

  test('exposes low-level request helpers without exposing the transport object', async () => {
    const requestSpy = vi.spyOn(HttpClient.prototype, 'get').mockResolvedValue({ data: [] });
    const client = new N8nClient({ baseUrl: 'http://localhost:5678', apiKey: 'test-key' }); // pragma: allowlist secret

    const result = await client.get<{ data: unknown[] }>('/workflows', { limit: 5 });

    expect('http' in client).toBe(false);
    expect(requestSpy).toHaveBeenCalledWith('/workflows', { limit: 5 }, undefined);
    expect(result).toEqual({ data: [] });
    requestSpy.mockRestore();
  });
});

describe('HttpClient', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  test('HttpError has status and data', () => {
    const error = new HttpError(404, 'Not Found', { code: 'NOT_FOUND' });
    expect(error.status).toBe(404);
    expect(error.message).toBe('Not Found');
    expect(error.data).toEqual({ code: 'NOT_FOUND' });
    expect(error.name).toBe('HttpError');
  });

  test('retries transient HTTP status responses', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: 'Slow down' }), {
          status: 429,
          headers: { 'content-type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: [] }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      );

    vi.stubGlobal('fetch', fetchMock);

    const client = new HttpClient({ baseUrl: 'http://localhost:5678', apiKey: 'test-key' }); // pragma: allowlist secret
    const result = await client.get<{ data: unknown[] }>('/workflows');

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ data: [] });
  });

  test('does not retry transient failures for unsafe methods by default', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: 'Slow down' }), {
        status: 429,
        headers: { 'content-type': 'application/json' },
      }),
    );

    vi.stubGlobal('fetch', fetchMock);

    const client = new HttpClient({ baseUrl: 'http://localhost:5678', apiKey: 'test-key' }); // pragma: allowlist secret

    await expect(client.post('/workflows', { name: 'Created once' })).rejects.toMatchObject({ status: 429 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test('aborts hung requests after the configured timeout', async () => {
    vi.useFakeTimers();

    const fetchMock = vi.fn().mockImplementation((_url: string, init?: RequestInit) => {
      return new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          reject(Object.assign(new Error('This operation was aborted'), { name: 'AbortError' }));
        });
      });
    });

    vi.stubGlobal('fetch', fetchMock);

    const client = new HttpClient({
      baseUrl: 'http://localhost:5678',
      apiKey: 'test-key', // pragma: allowlist secret
      requestTimeoutMs: 50,
    });

    const request = client.request({ method: 'GET', path: '/workflows', retry: false });
    const assertion = expect(request).rejects.toMatchObject({ name: 'AbortError' });
    await vi.advanceTimersByTimeAsync(50);

    await assertion;
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
