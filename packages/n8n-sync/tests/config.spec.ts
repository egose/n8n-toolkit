import { describe, expect, it, vi } from 'vitest';

import {
  DEFAULT_N8N_CORE_PATH,
  DEFAULT_SYNC_ACTIVE_TAG,
  DEFAULT_SYNC_AUTH_MODE,
  DEFAULT_SYNC_EVENTS_PATH,
  DEFAULT_SYNC_MAX_BODY_BYTES,
  DEFAULT_SYNC_MAX_QUEUE_SIZE,
  DEFAULT_SYNC_MAX_RETRIES,
  DEFAULT_SYNC_PUBLISHER_INVALID_STATE,
  DEFAULT_SYNC_REPLAY_CACHE_SIZE,
  DEFAULT_SYNC_ROUTE_BASE,
  DEFAULT_SYNC_SIGNATURE_TOLERANCE_MS,
  DEFAULT_SYNC_TIMEOUT_MS,
  DEFAULT_SYNC_WORKFLOW_TAG,
  parseConfig,
} from '../src/shared/config';
import { createPublisherEntryHooks } from '../src/publisher/entry';
import { createPublisherHookConfig } from '../src/publisher/runtime';
import { createSubscriberEntryHooks } from '../src/subscriber/entry';
import { createSubscriberHookConfig } from '../src/subscriber/runtime';

const SECRET = 's3cret'; // pragma: allowlist secret

function makeEnv(overrides: Record<string, string | undefined> = {}): Record<string, string | undefined> {
  return {
    SYNC_SHARED_SECRET: SECRET,
    SYNC_SUBSCRIBER_URLS: 'https://target.example.com',
    SYNC_SOURCE_ID: 'source-1',
    ...overrides,
  };
}

function expectConfigError(overrides: Record<string, string | undefined>, message: string | RegExp): void {
  expect(() => parseConfig(makeEnv(overrides))).toThrow(message);
}

