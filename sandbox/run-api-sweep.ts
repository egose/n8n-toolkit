#!/usr/bin/env tsx
/**
 * API sweep for @egose/n8n-client.
 *
 * Brings up a single n8n instance via docker-compose, prompts for an
 * `N8N_LICENSE_ACTIVATION_KEY` via @clack/prompts, provisions an owner +
 * API key, then visits every top-level collection + singleton client method
 * exactly once and records the HTTP status and parsed payload (or error) for
 * each call to `sandbox/api-sweep-results.json`.
 *
 * Scope: shallow — every collection-level method (list/get/create/update/
 * delete) and every singleton is exercised at least once. Resource-instance
 * methods (activate/patch/refresh/test/...) and nested project/workflow
 * collections are NOT exercised. Endpoints that require an existing id are
 * fed the id of a freshly created temp resource where possible; if creation
 * itself fails (e.g. license-gated), the dependent methods record the error.
 *
 * Usage:
 *   pnpm exec tsx sandbox/run-api-sweep.ts
 *
 * Env overrides:
 *   N8N_LICENSE_ACTIVATION_KEY   skipped prompt when set (empty = unlicensed)
 *   N8N_APISPEC_PORT             host port for the n8n container (default 5690)
 *   N8N_APISPEC_VERSION          n8n image tag (default `latest`)
 *   NO_CLEANUP=1                 leave the stack running after the sweep
 *   NO_BOOT=1                    skip docker-compose up/provision (assume the
 *                                instance is already running and a key file
 *                                already exists at sandbox/secrets/apispec-key.json)
 *
 * Output: sandbox/api-sweep-results.json
 */

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import * as clack from '@clack/prompts';
// Import from the built dist so the sweep script doesn't depend on tsconfig
// path resolution (the workspace has no root tsconfig.json — only
// tsconfig.base.json that tsx does not consult automatically).
import N8nClient, { HttpError } from '../packages/n8n-client/dist/index.js';
import type {
  StopManyExecutionsRequest,
  UpsertRowBooleanRequest,
  UpdateRowsBooleanRequest,
  DeleteRowsBooleanParams,
  ProjectMemberRelation,
} from '../packages/n8n-client/dist/index.js';

const SANDBOX_DIR = resolve(import.meta.dirname, '.');
const COMPOSE_FILE = resolve(SANDBOX_DIR, 'docker-compose.apispec.yml');
const SECRETS_PATH = resolve(SANDBOX_DIR, 'secrets/apispec-key.json');
const OUTPUT_PATH = resolve(SANDBOX_DIR, 'api-sweep-results.json');
const SERVICE_CONTAINER = 'n8tool_apispec_provisioner';

// ─── Colour helpers (no unsupported ANSI on plain logs) ────────────────────
function logStep(label: string) {
  console.log(`\n▼ ${label}`);
}
function logInfo(msg: string) {
  console.log(`  ${msg}`);
}
function logOk(msg: string) {
  console.log(`  ✓ ${msg}`);
}
function logWarn(msg: string) {
  console.log(`  ⚠ ${msg}`);
}
function logErr(msg: string) {
  console.error(`  ✗ ${msg}`);
}

// ─── Docker helper ─────────────────────────────────────────────────────────
function run(
  cmd: string,
  args: string[],
  opts: { cwd?: string; env?: NodeJS.ProcessEnv } = {},
): { code: number; stdout: string; stderr: string } {
  const r = spawnSync(cmd, args, {
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: false,
    cwd: opts.cwd,
    env: { ...process.env, ...opts.env },
    encoding: 'utf8',
  });
  return { code: r.status ?? 0, stdout: r.stdout ?? '', stderr: r.stderr ?? '' };
}

function composeEnv(licenseKey: string): NodeJS.ProcessEnv {
  // Forward only the variables docker-compose.apispec.yml reads.
  return {
    ...process.env,
    N8N_LICENSE_ACTIVATION_KEY: licenseKey,
    // Don't accidentally leak SECRETS_PATH or other unrelated envs.
  };
}

