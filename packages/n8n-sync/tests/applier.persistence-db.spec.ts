import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type { SQLInputValue } from 'node:sqlite';

import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Logger } from '../src/shared/logger';
import type { SyncCredentialDto, SyncEvent, SyncWorkflowDto } from '../src/shared/types';
import { createApplier } from '../src/subscriber/applier';
import { createSyncOrderingStore } from '../src/subscriber/order-state';
import type { N8nSyncRepositories } from '../src/subscriber/n8n-runtime';

const log: Logger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  child: vi.fn(),
};

const workflow: SyncWorkflowDto = {
  id: 'wf-1',
  name: 'Synced Workflow',
  active: true,
  isArchived: false,
  nodes: [{ id: 'n1' }],
  connections: { n1: {} },
  settings: { a: 1 },
  versionId: 'v-1',
  activeVersionId: 'v-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
};

const credential: SyncCredentialDto = {
  id: 'cred-1',
  name: 'Synced Credential',
  type: 'httpBasicAuth',
  data: 'encrypted-blob',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
};

function orderedEvent<T extends Omit<SyncEvent, 'at' | 'sourceId' | 'eventId' | 'entityRevision'>>(
  event: T,
  overrides: Partial<Pick<SyncEvent, 'at' | 'sourceId' | 'eventId' | 'entityRevision'>> = {},
): T & Pick<SyncEvent, 'at' | 'sourceId' | 'eventId' | 'entityRevision'> {
  return {
    ...event,
    at: overrides.at ?? '2026-01-02T00:00:00.000Z',
    sourceId: overrides.sourceId ?? 'source-a',
    eventId: overrides.eventId ?? 'source-a:1',
    entityRevision: overrides.entityRevision ?? '1',
  };
}

type SqliteHarness = {
  repos: N8nSyncRepositories;
  path: string;
  dispose: () => Promise<void>;
  readWorkflowRow: (id: string) => Record<string, unknown> | null;
  readWorkflowOwnerLink: (workflowId: string) => Record<string, unknown> | null;
  readCredentialOwnerLink: (credentialId: string) => Record<string, unknown> | null;
  insertWorkflow: (entity: Record<string, unknown>) => void;
  insertCredential: (entity: Record<string, unknown>) => void;
  controls: {
    failNextWorkflowOwnerSave: boolean;
    beforeWorkflowSave?: () => Promise<void>;
    transactionsEnabled: boolean;
    workflowConditionalUpdateEnabled: boolean;
    credentialConditionalUpdateEnabled: boolean;
  };
  insertWorkflowFromSecondary: (entity: Record<string, unknown>) => void;
};

function normalizeValue(value: unknown): SQLInputValue {
  if (value === undefined) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (Array.isArray(value)) return JSON.stringify(value);
  if (value && typeof value === 'object') return JSON.stringify(value);
  return value as SQLInputValue;
}

function hydrateRow<T extends Record<string, unknown>>(row: T | undefined): T | null {
  if (!row) return null;
  const hydrated = { ...row } as Record<string, unknown>;
  if (typeof hydrated.updatedAt === 'string') hydrated.updatedAt = new Date(hydrated.updatedAt);
  if (typeof hydrated.createdAt === 'string') hydrated.createdAt = new Date(hydrated.createdAt);
  if (typeof hydrated.stoppedAt === 'string') hydrated.stoppedAt = new Date(hydrated.stoppedAt);
  return hydrated as T;
}

