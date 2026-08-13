// ---------------------------------------------------------------------------
// Centralized environment configuration
//
// Every process.env reference in this package should live here (or be derived
// from values here). This provides a single lookup for all environment
// variables, their defaults, and processed / derived values.
// ---------------------------------------------------------------------------

import type { SyncAuthMode } from './auth';

/** Keys imported by both sides to gate per-entity behavior. */
export type SyncEntity = 'workflows' | 'credentials' | 'executions';
export type SyncEnv = Record<string, string | undefined>;

export type SyncLogLevel = 'debug' | 'info' | 'warn' | 'error';

export type SyncAuthConfig =
  | {
      mode: 'hmac';
      secret: string;
    }
  | {
      mode: 'token';
      token: string;
    };

export interface PublisherConfig {
  sourceId: string;
  subscriberUrls: readonly string[];
  eventsPath: string;
  timeoutMs: number;
  maxAttempts: number;
  maxQueueSize: number;
  publisherStatePath: string;
}

export interface SubscriberConfig {
  routeBase: string;
  targetProjectId: string;
  applyActiveState: boolean;
  maxBodyBytes: number;
  signatureToleranceMs: number;
  replayCacheSize: number;
  subscriberStatePath: string;
  n8nDiPath: string;
  n8nDbPath: string;
}

export interface SyncConfig {
  logLevel: SyncLogLevel;
  auth: SyncAuthConfig;
  entities: ReadonlySet<SyncEntity>;
  filterByTag: boolean;
  syncWorkflowTag: string;
  activeTag: string;
  publisher: PublisherConfig;
  subscriber: SubscriberConfig;
}

export const DEFAULT_LOG_LEVEL: SyncLogLevel = 'info';
export const DEFAULT_SYNC_AUTH_MODE: SyncAuthMode = 'hmac';
export const DEFAULT_SYNC_ENTITIES = new Set<SyncEntity>(['workflows', 'credentials']) as ReadonlySet<SyncEntity>;
export const DEFAULT_SYNC_FILTER_BY_TAG = false;
export const DEFAULT_SYNC_WORKFLOW_TAG = 'sync';
export const DEFAULT_SYNC_ACTIVE_TAG = 'active';
export const DEFAULT_SYNC_EVENTS_PATH = '/rest/sync/v1/events';
export const DEFAULT_SYNC_TIMEOUT_MS = 10_000;
export const DEFAULT_SYNC_MAX_RETRIES = 3;
export const DEFAULT_SYNC_MAX_QUEUE_SIZE = 1_000;
export const DEFAULT_SYNC_PUBLISHER_STATE_PATH = '/home/node/.n8n/sync-state/publisher-ordering.json';
export const DEFAULT_SYNC_ROUTE_BASE = '/rest/sync/v1';
export const DEFAULT_SYNC_MAX_BODY_BYTES = 16 * 1024 * 1024;
export const DEFAULT_SYNC_SIGNATURE_TOLERANCE_MS = 5 * 60 * 1000;
export const DEFAULT_SYNC_REPLAY_CACHE_SIZE = 10_000;
export const DEFAULT_SYNC_SUBSCRIBER_STATE_PATH = '/home/node/.n8n/sync-state/subscriber-ordering.json';
export const DEFAULT_N8N_DI_PATH = '/usr/local/lib/node_modules/n8n/node_modules/@n8n/di';
export const DEFAULT_N8N_DB_PATH = '/usr/local/lib/node_modules/n8n/node_modules/@n8n/db';

const ENTITY_NAMES: readonly SyncEntity[] = ['workflows', 'credentials', 'executions'];
const LOG_LEVEL_NAMES: readonly SyncLogLevel[] = ['debug', 'info', 'warn', 'error'];
const LOCAL_URL_BASE = 'https://n8n-sync.local';
const DEV_HTTP_NODE_ENVS = new Set(['development', 'test']);

interface IntOptionRange {
  min: number;
  max: number;
  defaultValue: number;
}

