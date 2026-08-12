import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, test, vi } from 'vitest';
import N8nClient, { HttpError } from '../src/index';
import { HttpClient } from '../src/http-client';

function createAbortError(message: string): Error {
  const error = new Error(message);
  error.name = 'AbortError';
  return error;
}

async function listen(handler: (req: IncomingMessage, res: ServerResponse<IncomingMessage>) => void): Promise<{
  baseUrl: string;
  close: () => Promise<void>;
}> {
  const server = createServer(handler);

  await new Promise<void>((resolve, reject) => {
    server.listen(0, '127.0.0.1', (error?: Error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });

  const address = server.address() as AddressInfo;

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      }),
  };
}

async function readRequestBody(request: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString('utf8');
}

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

  test('reuses stateless client accessors without retaining project-scoped folder clients', () => {
    const client = new N8nClient({ baseUrl: 'http://localhost:5678', apiKey: 'test-key' }); // pragma: allowlist secret

    expect(client.workflows()).toBe(client.workflows());
    expect(client.projects()).toBe(client.projects());
    expect(client.folders('proj-1')).not.toBe(client.folders('proj-1'));
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

  test('retries network failures without depending on fetch error text', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('socket closed unexpectedly'))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: [] }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      );

    const client = new HttpClient({
      baseUrl: 'http://localhost:5678',
      apiKey: 'test-key', // pragma: allowlist secret
      transport: {
        fetch: fetchMock,
        sleep: vi.fn().mockResolvedValue(undefined),
        random: () => 0,
      },
    });

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

  test('retries malformed JSON error responses as HttpError instead of throwing SyntaxError', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response('{"message":', {
          status: 502,
          statusText: 'Bad Gateway',
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

  test('preserves raw error bodies and safe response metadata on HttpError', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('{"message":', {
        status: 502,
        statusText: 'Bad Gateway',
        headers: { 'content-type': 'application/json', 'x-trace-id': 'trace-1' },
      }),
    );

    vi.stubGlobal('fetch', fetchMock);

    const client = new HttpClient({ baseUrl: 'http://localhost:5678', apiKey: 'test-key' }); // pragma: allowlist secret

    await expect(client.request({ method: 'GET', path: '/workflows', retry: false })).rejects.toMatchObject({
      status: 502,
      statusText: 'Bad Gateway',
      method: 'GET',
      path: '/workflows',
      data: '{"message":',
      headers: {
        'content-type': 'application/json',
        'x-trace-id': 'trace-1',
      },
    });
  });

  test.each([
    ['GET', 200],
    ['POST', 201],
    ['HEAD', 200],
  ])('%s returns undefined for successful zero-length bodies', async (method, status) => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(null, {
        status,
        headers: { 'content-type': 'application/json' },
      }),
    );

    vi.stubGlobal('fetch', fetchMock);

    const client = new HttpClient({ baseUrl: 'http://localhost:5678', apiKey: 'test-key' }); // pragma: allowlist secret
    const result = await client.request({
      method,
      path: '/workflows',
      body: method === 'POST' ? { name: 'Test' } : undefined,
    });

    expect(result).toBeUndefined();
  });

  test('omits the query string when no query values remain', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: [] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    vi.stubGlobal('fetch', fetchMock);

    const client = new HttpClient({ baseUrl: 'http://localhost:5678', apiKey: 'test-key' }); // pragma: allowlist secret
    await client.get('/workflows', { cursor: undefined, projectId: null });

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:5678/api/v1/workflows', expect.any(Object));
  });

  test('serializes array query params as repeated keys', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: [] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    vi.stubGlobal('fetch', fetchMock);

    const client = new HttpClient({ baseUrl: 'http://localhost:5678', apiKey: 'test-key' }); // pragma: allowlist secret
    await client.get('/workflows', { tag: ['prod', 'staging'], active: true, limit: 5 });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:5678/api/v1/workflows?tag=prod&tag=staging&active=true&limit=5',
      expect.any(Object),
    );
  });

  test('rejects unsupported nested query values locally', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const client = new HttpClient({ baseUrl: 'http://localhost:5678', apiKey: 'test-key' }); // pragma: allowlist secret

    await expect(client.get('/workflows', { filter: { nested: true } as never })).rejects.toThrow(
      'Unsupported query value for "filter"',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('normalizes lowercase methods for retry behavior', async () => {
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
    const result = await client.request<{ data: unknown[] }>({ method: 'get', path: '/workflows' });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ data: [] });
  });

  test('honors Retry-After delta-seconds with deterministic jitter', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: 'Slow down' }), {
          status: 429,
          headers: { 'content-type': 'application/json', 'retry-after': '2' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: [] }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      );
    const sleepMock = vi.fn().mockResolvedValue(undefined);

    const client = new HttpClient({
      baseUrl: 'http://localhost:5678',
      apiKey: 'test-key', // pragma: allowlist secret
      transport: {
        fetch: fetchMock,
        sleep: sleepMock,
        random: () => 0.5,
      },
    });

    const result = await client.get<{ data: unknown[] }>('/workflows');

    expect(sleepMock).toHaveBeenCalledTimes(1);
    expect(sleepMock).toHaveBeenCalledWith(2200, expect.any(AbortSignal));
    expect(result).toEqual({ data: [] });
  });

  test('caps HTTP-date Retry-After delays before retrying', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: 'Maintenance' }), {
          status: 503,
          headers: {
            'content-type': 'application/json',
            'retry-after': 'Tue, 11 Aug 2026 12:01:00 GMT',
          },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: [] }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      );
    const sleepMock = vi.fn().mockResolvedValue(undefined);

    const client = new HttpClient({
      baseUrl: 'http://localhost:5678',
      apiKey: 'test-key', // pragma: allowlist secret
      transport: {
        fetch: fetchMock,
        sleep: sleepMock,
        now: () => Date.parse('Tue, 11 Aug 2026 12:00:00 GMT'),
        random: () => 0,
      },
    });

    const result = await client.get<{ data: unknown[] }>('/workflows');

    expect(sleepMock).toHaveBeenCalledTimes(1);
    expect(sleepMock).toHaveBeenCalledWith(30000, expect.any(AbortSignal));
    expect(result).toEqual({ data: [] });
  });

  test.each(['get', 'head'])('rejects lowercase %s request bodies locally', async (method) => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const client = new HttpClient({ baseUrl: 'http://localhost:5678', apiKey: 'test-key' }); // pragma: allowlist secret

    await expect(client.request({ method, path: '/workflows', body: { invalid: true } })).rejects.toThrow(
      `${method.toUpperCase()} requests cannot include a body`,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('treats requestTimeoutMs as a total deadline across retries and backoff', async () => {
    vi.useFakeTimers();

    const fetchMock = vi.fn().mockImplementation(
      async () =>
        new Response(JSON.stringify({ message: 'Busy' }), {
          status: 503,
          headers: { 'content-type': 'application/json' },
        }),
    );

    const client = new HttpClient({
      baseUrl: 'http://localhost:5678',
      apiKey: 'test-key', // pragma: allowlist secret
      requestTimeoutMs: 2_500,
      transport: {
        fetch: fetchMock,
        random: () => 0,
      },
    });

    const request = client.request({ method: 'GET', path: '/workflows' }).then(
      () => undefined,
      (error) => error,
    );
    await vi.advanceTimersByTimeAsync(2_500);

    await expect(request).resolves.toMatchObject({ name: 'AbortError' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test('caller abort stops pending retry delays and further attempts', async () => {
    vi.useFakeTimers();

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: 'Slow down' }), {
        status: 429,
        headers: { 'content-type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const client = new HttpClient({ baseUrl: 'http://localhost:5678', apiKey: 'test-key' }); // pragma: allowlist secret
    const controller = new AbortController();

    const request = client.request({ method: 'GET', path: '/workflows', signal: controller.signal }).then(
      () => undefined,
      (error) => error,
    );

    await Promise.resolve();
    controller.abort(createAbortError('Cancelled by caller'));
    await vi.runAllTimersAsync();

    await expect(request).resolves.toMatchObject({ name: 'AbortError', message: 'Cancelled by caller' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test.each([
    [{ apiKey: 'test-key' }, 'Authorization'], // pragma: allowlist secret
    [{ apiKey: 'test-key' }, 'x-n8n-api-key'], // pragma: allowlist secret
    [{ bearerToken: 'test-token' }, 'authorization'],
    [{ bearerToken: 'test-token' }, 'X-N8N-API-KEY'],
  ])('rejects sensitive header overrides locally for %s with header %s', async (authConfig, headerName) => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const client = new HttpClient({
      baseUrl: 'http://localhost:5678',
      ...authConfig,
    } as ConstructorParameters<typeof HttpClient>[0]);

    await expect(client.get('/workflows', undefined, { [headerName]: 'override' })).rejects.toThrow(
      `Header override not allowed: ${headerName}`,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('follows same-origin redirects without dropping auth', async () => {
    const requests: Array<{ path: string; apiKey: string | undefined }> = [];
    const server = await listen((req, res) => {
      requests.push({
        path: req.url ?? '',
        apiKey: typeof req.headers['x-n8n-api-key'] === 'string' ? req.headers['x-n8n-api-key'] : undefined,
      });

      if (req.url === '/api/v1/workflows') {
        res.writeHead(302, { location: '/api/v1/redirected' });
        res.end();
        return;
      }

      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ data: [] }));
    });

    try {
      const client = new HttpClient({ baseUrl: server.baseUrl, apiKey: 'test-key' }); // pragma: allowlist secret
      const result = await client.get<{ data: unknown[] }>('/workflows');

      expect(result).toEqual({ data: [] });
      expect(requests).toEqual([
        { path: '/api/v1/workflows', apiKey: 'test-key' }, // pragma: allowlist secret
        { path: '/api/v1/redirected', apiKey: 'test-key' }, // pragma: allowlist secret
      ]);
    } finally {
      await server.close();
    }
  });

  test.each([
    [{ apiKey: 'test-key' }, 'x-n8n-api-key'], // pragma: allowlist secret
    [{ bearerToken: 'test-token' }, 'authorization'],
  ])('blocks cross-origin redirects before credentials reach the target for %s', async (authConfig, headerName) => {
    const targetRequests: Array<string | undefined> = [];
    const target = await listen((req, res) => {
      targetRequests.push(typeof req.headers[headerName] === 'string' ? req.headers[headerName] : undefined);
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ leaked: true }));
    });

    const redirector = await listen((_req, res) => {
      res.writeHead(302, { location: `${target.baseUrl}/redirected` });
      res.end();
    });

    try {
      const client = new HttpClient({
        baseUrl: redirector.baseUrl,
        ...authConfig,
      } as ConstructorParameters<typeof HttpClient>[0]);

      await expect(client.get('/workflows')).rejects.toMatchObject({
        status: 302,
        message: 'Cross-origin redirect blocked',
      });
      expect(targetRequests).toEqual([]);
    } finally {
      await redirector.close();
      await target.close();
    }
  });

  test('removes lowercase multipart content-type overrides so fetch can add the boundary', async () => {
    let contentType: string | undefined;
    let body = '';
    const server = await listen(async (req, res) => {
      contentType = typeof req.headers['content-type'] === 'string' ? req.headers['content-type'] : undefined;
      body = await readRequestBody(req);
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    });

    try {
      const client = new HttpClient({ baseUrl: server.baseUrl, apiKey: 'test-key' }); // pragma: allowlist secret
      const form = new FormData();
      form.append('name', 'upload');

      await client.post<{ ok: boolean }>('/upload', form, undefined, { 'content-type': 'multipart/form-data' });

      expect(contentType).toMatch(/^multipart\/form-data; boundary=/);
      expect(body).toContain('name="name"');
      expect(body).toContain('upload');
    } finally {
      await server.close();
    }
  });
});
