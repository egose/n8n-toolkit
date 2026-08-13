/**
 * Centralized logging library for external endpoint interactions.
 *
 * Zero-dependency structured JSON logger built on Node.js console.
 * Provides consistent log format, configurable levels, child loggers
 * with module context, and helpers for request/response/error details.
 *
 * Configuration (environment variables):
 *   LOG_LEVEL  – minimum level to emit: "debug" | "info" | "warn" | "error" (default: "info")
 *
 * Usage:
 *   import { logger, createLogger } from './logger';
 *
 *   // Root logger
 *   logger.info('Server started', { port: 3000 });
 *
 *   // Module-scoped child logger
 *   const log = createLogger('CustomAPIs');
 *   log.warn('Access denied', { statusCode: 401 });
 *
 *   // Request/response/error helpers
 *   import { logRequest, logResponse, logError } from './logger';
 *   logRequest(log, { method: 'POST', url: '/api/v1/messages', headers: { 'x-tenant-id': '...' } });
 *   logResponse(log, { statusCode: 200, body: { id: '123' } });
 *   logError(log, error, { context: 'token exchange' });
 */

import { SYNC_SIGNATURE_HEADER, SYNC_TIMESTAMP_HEADER, SYNC_TOKEN_HEADER } from './auth';
import { DEFAULT_LOG_LEVEL, type SyncLogLevel } from './config';

// ---------------------------------------------------------------------------
// Log levels
// ---------------------------------------------------------------------------

const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 } as const;
type LogLevel = keyof typeof LOG_LEVELS;

function resolveLogLevel(logLevel: SyncLogLevel | undefined): LogLevel {
  return logLevel && logLevel in LOG_LEVELS ? (logLevel as LogLevel) : DEFAULT_LOG_LEVEL;
}

// ---------------------------------------------------------------------------
// Sensitive header keys to redact
// ---------------------------------------------------------------------------

const REDACTED = '[REDACTED]';
const RESERVED_FIELDS = new Set(['timestamp', 'level', 'module', 'msg']);
const URL_FIELDS = new Set(['url', 'target']);
const SENSITIVE_HEADERS = new Set([
  'authorization',
  'cookie',
  'set-cookie',
  'x-n8n-api-key',
  'x-api-key',
  SYNC_TOKEN_HEADER,
  SYNC_SIGNATURE_HEADER,
  SYNC_TIMESTAMP_HEADER,
]);
const SENSITIVE_QUERY_KEYS = new Set(
  [
    'access_token',
    'api_key',
    'authorization',
    'client_secret',
    'key',
    'password',
    'passwd',
    'refresh_token',
    'secret',
    'sig',
    'signature',
    'token',
    SYNC_TOKEN_HEADER,
    SYNC_SIGNATURE_HEADER,
    SYNC_TIMESTAMP_HEADER,
  ].map((key) => normalizeLookupKey(key)),
);

function normalizeLookupKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function sanitizeHeaders(headers: Record<string, unknown> | undefined): Record<string, string> | undefined {
  if (!headers) return undefined;
  const sanitized: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (value === undefined) continue;
    const lower = key.toLowerCase();
    sanitized[key] = SENSITIVE_HEADERS.has(lower) ? REDACTED : String(value);
  }
  return sanitized;
}

