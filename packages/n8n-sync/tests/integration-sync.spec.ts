import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createHmac } from 'node:crypto';

import type { CredentialDetail, Execution, Tag, Workflow } from '@egose/n8n-client';

import {
  deleteTargetExecution,
  deleteTargetExecutionsByWorkflow,
  insertTargetExecution,
  loadSecrets,
  makeActivatableWorkflowBody,
  makeCredentialBody,
  makeSourceClient,
  makeTargetClient,
  makeWorkflowBody,
  readDatabaseCredentialRecord,
  readSandboxServiceLogs,
  readTargetCredentialOwnerLink,
  readTargetExecutionsByWorkflow,
  readTargetWorkflowOwnerLink,
  sleep,
  startSandboxServices,
  stopSandboxServices,
  trackCreation,
  waitFor,
} from './integration-utils';

const secrets = loadSecrets();
const source = makeSourceClient(secrets);
const target = makeTargetClient(secrets);

const SYNC_TIMEOUT = 60_000;
const SYNC_POLL = 1000;
const FILTER_BY_TAG = process.env.SYNC_FILTER_BY_TAG === 'true';
const WORKFLOW_SYNC_TAG = process.env.SYNC_WORKFLOW_TAG ?? 'sync';
const WORKFLOW_ACTIVE_TAG = process.env.SYNC_ACTIVE_TAG ?? 'active';
const MAX_QUEUE_SIZE = Number(process.env.SYNC_MAX_QUEUE_SIZE ?? '1000');

const createdWorkflows: string[] = [];
const createdCredentials: string[] = [];
const createdSourceTags: string[] = [];
const sourceTagCache = new Map<string, Tag>();

function signEvent(body: string, timestamp = String(Date.now())) {
  const signature = createHmac('sha256', process.env.SYNC_SHARED_SECRET ?? 'sync-shared-secret')
    .update(`${timestamp}.${body}`)
    .digest('hex');
  return {
    timestamp,
    signature,
  };
}

function errorStatus(error: unknown): number | undefined {
  return typeof error === 'object' && error !== null && 'status' in error
    ? ((error as { status?: unknown }).status as number | undefined)
    : undefined;
}

async function postSyncEvent(
  event: Record<string, unknown>,
  options: { expectedStatus?: number; timestamp?: string } = {},
) {
  const body = JSON.stringify(event);
  const signed = signEvent(body, options.timestamp ?? String(Date.now()));
  const response = await fetch(`${secrets.n8n2.baseUrl}/rest/sync/v1/events`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-sync-timestamp': signed.timestamp,
      'x-sync-signature': signed.signature,
    },
    body,
  });
  expect(response.status).toBe(options.expectedStatus ?? 200);
  return response;
}

async function getTargetWorkflow(id: string): Promise<Workflow | null> {
  try {
    return await target.workflows().get(id);
  } catch (error) {
    if (errorStatus(error) === 404) {
      return null;
    }
    throw error;
  }
}

async function getTargetCredential(id: string): Promise<CredentialDetail | null> {
  try {
    return await target.credentials().get(id);
  } catch (error) {
    if (errorStatus(error) === 404) {
      return null;
    }
    throw error;
  }
}

async function waitForSubscriberHealth(label = 'subscriber health route') {
  await waitFor(
    async () => {
      const res = await fetch(`${secrets.n8n2.baseUrl}/rest/sync/v1/health`);
      return res.status === 200 ? true : null;
    },
    { timeoutMs: 60_000, intervalMs: 1000, label },
  );
}

async function createTrackedWorkflow(
  body: ReturnType<typeof makeWorkflowBody> | ReturnType<typeof makeActivatableWorkflowBody>,
) {
  const created = await source.workflows().create(body);
  createdWorkflows.push(created.id);
  trackCreation('workflow', created.id);
  return created;
}

async function createTrackedCredential(body: ReturnType<typeof makeCredentialBody>) {
  const created = await source.credentials().create(body);
  createdCredentials.push(created.id);
  trackCreation('credential', created.id);
  return created;
}

async function updateSourceWorkflow(id: string, overrides: Partial<Pick<Workflow, 'description' | 'name'>> = {}) {
  const fetched = await source.workflows().get(id);
  await source.workflows().update(id, {
    name: overrides.name ?? fetched.name,
    description: overrides.description ?? fetched.description ?? undefined,
    nodes: fetched.nodes,
    connections: fetched.connections,
    settings: fetched.settings ?? { executionOrder: 'v1' },
  });
}