export function assertValidSyncEntitySelection(entities: ReadonlySet<SyncEntity>): void {
  if (entities.has('executions') && !entities.has('workflows')) {
    throw new Error('SYNC_ENTITIES=executions requires workflows to also be enabled');
  }
}

function isBlank(raw: string | undefined): boolean {
  return raw === undefined || raw.trim() === '';
}

function describeValue(raw: string): string {
  return JSON.stringify(raw.length > 120 ? `${raw.slice(0, 117)}...` : raw);
}

function requireEnumValue<T extends string>(
  key: string,
  raw: string | undefined,
  allowed: readonly T[],
  defaultValue: T,
): T {
  const rawValue = raw ?? '';
  if (rawValue.trim() === '') return defaultValue;

  const normalized = rawValue.trim().toLowerCase() as T;
  if (allowed.includes(normalized)) {
    return normalized;
  }

  throw new Error(
    `${key} must be one of ${allowed.map((value) => JSON.stringify(value)).join(', ')}; received ${describeValue(rawValue)}`,
  );
}

function parseBooleanEnv(key: string, raw: string | undefined, defaultValue: boolean): boolean {
  const rawValue = raw ?? '';
  if (rawValue.trim() === '') return defaultValue;

  const normalized = rawValue.trim().toLowerCase();
  if (normalized === 'true') return true;
  if (normalized === 'false') return false;
  throw new Error(`${key} must be "true" or "false"; received ${describeValue(rawValue)}`);
}

function parseIntegerEnv(key: string, raw: string | undefined, options: IntOptionRange): number {
  const rawValue = raw ?? '';
  if (rawValue.trim() === '') return options.defaultValue;

  const trimmed = rawValue.trim();
  if (!/^-?\d+$/.test(trimmed)) {
    throw new Error(
      `${key} must be a base-10 integer between ${options.min} and ${options.max}; received ${describeValue(rawValue)}`,
    );
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || !Number.isSafeInteger(parsed)) {
    throw new Error(`${key} must be a safe integer between ${options.min} and ${options.max}`);
  }

  if (parsed < options.min || parsed > options.max) {
    throw new Error(`${key} must be between ${options.min} and ${options.max}; received ${trimmed}`);
  }

  return parsed;
}

function parseStringEnv(raw: string | undefined, defaultValue = ''): string {
  const rawValue = raw ?? '';
  if (rawValue.trim() === '') return defaultValue;
  return rawValue.trim();
}

function parseEntities(raw: string | undefined): ReadonlySet<SyncEntity> {
  const rawValue = raw ?? '';
  if (rawValue.trim() === '') {
    return new Set(DEFAULT_SYNC_ENTITIES) as ReadonlySet<SyncEntity>;
  }

  const values = rawValue
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  const invalid = values.filter((value) => !ENTITY_NAMES.includes(value as SyncEntity));

  if (invalid.length > 0) {
    throw new Error(
      `SYNC_ENTITIES must contain only ${ENTITY_NAMES.map((value) => JSON.stringify(value)).join(', ')}; invalid values: ${invalid.map((value) => JSON.stringify(value)).join(', ')}`,
    );
  }

  if (values.length === 0) {
    throw new Error(
      `SYNC_ENTITIES must not be empty when explicitly set; allowed values: ${ENTITY_NAMES.map((value) => JSON.stringify(value)).join(', ')}`,
    );
  }

  const entities = new Set(values as SyncEntity[]) as ReadonlySet<SyncEntity>;
  assertValidSyncEntitySelection(entities);
  return entities;
}

function normalizeLocalAbsolutePath(
  key: string,
  raw: string | undefined,
  defaultValue: string,
  options: { stripTrailingSlash?: boolean } = {},
): string {
  const value = parseStringEnv(raw, defaultValue);
  if (!value.startsWith('/')) {
    throw new Error(`${key} must be a local absolute path starting with "/"; received ${describeValue(value)}`);
  }

  let parsed: URL;
  try {
    parsed = new URL(value, LOCAL_URL_BASE);
  } catch {
    throw new Error(`${key} must be a valid local absolute path; received ${describeValue(value)}`);
  }

  if (parsed.origin !== LOCAL_URL_BASE) {
    throw new Error(`${key} must not include a protocol or host; received ${describeValue(value)}`);
  }

  if (parsed.search || parsed.hash) {
    throw new Error(`${key} must not include query or fragment components; received ${describeValue(value)}`);
  }

  const normalizedPath =
    options.stripTrailingSlash && parsed.pathname.length > 1 ? parsed.pathname.replace(/\/+$/, '') : parsed.pathname;

  return normalizedPath || '/';
}

