import { randomUUID } from 'node:crypto';
import { readFileSync, rmSync } from 'node:fs';
import { mkdir, open, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import { hostname } from 'node:os';
import { dirname } from 'node:path';

import type { SyncPublisherInvalidState } from '../shared/config';
import {
  decodeOrderingTupleKey,
  getEntityOrderingKey,
  getSyncEventEntityRef,
  incrementDecimalString,
  isDecimalString,
  readJsonFile,
  type StateStoreStatus,
  type StateStoreStatusReason,
  writeJsonFileAtomic,
  type SyncEntityKind,
} from '../shared/ordering';
import { MAX_EVENT_ID_LENGTH, MAX_ID_LENGTH } from '../shared/validate';

type EventOrderingInput = Parameters<typeof getSyncEventEntityRef>[0];

interface PublisherOrderingState {
  version: 3;
  sourceId: string;
  nextEventSequence: string;
  entityRevisions: Record<string, string>;
}

interface LegacyPublisherOrderingStateV1 {
  version: 1;
  nextEventSequence: string;
  entityRevisions: Record<string, string>;
}

interface LegacyPublisherOrderingStateV2 {
  version: 2;
  nextEventSequence: string;
  entityRevisions: Record<string, string>;
}

export interface PublisherInvalidStateResetInfo {
  backupPath: string;
  previousSourceId: string;
  newSourceId: string;
}

export interface PublisherOrderStateSummary {
  version: number;
  sourceId: string;
  nextEventSequence: string;
  entityKeyCount: number;
}

export interface EventOrderingAllocator {
  initialize(): Promise<void>;
  getStatus(): StateStoreStatus;
  allocate(event: EventOrderingInput): Promise<{ eventId: string; entityRevision: string }>;
  /**
   * Epoch-reset outcome from a `quarantine-reset` recovery, if one happened
   * during `initialize()`/`allocate()`. Optional so hand-rolled test fakes
   * of this interface keep compiling; the runtime guards with a typeof check.
   */
  getInvalidStateReset?(): PublisherInvalidStateResetInfo | undefined;
  /**
   * Read-only snapshot of the loaded order state for startup visibility.
   * Returns undefined when no state is loaded yet. Optional so hand-rolled
   * test fakes of this interface keep compiling; the runtime guards with
   * a typeof check. Must not expose mutable state.
   */
  getStateSummary?(): PublisherOrderStateSummary | undefined;
}

/**
 * Supported on-disk publisher order-state format versions.
 *
 * Exposed in invalid-state diagnostics instead of the package version:
 * there is no build-time version define and reading package.json at
 * runtime is fragile inside the bundled `dist/publisher.cjs`
 * (tsup bundle, no runtime deps), so the format versions are the
 * stable identifier operators need for bundle-skew triage.
 */
export const PUBLISHER_ORDER_STATE_VERSIONS = [1, 2, 3] as const;

/**
 * Quarantine an unreadable publisher state file via atomic rename.
 *
 * Never writes over or deletes the original in place: the only copy is
 * moved to `<statePath>.corrupt.<UTC-timestamp>.bak`. Throws on failure
 * so callers can decide whether the failure masks their own error.
 */
export async function quarantineCorruptPublisherState(statePath: string): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = `${statePath}.corrupt.${timestamp}.bak`;
  await rename(statePath, backupPath);
  return backupPath;
}