async function waitForTargetWorkflow(
  id: string,
  label: string,
  predicate?: (workflow: Workflow) => boolean,
): Promise<Workflow> {
  return (await waitFor(
    async () => {
      const workflow = await getTargetWorkflow(id);
      return workflow && (predicate ? predicate(workflow) : true) ? workflow : null;
    },
    {
      timeoutMs: SYNC_TIMEOUT,
      intervalMs: SYNC_POLL,
      label,
    },
  )) as Workflow;
}

async function waitForTargetCredential(
  id: string,
  label: string,
  predicate?: (credential: CredentialDetail) => boolean,
): Promise<CredentialDetail> {
  return (await waitFor(
    async () => {
      const credential = await getTargetCredential(id);
      return credential && (predicate ? predicate(credential) : true) ? credential : null;
    },
    {
      timeoutMs: SYNC_TIMEOUT,
      intervalMs: SYNC_POLL,
      label,
    },
  )) as CredentialDetail;
}

async function waitForMissingTargetWorkflow(id: string, label: string) {
  return waitFor(async () => ((await getTargetWorkflow(id)) ? null : 'missing'), {
    timeoutMs: SYNC_TIMEOUT,
    intervalMs: SYNC_POLL,
    label,
  });
}

async function waitForMissingTargetCredential(id: string, label: string) {
  return waitFor(async () => ((await getTargetCredential(id)) ? null : 'missing'), {
    timeoutMs: SYNC_TIMEOUT,
    intervalMs: SYNC_POLL,
    label,
  });
}

async function waitForExecutionViaApi(workflowId: string, label: string): Promise<Execution> {
  return (await waitFor(
    async () => {
      const response = await target.executions().list({ workflowId });
      return response.data.find((row) => String(row.workflowId) === workflowId) ?? null;
    },
    {
      timeoutMs: SYNC_TIMEOUT,
      intervalMs: SYNC_POLL,
      label,
    },
  )) as Execution;
}

async function waitForWorkflowOwnerLink(workflowId: string) {
  return (await waitFor(async () => await readTargetWorkflowOwnerLink(workflowId), {
    timeoutMs: SYNC_TIMEOUT,
    intervalMs: SYNC_POLL,
    label: 'workflow owner link',
  })) as { workflowId: string; projectId: string; role: string };
}

async function waitForCredentialOwnerLink(credentialId: string) {
  return (await waitFor(async () => await readTargetCredentialOwnerLink(credentialId), {
    timeoutMs: SYNC_TIMEOUT,
    intervalMs: SYNC_POLL,
    label: 'credential owner link',
  })) as { credentialsId: string; projectId: string; role: string };
}

async function waitForCredentialRecord(database: 'n8n1' | 'n8n2', credentialId: string, label: string) {
  return (await waitFor(async () => await readDatabaseCredentialRecord(database, credentialId), {
    timeoutMs: SYNC_TIMEOUT,
    intervalMs: SYNC_POLL,
    label,
  })) as { id: string; name: string; type: string; data: string };
}

async function ensureSourceTag(name: string): Promise<Tag> {
  const cached = sourceTagCache.get(name);
  if (cached) {
    return cached;
  }

  let cursor: string | undefined;
  do {
    const response = await source.tags().list(cursor ? { cursor } : undefined);
    const existing = response.data.find((tag) => tag.name === name);
    if (existing) {
      sourceTagCache.set(name, existing);
      return existing;
    }
    cursor = response.nextCursor ?? undefined;
  } while (cursor);

  const created = await source.tags().create({ name });
  createdSourceTags.push(created.id);
  sourceTagCache.set(name, created);
  return created;
}

async function setWorkflowTagsAndRepublish(workflowId: string, tagNames: string[]) {
  const tags = await Promise.all(tagNames.map((name) => ensureSourceTag(name)));
  await source.workflows().updateTags(
    workflowId,
    tags.map((tag) => ({ id: tag.id })),
  );
  await updateSourceWorkflow(workflowId, { description: `republished-${Date.now()}` });
}

async function createSyncedWorkflow(name: string) {
  const created = await createTrackedWorkflow(makeWorkflowBody(name));
  if (FILTER_BY_TAG) {
    await setWorkflowTagsAndRepublish(created.id, [WORKFLOW_SYNC_TAG]);
  }
  await waitForTargetWorkflow(created.id, `workflow ${created.id} initial sync`);
  return created;
}

async function deleteSourceWorkflow(id: string) {
  await source.delete<unknown>(`/workflows/${id}`);
}

