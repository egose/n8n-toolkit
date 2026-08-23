import { DEFAULT_SYNC_SUBSCRIBER_STATE_PATH } from '../shared/config';
import {
  readJsonFile,
  type StateStoreStatus,
  type StateStoreStatusReason,
  writeJsonFileAtomic,
} from '../shared/ordering';

export interface ExecutionIdentityRecord {
  sourceId: string;
  sourceExecutionId: string;
  targetExecutionId: string | number;
  workflowId?: string | null;
}

interface ExecutionIdentityState {
  version: 1;
  mappings: Record<string, ExecutionIdentityRecord>;
}

export interface ExecutionIdentityStore {
  initialize(): Promise<void>;
  getStatus(): StateStoreStatus;
  get(identity: { sourceId: string; sourceExecutionId: string }): Promise<ExecutionIdentityRecord | undefined>;
  set(identity: ExecutionIdentityRecord): Promise<void>;
  delete(identity: { sourceId: string; sourceExecutionId: string }): Promise<boolean>;
  listBySourceWorkflow(identity: { sourceId: string; workflowId: string }): Promise<ExecutionIdentityRecord[]>;
  deleteBySourceWorkflow(identity: { sourceId: string; workflowId: string }): Promise<number>;
  deleteSource(sourceId: string): Promise<number>;
}

function defaultExecutionIdentityState(): ExecutionIdentityState {
  return {
    version: 1,
    mappings: {},
  };
}

function isExecutionIdentityRecord(value: unknown): value is ExecutionIdentityRecord {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  const targetExecutionId = record.targetExecutionId;
  return (
    typeof record.sourceId === 'string' &&
    typeof record.sourceExecutionId === 'string' &&
    (typeof targetExecutionId === 'string' || typeof targetExecutionId === 'number') &&
    (record.workflowId === undefined || record.workflowId === null || typeof record.workflowId === 'string')
  );
}

function isExecutionIdentityState(value: unknown): value is ExecutionIdentityState {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  if (record.version !== 1 || typeof record.mappings !== 'object' || record.mappings === null) return false;
  return Object.entries(record.mappings as Record<string, unknown>).every(([key, value]) => {
    if (!isExecutionIdentityRecord(value)) return false;
    try {
      const parsed = JSON.parse(key) as unknown;
      return (
        Array.isArray(parsed) &&
        parsed.length === 2 &&
        parsed[0] === value.sourceId &&
        parsed[1] === value.sourceExecutionId
      );
    } catch {
      return false;
    }
  });
}

function getExecutionIdentityKey(sourceId: string, sourceExecutionId: string): string {
  return JSON.stringify([sourceId, sourceExecutionId]);
}

export function getExecutionIdentityStatePath(subscriberStatePath = DEFAULT_SYNC_SUBSCRIBER_STATE_PATH): string {
  return subscriberStatePath.endsWith('.json')
    ? subscriberStatePath.replace(/\.json$/, '.executions.json')
    : `${subscriberStatePath}.executions.json`;
}

export function createExecutionIdentityStore(options: { statePath?: string } = {}): ExecutionIdentityStore {
  const statePath = options.statePath ?? getExecutionIdentityStatePath();
  const state = defaultExecutionIdentityState();
  let loaded = false;
  let status: StateStoreStatus = { ready: false, reason: 'not_initialized' };
  let mutationChain = Promise.resolve();

  const markDegraded = (reason: StateStoreStatusReason): void => {
    status = { ready: false, reason, degradedSince: new Date().toISOString() };
  };

  const loadState = async (): Promise<ExecutionIdentityState> => {
    if (loaded) return state;
    let persisted: ExecutionIdentityState | undefined;
    try {
      persisted = await readJsonFile<ExecutionIdentityState>(statePath);
    } catch (error) {
      markDegraded('invalid_state');
      throw error;
    }
    loaded = true;
    if (persisted === undefined) {
      status = { ready: true };
      return state;
    }
    if (!isExecutionIdentityState(persisted)) {
      markDegraded('invalid_state');
      throw new Error(`Invalid sync execution identity state at ${statePath}`);
    }
    Object.assign(state.mappings, persisted.mappings);
    status = { ready: true };
    return state;
  };

  const mutate = async <T>(work: (current: ExecutionIdentityState) => T | Promise<T>): Promise<T> => {
    const run = mutationChain.then(async () => {
      const current = await loadState();
      const next = { version: current.version, mappings: { ...current.mappings } } satisfies ExecutionIdentityState;
      const result = await work(next);
      try {
        await writeJsonFileAtomic(statePath, next);
      } catch (error) {
        markDegraded('storage_error');
        throw error;
      }
      state.mappings = next.mappings;
      status = { ready: true };
      return result;
    });

    mutationChain = run.then(
      () => undefined,
      () => undefined,
    );

    return run;
  };

  return {
    async initialize() {
      const current = await loadState();
      try {
        await writeJsonFileAtomic(statePath, current);
      } catch (error) {
        markDegraded('unwritable');
        throw error;
      }
      status = { ready: true };
    },

    getStatus() {
      return status;
    },

    async get(identity) {
      const current = await loadState();
      return current.mappings[getExecutionIdentityKey(identity.sourceId, identity.sourceExecutionId)];
    },

    async set(identity) {
      await mutate((current) => {
        current.mappings[getExecutionIdentityKey(identity.sourceId, identity.sourceExecutionId)] = identity;
      });
    },

    async delete(identity) {
      return await mutate((current) => {
        const key = getExecutionIdentityKey(identity.sourceId, identity.sourceExecutionId);
        const existed = key in current.mappings;
        if (existed) delete current.mappings[key];
        return existed;
      });
    },

    async listBySourceWorkflow(identity) {
      const current = await loadState();
      return Object.values(current.mappings).filter(
        (mapping) => mapping.sourceId === identity.sourceId && mapping.workflowId === identity.workflowId,
      );
    },

    async deleteBySourceWorkflow(identity) {
      return await mutate((current) => {
        let removed = 0;
        for (const [key, mapping] of Object.entries(current.mappings)) {
          if (mapping.sourceId === identity.sourceId && mapping.workflowId === identity.workflowId) {
            delete current.mappings[key];
            removed += 1;
          }
        }
        return removed;
      });
    },

    async deleteSource(sourceId) {
      return await mutate((current) => {
        let removed = 0;
        for (const [key, mapping] of Object.entries(current.mappings)) {
          if (mapping.sourceId === sourceId) {
            delete current.mappings[key];
            removed += 1;
          }
        }
        return removed;
      });
    },
  };
}
