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
import {
  getSweepFailureDefinition,
  getSweepProbeDefinition,
  PRIVILEGE_MATRIX,
  type SweepAuthProfile,
  type SweepFailureClassification,
} from './api-sweep-catalog.ts';

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
  /** Which API-key profile executed the probe. */
  authProfile: SweepAuthProfile;
  /** HTTP status code when known, else null. */
  status: number | null;
  /** Response payload (parsed JSON; array, object, or primitive). */
  payload: unknown;
  /** Declared probe setup requirements for interpreting failures. */
  preconditions: string[];
  /** Failure classification for non-2xx probes. */
  classification?: SweepFailureClassification;
  /** Error message when the call threw. Set together with `status` when the
   *  client re-threw an HttpError carrying both pieces. */
  error?: string;
  /** Wall-clock duration in milliseconds. */
  durationMs: number;
};

type SweepSecrets = {
  baseUrl: string;
  apiKey?: string;
  authProfiles?: Partial<
    Record<SweepAuthProfile, { apiKey: string; authMode: string; role: string; requestedScopes?: string[] }>
  >;
  provisioning?: {
    licenseActivationRequested?: boolean;
    apiKeyScopesSource?: string;
    apiKeyScopesStatus?: number | null;
    restrictedScopeCount?: number;
  };
  server?: {
    version?: string | null;
    settingsStatus?: number | null;
    licenseInfoStatus?: number | null;
    licensePlanName?: string | null;
    licenseFeatureKeys?: string[];
  };
};

function buildFailureMetadata(op: string) {
  const failure = getSweepFailureDefinition(op);
  return {
    classification: failure.classification,
  } satisfies Pick<SweepEntry, 'classification'>;
}