function buildWorkflowSyncDto(workflow: Workflow, overrides: Record<string, unknown> = {}) {
  return {
    id: workflow.id,
    name: workflow.name,
    active: workflow.active,
    isArchived: workflow.isArchived,
    nodes: workflow.nodes,
    connections: workflow.connections,
    ...(workflow.description === undefined ? {} : { description: workflow.description }),
    ...(workflow.settings === undefined ? {} : { settings: workflow.settings }),
    ...(workflow.staticData === undefined ? {} : { staticData: workflow.staticData }),
    ...(workflow.pinData === undefined ? {} : { pinData: workflow.pinData }),
    ...(workflow.meta === undefined ? {} : { meta: workflow.meta }),
    ...(workflow.versionId === undefined ? {} : { versionId: workflow.versionId }),
    ...(workflow.activeVersionId === undefined ? {} : { activeVersionId: workflow.activeVersionId }),
    ...(workflow.tags === undefined ? {} : { tags: workflow.tags }),
    ...(workflow.createdAt === undefined ? {} : { createdAt: workflow.createdAt }),
    ...(workflow.updatedAt === undefined ? {} : { updatedAt: workflow.updatedAt }),
    ...overrides,
  };
}

afterAll(async () => {
  await Promise.allSettled(createdWorkflows.map((id) => source.workflows().delete(id)));
  await Promise.allSettled(createdCredentials.map((id) => source.credentials().delete(id)));
  await Promise.allSettled(createdSourceTags.map((id) => source.tags().delete(id)));
});

describe.runIf(!FILTER_BY_TAG)('n8n-sync integration: workflow lifecycle', () => {
  it('syncs a newly created workflow from publisher to subscriber and links it to a target project', async () => {
    const name = `sync-int-${Date.now()}`;
    const created = await createTrackedWorkflow(makeWorkflowBody(name));

    const onTarget = await waitForTargetWorkflow(created.id, 'workflow create sync');
    expect(onTarget.id).toBe(created.id);
    expect(onTarget.name).toBe(name);
    expect(onTarget.active).toBe(false);

    const ownerLink = await waitForWorkflowOwnerLink(created.id);
    expect(ownerLink).toMatchObject({ workflowId: created.id, role: 'workflow:owner' });
  });

  it('syncs workflow update (rename)', async () => {
    const created = await createTrackedWorkflow(makeWorkflowBody(`sync-rename-${Date.now()}`));
    await waitForTargetWorkflow(created.id, `workflow ${created.id} initial sync`);

    const newName = `${created.name}-renamed`;
    await updateSourceWorkflow(created.id, { name: newName });

    const updated = await waitForTargetWorkflow(
      created.id,
      'workflow update sync',
      (workflow) => workflow.name === newName,
    );
    expect(updated.name).toBe(newName);
  });

  it('syncs workflow activation and publishes real execution summaries from webhook runs', async () => {
    const webhookPath = `sync-activate-${Date.now()}`;
    const created = await createTrackedWorkflow(
      makeActivatableWorkflowBody(`sync-activate-${Date.now()}`, webhookPath),
    );
    await waitForTargetWorkflow(
      created.id,
      `workflow ${created.id} initial sync`,
      (workflow) => workflow.active === false,
    );

    await source.workflows().activate(created.id);
    await waitForTargetWorkflow(created.id, 'workflow activate delivery');

    const response = await fetch(`${secrets.n8n1.baseUrl}/webhook/${webhookPath}`);
    expect(response.ok).toBe(true);

    const execution = await waitForExecutionViaApi(created.id, 'workflow.postExecute sync');
    expect(String(execution.workflowId)).toBe(created.id);
  });

  it('syncs workflow archive and unarchive', async () => {
    const created = await createTrackedWorkflow(makeWorkflowBody(`sync-archive-${Date.now()}`));
    await waitForTargetWorkflow(created.id, `workflow ${created.id} initial sync`);

    await source.workflows().archive(created.id);
    const archived = await waitForTargetWorkflow(
      created.id,
      'workflow archive sync',
      (workflow) => workflow.isArchived,
    );
    expect(archived.isArchived).toBe(true);

    await source.workflows().unarchive(created.id);
    const unarchived = await waitForTargetWorkflow(
      created.id,
      'workflow unarchive sync',
      (workflow) => !workflow.isArchived,
    );
    expect(unarchived.isArchived).toBe(false);
  });

  it('syncs workflow delete', async () => {
    const created = await createTrackedWorkflow(makeWorkflowBody(`sync-delete-${Date.now()}`));
    await waitForTargetWorkflow(created.id, `workflow ${created.id} initial sync`);

    await deleteSourceWorkflow(created.id);
    await waitForMissingTargetWorkflow(created.id, 'workflow delete sync');
  });
});

