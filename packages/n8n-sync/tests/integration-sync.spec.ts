import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { Workflow } from '@egose/n8n-client';

import {
  makeActivatableWorkflowBody,
  loadSecrets,
  makeCredentialBody,
  makeSourceClient,
  makeWorkflowBody,
  readTargetCredential,
  readTargetWorkflow,
  trackCreation,
  waitFor,
} from './integration-utils';

/**
 * End-to-end @egose/n8n-sync integration tests.
 *
 * Stack under test (see sandbox/docker-compose.yml):
 *   - n8n1 (publisher)  running publisher.cjs, fans events out to n8n2
 *   - n8n2 (subscriber) running subscriber.cjs, applies events via n8n's repos
 *
 * State on n8n2 is verified through the n8n Public API using
 * @egose/n8n-client. Sync delivery is fire-and-forget with retries (1s, 2s,
 * 4s); tests poll for the expected state instead of assuming instant sync.
 */

const secrets = loadSecrets();
const source = makeSourceClient(secrets);

// Sync events are delivered async with retries; give the subscriber plenty
// of time per assertion.
const SYNC_TIMEOUT = 60_000;
const SYNC_POLL = 1000;

const createdWorkflows: string[] = [];
const createdCredentials: string[] = [];

afterAll(async () => {
  // Best-effort cleanup. Don't abort the suite on cleanup errors.
  await Promise.allSettled(createdWorkflows.map((id) => source.workflows().delete(id)));
  await Promise.allSettled(createdCredentials.map((id) => source.credentials().delete(id)));
});

describe('n8n-sync integration: workflow lifecycle', () => {
  it('syncs a newly created workflow from publisher to subscriber', async () => {
    const name = `sync-int-${Date.now()}`;
    const created = await source.workflows().create(makeWorkflowBody(name));
    createdWorkflows.push(created.id);
    trackCreation('workflow', created.id);

    await waitFor(async () => await readTargetWorkflow(created.id), {
      timeoutMs: SYNC_TIMEOUT,
      intervalMs: SYNC_POLL,
      label: 'workflow create sync',
    });

    const onTarget = await readTargetWorkflow(created.id);
    expect(onTarget).not.toBeNull();
    expect(onTarget.id).toBe(created.id);
    expect(onTarget.name).toBe(name);
    expect(onTarget.active).toBe(false);
  });

  it('syncs workflow update (rename)', async () => {
    const created = await source.workflows().create(makeWorkflowBody(`sync-rename-${Date.now()}`));
    createdWorkflows.push(created.id);
    trackCreation('workflow', created.id);

    await waitFor(async () => await readTargetWorkflow(created.id), {
      timeoutMs: SYNC_TIMEOUT,
      label: `workflow ${created.id} initial sync`,
    });

    const newName = `${created.name}-renamed`;
    const fetched = await source.workflows().get(created.id);
    await source.workflows().update(created.id, {
      name: newName,
      nodes: fetched.nodes,
      connections: fetched.connections,
      settings: fetched.settings ?? { executionOrder: 'v1' },
    });

    await waitFor(
      async () => {
        const w = await readTargetWorkflow(created.id);
        return w && w.name === newName ? w : null;
      },
      { timeoutMs: SYNC_TIMEOUT, label: 'workflow update sync' },
    );
  });

  it.skip('syncs workflow activate', async () => {
    const created = await source.workflows().create(makeActivatableWorkflowBody(`sync-activate-${Date.now()}`));
    createdWorkflows.push(created.id);
    trackCreation('workflow', created.id);

    await waitFor(async () => await readTargetWorkflow(created.id), {
      timeoutMs: SYNC_TIMEOUT,
      label: `workflow ${created.id} initial sync`,
    });

    await source.workflows().activate(created.id);

    await waitFor(async () => (await readTargetWorkflow(created.id)) || null, {
      timeoutMs: SYNC_TIMEOUT,
      label: 'workflow activate sync',
    });
  });

  it('syncs workflow archive and unarchive', async () => {
    const created = await source.workflows().create(makeWorkflowBody(`sync-archive-${Date.now()}`));
    createdWorkflows.push(created.id);
    trackCreation('workflow', created.id);

    await waitFor(async () => await readTargetWorkflow(created.id), {
      timeoutMs: SYNC_TIMEOUT,
      label: `workflow ${created.id} initial sync`,
    });

    await source.workflows().archive(created.id);

    await waitFor(
      async () => {
        const w = (await readTargetWorkflow(created.id)) as Workflow | null;
        return w && w.isArchived ? w : null;
      },
      { timeoutMs: SYNC_TIMEOUT, label: 'workflow archive sync' },
    );

    await source.workflows().unarchive(created.id);

    await waitFor(
      async () => {
        const w = (await readTargetWorkflow(created.id)) as Workflow | null;
        return w && !w.isArchived ? w : null;
      },
      { timeoutMs: SYNC_TIMEOUT, label: 'workflow unarchive sync' },
    );
  });

  it('syncs workflow delete', async () => {
    const created = await source.workflows().create(makeWorkflowBody(`sync-delete-${Date.now()}`));
    trackCreation('workflow', created.id);

    await waitFor(async () => await readTargetWorkflow(created.id), {
      timeoutMs: SYNC_TIMEOUT,
      label: `workflow ${created.id} initial sync`,
    });

    await source.workflows().delete(created.id);

    await waitFor(async () => ((await readTargetWorkflow(created.id)) ? null : 'gone'), {
      timeoutMs: SYNC_TIMEOUT,
      label: 'workflow delete sync',
    });
  });
});