function waitForProvisioner(timeoutMs = 180_000): boolean {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const r = run('docker', [
      'inspect',
      '--type=container',
      '-f',
      '{{.State.Status}} {{.State.ExitCode}}',
      SERVICE_CONTAINER,
    ]);
    const out = r.stdout.trim();
    const [status, exitStr] = out.split(' ');
    if (status === 'exited' || status === 'dead') {
      return Number(exitStr) === 0;
    }
    spawnSync('sleep', ['1.5'], { shell: false, stdio: 'ignore' });
  }
  return false;
}

// ─── Result capture ───────────────────────────────────────────────────────
type SweepEntry = {
  /** Dotted path identifying the client method, e.g. `workflows.list`. */
  op: string;
  /** HTTP status code when known, else null. */
  status: number | null;
  /** Response payload (parsed JSON; array, object, or primitive). */
  payload: unknown;
  /** Error message when the call threw. Set together with `status` when the
   *  client re-threw an HttpError carrying both pieces. */
  error?: string;
  /** Wall-clock duration in milliseconds. */
  durationMs: number;
};

async function capture(op: string, fn: () => Promise<unknown>): Promise<SweepEntry> {
  const start = Date.now();
  try {
    const result = await fn();
    return {
      op,
      status: 200,
      payload: normalizeForJson(result),
      durationMs: Date.now() - start,
    };
  } catch (err) {
    if (err instanceof HttpError) {
      return {
        op,
        status: err.status,
        payload: normalizeForJson(err.data),
        error: err.message,
        durationMs: Date.now() - start,
      };
    }
    // Non-HTTP error (constructor validation, network failure, type error,
    // etc.). Capture the message verbatim.
    const message = err instanceof Error ? err.message : String(err);
    return {
      op,
      status: null,
      payload: null,
      error: message,
      durationMs: Date.now() - start,
    };
  }
}

/** Replace non-JSON-serializable values (ArrayBuffer, BigInt, etc.) with a
 *  small placeholder so the final report file stays JSON-valid. */
function normalizeForJson(value: unknown): unknown {
  return replacer(undefined, value);
}

function replacer(_key: string | undefined, value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === 'bigint') return { __bigint: String(value) };
  if (typeof value === 'function') return { __function: '[Function]' };
  if (value instanceof ArrayBuffer) {
    return { __arraybuffer: `<${value.byteLength} bytes>` };
  }
  if (ArrayBuffer.isView(value) && !(value instanceof DataView)) {
    return { __typedarray: `<${value.byteLength} bytes>` };
  }
  if (typeof value === 'object') {
    if (Array.isArray(value)) return value.map((v) => replacer(undefined, v));
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = replacer(undefined, v);
    }
    return out;
  }
  return value;
}

// ─── Sweep fixtures ────────────────────────────────────────────────────────
const START_NODE = {
  name: 'When clicking Execute',
  type: 'n8n-nodes-base.manualTrigger',
  typeVersion: 1,
  position: [0, 0],
  parameters: {},
};

const WORKFLOW_CREATE = {
  name: 'api-sweep-workflow',
  nodes: [START_NODE],
  connections: {},
  settings: { executionOrder: 'v1' },
};

const WORKFLOW_UPDATE = {
  name: 'api-sweep-workflow',
  nodes: [START_NODE],
  connections: {},
  settings: { executionOrder: 'v1' },
};

const CREDENTIAL_CREATE = {
  name: 'api-sweep-credential',
  type: 'httpHeaderAuth',
  data: { name: 'X-Test', value: 'sweep' },
};

const TAG_CREATE = { name: 'api-sweep-tag' };

const VARIABLE_CREATE = { key: 'API_SWEEP_VAR', value: 'sweep' };
const VARIABLE_UPDATE = { key: 'API_SWEEP_VAR_UPDATED', value: 'sweep-updated' };