describe.runIf(FILTER_BY_TAG)('n8n-sync integration: workflow tag filtering', () => {
  it('keeps untagged workflows absent until a sync tag is added', async () => {
    const created = await createTrackedWorkflow(makeWorkflowBody(`sync-filtered-${Date.now()}`));

    await sleep(3_000);
    expect(await getTargetWorkflow(created.id)).toBeNull();

    await setWorkflowTagsAndRepublish(created.id, [WORKFLOW_SYNC_TAG]);

    const onTarget = await waitForTargetWorkflow(
      created.id,
      'tag-filtered workflow upsert',
      (workflow) => workflow.active === false,
    );
    expect(onTarget.active).toBe(false);

    const ownerLink = await waitForWorkflowOwnerLink(created.id);
    expect(ownerLink).toMatchObject({ workflowId: created.id, role: 'workflow:owner' });
  });

  it('drops untagged executions and rewrites target active state from source tags', async () => {
    const gatedWebhookPath = `sync-filtered-gated-${Date.now()}`;
    const gated = await createTrackedWorkflow(
      makeActivatableWorkflowBody(`sync-filtered-gated-${Date.now()}`, gatedWebhookPath),
    );

    await source.workflows().activate(gated.id);
    const firstRun = await fetch(`${secrets.n8n1.baseUrl}/webhook/${gatedWebhookPath}`);
    expect(firstRun.ok).toBe(true);

    await sleep(3_000);
    expect(await getTargetWorkflow(gated.id)).toBeNull();
    const absentExecutions = await target.executions().list({ workflowId: gated.id });
    expect(absentExecutions.data).toHaveLength(0);

    const created = await createTrackedWorkflow(makeWorkflowBody(`sync-filtered-tags-${Date.now()}`));
    await setWorkflowTagsAndRepublish(created.id, [WORKFLOW_SYNC_TAG]);
    const inactive = await waitForTargetWorkflow(
      created.id,
      'sync-tag workflow upsert',
      (workflow) => workflow.active === false,
    );
    expect(inactive.active).toBe(false);

    await setWorkflowTagsAndRepublish(created.id, [WORKFLOW_SYNC_TAG, WORKFLOW_ACTIVE_TAG]);
    const active = await waitForTargetWorkflow(
      created.id,
      'active-tag workflow upsert',
      (workflow) => workflow.active === true,
    );
    expect(active.active).toBe(true);

    await setWorkflowTagsAndRepublish(created.id, []);
    await waitForMissingTargetWorkflow(created.id, 'workflow delete after sync tag removal');
  });
});

describe('n8n-sync integration: credential lifecycle', () => {
  it('applies a source-derived encrypted credential upsert, stores encrypted data at rest, and links it to a target project', async () => {
    const name = `cred-sync-${Date.now()}`;
    const plaintextValue = `integration-create-${Date.now()}`;
    const created = await createTrackedCredential({
      ...makeCredentialBody(name),
      data: { name: 'X-Test', value: plaintextValue },
    });

    const sourceRow = await waitForCredentialRecord('n8n1', created.id, 'source credential ciphertext');
    await postSyncEvent({
      type: 'credentials.upsert',
      at: new Date().toISOString(),
      sourceId: 'credential-source-a',
      eventId: 'credential-source-a:1',
      entityRevision: '1',
      credential: {
        id: sourceRow.id,
        name: sourceRow.name,
        type: sourceRow.type,
        data: sourceRow.data,
      },
    });

    const onTarget = await waitForTargetCredential(created.id, 'credential upsert sync');
    expect(onTarget.id).toBe(created.id);
    expect(onTarget.name).toBe(name);
    expect(onTarget.type).toBe('httpHeaderAuth');

    const ownerLink = await waitForCredentialOwnerLink(created.id);
    expect(ownerLink).toMatchObject({ credentialsId: created.id, role: 'credential:owner' });

    const targetRow = await waitForCredentialRecord('n8n2', created.id, 'target credential ciphertext');
    expect(targetRow.data).toBe(sourceRow.data);
    expect(targetRow.data).toMatch(/^U2FsdGVkX1/);
    expect(targetRow.data).not.toContain(plaintextValue);
  });

  it('applies credential updates when a later encrypted blob arrives', async () => {
    const created = await createTrackedCredential({
      ...makeCredentialBody(`cred-rename-${Date.now()}`),
      data: { name: 'X-Test', value: `before-${Date.now()}` },
    });
    const initialSourceRow = await waitForCredentialRecord('n8n1', created.id, 'initial source credential ciphertext');
    await postSyncEvent({
      type: 'credentials.upsert',
      at: new Date().toISOString(),
      sourceId: 'credential-source-b',
      eventId: 'credential-source-b:1',
      entityRevision: '1',
      credential: {
        id: initialSourceRow.id,
        name: initialSourceRow.name,
        type: initialSourceRow.type,
        data: initialSourceRow.data,
      },
    });
    await waitForTargetCredential(created.id, `credential ${created.id} initial sync`);

    const initialTarget = await readDatabaseCredentialRecord('n8n2', created.id);
    expect(initialTarget).not.toBeNull();

    const newName = `${created.name}-v2`;
    const nextPlaintextValue = `after-${Date.now()}`;
    await source.credentials().update(created.id, {
      name: newName,
      data: { name: 'X-Test', value: nextPlaintextValue },
    });

    const sourceRow = await waitForCredentialRecord('n8n1', created.id, 'updated source credential ciphertext');
    await postSyncEvent({
      type: 'credentials.upsert',
      at: new Date().toISOString(),
      sourceId: 'credential-source-b',
      eventId: 'credential-source-b:2',
      entityRevision: '2',
      credential: {
        id: sourceRow.id,
        name: sourceRow.name,
        type: sourceRow.type,
        data: sourceRow.data,
      },
    });

    const updated = await waitForTargetCredential(
      created.id,
      'credential update sync',
      (credential) => credential.name === newName,
    );
    expect(updated.name).toBe(newName);

    const targetRow = await waitFor(
      async () => {
        const row = await readDatabaseCredentialRecord('n8n2', created.id);
        return row && row.data === sourceRow.data ? row : null;
      },
      {
        timeoutMs: SYNC_TIMEOUT,
        intervalMs: SYNC_POLL,
        label: 'updated target credential ciphertext',
      },
    );
    expect(targetRow.data).toBe(sourceRow.data);
    expect(targetRow.data).not.toBe(initialTarget?.data);
    expect(targetRow.data).not.toContain(nextPlaintextValue);
  });

  it('syncs credential delete', async () => {
    const created = await createTrackedCredential(makeCredentialBody(`cred-delete-${Date.now()}`));
    const sourceRow = await waitForCredentialRecord('n8n1', created.id, 'credential delete source ciphertext');
    await postSyncEvent({
      type: 'credentials.upsert',
      at: new Date().toISOString(),
      sourceId: 'credential-source-c',
      eventId: 'credential-source-c:1',
      entityRevision: '1',
      credential: {
        id: sourceRow.id,
        name: sourceRow.name,
        type: sourceRow.type,
        data: sourceRow.data,
      },
    });
    await waitForTargetCredential(created.id, `credential ${created.id} initial sync`);

    await postSyncEvent({
      type: 'credentials.delete',
      at: new Date().toISOString(),
      sourceId: 'credential-source-c',
      eventId: 'credential-source-c:2',
      entityRevision: '2',
      credentialId: created.id,
    });
    await waitForMissingTargetCredential(created.id, 'credential delete sync');
  });
});