function jsonTypeOf(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

function describeUnknownPublisherState(value: unknown): {
  versionDesc: string;
  sourceIdDesc: string;
  entityKeyCountDesc: string;
} {
  let versionDesc = `missing (JSON type ${jsonTypeOf(value)})`;
  let sourceIdDesc = 'missing';
  let entityKeyCountDesc = 'unknown';
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    if ('version' in record) {
      try {
        versionDesc = JSON.stringify(record.version) ?? jsonTypeOf(record.version);
      } catch {
        versionDesc = jsonTypeOf(record.version);
      }
    }
    if (typeof record.sourceId === 'string') {
      const preview = record.sourceId.slice(0, 64);
      try {
        sourceIdDesc = `${JSON.stringify(preview)} (length ${record.sourceId.length})`;
      } catch {
        sourceIdDesc = `(length ${record.sourceId.length})`;
      }
    } else if ('sourceId' in record) {
      sourceIdDesc = `non-string (JSON type ${jsonTypeOf(record.sourceId)})`;
    }
    if (
      typeof record.entityRevisions === 'object' &&
      record.entityRevisions !== null &&
      !Array.isArray(record.entityRevisions)
    ) {
      entityKeyCountDesc = String(Object.keys(record.entityRevisions as Record<string, unknown>).length);
    }
  } else if ('version' in Object(value ?? {})) {
    versionDesc = String((value as { version?: unknown }).version);
  } else {
    versionDesc = `missing (JSON type ${jsonTypeOf(value)})`;
  }
  return { versionDesc, sourceIdDesc, entityKeyCountDesc };
}

function assertValidSourceId(sourceId: string): void {
  if (sourceId.trim() === '' || sourceId.length > MAX_ID_LENGTH) {
    throw new Error(`SYNC_SOURCE_ID must be non-blank and ${MAX_ID_LENGTH} characters or fewer`);
  }
}

function assertValidGeneratedEventId(eventId: string): void {
  if (eventId.length > MAX_EVENT_ID_LENGTH) {
    throw new Error(`Generated sync eventId exceeds ${MAX_EVENT_ID_LENGTH} characters; shorten SYNC_SOURCE_ID`);
  }
}

function defaultPublisherOrderingState(sourceId: string): PublisherOrderingState {
  return {
    version: 3,
    sourceId,
    nextEventSequence: '0',
    entityRevisions: {},
  };
}

function isLegacyPublisherOrderingStateV2(value: unknown): value is LegacyPublisherOrderingStateV2 {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    record.version === 2 &&
    isDecimalString(record.nextEventSequence) &&
    typeof record.entityRevisions === 'object' &&
    record.entityRevisions !== null &&
    Object.entries(record.entityRevisions as Record<string, unknown>).every(
      ([key, revision]) => decodeOrderingTupleKey(key, 2) !== undefined && isDecimalString(revision),
    )
  );
}

function isCurrentPublisherOrderingState(value: unknown): value is PublisherOrderingState {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    record.version === 3 &&
    typeof record.sourceId === 'string' &&
    record.sourceId.trim() !== '' &&
    record.sourceId.length <= MAX_ID_LENGTH &&
    isDecimalString(record.nextEventSequence) &&
    typeof record.entityRevisions === 'object' &&
    record.entityRevisions !== null &&
    Object.entries(record.entityRevisions as Record<string, unknown>).every(
      ([key, revision]) => decodeOrderingTupleKey(key, 2) !== undefined && isDecimalString(revision),
    )
  );
}

function isLegacyPublisherOrderingStateV1(value: unknown): value is LegacyPublisherOrderingStateV1 {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    record.version === 1 &&
    isDecimalString(record.nextEventSequence) &&
    typeof record.entityRevisions === 'object' &&
    record.entityRevisions !== null &&
    Object.values(record.entityRevisions).every(isDecimalString)
  );
}

function migrateLegacyPublisherOrderingStateV1(
  state: LegacyPublisherOrderingStateV1,
  sourceId: string,
): PublisherOrderingState {
  const entityRevisions: Record<string, string> = {};
  for (const [legacyKey, revision] of Object.entries(state.entityRevisions)) {
    const separator = legacyKey.indexOf(':');
    if (separator <= 0) {
      throw new Error(`Invalid legacy sync publisher order state key ${JSON.stringify(legacyKey)}`);
    }
    const kind = legacyKey.slice(0, separator);
    if (kind !== 'workflow' && kind !== 'credential' && kind !== 'execution') {
      throw new Error(`Invalid legacy sync publisher order state key ${JSON.stringify(legacyKey)}`);
    }
    entityRevisions[getEntityOrderingKey({ kind: kind as SyncEntityKind, id: legacyKey.slice(separator + 1) })] =
      revision;
  }
  return {
    version: 3,
    sourceId,
    nextEventSequence: state.nextEventSequence,
    entityRevisions,
  };
}

