import { mkdirSync, readFileSync, existsSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { execFile as execFileCallback } from 'node:child_process';
import { promisify } from 'node:util';

import N8nClient from '@egose/n8n-client';

const execFile = promisify(execFileCallback);
const REPO_ROOT = resolve(process.cwd(), '../..');
const COMPOSE_FILE = resolve(REPO_ROOT, 'sandbox/docker-compose.yml');

/**
 * Shared helpers for @egose/n8n-sync integration tests.
 *
 * Tests are run against the two-instance docker-compose stack under
 * sandbox/docker-compose.yml. The provisioner container writes owner
 * credentials + Public API keys to sandbox/secrets/api-keys.json; tests read
 * that file (resolved via N8N_SYNC_INTEGRATION_SECRETS env var so they can run
 * from either the repo root or the package directory).
 */

export interface InstanceCreds {
  baseUrl: string;
  apiKey: string;
}

export interface Secrets {
  n8n1: InstanceCreds;
  n8n2: InstanceCreds;
}

const DEFAULT_SECRETS_PATH =
  process.env.N8N_SYNC_INTEGRATION_SECRETS ?? resolve(process.cwd(), '../..', 'sandbox/secrets/api-keys.json');

export function loadSecrets(secretsPath: string = DEFAULT_SECRETS_PATH): Secrets {
  if (!existsSync(secretsPath)) {
    throw new Error(
      `integration secrets not found at ${secretsPath}.\n` +
        'Did the docker-compose provisioner service finish? ' +
        'Run `docker compose -f sandbox/docker-compose.yml up --build` first.',
    );
  }
  const raw = JSON.parse(readFileSync(secretsPath, 'utf8'));
  if (!raw.n8n1?.apiKey || !raw.n8n2?.apiKey) {
    throw new Error(`integration secrets file ${secretsPath} is missing API keys`);
  }
  return raw as Secrets;
}

export function makeSourceClient(secrets: Secrets): N8nClient {
  return new N8nClient({ baseUrl: secrets.n8n1.baseUrl, apiKey: secrets.n8n1.apiKey });
}

export function makeTargetClient(secrets: Secrets): N8nClient {
  return new N8nClient({ baseUrl: secrets.n8n2.baseUrl, apiKey: secrets.n8n2.apiKey });
}

function sqlLiteral(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

async function queryTargetJson(sql: string): Promise<unknown | null> {
  return queryDatabaseJson('n8n2', sql);
}

async function queryDatabaseJson(database: 'n8n1' | 'n8n2', sql: string): Promise<unknown | null> {
  const { stdout } = await execFile('docker', [
    'compose',
    '-f',
    COMPOSE_FILE,
    'exec',
    '-T',
    'postgres',
    'psql',
    '-U',
    'postgres',
    '-d',
    database,
    '-t',
    '-A',
    '-c',
    sql,
  ]);
  const raw = stdout.trim();
  return raw ? JSON.parse(raw) : null;
}

async function execTargetSql(sql: string): Promise<string> {
  return execDatabaseSql('n8n2', sql);
}

async function execDatabaseSql(database: 'n8n1' | 'n8n2', sql: string): Promise<string> {
  const { stdout } = await execFile('docker', [
    'compose',
    '-f',
    COMPOSE_FILE,
    'exec',
    '-T',
    'postgres',
    'psql',
    '-U',
    'postgres',
    '-d',
    database,
    '-t',
    '-A',
    '-c',
    sql,
  ]);
  return stdout.trim();
}

export async function readTargetWorkflow(
  id: string,
): Promise<null | { id: string; name: string; active: boolean; isArchived: boolean }> {
  return (await queryTargetJson(
    `select json_build_object(` +
      `'id', id, ` +
      `'name', name, ` +
      `'active', active, ` +
      `'isArchived', "isArchived"` +
      `) from workflow_entity where id = ${sqlLiteral(id)} limit 1;`,
  )) as null | { id: string; name: string; active: boolean; isArchived: boolean };
}

export async function readTargetCredential(id: string): Promise<null | { id: string; name: string; type: string }> {
  return (await queryTargetJson(
    `select json_build_object(` +
      `'id', id, ` +
      `'name', name, ` +
      `'type', type` +
      `) from credentials_entity where id = ${sqlLiteral(id)} limit 1;`,
  )) as null | { id: string; name: string; type: string };
}

export async function readDatabaseCredentialRecord(
  database: 'n8n1' | 'n8n2',
  id: string,
): Promise<null | { id: string; name: string; type: string; data: string }> {
  return (await queryDatabaseJson(
    database,
    `select json_build_object(` +
      `'id', id, ` +
      `'name', name, ` +
      `'type', type, ` +
      `'data', data` +
      `) from credentials_entity where id = ${sqlLiteral(id)} limit 1;`,
  )) as null | { id: string; name: string; type: string; data: string };
}

export async function readTargetWorkflowOwnerLink(
  workflowId: string,
): Promise<null | { workflowId: string; projectId: string; role: string }> {
  return (await queryTargetJson(
    `select json_build_object(` +
      `'workflowId', "workflowId", ` +
      `'projectId', "projectId", ` +
      `'role', role` +
      `) from shared_workflow where "workflowId" = ${sqlLiteral(workflowId)} and role = 'workflow:owner' limit 1;`,
  )) as null | { workflowId: string; projectId: string; role: string };
}

export async function readTargetCredentialOwnerLink(
  credentialId: string,
): Promise<null | { credentialsId: string; projectId: string; role: string }> {
  return (await queryTargetJson(
    `select json_build_object(` +
      `'credentialsId', "credentialsId", ` +
      `'projectId', "projectId", ` +
      `'role', role` +
      `) from shared_credentials where "credentialsId" = ${sqlLiteral(credentialId)} and role = 'credential:owner' limit 1;`,
  )) as null | { credentialsId: string; projectId: string; role: string };
}

export interface TargetExecutionRow {
  id: string;
  workflowId: string | null;
  status: string;
  mode: string;
  finished: boolean;
  startedAt: string | null;
  stoppedAt: string | null;
}

export async function readTargetExecutionsByWorkflow(workflowId: string): Promise<TargetExecutionRow[]> {
  const rows = (await queryTargetJson(
    `select coalesce(json_agg(json_build_object(` +
      `'id', id::text, ` +
      `'workflowId', "workflowId", ` +
      `'status', status, ` +
      `'mode', mode, ` +
      `'finished', finished, ` +
      `'startedAt', to_char("startedAt" at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'), ` +
      `'stoppedAt', case when "stoppedAt" is null then null else to_char("stoppedAt" at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') end` +
      `) order by id), '[]'::json) from execution_entity where "workflowId" = ${sqlLiteral(workflowId)};`,
  )) as TargetExecutionRow[] | null;
  return rows ?? [];
}

export async function insertTargetExecution(
  workflowId: string,
  options: {
    status: string;
    mode: string;
    finished: boolean;
    startedAt?: string;
    stoppedAt?: string;
    createdAt?: string;
  },
): Promise<TargetExecutionRow> {
  const startedAt = options.startedAt ?? null;
  const stoppedAt = options.stoppedAt ?? null;
  const createdAt = options.createdAt ?? options.startedAt ?? new Date().toISOString();
  return (await queryTargetJson(
    `with inserted as (` +
      `insert into execution_entity (` +
      `status, finished, mode, "workflowId", "startedAt", "stoppedAt", "createdAt", "storedAt", "deduplicationKey", "waitTill", "tracingContext", "usedPrivateCredentials"` +
      `) values (` +
      `${sqlLiteral(options.status)}, ` +
      `${options.finished ? 'true' : 'false'}, ` +
      `${sqlLiteral(options.mode)}, ` +
      `${sqlLiteral(workflowId)}, ` +
      `${startedAt ? `${sqlLiteral(startedAt)}::timestamptz` : 'null'}, ` +
      `${stoppedAt ? `${sqlLiteral(stoppedAt)}::timestamptz` : 'null'}, ` +
      `${sqlLiteral(createdAt)}::timestamptz, ` +
      `'db', null, null, null, false` +
      `) returning id::text as id, "workflowId", status, mode, finished, ` +
      `case when "startedAt" is null then null else to_char("startedAt" at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') end as "startedAt", ` +
      `case when "stoppedAt" is null then null else to_char("stoppedAt" at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') end as "stoppedAt"` +
      `) select row_to_json(inserted) from inserted;`,
  )) as TargetExecutionRow;
}

export async function deleteTargetExecution(id: string): Promise<void> {
  await execTargetSql(`delete from execution_entity where id::text = ${sqlLiteral(id)};`);
}

export async function deleteTargetExecutionsByWorkflow(workflowId: string): Promise<void> {
  await execTargetSql(`delete from execution_entity where "workflowId" = ${sqlLiteral(workflowId)};`);
}

export async function stopSandboxServices(...services: string[]): Promise<void> {
  await execFile('docker', ['compose', '-f', COMPOSE_FILE, 'stop', ...services]);
}

export async function startSandboxServices(...services: string[]): Promise<void> {
  await execFile('docker', ['compose', '-f', COMPOSE_FILE, 'start', ...services]);
}

export async function readSandboxServiceLogs(service: string): Promise<string> {
  const { stdout } = await execFile('docker', ['compose', '-f', COMPOSE_FILE, 'logs', '--no-color', service]);
  return stdout;
}

/** Wait until `predicate()` returns truthy, polling every `intervalMs`. */
export async function waitFor<T>(
  predicate: () => Promise<T> | T,
  {
    timeoutMs = 30_000,
    intervalMs = 500,
    label = 'condition',
  }: { timeoutMs?: number; intervalMs?: number; label?: string } = {},
): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  let lastErr: unknown;
  while (Date.now() < deadline) {
    try {
      const v = await predicate();
      if (v) return v;
    } catch (e) {
      lastErr = e;
    }
    await sleep(intervalMs);
  }
  const tail = lastErr instanceof Error ? `\nlast error: ${lastErr.message}` : '';
  throw new Error(`timed out after ${timeoutMs}ms waiting for ${label}${tail}`);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** A minimal but valid workflow body for the n8n Public API. */
export function makeWorkflowBody(name: string) {
  return {
    name,
    nodes: [
      {
        name: 'When clicking execute workflow',
        type: 'n8n-nodes-base.manualTrigger',
        typeVersion: 1,
        position: [0, 0],
        parameters: {},
      },
    ],
    connections: {},
    settings: { executionOrder: 'v1' as const },
  };
}

/** A workflow body with a real trigger node so n8n allows activation. */
export function makeActivatableWorkflowBody(name: string, path = `sync-${Date.now()}`) {
  return {
    name,
    nodes: [
      {
        name: 'Webhook',
        type: 'n8n-nodes-base.webhook',
        typeVersion: 2,
        position: [0, 0],
        parameters: {
          path,
          httpMethod: 'GET',
          responseMode: 'onReceived',
        },
      },
    ],
    connections: {},
    settings: { executionOrder: 'v1' as const },
  };
}

/** A credential body the API will accept without testing real secrets. */
export function makeCredentialBody(name: string) {
  return {
    name,
    type: 'httpHeaderAuth',
    data: { name: 'X-Test', value: 'integration-tests' },
  };
}

let createdIds: Array<{ kind: 'workflow' | 'credential'; id: string }> | undefined;
/** Tracks created entities for end-of-suite cleanup across all test files. */
export function trackCreation(kind: 'workflow' | 'credential', id: string) {
  if (createdIds === undefined) createdIds = [];
  createdIds.push({ kind, id });
}
export function consumedCreationTrackingFile(): Array<{ kind: 'workflow' | 'credential'; id: string }> | undefined {
  return createdIds;
}

/**
 * Persist created-entity IDs to disk so the runner can clean up even if the
 * test process crashed. Used by `scripts/cleanup.ts`.
 */
export function persistCreatedIds(path = resolve(process.cwd(), '.integration-created.json')) {
  if (!createdIds) return;
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(createdIds, null, 2));
}