function parseSubscriberUrls(env: SyncEnv): readonly string[] {
  const rawList = !isBlank(env.SYNC_SUBSCRIBER_URLS) ? env.SYNC_SUBSCRIBER_URLS : env.SYNC_SUBSCRIBER_URL;
  if (isBlank(rawList)) return [];
  const rawListValue = rawList ?? '';

  const allowInsecureHttp = parseBooleanEnv('SYNC_ALLOW_INSECURE_HTTP', env.SYNC_ALLOW_INSECURE_HTTP, false);
  const nodeEnv = parseStringEnv(env.NODE_ENV).toLowerCase();
  const allowHttp = allowInsecureHttp && DEV_HTTP_NODE_ENVS.has(nodeEnv);
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const entry of rawListValue.split(',')) {
    const candidate = entry.trim();
    if (!candidate) continue;

    let parsed: URL;
    try {
      parsed = new URL(candidate);
    } catch {
      throw new Error(`SYNC_SUBSCRIBER_URLS must contain valid absolute URLs; received ${describeValue(candidate)}`);
    }

    if (parsed.username || parsed.password) {
      throw new Error('SYNC_SUBSCRIBER_URLS entries must not include username or password components');
    }

    if (parsed.search || parsed.hash) {
      throw new Error(
        `SYNC_SUBSCRIBER_URLS entries must not include query or fragment components; received ${describeValue(candidate)}`,
      );
    }

    if (parsed.pathname !== '/' && parsed.pathname !== '') {
      throw new Error(
        `SYNC_SUBSCRIBER_URLS entries must be base URLs without a path; received ${describeValue(candidate)}`,
      );
    }

    if (parsed.protocol === 'http:') {
      if (!allowInsecureHttp) {
        throw new Error(
          'SYNC_SUBSCRIBER_URLS entries must use https unless SYNC_ALLOW_INSECURE_HTTP=true is set for development or test',
        );
      }

      if (!allowHttp) {
        throw new Error('SYNC_ALLOW_INSECURE_HTTP=true is allowed only when NODE_ENV is "development" or "test"');
      }
    } else if (parsed.protocol !== 'https:') {
      throw new Error(`SYNC_SUBSCRIBER_URLS entries must use https; received ${describeValue(candidate)}`);
    }

    const value = parsed.origin;
    if (seen.has(value)) {
      throw new Error(`SYNC_SUBSCRIBER_URLS contains a duplicate target URL after normalization: ${value}`);
    }

    seen.add(value);
    normalized.push(value);
  }

  return normalized;
}

function parsePublisherConfig(env: SyncEnv): PublisherConfig {
  return {
    sourceId: parseStringEnv(env.SYNC_SOURCE_ID),
    subscriberUrls: parseSubscriberUrls(env),
    eventsPath: normalizeLocalAbsolutePath('SYNC_EVENTS_PATH', env.SYNC_EVENTS_PATH, DEFAULT_SYNC_EVENTS_PATH),
    timeoutMs: parseIntegerEnv('SYNC_TIMEOUT_MS', env.SYNC_TIMEOUT_MS, {
      defaultValue: DEFAULT_SYNC_TIMEOUT_MS,
      min: 1,
      max: 300_000,
    }),
    maxAttempts: parseIntegerEnv('SYNC_MAX_RETRIES', env.SYNC_MAX_RETRIES, {
      defaultValue: DEFAULT_SYNC_MAX_RETRIES,
      min: 1,
      max: 10,
    }),
    maxQueueSize: parseIntegerEnv('SYNC_MAX_QUEUE_SIZE', env.SYNC_MAX_QUEUE_SIZE, {
      defaultValue: DEFAULT_SYNC_MAX_QUEUE_SIZE,
      min: 1,
      max: 100_000,
    }),
    publisherStatePath: parseStringEnv(env.SYNC_PUBLISHER_STATE_PATH, DEFAULT_SYNC_PUBLISHER_STATE_PATH),
  };
}

