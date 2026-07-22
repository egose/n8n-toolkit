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

/** Parse a comma-separated URL list: trims, strips trailing slashes, dedupes. */
function urlListFromEnv(raw: string | undefined): string[] {
  const urls = (raw ?? '')
    .split(',')
    .map((url) => url.trim().replace(/\/+$/, ''))
    .filter(Boolean);
  return [...new Set(urls)];
}

/** Normalize a comma-separated entity list to an unordered Set. */
function stringSetFromEnv(raw: string | undefined): Set<string> {
  const values = (raw ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return new Set(values);
}

/** Keys imported by both sides to gate per-entity behavior. */
export type SyncEntity = 'workflows' | 'credentials' | 'executions';

const ENTITY_NAMES: readonly SyncEntity[] = ['workflows', 'credentials', 'executions'];

/**
 * Comma-separated whitelist of entity kinds to sync. Unknown names are
 * ignored. Defaults to workflows + credentials, so executions are opt-in.
 *
 * `SYNC_ENTITIES.has(name)` is the canonical gate both sides use to decide
 * whether a publisher hook/apply path is wired for a given entity.
 */
export const SYNC_ENTITIES: ReadonlySet<SyncEntity> = (() => {
  const raw = stringSetFromEnv(process.env.SYNC_ENTITIES);
  const filtered = new Set<SyncEntity>();
  for (const name of ENTITY_NAMES) {
    if (raw.has(name)) filtered.add(name);
  }
  return filtered.size > 0 ? filtered : new Set<SyncEntity>(['workflows', 'credentials']);
})();

// Shared
export const LOG_LEVEL = (process.env.LOG_LEVEL ?? 'info').toLowerCase();
export const SYNC_SHARED_SECRET = process.env.SYNC_SHARED_SECRET ?? '';

/**
 * Publisher → subscriber authentication scheme: `hmac` (default, per-request
 * HMAC-SHA256 signature with replay protection) or `token` (static bearer).
 */
export const SYNC_AUTH_MODE: 'hmac' | 'token' = process.env.SYNC_AUTH_MODE === 'token' ? 'token' : 'hmac';

// Publisher
/** Target instance base URLs. SYNC_SUBSCRIBER_URLS (comma-separated) takes precedence over SYNC_SUBSCRIBER_URL. */
export const SYNC_SUBSCRIBER_URLS = urlListFromEnv(process.env.SYNC_SUBSCRIBER_URLS ?? process.env.SYNC_SUBSCRIBER_URL);
export const SYNC_SOURCE_ID = process.env.SYNC_SOURCE_ID ?? '';
export const SYNC_EVENTS_PATH = process.env.SYNC_EVENTS_PATH || '/rest/sync/v1/events';
export const SYNC_TIMEOUT_MS = intFromEnv(process.env.SYNC_TIMEOUT_MS, 10_000);
export const SYNC_MAX_RETRIES = intFromEnv(process.env.SYNC_MAX_RETRIES, 3);

// Subscriber
export const SYNC_ROUTE_BASE = (process.env.SYNC_ROUTE_BASE || '/rest/sync/v1').replace(/\/+$/, '');
export const SYNC_TARGET_PROJECT_ID = process.env.SYNC_TARGET_PROJECT_ID ?? '';
export const SYNC_APPLY_ACTIVE_STATE = process.env.SYNC_APPLY_ACTIVE_STATE === 'true';
export const SYNC_MAX_BODY_BYTES = intFromEnv(process.env.SYNC_MAX_BODY_BYTES, 16 * 1024 * 1024);
export const SYNC_SIGNATURE_TOLERANCE_MS = intFromEnv(process.env.SYNC_SIGNATURE_TOLERANCE_MS, 5 * 60 * 1000);

// Subscriber – n8n runtime module locations (inside the n8n host process)
export const N8N_DI_PATH = process.env.N8N_DI_PATH || '/usr/local/lib/node_modules/n8n/node_modules/@n8n/di';
export const N8N_DB_PATH = process.env.N8N_DB_PATH || '/usr/local/lib/node_modules/n8n/node_modules/@n8n/db';