describe('n8n-sync integration: subscriber endpoint health', () => {
  it('responds on GET /rest/sync/v1/health', async () => {
    const res = await fetch(`${secrets.n8n2.baseUrl}/rest/sync/v1/health`);
    expect(res.status).toBe(200);
    await expect(res.text()).resolves.toMatch(/ok|healthy|up/i);
  });

  it('does not 200 on GET /rest/sync/v1/health on the publisher (no route mounted there)', async () => {
    const res = await fetch(`${secrets.n8n1.baseUrl}/rest/sync/v1/health`);
    expect(res.status).not.toBe(200);
  });
});

describe.runIf(!FILTER_BY_TAG)('n8n-sync integration: execution identity mapping', () => {
  it('creates a mapped execution without overwriting a native target execution whose id matches the source execution id', async () => {
    const workflow = await createSyncedWorkflow(`sync-exec-collision-${Date.now()}`);

    try {
      const native = await insertTargetExecution(workflow.id, {
        status: 'native',
        mode: 'internal',
        finished: false,
        startedAt: '2026-06-01T10:00:00.000Z',
      });

      const sourceId = `exec-collision-${Date.now()}`;
      await postSyncEvent({
        type: 'execution.upsert',
        at: '2026-06-01T10:00:05.000Z',
        sourceId,
        eventId: `${sourceId}:1`,
        entityRevision: '1',
        execution: {
          id: native.id,
          workflowId: workflow.id,
          status: 'success',
          mode: 'manual',
          finished: true,
          startedAt: '2026-06-01T10:00:00.000Z',
          stoppedAt: '2026-06-01T10:00:05.000Z',
          createdAt: '2026-06-01T10:00:00.000Z',
        },
      });

      const executions = await waitFor(
        async () => {
          const rows = await readTargetExecutionsByWorkflow(workflow.id);
          return rows.length === 2 ? rows : null;
        },
        {
          timeoutMs: SYNC_TIMEOUT,
          intervalMs: SYNC_POLL,
          label: 'execution collision isolation',
        },
      );

      const unchangedNative = executions.find((row) => row.id === native.id);
      const synced = executions.find((row) => row.id !== native.id);
      expect(unchangedNative).toMatchObject({ id: native.id, status: 'native', mode: 'internal', finished: false });
      expect(synced).toMatchObject({ workflowId: workflow.id, status: 'success', mode: 'manual', finished: true });
    } finally {
      await deleteTargetExecutionsByWorkflow(workflow.id);
    }
  });

  it('keeps duplicate deliveries idempotent and isolates two publishers with the same source execution id', async () => {
    const workflow = await createSyncedWorkflow(`sync-exec-duplicate-${Date.now()}`);

    try {
      const sourceBase = `pub-${Date.now()}`;
      const sharedExecution = {
        id: 'shared-exec-1',
        workflowId: workflow.id,
        status: 'success',
        mode: 'manual',
        finished: true,
        startedAt: '2026-06-02T10:00:00.000Z',
        stoppedAt: '2026-06-02T10:00:05.000Z',
        createdAt: '2026-06-02T10:00:00.000Z',
      };

      await postSyncEvent({
        type: 'execution.upsert',
        at: '2026-06-02T10:00:05.000Z',
        sourceId: `${sourceBase}-a`,
        eventId: `${sourceBase}-a:1`,
        entityRevision: '1',
        execution: sharedExecution,
      });
      await postSyncEvent(
        {
          type: 'execution.upsert',
          at: '2026-06-02T10:00:05.000Z',
          sourceId: `${sourceBase}-a`,
          eventId: `${sourceBase}-a:1`,
          entityRevision: '1',
          execution: sharedExecution,
        },
        { timestamp: String(Date.now() + 1) },
      );
      await postSyncEvent({
        type: 'execution.upsert',
        at: '2026-06-02T10:00:06.000Z',
        sourceId: `${sourceBase}-b`,
        eventId: `${sourceBase}-b:1`,
        entityRevision: '1',
        execution: sharedExecution,
      });

      const executions = await waitFor(
        async () => {
          const rows = await readTargetExecutionsByWorkflow(workflow.id);
          return rows.length === 2 ? rows : null;
        },
        {
          timeoutMs: SYNC_TIMEOUT,
          intervalMs: SYNC_POLL,
          label: 'execution duplicate and publisher isolation',
        },
      );

      expect(executions.every((row) => row.id !== 'shared-exec-1')).toBe(true);
      expect(executions.every((row) => row.status === 'success')).toBe(true);
    } finally {
      await deleteTargetExecutionsByWorkflow(workflow.id);
    }
  });

  it('serializes concurrent revisions for one source execution and recreates the mapping after target-side cleanup', async () => {
    const workflow = await createSyncedWorkflow(`sync-exec-concurrency-${Date.now()}`);

    try {
      const sourceId = `exec-concurrency-${Date.now()}`;
      await Promise.all([
        postSyncEvent({
          type: 'execution.upsert',
          at: '2026-06-03T10:00:00.000Z',
          sourceId,
          eventId: `${sourceId}:1`,
          entityRevision: '1',
          execution: {
            id: 'concurrent-1',
            workflowId: workflow.id,
            status: 'running',
            mode: 'manual',
            finished: false,
            startedAt: '2026-06-03T10:00:00.000Z',
            createdAt: '2026-06-03T10:00:00.000Z',
          },
        }),
        postSyncEvent({
          type: 'execution.upsert',
          at: '2026-06-03T10:00:05.000Z',
          sourceId,
          eventId: `${sourceId}:2`,
          entityRevision: '2',
          execution: {
            id: 'concurrent-1',
            workflowId: workflow.id,
            status: 'success',
            mode: 'manual',
            finished: true,
            startedAt: '2026-06-03T10:00:00.000Z',
            stoppedAt: '2026-06-03T10:00:05.000Z',
            createdAt: '2026-06-03T10:00:00.000Z',
          },
        }),
      ]);

      const initial = await waitFor(
        async () => {
          const rows = await readTargetExecutionsByWorkflow(workflow.id);
          return rows.length === 1 && rows[0]?.status === 'success' ? rows[0] : null;
        },
        {
          timeoutMs: SYNC_TIMEOUT,
          intervalMs: SYNC_POLL,
          label: 'execution concurrency convergence',
        },
      );

      await deleteTargetExecution(initial.id);
      await postSyncEvent({
        type: 'execution.upsert',
        at: '2026-06-03T10:00:06.000Z',
        sourceId,
        eventId: `${sourceId}:3`,
        entityRevision: '3',
        execution: {
          id: 'concurrent-1',
          workflowId: workflow.id,
          status: 'error',
          mode: 'manual',
          finished: true,
          startedAt: '2026-06-03T10:00:00.000Z',
          stoppedAt: '2026-06-03T10:00:06.000Z',
          createdAt: '2026-06-03T10:00:00.000Z',
        },
      });

      const recreated = await waitFor(
        async () => {
          const rows = await readTargetExecutionsByWorkflow(workflow.id);
          return rows.length === 1 && rows[0]?.status === 'error' ? rows[0] : null;
        },
        {
          timeoutMs: SYNC_TIMEOUT,
          intervalMs: SYNC_POLL,
          label: 'execution mapping recreation after cleanup',
        },
      );

      expect(recreated.id).not.toBe(initial.id);
    } finally {
      await deleteTargetExecutionsByWorkflow(workflow.id);
    }
  });

  it('exposes synced execution summaries through execution list/get/tag APIs and accepts insights summary queries', async () => {
    const workflow = await createSyncedWorkflow(`sync-exec-api-${Date.now()}`);

    try {
      const sourceId = `exec-api-${Date.now()}`;
      await postSyncEvent({
        type: 'execution.upsert',
        at: '2026-06-04T10:00:05.000Z',
        sourceId,
        eventId: `${sourceId}:1`,
        entityRevision: '1',
        execution: {
          id: 'api-exec-1',
          workflowId: workflow.id,
          status: 'success',
          mode: 'manual',
          finished: true,
          startedAt: '2026-06-04T10:00:00.000Z',
          stoppedAt: '2026-06-04T10:00:05.000Z',
          createdAt: '2026-06-04T10:00:00.000Z',
        },
      });

      const listed = await waitFor(
        async () => {
          const response = await target.executions().list({ workflowId: workflow.id });
          const match = response.data.find((row) => String(row.workflowId) === workflow.id && row.status === 'success');
          return match ? { response, execution: match } : null;
        },
        {
          timeoutMs: SYNC_TIMEOUT,
          intervalMs: SYNC_POLL,
          label: 'execution list API visibility',
        },
      );

      expect(listed.response.data.some((row) => String(row.id) === String(listed.execution.id))).toBe(true);

      const fetched = await target.executions().get(listed.execution.id);
      expect(String(fetched.workflowId)).toBe(workflow.id);
      expect(fetched.status).toBe('success');
      expect(fetched.mode).toBe('manual');
      expect(fetched.finished).toBe(true);
      expect(fetched.data).toBeUndefined();

      const insightsWindowEnd = new Date();
      const insightsWindowStart = new Date(insightsWindowEnd.getTime() - 24 * 60 * 60 * 1000);
      const insights = await target.insights().getSummary({
        startDate: insightsWindowStart.toISOString(),
        endDate: insightsWindowEnd.toISOString(),
      });
      expect(insights.total.value).toBeGreaterThanOrEqual(0);
      expect(insights.failed.value).toBeGreaterThanOrEqual(0);
    } finally {
      await deleteTargetExecutionsByWorkflow(workflow.id);
    }
  });

  it('deletes synced executions before applying workflow.delete so target workflow removal succeeds', async () => {
    const workflow = await createSyncedWorkflow(`sync-exec-workflow-delete-${Date.now()}`);

    await postSyncEvent({
      type: 'execution.upsert',
      at: '2026-06-05T10:00:05.000Z',
      sourceId: `exec-delete-${Date.now()}`,
      eventId: `exec-delete-${Date.now()}:1`,
      entityRevision: '1',
      execution: {
        id: 'delete-exec-1',
        workflowId: workflow.id,
        status: 'success',
        mode: 'manual',
        finished: true,
        startedAt: '2026-06-05T10:00:00.000Z',
        stoppedAt: '2026-06-05T10:00:05.000Z',
        createdAt: '2026-06-05T10:00:00.000Z',
      },
    });

    await waitFor(
      async () => {
        const rows = await readTargetExecutionsByWorkflow(workflow.id);
        return rows.length === 1 ? rows[0] : null;
      },
      {
        timeoutMs: SYNC_TIMEOUT,
        intervalMs: SYNC_POLL,
        label: 'execution present before workflow delete',
      },
    );

    await deleteSourceWorkflow(workflow.id);

    await waitForMissingTargetWorkflow(workflow.id, 'workflow delete with synced executions');
    await waitFor(
      async () => ((await readTargetExecutionsByWorkflow(workflow.id)).length === 0 ? 'executions deleted' : null),
      {
        timeoutMs: SYNC_TIMEOUT,
        intervalMs: SYNC_POLL,
        label: 'execution cleanup on workflow delete',
      },
    );
  });
});

