import {
  appliedEventStateFromEvent,
  classifyOrderedEvent,
  decodeOrderingTupleKey,
  getSourceEntityStateKey,
  isDecimalString,
  isSyncEventType,
  isValidIsoTimestamp,
  readJsonFile,
  type StateStoreStatus,
  type StateStoreStatusReason,
  writeJsonFileAtomic,
  type AppliedEventState,
  type OrderedEventDecision,
} from '../shared/ordering';
import type { SyncEvent } from '../shared/types';

interface SubscriberOrderingState {
  version: 2;
  entities: Record<string, AppliedEventState>;
}

export interface SyncOrderingStore {
  initialize(): Promise<void>;
  getStatus(): StateStoreStatus;
  inspect(event: SyncEvent): Promise<{ decision: OrderedEventDecision; previous?: AppliedEventState }>;
  recordApplied(event: SyncEvent): Promise<void>;
}

function defaultSubscriberOrderingState(): SubscriberOrderingState {
  return {
    version: 2,
    entities: {},
  };
}

function legacySubscriberOrderingStateError(statePath: string): Error {
  return new Error(
    `Unsupported sync subscriber order state version 1 at ${statePath}. Version 1 used ambiguous colon-separated source/entity keys and cannot be migrated safely. Back up this file, then either restore from an unambiguous metadata backup or reset subscriber sync state and run a full source resync so delete tombstones and revisions are rebuilt.`,
  );
}

function isAppliedEventState(value: unknown): value is AppliedEventState {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    isDecimalString(record.entityRevision) &&
    typeof record.eventId === 'string' &&
    isSyncEventType(record.type) &&
    isValidIsoTimestamp(record.at)
  );
}

function isSubscriberOrderingState(value: unknown): value is SubscriberOrderingState {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  if (record.version !== 2 || typeof record.entities !== 'object' || record.entities === null) return false;
  return Object.entries(record.entities as Record<string, unknown>).every(
    ([key, value]) => decodeOrderingTupleKey(key, 3) !== undefined && isAppliedEventState(value),
  );
}

export function createSyncOrderingStore(options: { statePath?: string } = {}): SyncOrderingStore {
  const { statePath } = options;
  const state = defaultSubscriberOrderingState();
  let loaded = !statePath;
  let status: StateStoreStatus = loaded ? { ready: true } : { ready: false, reason: 'not_initialized' };
  let mutationChain = Promise.resolve();

  const markDegraded = (reason: StateStoreStatusReason): void => {
    status = { ready: false, reason, degradedSince: new Date().toISOString() };
  };

  const loadState = async (): Promise<SubscriberOrderingState> => {
    if (loaded) return state;
    let persisted: SubscriberOrderingState | undefined;
    try {
      persisted = await readJsonFile<SubscriberOrderingState>(statePath!);
    } catch (error) {
      markDegraded('invalid_state');
      throw error;
    }
    if (persisted === undefined) {
      loaded = true;
      status = { ready: true };
      return state;
    }
    if ((persisted as { version?: unknown }).version === 1) {
      markDegraded('invalid_state');
      throw legacySubscriberOrderingStateError(statePath!);
    }
    if (!isSubscriberOrderingState(persisted)) {
      markDegraded('invalid_state');
      throw new Error(`Invalid sync subscriber order state at ${statePath}`);
    }
    Object.assign(state.entities, persisted.entities);
    loaded = true;
    status = { ready: true };
    return state;
  };

  return {
    async initialize() {
      const current = await loadState();
      if (statePath) {
        try {
          await writeJsonFileAtomic(statePath, current);
        } catch (error) {
          markDegraded('unwritable');
          throw error;
        }
      }
      status = { ready: true };
    },

    getStatus() {
      return status;
    },

    async inspect(event) {
      const current = await loadState();
      const previous = current.entities[getSourceEntityStateKey(event)];
      return { decision: classifyOrderedEvent(previous, event), previous };
    },

    async recordApplied(event) {
      const run = mutationChain.then(async () => {
        const current = await loadState();
        const next = {
          version: current.version,
          entities: { ...current.entities, [getSourceEntityStateKey(event)]: appliedEventStateFromEvent(event) },
        } satisfies SubscriberOrderingState;
        if (statePath) {
          try {
            await writeJsonFileAtomic(statePath, next);
          } catch (error) {
            markDegraded('storage_error');
            throw error;
          }
        }
        Object.assign(current.entities, next.entities);
        status = { ready: true };
      });

      mutationChain = run.then(
        () => undefined,
        () => undefined,
      );

      await run;
    },
  };
}