describe('n8n-sync integration: credential lifecycle', () => {
  it('syncs a newly created credential from publisher to subscriber', async () => {
    const name = `cred-sync-${Date.now()}`;
    const created = await source.credentials().create(makeCredentialBody(name));
    createdCredentials.push(created.id);
    trackCreation('credential', created.id);

    await waitFor(async () => await readTargetCredential(created.id), {
      timeoutMs: SYNC_TIMEOUT,
      intervalMs: SYNC_POLL,
      label: 'credential create sync',
    });

    const onTarget = await readTargetCredential(created.id);
    expect(onTarget).not.toBeNull();
    expect(onTarget.id).toBe(created.id);
    expect(onTarget.name).toBe(name);
    expect(onTarget.type).toBe('httpHeaderAuth');
  });

  it.skip('syncs credential update (rename)', async () => {
    const created = await source.credentials().create(makeCredentialBody(`cred-rename-${Date.now()}`));
    createdCredentials.push(created.id);
    trackCreation('credential', created.id);

    await waitFor(async () => await readTargetCredential(created.id), {
      timeoutMs: SYNC_TIMEOUT,
      label: `credential ${created.id} initial sync`,
    });

    const newName = `${created.name}-v2`;
    await source.credentials().update(created.id, { name: newName });

    await waitFor(
      async () => {
        const c = await readTargetCredential(created.id);
        return c && c.name === newName ? c : null;
      },
      { timeoutMs: SYNC_TIMEOUT, label: 'credential update sync' },
    );
  });

  it('syncs credential delete', async () => {
    const created = await source.credentials().create(makeCredentialBody(`cred-delete-${Date.now()}`));
    trackCreation('credential', created.id);

    await waitFor(async () => await readTargetCredential(created.id), {
      timeoutMs: SYNC_TIMEOUT,
      label: `credential ${created.id} initial sync`,
    });

    await source.credentials().delete(created.id);

    await waitFor(async () => ((await readTargetCredential(created.id)) ? null : 'gone'), {
      timeoutMs: SYNC_TIMEOUT,
      label: 'credential delete sync',
    });
  });
});

describe('n8n-sync integration: subscriber endpoint health', () => {
  it('responds on GET /rest/sync/v1/health', async () => {
    // n8n-client does not expose a raw health probe, hit the endpoint directly.
    const res = await fetch(`${secrets.n8n2.baseUrl}/rest/sync/v1/health`);
    expect(res.status).toBe(200);
    await expect(res.text()).resolves.toMatch(/ok|healthy|up/i);
  });

  it('does not 200 on GET /rest/sync/v1/health on the publisher (no route mounted there)', async () => {
    const res = await fetch(`${secrets.n8n1.baseUrl}/rest/sync/v1/health`);
    expect(res.status).not.toBe(200);
  });
});

describe('n8n-sync integration: stale / out-of-order delivery is skipped', () => {
  it('subscriber rejects an HMAC-signed event past the tolerance window', async () => {
    const oldTimestamp = String(Date.now() - 10 * 60 * 1000);
    const body = JSON.stringify({
      type: 'workflow.delete',
      workflowId: 'wf-does-not-exist',
      at: '1970-01-01T00:00:00.000Z',
      sourceId: 'test',
    });
    const crypto = await import('node:crypto');
    const sig = crypto
      .createHmac('sha256', process.env.SYNC_SHARED_SECRET ?? 'sync-shared-secret')
      .update(`${oldTimestamp}.${body}`)
      .digest('hex');
    const res = await fetch(`${secrets.n8n2.baseUrl}/rest/sync/v1/events`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-sync-timestamp': oldTimestamp,
        'x-sync-signature': sig,
      },
      body,
    });
    expect([401, 403]).toContain(res.status);
  });
});

beforeAll(async () => {
  // Sanity: the source instance is reachable and the subscriber routes are
  // fully mounted before any lifecycle hook tries to publish into n8n2.
  try {
    await source.workflows().list();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status =
      typeof error === 'object' && error !== null && 'status' in error
        ? (error as { status?: unknown }).status
        : undefined;
    if (status === 401 || /unauthorized/i.test(message)) {
      throw new Error(
        `source API key is unauthorized for ${secrets.n8n1.baseUrl}. ` +
          `The integration secrets file is likely stale. Re-run the provisioner or run ` +
          '`pnpm test:integration` so sandbox/secrets/api-keys.json is regenerated.',
      );
    }
    throw error;
  }
  await waitFor(
    async () => {
      const res = await fetch(`${secrets.n8n2.baseUrl}/rest/sync/v1/health`);
      return res.status === 200 ? true : null;
    },
    { timeoutMs: 60_000, intervalMs: 1000, label: 'subscriber health route' },
  );
}, 60_000);