describe('n8n-sync integration: stale / out-of-order delivery is skipped', () => {
  it('keeps the newer workflow revision when concurrent workflow.upsert events arrive out of order', async () => {
    const workflow = await createSyncedWorkflow(`sync-workflow-ordering-${Date.now()}`);
    const current = await source.workflows().get(workflow.id);
    const sourceId = `workflow-order-${Date.now()}`;
    const newerName = `${workflow.name}-newer`;
    const currentUpdatedAt = new Date(current.updatedAt).getTime();
    const olderAt = new Date(currentUpdatedAt + 1_000).toISOString();
    const newerAt = new Date(currentUpdatedAt + 2_000).toISOString();

    await Promise.all([
      postSyncEvent({
        type: 'workflow.upsert',
        at: newerAt,
        sourceId,
        eventId: `${sourceId}:2`,
        entityRevision: '2',
        workflow: buildWorkflowSyncDto(current, {
          name: newerName,
          updatedAt: newerAt,
        }),
      }),
      postSyncEvent({
        type: 'workflow.upsert',
        at: olderAt,
        sourceId,
        eventId: `${sourceId}:1`,
        entityRevision: '1',
        workflow: buildWorkflowSyncDto(current, {
          name: `${workflow.name}-older`,
          updatedAt: olderAt,
        }),
      }),
    ]);

    const converged = await waitForTargetWorkflow(
      workflow.id,
      'workflow revision ordering',
      (entry) => entry.name === newerName,
    );
    expect(converged.name).toBe(newerName);

    await sleep(2_000);
    expect((await getTargetWorkflow(workflow.id))?.name).toBe(newerName);
  });

  it('subscriber rejects an HMAC-signed event past the tolerance window', async () => {
    const oldTimestamp = String(Date.now() - 10 * 60 * 1000);
    const body = JSON.stringify({
      type: 'workflow.delete',
      workflowId: 'wf-does-not-exist',
      at: '1970-01-01T00:00:00.000Z',
      sourceId: 'test',
      eventId: 'test:1',
      entityRevision: '1',
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

  it('subscriber rejects an exact replay of the same HMAC-signed request', async () => {
    const timestamp = String(Date.now());
    const body = JSON.stringify({
      type: 'workflow.delete',
      workflowId: 'wf-does-not-exist',
      at: '2026-01-01T00:00:00.000Z',
      sourceId: 'test',
      eventId: 'test:replay-1',
      entityRevision: '1',
    });
    const crypto = await import('node:crypto');
    const sig = crypto
      .createHmac('sha256', process.env.SYNC_SHARED_SECRET ?? 'sync-shared-secret')
      .update(`${timestamp}.${body}`)
      .digest('hex');

    const first = await fetch(`${secrets.n8n2.baseUrl}/rest/sync/v1/events`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-sync-timestamp': timestamp,
        'x-sync-signature': sig,
      },
      body,
    });
    const second = await fetch(`${secrets.n8n2.baseUrl}/rest/sync/v1/events`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-sync-timestamp': timestamp,
        'x-sync-signature': sig,
      },
      body,
    });

    expect(first.status).toBe(200);
    expect(second.status).toBe(409);
  });
});

