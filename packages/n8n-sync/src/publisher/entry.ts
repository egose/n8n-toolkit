import { parseConfig, type SyncConfig, type SyncEnv } from '../shared/config';
import { createPublisherHookConfig, type PublisherHookRuntimeDeps } from './runtime';

export interface PublisherEntryDeps {
  parseConfig?: (env: SyncEnv) => SyncConfig;
  createPublisherHookConfig?: typeof createPublisherHookConfig;
  runtimeDeps?: PublisherHookRuntimeDeps;
}

export function createPublisherEntryHooks(env: SyncEnv, deps: PublisherEntryDeps = {}) {
  const resolveConfig = deps.parseConfig ?? parseConfig;
  const buildHooks = deps.createPublisherHookConfig ?? createPublisherHookConfig;
  return buildHooks(resolveConfig(env), deps.runtimeDeps);
}