describe('parseConfig', () => {
  it('uses defaults only for absent or blank values', () => {
    const config = parseConfig(
      makeEnv({
        SYNC_ENTITIES: '   ',
        SYNC_AUTH_MODE: '   ',
        SYNC_TIMEOUT_MS: '   ',
        SYNC_MAX_RETRIES: '   ',
        SYNC_MAX_QUEUE_SIZE: '   ',
        SYNC_EVENTS_PATH: '   ',
        SYNC_FILTER_BY_TAG: '   ',
        SYNC_WORKFLOW_TAG: '   ',
        SYNC_ACTIVE_TAG: '   ',
        SYNC_ROUTE_BASE: '   ',
        SYNC_MAX_BODY_BYTES: '   ',
        SYNC_SIGNATURE_TOLERANCE_MS: '   ',
        SYNC_REPLAY_CACHE_SIZE: '   ',
      }),
    );

    expect([...config.entities]).toEqual(['workflows', 'credentials']);
    expect(config.auth).toEqual({ mode: DEFAULT_SYNC_AUTH_MODE, secret: SECRET });
    expect(config.publisher.timeoutMs).toBe(DEFAULT_SYNC_TIMEOUT_MS);
    expect(config.publisher.maxAttempts).toBe(DEFAULT_SYNC_MAX_RETRIES);
    expect(config.publisher.maxQueueSize).toBe(DEFAULT_SYNC_MAX_QUEUE_SIZE);
    expect(config.publisher.eventsPath).toBe(DEFAULT_SYNC_EVENTS_PATH);
    expect(config.filterByTag).toBe(false);
    expect(config.syncWorkflowTag).toBe(DEFAULT_SYNC_WORKFLOW_TAG);
    expect(config.activeTag).toBe(DEFAULT_SYNC_ACTIVE_TAG);
    expect(config.subscriber.routeBase).toBe(DEFAULT_SYNC_ROUTE_BASE);
    expect(config.subscriber.maxBodyBytes).toBe(DEFAULT_SYNC_MAX_BODY_BYTES);
    expect(config.subscriber.signatureToleranceMs).toBe(DEFAULT_SYNC_SIGNATURE_TOLERANCE_MS);
    expect(config.subscriber.replayCacheSize).toBe(DEFAULT_SYNC_REPLAY_CACHE_SIZE);
  });

  it.each([
    ['SYNC_TIMEOUT_MS'],
    ['SYNC_MAX_RETRIES'],
    ['SYNC_MAX_QUEUE_SIZE'],
    ['SYNC_MAX_BODY_BYTES'],
    ['SYNC_SIGNATURE_TOLERANCE_MS'],
    ['SYNC_REPLAY_CACHE_SIZE'],
  ])('rejects partial numeric values for %s', (key) => {
    expectConfigError({ [key]: '10ms' }, key);
  });

  it.each([
    ['SYNC_TIMEOUT_MS'],
    ['SYNC_MAX_RETRIES'],
    ['SYNC_MAX_QUEUE_SIZE'],
    ['SYNC_MAX_BODY_BYTES'],
    ['SYNC_SIGNATURE_TOLERANCE_MS'],
    ['SYNC_REPLAY_CACHE_SIZE'],
  ])('rejects negative numeric values for %s', (key) => {
    expectConfigError({ [key]: '-1' }, key);
  });

  it.each([
    ['SYNC_TIMEOUT_MS'],
    ['SYNC_MAX_RETRIES'],
    ['SYNC_MAX_QUEUE_SIZE'],
    ['SYNC_MAX_BODY_BYTES'],
    ['SYNC_SIGNATURE_TOLERANCE_MS'],
    ['SYNC_REPLAY_CACHE_SIZE'],
  ])('rejects zero values for %s', (key) => {
    expectConfigError({ [key]: '0' }, key);
  });

  it.each([
    ['SYNC_TIMEOUT_MS', '300001'],
    ['SYNC_MAX_RETRIES', '11'],
    ['SYNC_MAX_QUEUE_SIZE', '100001'],
    ['SYNC_MAX_BODY_BYTES', String(64 * 1024 * 1024 + 1)],
    ['SYNC_SIGNATURE_TOLERANCE_MS', String(60 * 60 * 1000 + 1)],
    ['SYNC_REPLAY_CACHE_SIZE', '100001'],
  ])('rejects overflow values for %s', (key, value) => {
    expectConfigError({ [key]: value }, key);
  });

  it('rejects explicit invalid auth mode typos instead of silently falling back', () => {
    expectConfigError({ SYNC_AUTH_MODE: 'hmaccc' }, 'SYNC_AUTH_MODE');
  });

  it('models token auth with a discriminated union', () => {
    const config = parseConfig(makeEnv({ SYNC_AUTH_MODE: 'token' }));

    expect(config.auth).toEqual({ mode: 'token', token: SECRET });
  });

  it('rejects invalid entity values instead of silently enabling default entities', () => {
    expectConfigError({ SYNC_ENTITIES: 'execution' }, 'SYNC_ENTITIES');
    expectConfigError({ SYNC_ENTITIES: 'none' }, 'SYNC_ENTITIES');
  });

  it.each([
    ['workflows', ['workflows']],
    ['credentials', ['credentials']],
    ['workflows,credentials', ['workflows', 'credentials']],
    ['workflows,executions', ['workflows', 'executions']],
    ['workflows,credentials,executions', ['workflows', 'credentials', 'executions']],
  ])('accepts valid SYNC_ENTITIES=%s', (raw, expected) => {
    const config = parseConfig(makeEnv({ SYNC_ENTITIES: raw }));

    expect([...config.entities]).toEqual(expected);
  });

  it('rejects executions without workflows', () => {
    expectConfigError({ SYNC_ENTITIES: 'executions' }, 'requires workflows');
    expectConfigError({ SYNC_ENTITIES: 'credentials,executions' }, 'requires workflows');
  });

  it('rejects duplicate subscriber URLs after normalization', () => {
    expectConfigError(
      { SYNC_SUBSCRIBER_URLS: 'https://target.example.com, https://target.example.com/' },
      'duplicate target URL',
    );
  });

  it('requires an explicit source id when publisher delivery is enabled', () => {
    expectConfigError({ SYNC_SOURCE_ID: undefined }, 'SYNC_SOURCE_ID must be set');
    expectConfigError({ SYNC_SOURCE_ID: '   ' }, 'SYNC_SOURCE_ID must be set');
  });

  it('rejects source ids longer than the subscriber wire limit', () => {
    expectConfigError({ SYNC_SOURCE_ID: 's'.repeat(513) }, 'SYNC_SOURCE_ID must be 512 characters or fewer');
  });

  it('allows omitted source id when publisher delivery is disabled', () => {
    const config = parseConfig(makeEnv({ SYNC_SUBSCRIBER_URLS: undefined, SYNC_SOURCE_ID: undefined }));

    expect(config.publisher.sourceId).toBe('');
    expect(config.publisher.subscriberUrls).toEqual([]);
  });

  it('rejects subscriber URLs with userinfo', () => {
    expectConfigError({ SYNC_SUBSCRIBER_URLS: 'https://user:pass@target.example.com' }, 'username or password'); // pragma: allowlist secret
  });

  it('rejects subscriber URLs over http by default', () => {
    expectConfigError({ SYNC_SUBSCRIBER_URLS: 'http://target.example.com' }, 'must use https');
  });

  it('allows development-only http subscriber URLs when explicitly enabled', () => {
    const config = parseConfig(
      makeEnv({
        NODE_ENV: 'development',
        SYNC_ALLOW_INSECURE_HTTP: 'true',
        SYNC_SUBSCRIBER_URLS: 'http://127.0.0.1:5678',
      }),
    );

    expect(config.publisher.subscriberUrls).toEqual(['http://127.0.0.1:5678']);
  });

  it('rejects development-only http policy outside development and test', () => {
    expectConfigError(
      {
        NODE_ENV: 'production',
        SYNC_ALLOW_INSECURE_HTTP: 'true',
        SYNC_SUBSCRIBER_URLS: 'http://127.0.0.1:5678',
      },
      'allowed only when NODE_ENV',
    );
  });

  it('rejects malformed local path values', () => {
    expectConfigError({ SYNC_ROUTE_BASE: 'rest/sync/v1' }, 'local absolute path');
    expectConfigError({ SYNC_EVENTS_PATH: '/rest/sync/v1/events?debug=true' }, 'query or fragment');
  });

  it('defaults N8N_CORE_PATH and honors overrides', () => {
    expect(parseConfig(makeEnv({})).subscriber.n8nCorePath).toBe(DEFAULT_N8N_CORE_PATH);
    expect(parseConfig(makeEnv({ N8N_CORE_PATH: '   ' })).subscriber.n8nCorePath).toBe(DEFAULT_N8N_CORE_PATH);
    expect(parseConfig(makeEnv({ N8N_CORE_PATH: '/opt/n8n' })).subscriber.n8nCorePath).toBe('/opt/n8n');
  });

  it('defaults SYNC_PUBLISHER_INVALID_STATE to fail', () => {
    const config = parseConfig(makeEnv({}));
    const blankConfig = parseConfig(makeEnv({ SYNC_PUBLISHER_INVALID_STATE: '   ' }));

    expect(DEFAULT_SYNC_PUBLISHER_INVALID_STATE).toBe('fail');
    expect(config.publisher.invalidState).toBe('fail');
    expect(blankConfig.publisher.invalidState).toBe('fail');
  });

  it.each([['fail'], ['quarantine-reset']])('accepts SYNC_PUBLISHER_INVALID_STATE=%s', (raw) => {
    const config = parseConfig(makeEnv({ SYNC_PUBLISHER_INVALID_STATE: raw }));

    expect(config.publisher.invalidState).toBe(raw);
  });

  it('rejects garbage SYNC_PUBLISHER_INVALID_STATE with the allowed-values message', () => {
    expectConfigError(
      { SYNC_PUBLISHER_INVALID_STATE: 'reset' },
      'SYNC_PUBLISHER_INVALID_STATE must be one of "fail", "quarantine-reset"',
    );
  });
});