async function createSqliteHarness(): Promise<SqliteHarness> {
  const tempDir = await mkdtemp(join(tmpdir(), 'n8n-sync-persistence-'));
  const path = join(tempDir, 'applier.sqlite');
  const db = new DatabaseSync(path);
  const secondary = new DatabaseSync(path);

  db.exec('PRAGMA journal_mode = WAL;');
  secondary.exec('PRAGMA journal_mode = WAL;');
  db.exec(`
    create table workflow_entity (
      id text primary key,
      name text not null,
      nodes text,
      connections text,
      settings text,
      staticData text,
      pinData text,
      meta text,
      description text,
      versionId text,
      active integer,
      activeVersionId text,
      isArchived integer not null default 0,
      createdAt text,
      updatedAt text
    );
    create table credentials_entity (
      id text primary key,
      name text not null,
      type text not null,
      data text,
      isGlobal integer not null default 0,
      isManaged integer not null default 0,
      createdAt text,
      updatedAt text
    );
    create table shared_workflow (
      workflowId text not null,
      projectId text not null,
      role text not null,
      primary key (workflowId, projectId, role)
    );
    create table shared_credentials (
      credentialsId text not null,
      projectId text not null,
      role text not null,
      primary key (credentialsId, projectId, role)
    );
    create table users (
      id text primary key,
      roleSlug text not null,
      createdAt text not null
    );
    create table projects (
      id text primary key,
      ownerUserId text,
      createdAt text not null
    );
  `);

  const controls = {
    failNextWorkflowOwnerSave: false,
    beforeWorkflowSave: undefined as undefined | (() => Promise<void>),
    transactionsEnabled: true,
    workflowConditionalUpdateEnabled: true,
    credentialConditionalUpdateEnabled: true,
  };

  const insertRow = (database: DatabaseSync, table: string, entity: Record<string, unknown>): void => {
    const entries = Object.entries(entity).filter(([, value]) => value !== undefined);
    const columns = entries.map(([column]) => `"${column}"`).join(', ');
    const placeholders = entries.map(() => '?').join(', ');
    database
      .prepare(`insert into ${table} (${columns}) values (${placeholders})`)
      .run(...entries.map(([, value]) => normalizeValue(value)));
  };

  const updateRow = (
    database: DatabaseSync,
    table: string,
    idColumn: string,
    id: string | number,
    partial: Record<string, unknown>,
  ): void => {
    const entries = Object.entries(partial).filter(([, value]) => value !== undefined);
    if (entries.length === 0) return;
    const setClause = entries.map(([column]) => `"${column}" = ?`).join(', ');
    database
      .prepare(`update ${table} set ${setClause} where "${idColumn}" = ?`)
      .run(...entries.map(([, value]) => normalizeValue(value)), id);
  };

  const readWorkflowRow = (id: string): Record<string, unknown> | null =>
    hydrateRow(db.prepare('select * from workflow_entity where id = ?').get(id) as Record<string, unknown> | undefined);

  const readWorkflowOwnerLink = (workflowId: string): Record<string, unknown> | null =>
    hydrateRow(
      db
        .prepare('select workflowId, projectId, role from shared_workflow where workflowId = ? and role = ?')
        .get(workflowId, 'workflow:owner') as Record<string, unknown> | undefined,
    );

  const readCredentialOwnerLink = (credentialId: string): Record<string, unknown> | null =>
    hydrateRow(
      db
        .prepare('select credentialsId, projectId, role from shared_credentials where credentialsId = ? and role = ?')
        .get(credentialId, 'credential:owner') as Record<string, unknown> | undefined,
    );

  const transaction = async <T>(work: (repos: N8nSyncRepositories) => Promise<T>): Promise<T> => {
    if (!controls.transactionsEnabled) {
      return await work(reposWithoutTransaction);
    }

    db.exec('BEGIN;');
    try {
      const result = await work(reposWithoutTransaction);
      db.exec('COMMIT;');
      return result;
    } catch (error) {
      db.exec('ROLLBACK;');
      throw error;
    }
  };

  const reposWithoutTransaction: N8nSyncRepositories = {
    workflow: {
      findOneBy: async ({ id }) => readWorkflowRow(id),
      save: async (entity) => {
        await controls.beforeWorkflowSave?.();
        controls.beforeWorkflowSave = undefined;
        insertRow(db, 'workflow_entity', entity);
      },
      update: async (id, partial) => {
        updateRow(db, 'workflow_entity', 'id', id, partial);
      },
      delete: async (id) => {
        db.prepare('delete from workflow_entity where id = ?').run(id);
      },
      conditionalUpdate: async (id, partial, options) => {
        if (!controls.workflowConditionalUpdateEnabled)
          return (await readWorkflowRow(String(id))) ? 'stale' : 'missing';
        const entries = Object.entries(partial).filter(([, value]) => value !== undefined);
        const setClause = entries.map(([column]) => `"${column}" = ?`).join(', ');
        const params: SQLInputValue[] = [...entries.map(([, value]) => normalizeValue(value)), id];
        let whereClause = 'id = ?';
        if (options.incomingTimestamp) {
          whereClause += ` and (updatedAt is null or updatedAt < ?)`;
          params.push(options.incomingTimestamp.toISOString());
        }
        const result = db.prepare(`update workflow_entity set ${setClause} where ${whereClause}`).run(...params);
        if (Number(result.changes ?? 0) > 0) return 'updated';
        return readWorkflowRow(String(id)) ? 'stale' : 'missing';
      },
    },
    credentials: {
      findOneBy: async ({ id }) =>
        hydrateRow(
          db.prepare('select * from credentials_entity where id = ?').get(id) as Record<string, unknown> | undefined,
        ),
      save: async (entity) => {
        insertRow(db, 'credentials_entity', entity);
      },
      update: async (id, partial) => {
        updateRow(db, 'credentials_entity', 'id', id, partial);
      },
      delete: async (id) => {
        db.prepare('delete from credentials_entity where id = ?').run(id);
      },
      conditionalUpdate: async (id, partial, options) => {
        if (!controls.credentialConditionalUpdateEnabled) {
          const existing = db.prepare('select id from credentials_entity where id = ?').get(id);
          return existing ? 'stale' : 'missing';
        }
        const entries = Object.entries(partial).filter(([, value]) => value !== undefined);
        const setClause = entries.map(([column]) => `"${column}" = ?`).join(', ');
        const params: SQLInputValue[] = [...entries.map(([, value]) => normalizeValue(value)), id];
        let whereClause = 'id = ?';
        if (options.incomingTimestamp) {
          whereClause += ` and (updatedAt is null or updatedAt < ?)`;
          params.push(options.incomingTimestamp.toISOString());
        }
        const result = db.prepare(`update credentials_entity set ${setClause} where ${whereClause}`).run(...params);
        if (Number(result.changes ?? 0) > 0) return 'updated';
        const existing = db.prepare('select id from credentials_entity where id = ?').get(id);
        return existing ? 'stale' : 'missing';
      },
    },
    sharedWorkflow: {
      findOneBy: async (where) =>
        hydrateRow(
          db
            .prepare(
              'select workflowId, projectId, role from shared_workflow where workflowId = ? and role = ? limit 1',
            )
            .get(String(where.workflowId), String(where.role)) as Record<string, unknown> | undefined,
        ),
      save: async (entity) => {
        if (controls.failNextWorkflowOwnerSave) {
          controls.failNextWorkflowOwnerSave = false;
          throw new Error('link failed');
        }
        insertRow(db, 'shared_workflow', entity);
      },
      delete: async (criteria) => {
        db.prepare('delete from shared_workflow where workflowId = ? and projectId = ? and role = ?').run(
          String(criteria.workflowId),
          String(criteria.projectId),
          String(criteria.role),
        );
      },
    },
    sharedCredentials: {
      findOneBy: async (where) =>
        hydrateRow(
          db
            .prepare(
              'select credentialsId, projectId, role from shared_credentials where credentialsId = ? and role = ? limit 1',
            )
            .get(String(where.credentialsId), String(where.role)) as Record<string, unknown> | undefined,
        ),
      save: async (entity) => {
        insertRow(db, 'shared_credentials', entity);
      },
      delete: async (criteria) => {
        db.prepare('delete from shared_credentials where credentialsId = ? and projectId = ? and role = ?').run(
          String(criteria.credentialsId),
          String(criteria.projectId),
          String(criteria.role),
        );
      },
    },
    user: {
      findOne: async () => null,
    },
    project: {
      getPersonalProjectForUser: async () => null,
    },
  };

  const repos: N8nSyncRepositories = {
    ...reposWithoutTransaction,
    transaction,
  };

  return {
    repos,
    path,
    controls,
    readWorkflowRow,
    readWorkflowOwnerLink,
    readCredentialOwnerLink,
    insertWorkflow: (entity) => insertRow(db, 'workflow_entity', entity),
    insertCredential: (entity) => insertRow(db, 'credentials_entity', entity),
    insertWorkflowFromSecondary: (entity) => insertRow(secondary, 'workflow_entity', entity),
    dispose: async () => {
      db.close();
      secondary.close();
      await rm(tempDir, { recursive: true, force: true });
    },
  };
}

