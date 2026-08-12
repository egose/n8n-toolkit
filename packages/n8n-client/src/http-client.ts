import type { HttpClock, HttpFetch, HttpRandom, HttpSleep, N8nClientConfig } from './types.js';
import { NetworkError, retryTransientError } from './utils/retry.js';

const MAX_REDIRECTS = 10;
const SENSITIVE_REQUEST_HEADERS = new Set(['authorization', 'x-n8n-api-key']);

export type QueryPrimitive = string | number | boolean;
export type QueryValue = QueryPrimitive | readonly QueryPrimitive[];
export type QueryParams = Record<string, QueryValue | null | undefined>;

interface HttpErrorDetails {
  method?: string;
  path?: string;
  statusText?: string;
  headers?: Record<string, string>;
}

export class HttpError extends Error {
  public status: number;
  public data: unknown;
  public method?: string;
  public path?: string;
  public statusText?: string;
  public headers?: Record<string, string>;

  constructor(status: number, message: string, data?: unknown, details?: HttpErrorDetails) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.data = data;
    this.method = details?.method;
    this.path = details?.path;
    this.statusText = details?.statusText;
    this.headers = details?.headers;
  }
}

interface ParsedResponse {
  data: unknown;
  rawBody: unknown;
}

export interface RequestOptions {
  method: string;
  path: string;
  body?: unknown;
  query?: object;
  headers?: Record<string, string>;
  /** Total deadline for this request, including retries and backoff. */
  timeoutMs?: number;
  /** Override the default retry policy. By default only GET/HEAD/OPTIONS requests retry. */
  retry?: boolean;
  /** Optional caller-controlled cancellation signal. */
  signal?: AbortSignal;
}