describe('parsed config runtime factories', () => {
  it('builds different publisher hook maps from different parsed config objects in the same process', () => {
    const defaultHooks = createPublisherHookConfig(parseConfig(makeEnv({ SYNC_SUBSCRIBER_URLS: undefined })));
    const executionHooks = createPublisherHookConfig(
      parseConfig(makeEnv({ SYNC_SUBSCRIBER_URLS: undefined, SYNC_ENTITIES: 'workflows,executions' })),
    );

    expect(defaultHooks.workflow.postExecute).toBeUndefined();
    expect(Array.isArray(executionHooks.workflow.postExecute)).toBe(true);
  });

  it('builds publisher entry hooks directly from injected env objects', () => {
    const defaultHooks = createPublisherEntryHooks(makeEnv({ SYNC_SUBSCRIBER_URLS: undefined }));
    const executionHooks = createPublisherEntryHooks(
      makeEnv({ SYNC_SUBSCRIBER_URLS: undefined, SYNC_ENTITIES: 'workflows,executions' }),
    );

    expect(defaultHooks.workflow.postExecute).toBeUndefined();
    expect(Array.isArray(executionHooks.workflow.postExecute)).toBe(true);
  });

  it('exposes subscriber entry construction for tests without touching import caches', () => {
    const hookConfig = { n8n: { ready: [] } };
    const buildHookConfig = vi.fn().mockReturnValue(hookConfig);

    const result = createSubscriberEntryHooks(makeEnv({ SYNC_ROUTE_BASE: '/rest/sync/injected' }), {
      createSubscriberHookConfig: buildHookConfig,
    });

    expect(result).toBe(hookConfig);
    expect(buildHookConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        subscriber: expect.objectContaining({ routeBase: '/rest/sync/injected' }),
      }),
      undefined,
    );
  });

  it('passes parsed subscriber config through startup wiring without relying on module cache state', async () => {
    const buildN8nSyncRepositories = vi.fn().mockReturnValue({
      workflow: {},
      credentials: {},
      sharedWorkflow: {},
      sharedCredentials: {},
      user: {},
      project: {},
    });
    const createSyncOrderingStore = vi.fn().mockReturnValue({});
    const createApplier = vi.fn().mockReturnValue(async () => undefined);
    const createSyncRouteHandler = vi.fn().mockReturnValue(vi.fn());
    const mountSyncRoutes = vi.fn();
    const app = { get: vi.fn(), post: vi.fn() };

    const firstHooks = createSubscriberHookConfig(parseConfig(makeEnv({ SYNC_ROUTE_BASE: '/rest/sync/one' })), {
      buildN8nSyncRepositories: buildN8nSyncRepositories as never,
      createSyncOrderingStore: createSyncOrderingStore as never,
      createApplier: createApplier as never,
      createSyncRouteHandler: createSyncRouteHandler as never,
      mountSyncRoutes: mountSyncRoutes as never,
    });
    const secondHooks = createSubscriberHookConfig(parseConfig(makeEnv({ SYNC_ROUTE_BASE: '/rest/sync/two' })), {
      buildN8nSyncRepositories: buildN8nSyncRepositories as never,
      createSyncOrderingStore: createSyncOrderingStore as never,
      createApplier: createApplier as never,
      createSyncRouteHandler: createSyncRouteHandler as never,
      mountSyncRoutes: mountSyncRoutes as never,
    });

    await firstHooks.n8n.ready[0]({ app } as never);
    await secondHooks.n8n.ready[0]({ app } as never);

    expect(buildN8nSyncRepositories).toHaveBeenCalledWith(
      expect.objectContaining({ entities: expect.any(Set), includeExecutions: false }),
    );
    expect(createApplier).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ allowedEntities: expect.any(Set) }),
    );
    expect(mountSyncRoutes).toHaveBeenNthCalledWith(
      1,
      app,
      expect.any(Function),
      '/rest/sync/one',
      expect.any(Function),
    );
    expect(mountSyncRoutes).toHaveBeenNthCalledWith(
      2,
      app,
      expect.any(Function),
      '/rest/sync/two',
      expect.any(Function),
    );
  });
});