function migrateLegacyPublisherOrderingStateV2(
  state: LegacyPublisherOrderingStateV2,
  sourceId: string,
): PublisherOrderingState {
  return {
    version: 3,
    sourceId,
    nextEventSequence: state.nextEventSequence,
    entityRevisions: state.entityRevisions,
  };
}

function createMemoryAllocator(sourceId: string): EventOrderingAllocator {
  assertValidSourceId(sourceId);
  const state = defaultPublisherOrderingState(sourceId);

  return {
    async initialize() {
      return undefined;
    },

    getStatus() {
      return { ready: true };
    },

    getInvalidStateReset() {
      return undefined;
    },

    getStateSummary() {
      return {
        version: state.version,
        sourceId: state.sourceId,
        nextEventSequence: state.nextEventSequence,
        entityKeyCount: Object.keys(state.entityRevisions).length,
      };
    },

    async allocate(event) {
      const entity = getSyncEventEntityRef(event);
      state.nextEventSequence = incrementDecimalString(state.nextEventSequence);
      state.entityRevisions[entity.key] = incrementDecimalString(state.entityRevisions[entity.key]);
      assertValidGeneratedEventId(`${sourceId}:${state.nextEventSequence}`);
      return {
        eventId: `${sourceId}:${state.nextEventSequence}`,
        entityRevision: state.entityRevisions[entity.key],
      };
    },
  };
}

function isProcessRunning(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException | undefined)?.code;
    return code === 'EPERM';
  }
}

/**
 * Best-effort single-writer guard for the file-backed publisher state.
 *
 * The lock file is never auto-removed on clean shutdown by the OS, and PIDs
 * are recycled aggressively inside containers — so a PID-only liveness check
 * false-positives on every restart (stale lock from the previous boot looks
 * "live"). Each lock therefore carries a unique owner token plus a heartbeat
 * timestamp refreshed by its holder; a lock is only treated as live when its
 * heartbeat is fresh. Stale locks (old heartbeat/mtime, dead PID,
 * unparseable content) are stolen instead of failing startup.
 */
const LOCK_HEARTBEAT_MS = 30_000;
const LOCK_STALE_MS = 120_000;
/**
 * Startup wait-and-retry tuning for a live-held lock. The total timeout
 * exceeds the staleness window plus margin so a genuinely live duplicate
 * still fails loud, while a rolling-restart overlap is waited out.
 */
const LOCK_WAIT_POLL_MS = 1_000;
const LOCK_WAIT_TIMEOUT_MS = LOCK_STALE_MS + 60_000;

interface PublisherLockContent {
  pid: number;
  owner: string;
  host: string;
  sourceId: string;
  statePath: string;
  acquiredAt: string;
  heartbeatAt: string;
}