export class HttpClient {
  private baseUrl: string;
  private apiKey?: string;
  private bearerToken?: string;
  private requestTimeoutMs: number;
  private fetchImpl: HttpFetch;
  private sleep: HttpSleep;
  private now: HttpClock;
  private random: HttpRandom;

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
    this.requestTimeoutMs = config.requestTimeoutMs ?? 30_000;
    this.fetchImpl = config.transport?.fetch ?? globalThis.fetch;
    this.sleep =
      config.transport?.sleep ??
      ((delayMs, signal) =>
        new Promise((resolve, reject) => {
          if (signal.aborted) {
            reject(
              signal.reason instanceof Error
                ? signal.reason
                : Object.assign(new Error('This operation was aborted'), { name: 'AbortError' }),
            );
            return;
          }

          const timeout = setTimeout(() => {
            signal.removeEventListener('abort', onAbort);
            resolve();
          }, delayMs);

          const onAbort = () => {
            clearTimeout(timeout);
            reject(
              signal.reason instanceof Error
                ? signal.reason
                : Object.assign(new Error('This operation was aborted'), { name: 'AbortError' }),
            );
          };

          signal.addEventListener('abort', onAbort, { once: true });
        }));
    this.now = config.transport?.now ?? Date.now;
    this.random = config.transport?.random ?? Math.random;
  }

  private createAbortError(message: string): Error {
    const error = new Error(message);
    error.name = 'AbortError';
    return error;
  }

  private abortReason(signal: AbortSignal): Error {
    return signal.reason instanceof Error ? signal.reason : this.createAbortError('This operation was aborted');
  }

  private createDeadlineSignal(timeoutMs: number): { signal: AbortSignal; cancel: () => void } {
    const controller = new AbortController();

    if (timeoutMs <= 0) {
      controller.abort(this.createAbortError(`Request deadline exceeded after ${timeoutMs}ms`));
      return { signal: controller.signal, cancel: () => undefined };
    }

    const timeout = setTimeout(() => {
      controller.abort(this.createAbortError(`Request deadline exceeded after ${timeoutMs}ms`));
    }, timeoutMs);

    return {
      signal: controller.signal,
      cancel: () => clearTimeout(timeout),
    };
  }

  private combineSignals(primary: AbortSignal, secondary: AbortSignal): AbortSignal {
    if (primary.aborted) {
      return primary;
    }

    if (secondary.aborted) {
      return secondary;
    }

    const controller = new AbortController();
    const abort = (signal: AbortSignal) => {
      controller.abort(
        signal.reason instanceof Error ? signal.reason : this.createAbortError('This operation was aborted'),
      );
    };

    primary.addEventListener('abort', () => abort(primary), { once: true });
    secondary.addEventListener('abort', () => abort(secondary), { once: true });

    return controller.signal;
  }

  private isRetryableByDefault(method: string): boolean {
    const normalizedMethod = method.toUpperCase();
    return normalizedMethod === 'GET' || normalizedMethod === 'HEAD' || normalizedMethod === 'OPTIONS';
  }

  private assertNoSensitiveHeaderOverrides(headers?: Record<string, string>): void {
    if (!headers) {
      return;
    }

    for (const name of Object.keys(headers)) {
      if (SENSITIVE_REQUEST_HEADERS.has(name.toLowerCase())) {
        throw new Error(`Header override not allowed: ${name}`);
      }
    }
  }

  private buildHeaders(extraHeaders?: Record<string, string>, body?: unknown): Headers {
    this.assertNoSensitiveHeaderOverrides(extraHeaders);

    const headers = new Headers({
      Accept: 'application/json',
      'Content-Type': 'application/json',
    });

    if (this.bearerToken) {
      headers.set('Authorization', `Bearer ${this.bearerToken}`);
    } else if (this.apiKey) {
      headers.set('X-N8N-API-KEY', this.apiKey);
    }

    for (const [name, value] of Object.entries(extraHeaders ?? {})) {
      headers.set(name, value);
    }

    if (body instanceof FormData) {
      headers.delete('content-type');
    }

    return headers;
  }

  private isRedirectStatus(status: number): boolean {
    return status === 301 || status === 302 || status === 303 || status === 307 || status === 308;
  }

  private nextRedirectMethod(status: number, method: string): string {
    if ((status === 301 || status === 302) && method === 'POST') {
      return 'GET';
    }

    if (status === 303 && method !== 'GET' && method !== 'HEAD') {
      return 'GET';
    }

    return method;
  }

  private async fetchWithRedirectPolicy(
    url: string,
    method: string,
    body: BodyInit | undefined,
    headers: Headers,
    signal: AbortSignal,
  ): Promise<Response> {
    let currentUrl = url;
    let currentMethod = method;
    let currentBody = body;

    for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount++) {
      let response: Response;

      try {
        response = await this.fetchImpl(currentUrl, {
          method: currentMethod,
          headers,
          body: currentBody,
          signal,
          redirect: 'manual',
        });
      } catch (error) {
        if (signal.aborted) {
          throw this.abortReason(signal);
        }

        throw new NetworkError('Network request failed', { cause: error });
      }

      if (!this.isRedirectStatus(response.status)) {
        return response;
      }

      const location = response.headers.get('location');
      if (!location) {
        return response;
      }

      const nextUrl = new URL(location, currentUrl);
      if (nextUrl.origin !== new URL(currentUrl).origin) {
        throw new HttpError(response.status, 'Cross-origin redirect blocked');
      }

      const nextMethod = this.nextRedirectMethod(response.status, currentMethod);
      if (nextMethod !== currentMethod) {
        currentMethod = nextMethod;
        currentBody = undefined;
      }

      currentUrl = nextUrl.toString();
    }

    throw new Error('Too many redirects');
  }

  private isQueryPrimitive(value: unknown): value is QueryPrimitive {
    return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
  }

  private serializeQuery(query?: object): string {
    if (!query) {
      return '';
    }

    const searchParams = new URLSearchParams();

    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null) {
        continue;
      }

      if (Array.isArray(value)) {
        for (const entry of value) {
          if (!this.isQueryPrimitive(entry)) {
            throw new Error(`Unsupported query value for "${key}"`);
          }

          searchParams.append(key, String(entry));
        }

        continue;
      }

      if (!this.isQueryPrimitive(value)) {
        throw new Error(`Unsupported query value for "${key}"`);
      }

      searchParams.append(key, String(value));
    }

    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
  }

  private responseHeaders(response: Response): Record<string, string> {
    return Object.fromEntries(response.headers.entries());
  }

  private async parseResponseData(response: Response): Promise<ParsedResponse> {
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const text = await response.text();

      if (text === '') {
        return { data: undefined, rawBody: undefined };
      }

      try {
        return { data: JSON.parse(text), rawBody: text };
      } catch {
        return { data: text, rawBody: text };
      }
    }

    if (contentType.includes('application/gzip') || contentType.includes('application/octet-stream')) {
      const body = await response.arrayBuffer();
      return {
        data: body.byteLength === 0 ? undefined : body,
        rawBody: body.byteLength === 0 ? undefined : body,
      };
    }

    const text = await response.text();
    if (text === '') {
      return { data: undefined, rawBody: undefined };
    }

    try {
      return { data: JSON.parse(text), rawBody: text };
    } catch {
      return { data: text, rawBody: text };
    }
  }

  async request<T>(options: RequestOptions): Promise<T> {
    const { method, path, body, query, headers: extraHeaders, signal: callerSignal } = options;
    const normalizedMethod = method.toUpperCase();

    if (body !== undefined && (normalizedMethod === 'GET' || normalizedMethod === 'HEAD')) {
      throw new Error(`${normalizedMethod} requests cannot include a body`);
    }

    const queryString = this.serializeQuery(query);

    const url = `${this.baseUrl}/api/v1${path}${queryString}`;

    const timeoutMs = options.timeoutMs ?? this.requestTimeoutMs;
    const shouldRetry = options.retry ?? this.isRetryableByDefault(normalizedMethod);
    const deadline = this.createDeadlineSignal(timeoutMs);
    const requestSignal = callerSignal ? this.combineSignals(deadline.signal, callerSignal) : deadline.signal;

    const requestOnce = async () => {
      if (requestSignal.aborted) {
        throw this.abortReason(requestSignal);
      }

      const headers = this.buildHeaders(extraHeaders, body);
      let requestBody: BodyInit | undefined;

      if (body !== undefined) {
        requestBody = body instanceof FormData ? body : JSON.stringify(body);
      }

      const response = await this.fetchWithRedirectPolicy(url, normalizedMethod, requestBody, headers, requestSignal);

      if (!response.ok && response.status !== 204) {
        const { data, rawBody } = await this.parseResponseData(response);
        const message =
          typeof data === 'object' && data !== null && 'message' in data && typeof data.message === 'string'
            ? data.message
            : response.statusText || `HTTP ${response.status}`;

        throw new HttpError(response.status, message, rawBody ?? data, {
          method: normalizedMethod,
          path,
          statusText: response.statusText,
          headers: this.responseHeaders(response),
        });
      }

      return response;
    };

    try {
      const response = shouldRetry
        ? await retryTransientError(requestOnce, {
            signal: requestSignal,
            sleep: this.sleep,
            now: this.now,
            random: this.random,
          })
        : await requestOnce();

      if (normalizedMethod === 'HEAD' || response.status === 204) {
        return undefined as T;
      }

      return (await this.parseResponseData(response)).data as T;
    } finally {
      deadline.cancel();
    }
  }

  async get<T>(path: string, query?: object, headers?: Record<string, string>): Promise<T> {
    return this.request<T>({ method: 'GET', path, query, headers });
  }

  async post<T>(path: string, body?: unknown, query?: object, headers?: Record<string, string>): Promise<T> {
    return this.request<T>({ method: 'POST', path, body, query, headers });
  }

  async put<T>(path: string, body?: unknown, query?: object, headers?: Record<string, string>): Promise<T> {
    return this.request<T>({ method: 'PUT', path, body, query, headers });
  }

  async patch<T>(path: string, body?: unknown, query?: object, headers?: Record<string, string>): Promise<T> {
    return this.request<T>({ method: 'PATCH', path, body, query, headers });
  }

  async delete<T>(path: string, query?: object, headers?: Record<string, string>): Promise<T> {
    return this.request<T>({ method: 'DELETE', path, query, headers });
  }
}