function parseSubscriberConfig(env: SyncEnv): SubscriberConfig {
  return {
    routeBase: normalizeLocalAbsolutePath('SYNC_ROUTE_BASE', env.SYNC_ROUTE_BASE, DEFAULT_SYNC_ROUTE_BASE, {
      stripTrailingSlash: true,
    }),
    targetProjectId: parseStringEnv(env.SYNC_TARGET_PROJECT_ID),
    applyActiveState: parseBooleanEnv('SYNC_APPLY_ACTIVE_STATE', env.SYNC_APPLY_ACTIVE_STATE, false),
    maxBodyBytes: parseIntegerEnv('SYNC_MAX_BODY_BYTES', env.SYNC_MAX_BODY_BYTES, {
      defaultValue: DEFAULT_SYNC_MAX_BODY_BYTES,
      min: 1,
      max: 64 * 1024 * 1024,
    }),
    signatureToleranceMs: parseIntegerEnv('SYNC_SIGNATURE_TOLERANCE_MS', env.SYNC_SIGNATURE_TOLERANCE_MS, {
      defaultValue: DEFAULT_SYNC_SIGNATURE_TOLERANCE_MS,
      min: 1,
      max: 60 * 60 * 1000,
    }),
    replayCacheSize: parseIntegerEnv('SYNC_REPLAY_CACHE_SIZE', env.SYNC_REPLAY_CACHE_SIZE, {
      defaultValue: DEFAULT_SYNC_REPLAY_CACHE_SIZE,
      min: 1,
      max: 100_000,
    }),
    subscriberStatePath: parseStringEnv(env.SYNC_SUBSCRIBER_STATE_PATH, DEFAULT_SYNC_SUBSCRIBER_STATE_PATH),
    n8nDiPath: parseStringEnv(env.N8N_DI_PATH, DEFAULT_N8N_DI_PATH),
    n8nDbPath: parseStringEnv(env.N8N_DB_PATH, DEFAULT_N8N_DB_PATH),
  };
}

function parseAuthConfig(env: SyncEnv): SyncAuthConfig {
  const mode = requireEnumValue('SYNC_AUTH_MODE', env.SYNC_AUTH_MODE, ['hmac', 'token'], DEFAULT_SYNC_AUTH_MODE);
  const value = env.SYNC_SHARED_SECRET ?? '';

  return mode === 'token' ? { mode, token: value } : { mode, secret: value };
}

function authValue(auth: SyncAuthConfig): string {
  return auth.mode === 'token' ? auth.token : auth.secret;
}

export function parseConfig(env: SyncEnv): SyncConfig {
  const config: SyncConfig = {
    logLevel: requireEnumValue('LOG_LEVEL', env.LOG_LEVEL, LOG_LEVEL_NAMES, DEFAULT_LOG_LEVEL),
    auth: parseAuthConfig(env),
    entities: parseEntities(env.SYNC_ENTITIES),
    filterByTag: parseBooleanEnv('SYNC_FILTER_BY_TAG', env.SYNC_FILTER_BY_TAG, DEFAULT_SYNC_FILTER_BY_TAG),
    syncWorkflowTag: parseStringEnv(env.SYNC_WORKFLOW_TAG, DEFAULT_SYNC_WORKFLOW_TAG),
    activeTag: parseStringEnv(env.SYNC_ACTIVE_TAG, DEFAULT_SYNC_ACTIVE_TAG),
    publisher: parsePublisherConfig(env),
    subscriber: parseSubscriberConfig(env),
  };

  assertValidSyncEntitySelection(config.entities);

  if (config.publisher.subscriberUrls.length > 0 && !authValue(config.auth)) {
    throw new Error('SYNC_SHARED_SECRET must be set when SYNC_SUBSCRIBER_URLS is configured');
  }

  return config;
}