function lockTimestampMs(value: unknown): number | undefined {
  if (typeof value !== 'string' || !value) return undefined;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function resolveLockHost(override: unknown): string {
  if (typeof override === 'string' && override.trim() !== '') return override;
  try {
    return hostname();
  } catch {
    return 'unknown';
  }
}

/** Progress ping for a startup wait on a live-held publisher lock. */
export interface PublisherLockWaitInfo {
  lockPath: string;
  elapsedMs: number;
  attempt: number;
}

/**
 * Test/advanced overrides for the file-backed publisher lock. All fields
 * are optional; defaults preserve production behavior (multi-heartbeat
 * staleness margin, bounded wait exceeding the staleness window). There are
 * intentionally no env tunables here — all `process.env` access lives in
 * `src/shared/config.ts`.
 */
export interface PublisherLockOptions {
  /** Override for the heartbeat/mtime staleness window. Default `LOCK_STALE_MS`. */
  staleMs?: number;
  /** Bounded total wait for a live-held lock before failing loud. Default `LOCK_WAIT_TIMEOUT_MS`. */
  waitTimeoutMs?: number;
  /** Poll interval while waiting on a live-held lock. Default `LOCK_WAIT_POLL_MS`. */
  pollMs?: number;
  /** Override for the current hostname (tests). Defaults to `os.hostname()`. */
  host?: string;
}

/**
 * Synchronously remove a publisher lock file owned by `owner`.
 *
 * Best-effort only: never throws (missing file, unparseable content,
 * foreign owner, and removal failures are all silently ignored) so it is
 * safe to call from `SIGTERM`/`SIGINT` handlers during graceful shutdown.
 * Non-owner locks are always preserved.
 */
export function tryRemovePublisherLockSync(lockPath: string, owner: string): void {
  try {
    let raw: string;
    try {
      raw = readFileSync(lockPath, 'utf8');
    } catch {
      return;
    }
    let existing: Partial<PublisherLockContent>;
    try {
      existing = JSON.parse(raw) as Partial<PublisherLockContent>;
    } catch {
      return;
    }
    if (existing.owner !== owner) return;
    try {
      rmSync(lockPath, { force: true });
    } catch {
      // Best effort: staleness detection reclaims a leftover lock.
    }
  } catch {
    // Never throw from sync shutdown paths.
  }
}

export function createEventOrderingAllocator(options: {
  sourceId: string;
  statePath?: string;
  invalidState?: SyncPublisherInvalidState;
  /**
   * Lock tuning overrides (staleness window, wait timeout/poll, hostname).
   * Defaults stand alone; used by tests for short windows.
   */
  lock?: PublisherLockOptions;
  /**
   * Lightweight wait-progress callback (the allocator is logger-free).
   * Live-lock waits are also surfaced via `getStatus()` (`storage_error`)
   * for the runtime degraded-state channel. Never throws back into the
   * allocator — callback errors are swallowed.
   */
  onLockWait?: (info: PublisherLockWaitInfo) => void;
}): EventOrderingAllocator {
  const { sourceId, statePath, invalidState = 'fail' } = options;
  assertValidSourceId(sourceId);
  if (!statePath) {
    return createMemoryAllocator(sourceId);
  }

  let loadedState: PublisherOrderingState | undefined;
  let status: StateStoreStatus = { ready: false, reason: 'not_initialized' };
  let invalidStateReset: PublisherInvalidStateResetInfo | undefined;
  let mutationChain = Promise.resolve();
  let lockAcquired = false;
  let heartbeatTimer: ReturnType<typeof setInterval> | undefined;
  const lockPath = `${statePath}.lock`;
  const lockOwner = randomUUID();
  // Effective identity/tuning for this allocator. A blank `lock.host`
  // override falls back to the real hostname.
  const effectiveHost = resolveLockHost(options.lock?.host);
  const lockStaleMs = options.lock?.staleMs ?? LOCK_STALE_MS;
  const lockWaitTimeoutMs = options.lock?.waitTimeoutMs ?? LOCK_WAIT_TIMEOUT_MS;
  const lockWaitPollMs = options.lock?.pollMs ?? LOCK_WAIT_POLL_MS;
  const notifyLockWait = (info: PublisherLockWaitInfo): void => {
    const callback = options.onLockWait;
    if (!callback) return;
    try {
      callback(info);
    } catch {
      // Progress reporting must never break acquisition.
    }
  };

  const markDegraded = (reason: StateStoreStatusReason): void => {
    status = { ready: false, reason, degradedSince: new Date().toISOString() };
  };

  const loadState = async (): Promise<PublisherOrderingState> => {
    await acquireLock();
    if (loadedState) return loadedState;
    let persisted: unknown;
    try {
      persisted = await readJsonFile<unknown>(statePath);
    } catch (error) {
      markDegraded('invalid_state');
      throw error;
    }
    if (persisted === undefined) {
      loadedState = defaultPublisherOrderingState(sourceId);
      status = { ready: true };
      return loadedState;
    }
    if (isLegacyPublisherOrderingStateV1(persisted)) {
      const migrated = migrateLegacyPublisherOrderingStateV1(persisted, sourceId);
      try {
        await writeJsonFileAtomic(statePath, migrated);
      } catch (error) {
        markDegraded('unwritable');
        throw error;
      }
      loadedState = migrated;
      status = { ready: true };
      return loadedState;
    }
    if (isLegacyPublisherOrderingStateV2(persisted)) {
      const migrated = migrateLegacyPublisherOrderingStateV2(persisted, sourceId);
      try {
        await writeJsonFileAtomic(statePath, migrated);
      } catch (error) {
        markDegraded('unwritable');
        throw error;
      }
      loadedState = migrated;
      status = { ready: true };
      return loadedState;
    }
    if (!isCurrentPublisherOrderingState(persisted)) {
      const { versionDesc, sourceIdDesc, entityKeyCountDesc } = describeUnknownPublisherState(persisted);
      const buildFailError = (backupNote: string): Error =>
        new Error(
          `Invalid sync publisher order state at ${statePath}. Parsed version: ${versionDesc}; stored sourceId: ${sourceIdDesc}; entity-key count: ${entityKeyCountDesc}; supports publisher state versions ${PUBLISHER_ORDER_STATE_VERSIONS.join(', ')}. ${backupNote} To recover, restore the quarantined backup after upgrading to a bundle that supports the stored version, or reset publisher sync state and run a full subscriber resync so revisions are rebuilt (never reinit counters under the same SYNC_SOURCE_ID).`,
        );
      if (invalidState !== 'quarantine-reset') {
        markDegraded('invalid_state');
        let backupNote: string;
        try {
          const backupPath = await quarantineCorruptPublisherState(statePath);
          backupNote = `Quarantined the unreadable file to ${backupPath}; the original path was renamed, not overwritten or deleted.`;
        } catch {
          // Quarantine failure must not mask the original invalid-state error.
          backupNote = `Quarantine of the unreadable file failed; the original file was left in place at ${statePath}.`;
        }
        throw buildFailError(backupNote);
      }
      // quarantine-reset policy: quarantine first, then reinit counters from
      // zero only as an epoch rotation (configured sourceId differs from the
      // quarantined file's stored sourceId). Never reset under the same
      // identity: reused eventId/entityRevision values are rejected by the
      // subscriber as stale/conflict (409 SYNC_REVISION_CONFLICT), causing
      // silent divergence.
      let backupPath: string;
      try {
        backupPath = await quarantineCorruptPublisherState(statePath);
      } catch {
        // Quarantine failure must not mask the original invalid-state error.
        markDegraded('invalid_state');
        throw buildFailError(
          `Quarantine of the unreadable file failed; the original file was left in place at ${statePath}.`,
        );
      }
      // Read the stored identity back from the quarantined backup. A
      // missing/unparseable/non-blank stored identity counts as unknown:
      // the epoch rotation cannot be verified, so refuse the reset.
      let storedSourceId: unknown;
      try {
        const quarantined = await readJsonFile<unknown>(backupPath);
        if (typeof quarantined === 'object' && quarantined !== null && !Array.isArray(quarantined)) {
          storedSourceId = (quarantined as Record<string, unknown>).sourceId;
        }
      } catch {
        storedSourceId = undefined;
      }
      if (typeof storedSourceId !== 'string' || storedSourceId.trim() === '') {
        markDegraded('invalid_state');
        throw buildFailError(
          `Quarantined the unreadable file to ${backupPath}; the original path was renamed, not overwritten or deleted. Automatic reset was refused because the quarantined file carries no usable stored publisher source identity, so an epoch rotation cannot be verified.`,
        );
      }
      if (storedSourceId === sourceId) {
        markDegraded('invalid_state');
        throw new Error(
          `Refusing to reset invalid sync publisher order state at ${statePath} under the same SYNC_SOURCE_ID ${JSON.stringify(sourceId)} (quarantined to ${backupPath}). Reinitializing counters would reuse eventId/entityRevision values that the subscriber rejects as stale/conflict (409 SYNC_REVISION_CONFLICT), causing silent divergence. To recover, restore the quarantined backup after upgrading to a bundle that supports the stored version, or rotate to a new SYNC_SOURCE_ID and run a full subscriber resync.`,
        );
      }
      const fresh = defaultPublisherOrderingState(sourceId);
      loadedState = fresh;
      status = { ready: true };
      invalidStateReset = { backupPath, previousSourceId: storedSourceId, newSourceId: sourceId };
      return fresh;
    }
    if (persisted.sourceId !== sourceId) {
      markDegraded('invalid_state');
      throw new Error(
        `SYNC_SOURCE_ID ${JSON.stringify(sourceId)} does not match publisher state sourceId ${JSON.stringify(persisted.sourceId)} at ${statePath}. To rotate source identity, stop the publisher, move this state file aside as a backup, set the new SYNC_SOURCE_ID deliberately, and perform a full subscriber resync or source-retirement procedure so stale events from the previous source epoch cannot override current state.`,
      );
    }
    loadedState = persisted;
    status = { ready: true };
    return loadedState;
  };

  const writeLockFile = async (acquiredAt: string): Promise<void> => {
    await mkdir(dirname(statePath), { recursive: true });
    const content: PublisherLockContent = {
      pid: process.pid,
      owner: lockOwner,
      host: effectiveHost,
      sourceId,
      statePath,
      acquiredAt,
      heartbeatAt: new Date().toISOString(),
    };
    const handle = await open(lockPath, 'wx');
    try {
      await handle.writeFile(JSON.stringify(content, null, 2));
    } finally {
      await handle.close();
    }
  };

  const refreshHeartbeat = async (): Promise<void> => {
    // Best effort only: a failed heartbeat simply leaves an older timestamp,
    // which lets the next starter steal the lock after LOCK_STALE_MS.
    try {
      const raw = await readFile(lockPath, 'utf8');
      const existing = JSON.parse(raw) as Partial<PublisherLockContent>;
      if (existing.owner !== lockOwner) {
        if (heartbeatTimer) clearInterval(heartbeatTimer);
        heartbeatTimer = undefined;
        return;
      }
      const next: PublisherLockContent = {
        pid: process.pid,
        owner: lockOwner,
        host: effectiveHost,
        sourceId,
        statePath,
        acquiredAt: typeof existing.acquiredAt === 'string' ? existing.acquiredAt : new Date().toISOString(),
        heartbeatAt: new Date().toISOString(),
      };
      await writeFile(lockPath, JSON.stringify(next, null, 2));
    } catch {
      // Ignore: staleness detection covers a dead heartbeat writer.
    }
  };

  const startHeartbeat = (): void => {
    if (heartbeatTimer) return;
    heartbeatTimer = setInterval(() => {
      void refreshHeartbeat();
    }, LOCK_HEARTBEAT_MS);
    if (typeof heartbeatTimer.unref === 'function') heartbeatTimer.unref();
  };

  const releaseLock = async (): Promise<void> => {
    if (!lockAcquired) return;
    try {
      const raw = await readFile(lockPath, 'utf8');
      const existing = JSON.parse(raw) as Partial<PublisherLockContent>;
      if (existing.owner === lockOwner) {
        await rm(lockPath, { force: true });
      }
    } catch {
      // Best effort: a leftover lock is reclaimed via heartbeat staleness.
    } finally {
      lockAcquired = false;
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      heartbeatTimer = undefined;
    }
  };

  const releaseLockSync = (): void => {
    try {
      tryRemovePublisherLockSync(lockPath, lockOwner);
    } catch {
      // Best effort: staleness detection reclaims a leftover lock.
    } finally {
      lockAcquired = false;
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      heartbeatTimer = undefined;
    }
  };

  const registerExitCleanup = (): void => {
    // SIGTERM/SIGINT remove the lock synchronously so graceful redeploys
    // (k8s rolling restarts) leave no lock behind. Async cleanup is kept
    // for `beforeExit` and other exits.
    const onSignal = (): void => {
      try {
        releaseLockSync();
      } catch {
        // Never throw from process lifecycle hooks.
      }
    };
    const onBeforeExit = (): void => {
      void releaseLock();
    };
    // Best effort only — never throw from process lifecycle hooks.
    try {
      process.once('SIGTERM', onSignal);
      process.once('SIGINT', onSignal);
      process.once('beforeExit', onBeforeExit);
    } catch {
      // Non-Node runtimes or restricted sandboxes: staleness covers it.
    }
  };

  const readExistingLock = async (): Promise<{ content?: Partial<PublisherLockContent>; mtimeMs?: number }> => {
    let content: Partial<PublisherLockContent> | undefined;
    try {
      content = JSON.parse(await readFile(lockPath, 'utf8')) as Partial<PublisherLockContent>;
    } catch {
      content = undefined;
    }
    try {
      const stats = await stat(lockPath);
      return { content, mtimeMs: stats.mtimeMs };
    } catch {
      return { content };
    }
  };

  /**
   * Classify an existing lock as live or stealable.
   *
   * Host-aware: when the recorded `host` is present (and known) and differs
   * from this process's host, the lock comes from a different PID namespace
   * (e.g. a previous k8s pod generation), so the PID check proves nothing
   * and is disregarded — the decision rests on heartbeat/mtime staleness
   * only. Same host, or a missing/blank/`unknown` recorded host, keeps the
   * legacy PID + staleness logic unchanged.
   */
  const classifyLock = (
    content: Partial<PublisherLockContent> | undefined,
    mtimeMs: number | undefined,
    now: number,
  ): { hostDiffers: boolean; heartbeatStale: boolean; pidDead: boolean; live: boolean } => {
    const heartbeatMs = lockTimestampMs(content?.heartbeatAt) ?? lockTimestampMs(content?.acquiredAt);
    const heartbeatAgeMs = heartbeatMs === undefined ? undefined : Math.max(0, now - heartbeatMs);
    const mtimeAgeMs = mtimeMs === undefined ? undefined : Math.max(0, now - mtimeMs);
    const lockPid =
      typeof content?.pid === 'number' && Number.isInteger(content.pid) && content.pid > 0 ? content.pid : undefined;
    const recordedHost = typeof content?.host === 'string' ? content.host.trim() : '';
    const selfHost = effectiveHost.trim();
    const isUnknownHost = (value: string): boolean => value === '' || value === 'unknown';
    const hostDiffers = !isUnknownHost(recordedHost) && !isUnknownHost(selfHost) && recordedHost !== selfHost;
    // Same owner re-entry is handled by the caller before consulting this.
    const heartbeatFresh = heartbeatAgeMs !== undefined && heartbeatAgeMs <= lockStaleMs;
    const mtimeFresh = mtimeAgeMs !== undefined && mtimeAgeMs <= lockStaleMs;
    const heartbeatStale = !heartbeatFresh || !mtimeFresh;
    const pidDead = !hostDiffers && lockPid !== undefined && !isProcessRunning(lockPid);
    return { hostDiffers, heartbeatStale, pidDead, live: !(heartbeatStale || pidDead) };
  };

  const buildDuplicateLockError = (): Error =>
    new Error(
      `Publisher state lock already exists at ${lockPath}. Multiple publisher processes sharing one SYNC_SOURCE_ID/SYNC_PUBLISHER_STATE_PATH are unsupported without an atomic shared allocator. Stop the duplicate process, or if this is a verified stale lock after a crash, remove the lock file before restarting.`,
    );

  const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

  const acquireLock = async (): Promise<void> => {
    if (lockAcquired) return;
    const acquiredAt = new Date().toISOString();

    const stealAndAcquire = async (): Promise<void> => {
      await rm(lockPath, { force: true });
      await writeLockFile(acquiredAt);
      lockAcquired = true;
      registerExitCleanup();
      startHeartbeat();
    };

    try {
      await writeLockFile(acquiredAt);
      lockAcquired = true;
      registerExitCleanup();
      startHeartbeat();
      return;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException | undefined)?.code;
      if (code !== 'EEXIST') {
        markDegraded('storage_error');
        throw error;
      }
    }

    // Another lock file exists. Same owner re-entering in-process (e.g.
    // loadState racing allocate): just adopt the lock instead of failing.
    const initial = await readExistingLock();
    if (initial.content?.owner === lockOwner) {
      lockAcquired = true;
      startHeartbeat();
      return;
    }
    // Stale when nothing proves liveness: unparseable content, an expired
    // heartbeat/mtime, or (same host / unknown host only) a dead PID. PID
    // aliveness alone is NOT enough — container PID reuse makes stale locks
    // look live, so a foreign-host lock ignores the PID check entirely.
    try {
      if (!classifyLock(initial.content, initial.mtimeMs, Date.now()).live) {
        await stealAndAcquire();
        return;
      }
    } catch (stealError) {
      const code = (stealError as NodeJS.ErrnoException | undefined)?.code;
      if (code !== 'EEXIST') {
        markDegraded('storage_error');
        throw stealError;
      }
      // Lost a steal race with another starter; fall through to the wait.
    }

    // Live-held lock (fresh heartbeat, or same-host live PID): do not throw
    // immediately — a rolling restart genuinely overlaps during the grace
    // period. Surface the wait via the degraded status channel (logger-free)
    // plus the optional progress callback, poll until the lock is released
    // or goes stale (then steal per the rules above), and only fail loud
    // after a bounded timeout exceeding the staleness window plus margin.
    markDegraded('storage_error');
    const waitStart = Date.now();
    let attempt = 0;
    for (;;) {
      const elapsedMs = Date.now() - waitStart;
      if (elapsedMs >= lockWaitTimeoutMs) {
        markDegraded('storage_error');
        throw buildDuplicateLockError();
      }
      attempt += 1;
      notifyLockWait({ lockPath, elapsedMs, attempt });
      await sleep(Math.min(lockWaitPollMs, Math.max(0, lockWaitTimeoutMs - elapsedMs)));
      // Fast path: the holder released the lock (graceful shutdown removes
      // it synchronously on SIGTERM/SIGINT).
      try {
        await writeLockFile(acquiredAt);
        lockAcquired = true;
        registerExitCleanup();
        startHeartbeat();
        return;
      } catch (error) {
        const code = (error as NodeJS.ErrnoException | undefined)?.code;
        if (code !== 'EEXIST') {
          markDegraded('storage_error');
          throw error;
        }
      }
      const current = await readExistingLock();
      if (current.content?.owner === lockOwner) {
        lockAcquired = true;
        startHeartbeat();
        return;
      }
      if (!classifyLock(current.content, current.mtimeMs, Date.now()).live) {
        try {
          await stealAndAcquire();
          return;
        } catch (error) {
          const code = (error as NodeJS.ErrnoException | undefined)?.code;
          if (code !== 'EEXIST') {
            markDegraded('storage_error');
            throw error;
          }
          // Lost a steal race; keep waiting until the timeout.
        }
      }
    }
  };

  return {
    async initialize() {
      const state = await loadState();
      try {
        await writeJsonFileAtomic(statePath, state);
      } catch (error) {
        markDegraded('unwritable');
        throw error;
      }
      status = { ready: true };
    },

    getStatus() {
      return status;
    },

    getInvalidStateReset() {
      return invalidStateReset;
    },

    getStateSummary() {
      if (!loadedState) return undefined;
      return {
        version: loadedState.version,
        sourceId: loadedState.sourceId,
        nextEventSequence: loadedState.nextEventSequence,
        entityKeyCount: Object.keys(loadedState.entityRevisions).length,
      };
    },

    allocate(event) {
      const run = mutationChain.then(async () => {
        const state = await loadState();
        const entity = getSyncEventEntityRef(event);
        const nextSequence = incrementDecimalString(state.nextEventSequence);
        const nextRevision = incrementDecimalString(state.entityRevisions[entity.key]);
        const eventId = `${sourceId}:${nextSequence}`;
        assertValidGeneratedEventId(eventId);
        const next = {
          version: state.version,
          sourceId: state.sourceId,
          nextEventSequence: nextSequence,
          entityRevisions: { ...state.entityRevisions, [entity.key]: nextRevision },
        } satisfies PublisherOrderingState;
        try {
          await writeJsonFileAtomic(statePath, next);
        } catch (error) {
          markDegraded('storage_error');
          throw error;
        }
        loadedState = next;
        status = { ready: true };
        return {
          eventId,
          entityRevision: nextRevision,
        };
      });

      mutationChain = run.then(
        () => undefined,
        () => undefined,
      );

      return run;
    },
  };
}