const PROJECT_CREATE = { name: 'api-sweep-project' };

const DATA_TABLE_CREATE = {
  name: 'api-sweep-table',
  columns: [
    { name: 'name', type: 'string' as const },
    { name: 'count', type: 'number' as const },
  ],
};

const FOLDER_CREATE = { name: 'api-sweep-folder' };
const FOLDER_UPDATE = { name: 'api-sweep-folder-renamed' };

const DATA_TABLE_UPDATE = { name: 'api-sweep-table-renamed' };
const COLUMN_CREATE = { name: 'flag', type: 'boolean' as const };

const USER_CREATE = [{ email: 'sweep-user@example.com' }];

const SECURITY_POLICY_UPDATE_BASE = {
  personalSpacePublishing: false,
  personalSpaceSharing: false,
  redactionEnforcement: { floor: 'off' as const },
};

// ─── Sweep orchestration ───────────────────────────────────────────────────
async function runSweep(client: N8nClient): Promise<SweepEntry[]> {
  const entries: SweepEntry[] = [];

  // ---- Workflows -----------------------------------------------------------
  const wfCreated = await capture('workflows.create', () => client.workflows().create(WORKFLOW_CREATE));
  entries.push(wfCreated);
  const wfId = pickId(wfCreated.payload);

  entries.push(await capture('workflows.list', () => client.workflows().list({})));
  if (wfId) {
    entries.push(await capture('workflows.get', () => client.workflows().get(wfId)));
    entries.push(await capture('workflows.update', () => client.workflows().update(wfId, { ...WORKFLOW_UPDATE })));
    entries.push(await capture('workflows.activate', () => client.workflows().activate(wfId)));
    entries.push(await capture('workflows.deactivate', () => client.workflows().deactivate(wfId)));
    entries.push(await capture('workflows.archive', () => client.workflows().archive(wfId)));
    entries.push(await capture('workflows.unarchive', () => client.workflows().unarchive(wfId)));
    entries.push(await capture('workflows.getTags', () => client.workflows().getTags(wfId)));
    entries.push(await capture('workflows.updateTags', () => client.workflows().updateTags(wfId, [])));
    // getVersion requires a real version id we don't have — feed '1' so we capture
    // either the body or the 404 from n8n.
    entries.push(await capture('workflows.getVersion', () => client.workflows().getVersion(wfId, '1')));
    entries.push(await capture('workflows.listTestRuns', () => client.workflows().listTestRuns(wfId)));
  }

  // ---- Executions ----------------------------------------------------------
  // Note: executions.get / retry / stop / delete / getTags / updateTags all
  // require an existing execution id; we don't trigger one in the sweep, so
  // each call below will hit the 404 path. The sweep still records the actual
  // API response (status + body) so coverage stays complete.
  entries.push(await capture('executions.list', () => client.executions().list({})));
  entries.push(await capture('executions.get', () => client.executions().get(1)));
  entries.push(await capture('executions.getTags', () => client.executions().getTags(1)));
  entries.push(await capture('executions.updateTags', () => client.executions().updateTags(1, [])));
  entries.push(await capture('executions.retry', () => client.executions().retry(1)));
  entries.push(await capture('executions.stop', () => client.executions().stop(1)));
  entries.push(await capture('executions.delete', () => client.executions().delete(1)));
  entries.push(
    await capture('executions.stopMany', () =>
      client.executions().stopMany({
        status: ['queued', 'running', 'waiting'],
      } satisfies StopManyExecutionsRequest),
    ),
  );

  // ---- Credentials ---------------------------------------------------------
  const credCreated = await capture('credentials.create', () => client.credentials().create(CREDENTIAL_CREATE));
  entries.push(credCreated);
  const credId = pickId(credCreated.payload);

  entries.push(await capture('credentials.list', () => client.credentials().list({})));
  if (credId) {
    entries.push(await capture('credentials.get', () => client.credentials().get(credId)));
    entries.push(
      await capture('credentials.update', () =>
        client.credentials().update(credId, { name: 'api-sweep-credential-renamed' }),
      ),
    );
    entries.push(await capture('credentials.test', () => client.credentials().test(credId)));
    entries.push(await capture('credentials.transfer', () => client.credentials().transfer(credId, 'n8n-personal')));
  }
  entries.push(await capture('credentials.getSchema', () => client.credentials().getSchema('httpHeaderAuth')));

  // ---- Tags ----------------------------------------------------------------
  const tagCreated = await capture('tags.create', () => client.tags().create(TAG_CREATE));
  entries.push(tagCreated);
  const tagId = pickId(tagCreated.payload);

  entries.push(await capture('tags.list', () => client.tags().list({})));
  if (tagId) {
    entries.push(await capture('tags.get', () => client.tags().get(tagId)));
    entries.push(await capture('tags.update', () => client.tags().update(tagId, TAG_CREATE)));
  }

  // ---- Users ---------------------------------------------------------------
  entries.push(await capture('users.list', () => client.users().list({})));
  const usersListEntry = entries.find((e) => e.op === 'users.list');
  const usersList = usersListEntry?.payload as { data?: Array<{ id: string }> } | undefined;
  const ownerId = usersList?.data?.[0]?.id;
  if (ownerId) {
    entries.push(await capture('users.get', () => client.users().get(ownerId)));
    // changeRole on the owner: will likely 400 — we record the response.
    entries.push(await capture('users.changeRole', () => client.users().changeRole(ownerId, 'member')));
  }
  // users.create takes an array
  entries.push(await capture('users.create', () => client.users().create(USER_CREATE)));

  // ---- Variables -----------------------------------------------------------
  const varCreated = await capture('variables.create', () => client.variables().create(VARIABLE_CREATE));
  entries.push(varCreated);
  // variables.create returns void on success, so we can't pick the id from
  // the payload. Fall back to listing then looking up by key.
  const varList = await capture('variables.list', () => client.variables().list({}));
  entries.push(varList);
  const varId = pickVariableId(varList.payload, 'API_SWEEP_VAR');
  if (varId) {
    // variables.get uses paginated search
    entries.push(await capture('variables.get', () => client.variables().get(varId)));
    entries.push(await capture('variables.update', () => client.variables().update(varId, VARIABLE_UPDATE)));
  }

  // ---- Projects ------------------------------------------------------------
  const projCreated = await capture('projects.create', () => client.projects().create(PROJECT_CREATE));
  entries.push(projCreated);
  const projId = pickId(projCreated.payload);

  entries.push(await capture('projects.list', () => client.projects().list({})));
  if (projId) {
    entries.push(await capture('projects.update', () => client.projects().update(projId, PROJECT_CREATE)));
    // ProjectClient has no `get(id)` — exercise `listMembers` instead.
    entries.push(await capture('projects.listMembers', () => client.projects().listMembers(projId)));
    // addMembers then removeMember — sweep needs a user id; reuse ownerId if present.
    if (ownerId) {
      const memberRelation: ProjectMemberRelation = {
        userId: ownerId,
        role: 'project:editor',
      };
      entries.push(await capture('projects.addMembers', () => client.projects().addMembers(projId, [memberRelation])));
      entries.push(
        await capture('projects.changeMemberRole', () =>
          client.projects().changeMemberRole(projId, ownerId, 'project:viewer'),
        ),
      );
      entries.push(await capture('projects.removeMember', () => client.projects().removeMember(projId, ownerId)));
    }
  }

  // ---- Folders (project-scoped) --------------------------------------------
  if (projId) {
    const folders = client.folders(projId);
    const folderCreated = await capture('folders.create', () => folders.create(FOLDER_CREATE));
    entries.push(folderCreated);
    const folderId = pickId(folderCreated.payload);

    entries.push(await capture('folders.list', () => folders.list({})));
    if (folderId) {
      entries.push(await capture('folders.get', () => folders.get(folderId)));
      entries.push(await capture('folders.update', () => folders.update(folderId, FOLDER_UPDATE)));
    }
  }

  // ---- Data tables ---------------------------------------------------------
  const dtCreated = await capture('dataTables.create', () =>
    client.dataTables().create({
      ...DATA_TABLE_CREATE,
      ...(projId ? { projectId: projId } : {}),
    }),
  );
  entries.push(dtCreated);
  const dtId = pickId(dtCreated.payload);

  entries.push(await capture('dataTables.list', () => client.dataTables().list({})));
  if (dtId) {
    entries.push(await capture('dataTables.get', () => client.dataTables().get(dtId)));
    entries.push(await capture('dataTables.update', () => client.dataTables().update(dtId, DATA_TABLE_UPDATE)));

    // Rows — insert, list, upsert, update, delete, clear
    const inserted = await capture('dataTables.insertRows', () =>
      client.dataTables().insertRows(dtId, {
        data: [
          { name: 'alpha', count: 1 },
          { name: 'beta', count: 2 },
        ],
        returnType: 'all',
      }),
    );
    entries.push(inserted);

    entries.push(await capture('dataTables.listRows', () => client.dataTables().listRows(dtId)));

    const upsertPayload: UpsertRowBooleanRequest = {
      filter: {
        type: 'and',
        filters: [{ columnName: 'name', condition: 'eq', value: 'alpha' }],
      },
      data: { name: 'alpha', count: 1 },
      returnData: false,
    };
    entries.push(await capture('dataTables.upsertRow', () => client.dataTables().upsertRow(dtId, upsertPayload)));
    const updatePayload: UpdateRowsBooleanRequest = {
      filter: {
        type: 'and',
        filters: [{ columnName: 'name', condition: 'eq', value: 'beta' }],
      },
      data: { count: 3 },
      returnData: false,
    };
    entries.push(await capture('dataTables.updateRows', () => client.dataTables().updateRows(dtId, updatePayload)));
    const deleteRowsPayload: DeleteRowsBooleanParams = {
      filter: "name eq 'unused-name'",
      returnData: false,
    };
    entries.push(await capture('dataTables.deleteRows', () => client.dataTables().deleteRows(dtId, deleteRowsPayload)));
    entries.push(await capture('dataTables.clearRows', () => client.dataTables().clearRows(dtId)));

    // Columns
    const colCreated = await capture('dataTables.createColumn', () =>
      client.dataTables().createColumn(dtId, COLUMN_CREATE),
    );
    entries.push(colCreated);
    entries.push(await capture('dataTables.listColumns', () => client.dataTables().listColumns(dtId)));
    const colId = pickId(colCreated.payload);
    if (colId) {
      entries.push(
        await capture('dataTables.updateColumn', () =>
          client.dataTables().updateColumn(dtId, colId, { name: 'flag-renamed' }),
        ),
      );
      entries.push(await capture('dataTables.deleteColumn', () => client.dataTables().deleteColumn(dtId, colId)));
    }
  }

  // ---- Community packages --------------------------------------------------
  entries.push(await capture('communityPackages.list', () => client.communityPackages().list()));
  // install: actually pulls from npm — too invasive for a sweep. Skip and
  // exercise only the read path. If the user opts in later we can add it.
  // update / uninstall need a name; we don't install anything here.

  // ---- Singletons ----------------------------------------------------------
  entries.push(await capture('audit.generate', () => client.audit().generate({})));
  entries.push(await capture('insights.getSummary', () => client.insights().getSummary({})));
  entries.push(await capture('sourceControl.pull', () => client.sourceControl().pull({})));
  entries.push(await capture('securityPolicy.get', () => client.securityPolicy().get()));
  entries.push(
    await capture('securityPolicy.update', () => client.securityPolicy().update(SECURITY_POLICY_UPDATE_BASE)),
  );
  entries.push(await capture('discover.get', () => client.discover().get()));

  // ---- Packages (export+import) --------------------------------------------
  // Export with an empty workflowIds list produces an empty package without
  // needing any workflow resource to exist on the server.
  entries.push(await capture('n8nPackage.exportWorkflows', () => client.n8nPackage().exportWorkflows({})));
  // importPackage needs a real file; we don't have one to feed. Skip the import
  // call so it doesn't error on a missing file — that failure isn't a server-
  // side response anyway.
  return entries;
}

