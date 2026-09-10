import { randomUUID } from 'node:crypto';
import { mkdir, open, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { hostname } from 'node:os';
import { dirname } from 'node:path';

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

export interface EventOrderingAllocator {
  initialize(): Promise<void>;
  getStatus(): StateStoreStatus;
  allocate(event: EventOrderingInput): Promise<{ eventId: string; entityRevision: string }>;
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
}): EventOrderingAllocator {
  const { sourceId, statePath } = options;
  assertValidSourceId(sourceId);
  if (!statePath) {
    return createMemoryAllocator(sourceId);
  }

  let loadedState: PublisherOrderingState | undefined;
  let status: StateStoreStatus = { ready: false, reason: 'not_initialized' };
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
      markDegraded('invalid_state');
      throw new Error(`Invalid sync publisher order state at ${statePath}`);
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
