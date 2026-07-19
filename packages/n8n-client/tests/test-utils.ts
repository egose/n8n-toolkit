import { HttpError, type HttpClient } from '../src/http-client';
import { vi } from 'vitest';

type MockResponse = {
  status?: number;
  body?: unknown;
  headers?: Record<string, string>;
};

export type MockHttpClient = HttpClient & {
  request: ReturnType<typeof vi.fn>;
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
  patch: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

function takeResponse(responses: MockResponse[], callIndex: number): MockResponse {
  return responses[callIndex] ?? responses[responses.length - 1] ?? { body: undefined };
}

function unwrapResponse(response: MockResponse): unknown {
  if (response.status && response.status >= 400) {
    throw new HttpError(response.status, `HTTP ${response.status}`, response.body);
  }

  return response.body;
}

function createMockHttpClient(responses: MockResponse[] = []): MockHttpClient {
  let callIndex = 0;

  const consume = () => {
    const response = takeResponse(responses, callIndex);
    callIndex++;
    return unwrapResponse(response);
  };

  return {
    request: vi.fn().mockImplementation(async () => consume()),
    get: vi.fn().mockImplementation(async () => consume()),
    post: vi.fn().mockImplementation(async () => consume()),
    put: vi.fn().mockImplementation(async () => consume()),
    patch: vi.fn().mockImplementation(async () => consume()),
    delete: vi.fn().mockImplementation(async () => consume()),
  } as unknown as MockHttpClient;
}

export { createMockHttpClient };