function pickId(payload: unknown): string | undefined {
  if (typeof payload !== 'object' || payload === null) return undefined;
  const obj = payload as Record<string, unknown>;
  if (typeof obj.id === 'string') return obj.id;
  if (typeof obj.data === 'object' && obj.data !== null) {
    const inner = obj.data as Record<string, unknown>;
    if (typeof inner.id === 'string') return inner.id;
  }
  return undefined;
}

function pickVariableId(payload: unknown, key: string): string | undefined {
  if (typeof payload !== 'object' || payload === null) return undefined;
  const obj = payload as { data?: Array<{ id: string; key: string }> };
  return obj.data?.find((v) => v.key === key)?.id;
}

// ─── Cleanup of created resources (best-effort) ────────────────────────────
async function cleanup(client: N8nClient, entries: SweepEntry[]): Promise<void> {
  const find = (op: string) => entries.find((e) => e.op === op);
  const silent = async (op: string, fn: () => Promise<unknown>) => {
    try {
      await fn();
    } catch (err) {
      logWarn(`cleanup ${op} failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  await silent('credentials.delete', async () => {
    const id = pickId(find('credentials.create')?.payload);
    if (id) await client.credentials().delete(id);
  });
  await silent('tags.delete', async () => {
    const id = pickId(find('tags.create')?.payload);
    if (id) await client.tags().delete(id);
  });
  await silent('variables.delete', async () => {
    const varList = await client
      .variables()
      .list()
      .catch(() => undefined);
    const id = pickVariableId(varList, 'API_SWEEP_VAR_UPDATED');
    if (id) await client.variables().delete(id);
  });
  await silent('dataTables.delete', async () => {
    const id = pickId(find('dataTables.create')?.payload);
    if (id) await client.dataTables().delete(id);
  });
  await silent('workflows.delete', async () => {
    const id = pickId(find('workflows.create')?.payload);
    if (id) await client.workflows().delete(id);
  });
  await silent('projects.delete', async () => {
    const id = pickId(find('projects.create')?.payload);
    if (id) await client.projects().delete(id);
  });
}

// ─── Main ───────────────────────────────────────────────────────────────────
async function main() {
  clack.intro('n8n-client API sweep');

  // Step 1: collect the license key via @clack/prompts (skippable).
  const fromEnv = process.env.N8N_LICENSE_ACTIVATION_KEY;
  let licenseKey: string;
  if (fromEnv !== undefined && fromEnv !== null) {
    licenseKey = fromEnv;
    clack.log.info(`Using N8N_LICENSE_ACTIVATION_KEY from env (length ${licenseKey.length}).`);
  } else {
    const answer = await clack.password({
      message: 'Paste your N8N license activation key (leave empty to skip and run unlicensed):',
      mask: '*',
    });
    if (clack.isCancel(answer)) {
      clack.cancel('Sweep cancelled.');
      process.exit(0);
    }
    licenseKey = String(answer ?? '').trim();
  }

  // Step 2: bring up the compose stack + provision (or skip with NO_BOOT=1).
  const noBoot = process.env.NO_BOOT === '1';
  const noCleanupFlag = process.env.NO_CLEANUP === '1';

  if (noBoot) {
    logStep('NO_BOOT=1 — skipping docker-compose up and provisioner');
    if (!existsSync(SECRETS_PATH)) {
      clack.cancel(`NO_BOOT=1 but secrets file not found at ${SECRETS_PATH}`);
      process.exit(1);
    }
  } else {
    logStep('Bring up the docker-compose stack (postgres + n8n + provisioner)');
    const up = run('docker', ['compose', '-f', COMPOSE_FILE, 'up', '--build', '--wait', '-d'], {
      cwd: SANDBOX_DIR,
      env: composeEnv(licenseKey),
    });
    if (up.code !== 0) {
      logErr(`docker compose up failed (exit ${up.code})`);
      process.stderr.write(up.stderr);
      process.exit(up.code);
    }
    logOk('stack is up');

    logStep('Wait for the provisioner to finish');
    if (!waitForProvisioner()) {
      logErr('provisioner did not exit cleanly — check `docker logs n8tool_apispec_provisioner`');
      if (!noCleanupFlag) {
        run('docker', ['compose', '-f', COMPOSE_FILE, 'down', '-v'], {
          cwd: SANDBOX_DIR,
          env: composeEnv(licenseKey),
        });
      }
      process.exit(1);
    }
    if (!existsSync(SECRETS_PATH)) {
      logErr(`provisioner exited but ${SECRETS_PATH} is missing`);
      if (!noCleanupFlag) {
        run('docker', ['compose', '-f', COMPOSE_FILE, 'down', '-v'], {
          cwd: SANDBOX_DIR,
          env: composeEnv(licenseKey),
        });
      }
      process.exit(1);
    }
    logOk('provisioner OK — secrets written.');
  }

  // Step 3: load the secrets file and construct the client.
  logStep('Build N8nClient from the provisioned API key');
  const secrets = JSON.parse(readFileSync(SECRETS_PATH, 'utf8')) as {
    baseUrl: string;
    apiKey: string;
  };
  let client: N8nClient;
  try {
    client = new N8nClient({ baseUrl: secrets.baseUrl, apiKey: secrets.apiKey });
  } catch (err) {
    clack.cancel(`Failed to construct N8nClient: ${err instanceof Error ? err.message : String(err)}`);
    if (!noBoot && !noCleanupFlag) {
      run('docker', ['compose', '-f', COMPOSE_FILE, 'down', '-v'], {
        cwd: SANDBOX_DIR,
        env: composeEnv(licenseKey),
      });
    }
    process.exit(1);
  }
  logOk(`client ready (baseUrl=${secrets.baseUrl})`);

  // Step 4: run the sweep.
  logStep('Hitting every endpoint through @egose/n8n-client');
  const entries = await runSweep(client);

  // Step 5: best-effort cleanup of created resources.
  logStep('Cleanup created resources (best-effort)');
  await cleanup(client, entries);

  // Step 6: write the report.
  logStep(`Write report to ${OUTPUT_PATH}`);
  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl: secrets.baseUrl,
    endpointCount: entries.length,
    okCount: entries.filter((e) => e.status !== null && e.status >= 200 && e.status < 300).length,
    errCount: entries.filter((e) => e.status === null || e.status >= 400).length,
    entries,
  };
  writeFileSync(OUTPUT_PATH, JSON.stringify(report, null, 2) + '\n', 'utf8');
  logOk(`${entries.length} entries written.`);

  // Step 7: tear down the stack unless the user opted out.
  if (!noBoot && !noCleanupFlag) {
    logStep('Teardown the stack');
    const down = run('docker', ['compose', '-f', COMPOSE_FILE, 'down', '-v'], {
      cwd: SANDBOX_DIR,
      env: composeEnv(licenseKey),
    });
    if (down.code !== 0) {
      logWarn(`docker compose down returned ${down.code} — containers may still be running.`);
    } else {
      logOk('stack stopped.');
    }
  } else if (noCleanupFlag) {
    logInfo('NO_CLEANUP=1 — leaving the stack running.');
  }

  const summary = `${report.okCount}/${report.endpointCount} ok, ${report.errCount} errors`;
  clack.outro(`Sweep complete — ${summary}\nReport: ${OUTPUT_PATH}`);
}

void main();
