// ---------------------------------------------------------------------------
// Centralized environment configuration
//
// Every process.env reference in this package should live here (or be derived
// from values here). This provides a single lookup for all environment
// variables, their defaults, and processed / derived values.
// ---------------------------------------------------------------------------

function intFromEnv(raw: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(raw ?? '', 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

// Shared
export const LOG_LEVEL = (process.env.LOG_LEVEL ?? 'info').toLowerCase();
export const SYNC_SHARED_SECRET = process.env.SYNC_SHARED_SECRET ?? '';

// Publisher
export const SYNC_SUBSCRIBER_URL = (process.env.SYNC_SUBSCRIBER_URL ?? '').trim().replace(/\/+$/, '');
export const SYNC_SOURCE_ID = process.env.SYNC_SOURCE_ID ?? '';
export const SYNC_EVENTS_PATH = process.env.SYNC_EVENTS_PATH || '/rest/sync/v1/events';
export const SYNC_TIMEOUT_MS = intFromEnv(process.env.SYNC_TIMEOUT_MS, 10_000);
export const SYNC_MAX_RETRIES = intFromEnv(process.env.SYNC_MAX_RETRIES, 3);

// Subscriber
export const SYNC_ROUTE_BASE = (process.env.SYNC_ROUTE_BASE || '/rest/sync/v1').replace(/\/+$/, '');
export const SYNC_TARGET_PROJECT_ID = process.env.SYNC_TARGET_PROJECT_ID ?? '';
export const SYNC_APPLY_ACTIVE_STATE = process.env.SYNC_APPLY_ACTIVE_STATE === 'true';
export const SYNC_MAX_BODY_BYTES = intFromEnv(process.env.SYNC_MAX_BODY_BYTES, 16 * 1024 * 1024);

// Subscriber – n8n runtime module locations (inside the n8n host process)
export const N8N_DI_PATH = process.env.N8N_DI_PATH || '/usr/local/lib/node_modules/n8n/node_modules/@n8n/di';
export const N8N_DB_PATH = process.env.N8N_DB_PATH || '/usr/local/lib/node_modules/n8n/node_modules/@n8n/db';