describe.runIf(MAX_QUEUE_SIZE === 2)('n8n-sync integration: bounded publisher queue', () => {
  it('logs queue overflow while the subscriber is stopped and still recovers for later deliveries', async () => {
    const createdWorkflowIds: string[] = [];

    await stopSandboxServices('n8n2');
    try {
      for (let index = 0; index < 4; index += 1) {
        const workflow = await createTrackedWorkflow(makeWorkflowBody(`wf-overflow-${Date.now()}-${index}`));
        createdWorkflowIds.push(workflow.id);
      }

      await waitFor(
        async () => {
          const logs = await readSandboxServiceLogs('n8n1');
          return logs.includes('Sync queue is full; dropping oldest queued event') ? logs : null;
        },
        {
          timeoutMs: 20_000,
          intervalMs: 1000,
          label: 'queue overflow warning',
        },
      );
    } finally {
      await startSandboxServices('n8n2');
      await waitForSubscriberHealth('subscriber health route after restart');
    }

    const recovered = await createTrackedWorkflow(makeWorkflowBody(`wf-overflow-recovery-${Date.now()}`));
    await setWorkflowTagsAndRepublish(recovered.id, [WORKFLOW_SYNC_TAG]);
    await waitForTargetWorkflow(recovered.id, `overflow recovery workflow ${recovered.id}`);

    const logs = await readSandboxServiceLogs('n8n1');
    expect(logs).toContain('Sync queue is full; dropping oldest queued event');
  });
});

beforeAll(async () => {
  try {
    await source.workflows().list();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (errorStatus(error) === 401 || /unauthorized/i.test(message)) {
      throw new Error(
        `source API key is unauthorized for ${secrets.n8n1.baseUrl}. ` +
          `The integration secrets file is likely stale. Re-run the provisioner or run ` +
          '`pnpm test:integration` so sandbox/secrets/api-keys.json is regenerated.',
      );
    }
    throw error;
  }

  await waitForSubscriberHealth();
}, 60_000);
