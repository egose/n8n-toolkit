import { parseConfig, type SyncConfig, type SyncEnv } from '../shared/config';
import { createSubscriberHookConfig, type SubscriberHookRuntimeDeps } from './runtime';

export interface SubscriberEntryDeps {
  parseConfig?: (env: SyncEnv) => SyncConfig;
  createSubscriberHookConfig?: typeof createSubscriberHookConfig;
  runtimeDeps?: SubscriberHookRuntimeDeps;
}

export function createSubscriberEntryHooks(env: SyncEnv, deps: SubscriberEntryDeps = {}) {
  const resolveConfig = deps.parseConfig ?? parseConfig;
  const buildHooks = deps.createSubscriberHookConfig ?? createSubscriberHookConfig;
  return buildHooks(resolveConfig(env), deps.runtimeDeps);
}
