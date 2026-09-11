import { randomUUID } from 'node:crypto';
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

export function createEventOrderingAllocator(options: {
  sourceId: string;
  statePath?: string;
  invalidState?: SyncPublisherInvalidState;
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
  let lockHost = '';
  try {
    lockHost = hostname();
  } catch {
    lockHost = 'unknown';
  }

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
      host: lockHost,
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
        host: lockHost,
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

  const registerExitCleanup = (): void => {
    const cleanup = () => {
      void releaseLock();
    };
    // Best effort only — never throw from process lifecycle hooks.
    try {
      process.once('SIGTERM', cleanup);
      process.once('SIGINT', cleanup);
      process.once('beforeExit', cleanup);
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

  const acquireLock = async (): Promise<void> => {
    if (lockAcquired) return;
    const acquiredAt = new Date().toISOString();

    try {
      await writeLockFile(acquiredAt);
      lockAcquired = true;
      registerExitCleanup();
      startHeartbeat();
    } catch (error) {
      const code = (error as NodeJS.ErrnoException | undefined)?.code;
      if (code === 'EEXIST') {
        const { content, mtimeMs } = await readExistingLock();
        const now = Date.now();
        const heartbeatMs = lockTimestampMs(content?.heartbeatAt) ?? lockTimestampMs(content?.acquiredAt);
        const heartbeatAgeMs = heartbeatMs === undefined ? undefined : Math.max(0, now - heartbeatMs);
        const mtimeAgeMs = mtimeMs === undefined ? undefined : Math.max(0, now - mtimeMs);
        const lockPid =
          typeof content?.pid === 'number' && Number.isInteger(content.pid) && content.pid > 0
            ? content.pid
            : undefined;
        // Same owner re-entering in-process (e.g. loadState racing allocate):
        // just adopt the lock instead of failing.
        if (content?.owner === lockOwner) {
          lockAcquired = true;
          startHeartbeat();
          return;
        }
        // Stale when nothing proves liveness: unparseable content, an expired
        // heartbeat/mtime, or a dead PID. PID aliveness alone is NOT enough —
        // container PID reuse makes stale locks look live.
        const heartbeatFresh = heartbeatAgeMs !== undefined && heartbeatAgeMs <= LOCK_STALE_MS;
        const mtimeFresh = mtimeAgeMs !== undefined && mtimeAgeMs <= LOCK_STALE_MS;
        const heartbeatStale = !heartbeatFresh || !mtimeFresh;
        const pidDead = lockPid !== undefined && !isProcessRunning(lockPid);
        if (heartbeatStale || pidDead) {
          await rm(lockPath, { force: true });
          await writeLockFile(acquiredAt);
          lockAcquired = true;
          registerExitCleanup();
          startHeartbeat();
          return;
        }

        markDegraded('storage_error');
        throw new Error(
          `Publisher state lock already exists at ${lockPath}. Multiple publisher processes sharing one SYNC_SOURCE_ID/SYNC_PUBLISHER_STATE_PATH are unsupported without an atomic shared allocator. Stop the duplicate process, or if this is a verified stale lock after a crash, remove the lock file before restarting.`,
        );
      }
      markDegraded('storage_error');
      throw error;
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
