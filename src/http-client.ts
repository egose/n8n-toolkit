import type { N8nClientConfig } from './types.js';
import { retryTransientError } from './utils/retry.js';

export class HttpError extends Error {
  public status: number;
  public data: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.data = data;
  }
}

export interface RequestOptions {
  method: string;
  path: string;
  body?: unknown;
  query?: { [key: string]: unknown };
  headers?: Record<string, string>;
}

export class HttpClient {
  private baseUrl: string;
  private apiKey?: string;
  private bearerToken?: string;

  constructor(config: N8nClientConfig) {
    if (!config.apiKey && !config.bearerToken) {
      throw new Error('Either apiKey or bearerToken must be provided');
    }

    if (config.apiKey && config.bearerToken) {
      throw new Error('Provide either apiKey or bearerToken, not both');
    }

    this.baseUrl = config.baseUrl.replace(/\/+$/, '');
    this.apiKey = config.apiKey;
    this.bearerToken = config.bearerToken;
  }

  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    if (this.bearerToken) {
      headers['Authorization'] = `Bearer ${this.bearerToken}`;
    } else if (this.apiKey) {
      headers['X-N8N-API-KEY'] = this.apiKey;
    }

    return headers;
  }

  private async parseResponseData(response: Response): Promise<unknown> {
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      return response.json();
    }

    if (contentType.includes('application/gzip') || contentType.includes('application/octet-stream')) {
      return response.arrayBuffer();
    }

    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  async request<T>(options: RequestOptions): Promise<T> {
    const { method, path, body, query, headers: extraHeaders } = options;

    const queryString = query
      ? '?' +
        Object.entries(query)
          .filter(([, v]) => v !== undefined && v !== null)
          .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
          .join('&')
      : '';

    const url = `${this.baseUrl}/api/v1${path}${queryString}`;

    const headers = {
      ...this.buildHeaders(),
      ...extraHeaders,
    };

    const response = await retryTransientError(async () => {
      const init: RequestInit = { method, headers };

      if (body !== undefined && method !== 'GET') {
        if (body instanceof FormData) {
          init.body = body;
          delete headers['Content-Type'];
        } else {
          init.body = JSON.stringify(body);
        }
      }

      const response = await fetch(url, init);

      if (!response.ok && response.status !== 204) {
        const data = await this.parseResponseData(response);
        const message = (data as { message?: string })?.message || `HTTP ${response.status}`;
        throw new HttpError(response.status, message, data);
      }

      return response;
    });

    if (response.status === 204) {
      return undefined as T;
    }

    return (await this.parseResponseData(response)) as T;
  }

  async get<T>(path: string, query?: { [key: string]: unknown }, headers?: Record<string, string>): Promise<T> {
    return this.request<T>({ method: 'GET', path, query, headers });
  }

  async post<T>(
    path: string,
    body?: unknown,
    query?: { [key: string]: unknown },
    headers?: Record<string, string>,
  ): Promise<T> {
    return this.request<T>({ method: 'POST', path, body, query, headers });
  }

  async put<T>(
    path: string,
    body?: unknown,
    query?: { [key: string]: unknown },
    headers?: Record<string, string>,
  ): Promise<T> {
    return this.request<T>({ method: 'PUT', path, body, query, headers });
  }

  async patch<T>(
    path: string,
    body?: unknown,
    query?: { [key: string]: unknown },
    headers?: Record<string, string>,
  ): Promise<T> {
    return this.request<T>({ method: 'PATCH', path, body, query, headers });
  }

  async delete<T>(path: string, query?: { [key: string]: unknown }, headers?: Record<string, string>): Promise<T> {
    return this.request<T>({ method: 'DELETE', path, query, headers });
  }
}