async function capture(op: string, authProfile: SweepAuthProfile, fn: () => Promise<unknown>): Promise<SweepEntry> {
  const start = Date.now();
  const preconditions = getSweepProbeDefinition(op).preconditions;
  try {
    const result = await fn();
    return {
      op,
      authProfile,
      status: 200,
      payload: normalizeForJson(result),
      preconditions,
      durationMs: Date.now() - start,
    };
  } catch (err) {
    if (err instanceof HttpError) {
      return {
        op,
        authProfile,
        status: err.status,
        payload: normalizeForJson(err.data),
        preconditions,
        ...buildFailureMetadata(op),
        error: err.message,
        durationMs: Date.now() - start,
      };
    }
    // Non-HTTP error (constructor validation, network failure, type error,
    // etc.). Capture the message verbatim.
    const message = err instanceof Error ? err.message : String(err);
    return {
      op,
      authProfile,
      status: null,
      payload: null,
      preconditions,
      ...buildFailureMetadata(op),
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
type SweepResourceIds = {
  workflowId?: string;
};

async function runSweep(
  client: N8nClient,
  authProfile: SweepAuthProfile = 'owner',
): Promise<{ entries: SweepEntry[]; resourceIds: SweepResourceIds }> {
  const entries: SweepEntry[] = [];

  // ---- Workflows -----------------------------------------------------------
  const wfCreated = await capture('workflows.create', authProfile, () => client.workflows().create(WORKFLOW_CREATE));
  entries.push(wfCreated);
  const wfId = pickId(wfCreated.payload);

  entries.push(await capture('workflows.list', authProfile, () => client.workflows().list({})));
  if (wfId) {
    entries.push(await capture('workflows.get', authProfile, () => client.workflows().get(wfId)));
    entries.push(
      await capture('workflows.update', authProfile, () => client.workflows().update(wfId, { ...WORKFLOW_UPDATE })),
    );
    entries.push(await capture('workflows.activate', authProfile, () => client.workflows().activate(wfId)));
    entries.push(await capture('workflows.deactivate', authProfile, () => client.workflows().deactivate(wfId)));
    entries.push(await capture('workflows.archive', authProfile, () => client.workflows().archive(wfId)));
    entries.push(await capture('workflows.unarchive', authProfile, () => client.workflows().unarchive(wfId)));
    entries.push(await capture('workflows.getTags', authProfile, () => client.workflows().getTags(wfId)));
    entries.push(await capture('workflows.updateTags', authProfile, () => client.workflows().updateTags(wfId, [])));
    // getVersion requires a real version id we don't have — feed '1' so we capture
    // either the body or the 404 from n8n.
    entries.push(await capture('workflows.getVersion', authProfile, () => client.workflows().getVersion(wfId, '1')));
    entries.push(await capture('workflows.listTestRuns', authProfile, () => client.workflows().listTestRuns(wfId)));
  }

  // ---- Executions ----------------------------------------------------------
  // Note: executions.get / retry / stop / delete / getTags / updateTags all
  // require an existing execution id; we don't trigger one in the sweep, so
  // each call below will hit the 404 path. The sweep still records the actual
  // API response (status + body) so coverage stays complete.
  entries.push(await capture('executions.list', authProfile, () => client.executions().list({})));
  entries.push(await capture('executions.get', authProfile, () => client.executions().get(1)));
  entries.push(await capture('executions.getTags', authProfile, () => client.executions().getTags(1)));
  entries.push(await capture('executions.updateTags', authProfile, () => client.executions().updateTags(1, [])));
  entries.push(await capture('executions.retry', authProfile, () => client.executions().retry(1)));
  entries.push(await capture('executions.stop', authProfile, () => client.executions().stop(1)));
  entries.push(await capture('executions.delete', authProfile, () => client.executions().delete(1)));
  entries.push(
    await capture('executions.stopMany', authProfile, () =>
      client.executions().stopMany({
        status: ['queued', 'running', 'waiting'],
      } satisfies StopManyExecutionsRequest),
    ),
  );

  // ---- Credentials ---------------------------------------------------------
  const credCreated = await capture('credentials.create', authProfile, () =>
    client.credentials().create(CREDENTIAL_CREATE),
  );
  entries.push(credCreated);
  const credId = pickId(credCreated.payload);

  entries.push(await capture('credentials.list', authProfile, () => client.credentials().list({})));
  if (credId) {
    entries.push(await capture('credentials.get', authProfile, () => client.credentials().get(credId)));
    entries.push(
      await capture('credentials.update', authProfile, () =>
        client.credentials().update(credId, { name: 'api-sweep-credential-renamed' }),
      ),
    );
    entries.push(await capture('credentials.test', authProfile, () => client.credentials().test(credId)));
    entries.push(
      await capture('credentials.transfer', authProfile, () => client.credentials().transfer(credId, 'n8n-personal')),
    );
  }
  entries.push(
    await capture('credentials.getSchema', authProfile, () => client.credentials().getSchema('httpHeaderAuth')),
  );

  // ---- Tags ----------------------------------------------------------------
  const tagCreated = await capture('tags.create', authProfile, () => client.tags().create(TAG_CREATE));
  entries.push(tagCreated);
  const tagId = pickId(tagCreated.payload);

  entries.push(await capture('tags.list', authProfile, () => client.tags().list({})));
  if (tagId) {
    entries.push(await capture('tags.get', authProfile, () => client.tags().get(tagId)));
    entries.push(await capture('tags.update', authProfile, () => client.tags().update(tagId, TAG_CREATE)));
  }

  // ---- Users ---------------------------------------------------------------
  entries.push(await capture('users.list', authProfile, () => client.users().list({})));
  const usersListEntry = entries.find((e) => e.op === 'users.list');
  const usersList = usersListEntry?.payload as { data?: Array<{ id: string }> } | undefined;
  const ownerId = usersList?.data?.[0]?.id;
  if (ownerId) {
    entries.push(await capture('users.get', authProfile, () => client.users().get(ownerId)));
    // changeRole on the owner: will likely 400 — we record the response.
    entries.push(await capture('users.changeRole', authProfile, () => client.users().changeRole(ownerId, 'member')));
  }
  // users.create takes an array
  entries.push(await capture('users.create', authProfile, () => client.users().create(USER_CREATE)));

  // ---- Variables -----------------------------------------------------------
  const varCreated = await capture('variables.create', authProfile, () => client.variables().create(VARIABLE_CREATE));
  entries.push(varCreated);
  // variables.create returns void on success, so we can't pick the id from
  // the payload. Fall back to listing then looking up by key.
  const varList = await capture('variables.list', authProfile, () => client.variables().list({}));
  entries.push(varList);
  const varId = pickVariableId(varList.payload, 'API_SWEEP_VAR');
  if (varId) {
    // variables.get uses paginated search
    entries.push(await capture('variables.get', authProfile, () => client.variables().get(varId)));
    entries.push(
      await capture('variables.update', authProfile, () => client.variables().update(varId, VARIABLE_UPDATE)),
    );
  }

  // ---- Projects ------------------------------------------------------------
  const projCreated = await capture('projects.create', authProfile, () => client.projects().create(PROJECT_CREATE));
  entries.push(projCreated);
  const projId = pickId(projCreated.payload);

  entries.push(await capture('projects.list', authProfile, () => client.projects().list({})));
  if (projId) {
    entries.push(await capture('projects.update', authProfile, () => client.projects().update(projId, PROJECT_CREATE)));
    // ProjectClient has no `get(id)` — exercise `listMembers` instead.
    entries.push(await capture('projects.listMembers', authProfile, () => client.projects().listMembers(projId)));
    // addMembers then removeMember — sweep needs a user id; reuse ownerId if present.
    if (ownerId) {
      const memberRelation: ProjectMemberRelation = {
        userId: ownerId,
        role: 'project:editor',
      };
      entries.push(
        await capture('projects.addMembers', authProfile, () => client.projects().addMembers(projId, [memberRelation])),
      );
      entries.push(
        await capture('projects.changeMemberRole', authProfile, () =>
          client.projects().changeMemberRole(projId, ownerId, 'project:viewer'),
        ),
      );
      entries.push(
        await capture('projects.removeMember', authProfile, () => client.projects().removeMember(projId, ownerId)),
      );
    }
  }

  // ---- Folders (project-scoped) --------------------------------------------
  if (projId) {
    const folders = client.folders(projId);
    const folderCreated = await capture('folders.create', authProfile, () => folders.create(FOLDER_CREATE));
    entries.push(folderCreated);
    const folderId = pickId(folderCreated.payload);

    entries.push(await capture('folders.list', authProfile, () => folders.list({})));
    if (folderId) {
      entries.push(await capture('folders.get', authProfile, () => folders.get(folderId)));
      entries.push(await capture('folders.update', authProfile, () => folders.update(folderId, FOLDER_UPDATE)));
    }
  }

  // ---- Data tables ---------------------------------------------------------
  const dtCreated = await capture('dataTables.create', authProfile, () =>
    client.dataTables().create({
      ...DATA_TABLE_CREATE,
      ...(projId ? { projectId: projId } : {}),
    }),
  );
  entries.push(dtCreated);
  const dtId = pickId(dtCreated.payload);

  entries.push(await capture('dataTables.list', authProfile, () => client.dataTables().list({})));
  if (dtId) {
    entries.push(await capture('dataTables.get', authProfile, () => client.dataTables().get(dtId)));
    entries.push(
      await capture('dataTables.update', authProfile, () => client.dataTables().update(dtId, DATA_TABLE_UPDATE)),
    );

    // Rows — insert, list, upsert, update, delete, clear
    const inserted = await capture('dataTables.insertRows', authProfile, () =>
      client.dataTables().insertRows(dtId, {
        data: [
          { name: 'alpha', count: 1 },
          { name: 'beta', count: 2 },
        ],
        returnType: 'all',
      }),
    );
    entries.push(inserted);

    entries.push(await capture('dataTables.listRows', authProfile, () => client.dataTables().listRows(dtId)));

    const upsertPayload: UpsertRowBooleanRequest = {
      filter: {
        type: 'and',
        filters: [{ columnName: 'name', condition: 'eq', value: 'alpha' }],
      },
      data: { name: 'alpha', count: 1 },
      returnData: false,
    };
    entries.push(
      await capture('dataTables.upsertRow', authProfile, () => client.dataTables().upsertRow(dtId, upsertPayload)),
    );
    const updatePayload: UpdateRowsBooleanRequest = {
      filter: {
        type: 'and',
        filters: [{ columnName: 'name', condition: 'eq', value: 'beta' }],
      },
      data: { count: 3 },
      returnData: false,
    };
    entries.push(
      await capture('dataTables.updateRows', authProfile, () => client.dataTables().updateRows(dtId, updatePayload)),
    );
    const deleteRowsPayload: DeleteRowsBooleanParams = {
      filter: {
        type: 'and',
        filters: [{ columnName: 'name', condition: 'eq', value: 'unused-name' }],
      },
      returnData: false,
    };
    entries.push(
      await capture('dataTables.deleteRows', authProfile, () =>
        client.dataTables().deleteRows(dtId, deleteRowsPayload),
      ),
    );
    entries.push(await capture('dataTables.clearRows', authProfile, () => client.dataTables().clearRows(dtId)));

    // Columns
    const colCreated = await capture('dataTables.createColumn', authProfile, () =>
      client.dataTables().createColumn(dtId, COLUMN_CREATE),
    );
    entries.push(colCreated);
    entries.push(await capture('dataTables.listColumns', authProfile, () => client.dataTables().listColumns(dtId)));
    const colId = pickId(colCreated.payload);
    if (colId) {
      entries.push(
        await capture('dataTables.updateColumn', authProfile, () =>
          client.dataTables().updateColumn(dtId, colId, { name: 'flag-renamed' }),
        ),
      );
      entries.push(
        await capture('dataTables.deleteColumn', authProfile, () => client.dataTables().deleteColumn(dtId, colId)),
      );
    }
  }

  // ---- Community packages --------------------------------------------------
  entries.push(await capture('communityPackages.list', authProfile, () => client.communityPackages().list()));
  // install: actually pulls from npm — too invasive for a sweep. Skip and
  // exercise only the read path. If the user opts in later we can add it.
  // update / uninstall need a name; we don't install anything here.

  // ---- Singletons ----------------------------------------------------------
  entries.push(await capture('audit.generate', authProfile, () => client.audit().generate({})));
  entries.push(await capture('insights.getSummary', authProfile, () => client.insights().getSummary({})));
  entries.push(await capture('sourceControl.pull', authProfile, () => client.sourceControl().pull({})));
  entries.push(await capture('securityPolicy.get', authProfile, () => client.securityPolicy().get()));
  entries.push(
    await capture('securityPolicy.update', authProfile, () =>
      client.securityPolicy().update(SECURITY_POLICY_UPDATE_BASE),
    ),
  );
  entries.push(await capture('discover.get', authProfile, () => client.discover().get()));

  // ---- Packages (export+import) --------------------------------------------
  // Export with an empty workflowIds list produces an empty package without
  // needing any workflow resource to exist on the server.
  entries.push(await capture('n8nPackage.exportWorkflows', authProfile, () => client.n8nPackage().exportWorkflows({})));
  // importPackage needs a real file; we don't have one to feed. Skip the import
  // call so it doesn't error on a missing file — that failure isn't a server-
  // side response anyway.
  return { entries, resourceIds: { workflowId: wfId } };
}

async function runRestrictedSweep(client: N8nClient, resourceIds: SweepResourceIds): Promise<SweepEntry[]> {
  const entries: SweepEntry[] = [];

  entries.push(await capture('discover.get', 'restricted', () => client.discover().get()));
  entries.push(await capture('workflows.list', 'restricted', () => client.workflows().list({})));
  if (resourceIds.workflowId) {
    entries.push(await capture('workflows.get', 'restricted', () => client.workflows().get(resourceIds.workflowId!)));
    entries.push(
      await capture('workflows.getTags', 'restricted', () => client.workflows().getTags(resourceIds.workflowId!)),
    );
    entries.push(
      await capture('workflows.listTestRuns', 'restricted', () =>
        client.workflows().listTestRuns(resourceIds.workflowId!),
      ),
    );
  }
  entries.push(await capture('executions.list', 'restricted', () => client.executions().list({})));
  entries.push(await capture('tags.list', 'restricted', () => client.tags().list({})));
  entries.push(await capture('users.list', 'restricted', () => client.users().list({})));
  entries.push(await capture('variables.list', 'restricted', () => client.variables().list({})));
  entries.push(await capture('projects.list', 'restricted', () => client.projects().list({})));
  entries.push(await capture('dataTables.list', 'restricted', () => client.dataTables().list({})));
  entries.push(await capture('communityPackages.list', 'restricted', () => client.communityPackages().list()));

  return entries;
}

function resolveAuthProfiles(
  secrets: SweepSecrets,
): Record<
  SweepAuthProfile,
  { client: N8nClient; role: string; authMode: string; requestedScopes?: string[] } | undefined
> {
  const ownerProfile =
    secrets.authProfiles?.owner ??
    (secrets.apiKey ? { apiKey: secrets.apiKey, authMode: 'apiKey', role: 'legacy owner API key' } : undefined);
  const restrictedProfile = secrets.authProfiles?.restricted;

  return {
    owner: ownerProfile
      ? {
          client: new N8nClient({ baseUrl: secrets.baseUrl, apiKey: ownerProfile.apiKey }),
          role: ownerProfile.role,
          authMode: ownerProfile.authMode,
          requestedScopes: ownerProfile.requestedScopes,
        }
      : undefined,
    restricted: restrictedProfile
      ? {
          client: new N8nClient({ baseUrl: secrets.baseUrl, apiKey: restrictedProfile.apiKey }),
          role: restrictedProfile.role,
          authMode: restrictedProfile.authMode,
          requestedScopes: restrictedProfile.requestedScopes,
        }
      : undefined,
  };
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

  // Step 3: load the secrets file and construct the clients.
  logStep('Build N8nClient from the provisioned API keys');
  const secrets = JSON.parse(readFileSync(SECRETS_PATH, 'utf8')) as SweepSecrets;
  let authProfiles: ReturnType<typeof resolveAuthProfiles> | undefined;
  try {
    authProfiles = resolveAuthProfiles(secrets);
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
  const ownerClient = authProfiles?.owner?.client;
  if (!ownerClient) {
    clack.cancel(`Provisioned secrets at ${SECRETS_PATH} did not contain an owner API key profile.`);
    process.exit(1);
  }
  logOk(`clients ready (baseUrl=${secrets.baseUrl})`);

  // Step 4: run the sweep.
  logStep('Hitting every endpoint through @egose/n8n-client');
  const ownerSweep = await runSweep(ownerClient, 'owner');
  const entries = [...ownerSweep.entries];
  if (authProfiles?.restricted?.client) {
    entries.push(...(await runRestrictedSweep(authProfiles.restricted.client, ownerSweep.resourceIds)));
  }

  // Step 5: best-effort cleanup of created resources.
  logStep('Cleanup created resources (best-effort)');
  await cleanup(ownerClient, entries);

  // Step 6: write the report.
  logStep(`Write report to ${OUTPUT_PATH}`);
  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl: secrets.baseUrl,
    context: {
      n8nVersion: secrets.server?.version ?? null,
      authProfiles: Object.entries(authProfiles ?? {})
        .filter(([, profile]) => profile !== undefined)
        .map(([name, profile]) => ({
          name,
          authMode: profile!.authMode,
          role: profile!.role,
          scopeCount: profile!.requestedScopes?.length ?? null,
        })),
      privilegeMatrix: PRIVILEGE_MATRIX,
      featureState: {
        licenseActivationRequested: secrets.provisioning?.licenseActivationRequested ?? null,
        apiKeyScopesSource: secrets.provisioning?.apiKeyScopesSource ?? null,
        apiKeyScopesStatus: secrets.provisioning?.apiKeyScopesStatus ?? null,
        restrictedScopeCount: secrets.provisioning?.restrictedScopeCount ?? null,
        settingsStatus: secrets.server?.settingsStatus ?? null,
        licenseInfoStatus: secrets.server?.licenseInfoStatus ?? null,
        licensePlanName: secrets.server?.licensePlanName ?? null,
        licenseFeatureKeys: secrets.server?.licenseFeatureKeys ?? [],
      },
    },
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