describe('createApplier real database persistence', () => {
  const harnesses: SqliteHarness[] = [];

  afterEach(async () => {
    await Promise.all(harnesses.splice(0).map(async (harness) => await harness.dispose()));
  });

  it('uses a real transaction to roll back workflow create + owner link and lets retry repair both rows', async () => {
    const harness = await createSqliteHarness();
    harnesses.push(harness);
    harness.controls.failNextWorkflowOwnerSave = true;
    const apply = createApplier(harness.repos, { log, targetProjectId: 'proj-1' });

    await expect(apply(orderedEvent({ type: 'workflow.upsert', workflow }))).rejects.toThrow('link failed');
    expect(harness.readWorkflowRow('wf-1')).toBeNull();
    expect(harness.readWorkflowOwnerLink('wf-1')).toBeNull();

    await apply(orderedEvent({ type: 'workflow.upsert', workflow }, { eventId: 'source-a:2', entityRevision: '2' }));

    expect(harness.readWorkflowRow('wf-1')).toMatchObject({ id: 'wf-1', name: 'Synced Workflow' });
    expect(harness.readWorkflowOwnerLink('wf-1')).toMatchObject({
      workflowId: 'wf-1',
      projectId: 'proj-1',
      role: 'workflow:owner',
    });
  });

  it('uses the real conditional update to keep an older workflow snapshot from overwriting a newer row', async () => {
    const harness = await createSqliteHarness();
    harnesses.push(harness);
    harness.insertWorkflow({
      id: 'wf-1',
      name: 'Initial workflow',
      updatedAt: '2026-01-01T00:00:00.000Z',
      createdAt: '2026-01-01T00:00:00.000Z',
      isArchived: 0,
      active: 0,
      activeVersionId: null,
      nodes: '[]',
      connections: '{}',
      settings: '{}',
      pinData: '{}',
    });

    const newerApply = createApplier(harness.repos, {
      log,
      targetProjectId: 'proj-1',
      ordering: createSyncOrderingStore({ statePath: `${harness.path}.ordering-a.json` }),
    });
    const olderApply = createApplier(harness.repos, {
      log,
      targetProjectId: 'proj-1',
      ordering: createSyncOrderingStore({ statePath: `${harness.path}.ordering-b.json` }),
    });

    await newerApply(
      orderedEvent(
        {
          type: 'workflow.upsert',
          workflow: { ...workflow, name: 'Newer workflow', updatedAt: '2026-01-03T00:00:00.000Z' },
        },
        { sourceId: 'source-a', eventId: 'source-a:2', entityRevision: '2' },
      ),
    );
    await olderApply(
      orderedEvent(
        {
          type: 'workflow.upsert',
          workflow: { ...workflow, name: 'Older workflow', updatedAt: '2026-01-02T00:00:00.000Z' },
        },
        { sourceId: 'source-a', eventId: 'source-a:1', entityRevision: '1' },
      ),
    );

    expect(harness.readWorkflowRow('wf-1')).toMatchObject({ name: 'Newer workflow' });
    expect(harness.readWorkflowOwnerLink('wf-1')).toMatchObject({ projectId: 'proj-1' });
  });

  it('reconciles a workflow insert race from a real database uniqueness conflict and still links ownership', async () => {
    const harness = await createSqliteHarness();
    harnesses.push(harness);
    harness.controls.transactionsEnabled = false;
    delete (harness.repos.workflow as { conditionalUpdate?: unknown }).conditionalUpdate;
    harness.controls.beforeWorkflowSave = async () => {
      harness.insertWorkflowFromSecondary({
        id: 'wf-1',
        name: 'Competing workflow',
        updatedAt: '2026-01-01T00:00:00.000Z',
        createdAt: '2026-01-01T00:00:00.000Z',
        isArchived: 0,
        active: 0,
        activeVersionId: null,
        nodes: '[]',
        connections: '{}',
        settings: '{}',
        pinData: '{}',
      });
    };
    const apply = createApplier(harness.repos, { log, targetProjectId: 'proj-1' });

    await apply(orderedEvent({ type: 'workflow.upsert', workflow }));

    expect(harness.readWorkflowRow('wf-1')).toMatchObject({
      id: 'wf-1',
      name: 'Synced Workflow',
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    });
    expect(harness.readWorkflowOwnerLink('wf-1')).toMatchObject({
      workflowId: 'wf-1',
      projectId: 'proj-1',
      role: 'workflow:owner',
    });
  });

  it('repairs an orphaned credential row in the real database by creating the missing owner relation', async () => {
    const harness = await createSqliteHarness();
    harnesses.push(harness);
    harness.insertCredential({
      id: 'cred-1',
      name: 'Orphaned credential',
      type: 'httpBasicAuth',
      data: 'encrypted-blob',
      updatedAt: '2026-01-01T00:00:00.000Z',
      createdAt: '2026-01-01T00:00:00.000Z',
      isGlobal: 0,
      isManaged: 0,
    });
    const apply = createApplier(harness.repos, { log, targetProjectId: 'proj-1' });

    await apply(orderedEvent({ type: 'credentials.upsert', credential }));

    expect(harness.readCredentialOwnerLink('cred-1')).toMatchObject({
      credentialsId: 'cred-1',
      projectId: 'proj-1',
      role: 'credential:owner',
    });
  });
});
