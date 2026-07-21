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
    'n8n2',
    '-t',
    '-A',
    '-c',
    sql,
  ]);
  const raw = stdout.trim();
  return raw ? JSON.parse(raw) : null;
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
export function makeActivatableWorkflowBody(name: string) {
  return {
    name,
    nodes: [
      {
        name: 'Webhook',
        type: 'n8n-nodes-base.webhook',
        typeVersion: 2,
        position: [0, 0],
        parameters: {
          path: `sync-${Date.now()}`,
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