function sanitizeUrl(url: string | undefined): string | undefined {
  if (!url) {
    return undefined;
  }

  const isAbsolute = /^[a-z][a-z0-9+.-]*:/i.test(url);
  const base = 'https://sanitized.invalid';

  try {
    const parsed = new URL(url, base);
    if (parsed.username) {
      parsed.username = REDACTED;
    }
    if (parsed.password) {
      parsed.password = REDACTED;
    }

    if (parsed.search) {
      const sanitizedQuery = new URLSearchParams();
      for (const [key, value] of parsed.searchParams.entries()) {
        sanitizedQuery.append(key, SENSITIVE_QUERY_KEYS.has(normalizeLookupKey(key)) ? REDACTED : value);
      }
      parsed.search = sanitizedQuery.toString();
    }

    if (isAbsolute) {
      return parsed.toString();
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return url;
  }
}

function sanitizeContext(ctx: LogContext | undefined): Record<string, unknown> {
  if (!ctx) {
    return {};
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(ctx)) {
    if (RESERVED_FIELDS.has(key)) {
      continue;
    }

    if (key === 'headers' && isRecord(value)) {
      sanitized[key] = sanitizeHeaders(value);
      continue;
    }

    if (URL_FIELDS.has(key) && typeof value === 'string') {
      sanitized[key] = sanitizeUrl(value);
      continue;
    }

    sanitized[key] = value;
  }

  return sanitized;
}

// ---------------------------------------------------------------------------
// Logger class
// ---------------------------------------------------------------------------

export interface LogContext {
  [key: string]: unknown;
}

export interface Logger {
  debug(msg: string, ctx?: LogContext): void;
  info(msg: string, ctx?: LogContext): void;
  warn(msg: string, ctx?: LogContext): void;
  error(msg: string, ctx?: LogContext): void;
  child(module: string): Logger;
}

class StructuredLogger implements Logger {
  private readonly module: string | undefined;
  private readonly minLevel: number;

  constructor(module?: string, minLevel?: number) {
    this.module = module;
    this.minLevel = minLevel ?? LOG_LEVELS[DEFAULT_LOG_LEVEL];
  }

  debug(msg: string, ctx?: LogContext): void {
    this.emit('debug', msg, ctx);
  }

  info(msg: string, ctx?: LogContext): void {
    this.emit('info', msg, ctx);
  }

  warn(msg: string, ctx?: LogContext): void {
    this.emit('warn', msg, ctx);
  }

  error(msg: string, ctx?: LogContext): void {
    this.emit('error', msg, ctx);
  }

  /**
   * Create a child logger that inherits the minimum log level and adds a
   * `module` field to every log entry.
   */
  child(module: string): Logger {
    return new StructuredLogger(module, this.minLevel);
  }

  // -------------------------------------------------------------------------
  // Internal
  // -------------------------------------------------------------------------

  private emit(level: LogLevel, msg: string, ctx?: LogContext): void {
    if (LOG_LEVELS[level] < this.minLevel) return;

    const entry: Record<string, unknown> = {
      ...sanitizeContext(ctx),
      timestamp: new Date().toISOString(),
      level,
      ...(this.module ? { module: this.module } : {}),
      msg,
    };

    switch (level) {
      case 'debug':
        console.debug(JSON.stringify(entry));
        break;
      case 'info':
        console.info(JSON.stringify(entry));
        break;
      case 'warn':
        console.warn(JSON.stringify(entry));
        break;
      case 'error':
        console.error(JSON.stringify(entry));
        break;
    }
  }
}

// ---------------------------------------------------------------------------
// Singleton root logger & factory
// ---------------------------------------------------------------------------

/** Root logger instance (no module context). */
export const logger: Logger = new StructuredLogger();

/** Create a module-scoped child logger. */
export function createLogger(module: string, options?: { minLevel?: SyncLogLevel }): Logger {
  return new StructuredLogger(module, LOG_LEVELS[resolveLogLevel(options?.minLevel)]);
}

// ---------------------------------------------------------------------------
// Request / Response / Error helpers
// ---------------------------------------------------------------------------

export interface RequestDetails {
  method?: string;
  url?: string;
  headers?: Record<string, string | string[] | undefined>;
  /** Optional body summary — callers should take care not to pass raw secrets. */
  body?: unknown;
}

/**
 * Log outgoing or incoming request details at `debug` level.
 * Headers and URLs are sanitized; request bodies are intentionally omitted.
 */
export function logRequest(log: Logger, req: RequestDetails, extra?: LogContext): void {
  log.debug('request', {
    method: req.method,
    ...(req.url !== undefined ? { url: sanitizeUrl(req.url) } : {}),
    headers: sanitizeHeaders(req.headers),
    ...extra,
  });
}

export interface ResponseDetails {
  statusCode?: number;
  headers?: Record<string, string | string[] | undefined>;
  body?: unknown;
  durationMs?: number;
}

/**
 * Log response details at `debug` level (or `warn` for 4xx/5xx).
 */
export function logResponse(log: Logger, res: ResponseDetails, extra?: LogContext): void {
  const statusCode = res.statusCode ?? 0;
  const level: LogLevel = statusCode >= 400 ? 'warn' : 'debug';
  const ctx: LogContext = {
    statusCode,
    ...(res.headers ? { headers: sanitizeHeaders(res.headers) } : {}),
    ...(res.durationMs !== undefined ? { durationMs: res.durationMs } : {}),
    ...extra,
  };

  log[level]('response', ctx);
}

/**
 * Log an error with full context at `error` level.
 * Extracts message, stack, code, and any additional context supplied.
 */
export function logError(log: Logger, error: unknown, extra?: LogContext): void {
  const err = error instanceof Error ? error : new Error(String(error));
  const ctx: LogContext = {
    error: err.message,
    ...(err.stack ? { stack: err.stack } : {}),
    ...((err as NodeJS.ErrnoException).code ? { code: (err as NodeJS.ErrnoException).code } : {}),
    ...extra,
  };
  log.error('error', ctx);
}
