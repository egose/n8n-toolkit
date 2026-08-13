import {
  appliedEventStateFromEvent,
  classifyOrderedEvent,
  getSourceEntityStateKey,
  readJsonFile,
  writeJsonFileAtomic,
  type AppliedEventState,
  type OrderedEventDecision,
} from '../shared/ordering';
import type { SyncEvent } from '../shared/types';

interface SubscriberOrderingState {
  version: 1;
  entities: Record<string, AppliedEventState>;
}

export interface SyncOrderingStore {
  inspect(event: SyncEvent): Promise<OrderedEventDecision>;
  recordApplied(event: SyncEvent): Promise<void>;
}

function defaultSubscriberOrderingState(): SubscriberOrderingState {
  return {
    version: 1,
    entities: {},
  };
}

function isAppliedEventState(value: unknown): value is AppliedEventState {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.entityRevision === 'string' &&
    typeof record.eventId === 'string' &&
    typeof record.type === 'string' &&
    typeof record.at === 'string'
  );
}

function isSubscriberOrderingState(value: unknown): value is SubscriberOrderingState {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  if (record.version !== 1 || typeof record.entities !== 'object' || record.entities === null) return false;
  return Object.values(record.entities as Record<string, unknown>).every(isAppliedEventState);
}

export function createSyncOrderingStore(options: { statePath?: string } = {}): SyncOrderingStore {
  const { statePath } = options;
  const state = defaultSubscriberOrderingState();
  let loaded = !statePath;
  let mutationChain = Promise.resolve();

  const loadState = async (): Promise<SubscriberOrderingState> => {
    if (loaded) return state;
    const persisted = await readJsonFile<SubscriberOrderingState>(statePath!);
    loaded = true;
    if (persisted === undefined) return state;
    if (!isSubscriberOrderingState(persisted)) {
      throw new Error(`Invalid sync subscriber order state at ${statePath}`);
    }
    Object.assign(state.entities, persisted.entities);
    return state;
  };

  return {
    async inspect(event) {
      const current = await loadState();
      return classifyOrderedEvent(current.entities[getSourceEntityStateKey(event)], event);
    },

    async recordApplied(event) {
      const run = mutationChain.then(async () => {
        const current = await loadState();
        current.entities[getSourceEntityStateKey(event)] = appliedEventStateFromEvent(event);
        if (statePath) {
          await writeJsonFileAtomic(statePath, current);
        }
      });

      mutationChain = run.then(
        () => undefined,
        () => undefined,
      );

      await run;
    },
  };
}
