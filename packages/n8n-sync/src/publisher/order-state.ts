import { mkdir, open, readFile, rm } from 'node:fs/promises';
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
  const lockPath = `${statePath}.lock`;

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

  const acquireLock = async (): Promise<void> => {
    if (lockAcquired) return;
    const writeLock = async (): Promise<void> => {
      await mkdir(dirname(statePath), { recursive: true });
      const handle = await open(lockPath, 'wx');
      try {
        await handle.writeFile(
          JSON.stringify({ pid: process.pid, sourceId, statePath, acquiredAt: new Date().toISOString() }, null, 2),
        );
      } finally {
        await handle.close();
      }
    };

    try {
      await writeLock();
      lockAcquired = true;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException | undefined)?.code;
      if (code === 'EEXIST') {
        let lockPid: number | undefined;
        try {
          const lock = JSON.parse(await readFile(lockPath, 'utf8')) as { pid?: unknown };
          lockPid = typeof lock.pid === 'number' && Number.isInteger(lock.pid) && lock.pid > 0 ? lock.pid : undefined;
        } catch {
          lockPid = undefined;
        }

        if (lockPid !== undefined && !isProcessRunning(lockPid)) {
          await rm(lockPath, { force: true });
          await writeLock();
          lockAcquired = true;
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
