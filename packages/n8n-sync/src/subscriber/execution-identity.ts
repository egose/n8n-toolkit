import { DEFAULT_SYNC_SUBSCRIBER_STATE_PATH } from '../shared/config';
import { readJsonFile, writeJsonFileAtomic } from '../shared/ordering';

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
  return Object.values(record.mappings as Record<string, unknown>).every(isExecutionIdentityRecord);
}

function getExecutionIdentityKey(sourceId: string, sourceExecutionId: string): string {
  return JSON.stringify([sourceId, sourceExecutionId]);
}

function defaultExecutionIdentityStatePath(): string {
  return DEFAULT_SYNC_SUBSCRIBER_STATE_PATH.endsWith('.json')
    ? DEFAULT_SYNC_SUBSCRIBER_STATE_PATH.replace(/\.json$/, '.executions.json')
    : `${DEFAULT_SYNC_SUBSCRIBER_STATE_PATH}.executions.json`;
}

export function createExecutionIdentityStore(options: { statePath?: string } = {}): ExecutionIdentityStore {
  const statePath = options.statePath ?? defaultExecutionIdentityStatePath();
  const state = defaultExecutionIdentityState();
  let loaded = false;
  let mutationChain = Promise.resolve();

  const loadState = async (): Promise<ExecutionIdentityState> => {
    if (loaded) return state;
    const persisted = await readJsonFile<ExecutionIdentityState>(statePath);
    loaded = true;
    if (persisted === undefined) return state;
    if (!isExecutionIdentityState(persisted)) {
      throw new Error(`Invalid sync execution identity state at ${statePath}`);
    }
    Object.assign(state.mappings, persisted.mappings);
    return state;
  };

  const mutate = async <T>(work: (current: ExecutionIdentityState) => T | Promise<T>): Promise<T> => {
    const run = mutationChain.then(async () => {
      const current = await loadState();
      const result = await work(current);
      await writeJsonFileAtomic(statePath, current);
      return result;
    });

    mutationChain = run.then(
      () => undefined,
      () => undefined,
    );

    return run;
  };

  return {
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
