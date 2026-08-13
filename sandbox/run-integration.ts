#!/usr/bin/env tsx
/**
 * One-shot orchestrator for the @egose/n8n-sync integration tests.
 *
 *   1. `docker compose up --build` — brings up postgres, n8n1, n8n2, and the
 *      provisioner (which writes owner accounts + API keys to
 *      `sandbox/secrets/api-keys.json`).
 *   2. Wait for the provisioner to finish (it exits 0).
 *   3. Build the workspace packages (so the integration test's
 *      `@egose/n8n-client` alias can find `packages/n8n-client/dist/`).
 *   4. Run the n8n-sync integration tests via vitest.
 *   5. Run typecheck.
 *   6. `docker compose down` — teardown.
 *
 * Usage:
 *   pnpm run test:integration         # from the repo root
 *
 * Env overrides:
 *   TZ                                ignored
 *   COMPOSE_PROFILES                  ignored (no profiles)
 *   NO_CLEANUP=1                      keep the stack running after tests pass (debugging)
 *   N8N_SYNC_INTEGRATION_SECRETS      path to a pre-existing api-keys.json
 *                                     (skip the provisioner only when this env
 *                                     var is explicitly set and the file exists)
 */

import { spawnSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

import { SUPPORTED_N8N_RUNTIME_VERSION_MATRIX } from '../packages/n8n-sync/src/subscriber/n8n-runtime';

const SANDBOX_DIR = resolve(import.meta.dirname, '.');
const COMPOSE_FILE = resolve(SANDBOX_DIR, 'docker-compose.yml');
const SECRETS_PATH = resolve(SANDBOX_DIR, 'secrets/api-keys.json');

const INTEGRATION_SCENARIOS = [
  {
    label: 'workspace-default',
    env: {
      N8N_SYNC_BUNDLE_SOURCE: 'workspace',
      SYNC_FILTER_BY_TAG: 'false',
      SYNC_MAX_QUEUE_SIZE: '1000',
    },
  },
  {
    label: 'packed-filtered',
    env: {
      N8N_SYNC_BUNDLE_SOURCE: 'packed',
      SYNC_FILTER_BY_TAG: 'true',
      SYNC_WORKFLOW_TAG: 'sync',
      SYNC_ACTIVE_TAG: 'active',
      SYNC_MAX_QUEUE_SIZE: '2',
    },
  },
] as const;

type C = {
  cyan: (s: string) => string;
  bold: (s: string) => string;
  dim: (s: string) => string;
  green: (s: string) => string;
  red: (s: string) => string;
};
let supported: C;
try {
  const { default: picocolors } = await import('picocolors');
  supported = picocolors as C;
} catch {
  supported = {
    cyan: (s) => s,
    bold: (s) => s,
    dim: (s) => s,
    green: (s) => s,
    red: (s) => s,
  };
}

function step(label: string) {
  console.log(supported.cyan(supported.bold(`\n▼ ${label}`)));
}

function run(cmd: string, args: string[], opts: { cwd?: string; env?: NodeJS.ProcessEnv } = {}): { code: number } {
  const r = spawnSync(cmd, args, {
    stdio: 'inherit',
    shell: false,
    cwd: opts.cwd,
    env: { ...process.env, ...opts.env },
  });
  return { code: r.status ?? 0 };
}

async function main() {
  const explicitSecretsPath = process.env.N8N_SYNC_INTEGRATION_SECRETS;
  const skipProvisioner = explicitSecretsPath ? existsSync(explicitSecretsPath) : false;
  const noCleanup = process.env.NO_CLEANUP === '1';
  const requestedVersion = process.env.N8N_VERSION;
  const requestedScenario = process.env.N8N_SYNC_INTEGRATION_SCENARIO;
  const versionsToTest = requestedVersion
    ? [{ label: 'override', version: requestedVersion }]
    : [...SUPPORTED_N8N_RUNTIME_VERSION_MATRIX];
  const scenariosToTest = requestedScenario
    ? INTEGRATION_SCENARIOS.filter((scenario) => scenario.label === requestedScenario)
    : [...INTEGRATION_SCENARIOS];

  if (requestedScenario && scenariosToTest.length === 0) {
    console.error(
      supported.red(
        `Unknown N8N_SYNC_INTEGRATION_SCENARIO=${requestedScenario}. ` +
          `Expected one of: ${INTEGRATION_SCENARIOS.map((scenario) => scenario.label).join(', ')}`,
      ),
    );
    process.exit(1);
  }

  if (noCleanup && scenariosToTest.length > 1) {
    console.error(
      supported.red(
        'NO_CLEANUP=1 requires a single integration scenario. ' +
          'Set N8N_SYNC_INTEGRATION_SCENARIO to one scenario label for debugging.',
      ),
    );
    process.exit(1);
  }

  for (const { label, version } of versionsToTest) {
    for (const scenario of scenariosToTest) {
      const dockerEnv = { N8N_VERSION: version, ...scenario.env };

      step(`Bring up the docker-compose stack (${label} n8n ${version}, ${scenario.label})`);
      const upArgs = ['compose', '-f', COMPOSE_FILE, 'up', '--build', '--wait'];
      if (skipProvisioner) {
        console.log(supported.dim('secrets file already present — skipping provisioner service'));
        upArgs.push('--scale', 'provisioner=0');
      }
      const up = run('docker', upArgs, { cwd: SANDBOX_DIR, env: dockerEnv });
      if (up.code !== 0) {
        console.error(supported.red(`docker compose up failed for n8n ${version} (${scenario.label})`));
        process.exit(up.code);
      }

      if (!skipProvisioner) {
        step(`Wait for the provisioner to finish (${label} n8n ${version}, ${scenario.label})`);
        const provisionOk = await waitForProvisionerSuccess();
        if (!provisionOk) {
          console.error(supported.red('provisioner did not exit cleanly — check `docker logs n8tool_provisioner`'));
          if (!noCleanup)
            run('docker', ['compose', '-f', COMPOSE_FILE, 'down', '-v'], { cwd: SANDBOX_DIR, env: dockerEnv });
          process.exit(1);
        }
        if (!existsSync(SECRETS_PATH)) {
          console.error(supported.red(`provisioner exited but ${SECRETS_PATH} is missing`));
          if (!noCleanup)
            run('docker', ['compose', '-f', COMPOSE_FILE, 'down', '-v'], { cwd: SANDBOX_DIR, env: dockerEnv });
          process.exit(1);
        }
        console.log(supported.green('provisioner OK — secrets written.'));
      }

      step(`Build workspace packages (${label} n8n ${version}, ${scenario.label})`);
      const build = run('pnpm', ['-r', '--if-present', 'build'], { cwd: resolve(SANDBOX_DIR, '..') });
      if (build.code !== 0) {
        if (!noCleanup)
          run('docker', ['compose', '-f', COMPOSE_FILE, 'down', '-v'], { cwd: SANDBOX_DIR, env: dockerEnv });
        process.exit(build.code);
      }

      step(`Run @egose/n8n-sync integration tests (${label} n8n ${version}, ${scenario.label})`);
      const test = run('pnpm', ['--filter', '@egose/n8n-sync', 'test:integration'], {
        cwd: resolve(SANDBOX_DIR, '..'),
        env: dockerEnv,
      });
      if (test.code !== 0) {
        if (!noCleanup)
          run('docker', ['compose', '-f', COMPOSE_FILE, 'down', '-v'], { cwd: SANDBOX_DIR, env: dockerEnv });
        process.exit(test.code);
      }

      if (!noCleanup) {
        step(`Teardown the stack (${label} n8n ${version}, ${scenario.label})`);
        run('docker', ['compose', '-f', COMPOSE_FILE, 'down', '-v'], { cwd: SANDBOX_DIR, env: dockerEnv });
      } else {
        console.log(supported.dim(`NO_CLEANUP=1 — leaving the n8n ${version} ${scenario.label} stack running.`));
      }
    }
  }
}

function waitForProvisionerSuccess(timeoutMs = 120_000): Promise<boolean> {
  return new Promise((resolve_) => {
    const deadline = Date.now() + timeoutMs;
    const tick = () => {
      const r = spawnSync(
        'docker',
        ['inspect', '--type=container', '-f', '{{.State.Status}} {{.State.ExitCode}}', 'n8tool_provisioner'],
        {
          encoding: 'utf8',
        },
      );
      const out = r.stdout?.trim() ?? '';
      const [status, exitStr] = out.split(' ');
      if (status === 'exited' || status === 'dead') {
        const code = Number(exitStr);
        resolve_(code === 0);
        return;
      }
      if (Date.now() > deadline) resolve_(false);
      else setTimeout(tick, 1500);
    };
    tick();
  });
}

void main();
