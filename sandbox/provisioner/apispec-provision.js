#!/usr/bin/env node
/**
 * API-sweep provisioner — brings a single n8n instance into a callable state.
 *
 * Flow:
 *   1. GET /healthz/readiness               → wait until n8n is ready
 *   2. POST /rest/owner/setup               → set the auth cookie (or login)
 *   3. POST /rest/license/activate          → activate Enterprise license
 *      (only when N8N_LICENSE_ACTIVATION_KEY is non-empty; skipped otherwise
 *      so the sweep can still run against an unlicensed community instance and
 *      record 403s for license-gated endpoints)
 *   4. POST /rest/api-keys {label, scopes}  → returns rawApiKey
 *   5. write { baseUrl, apiKey } to /secrets/apispec-key.json
 *
 * Usage: node apispec-provision.js <output-json-path>
 */

'use strict';

const {
  activateLicense,
  authenticate,
  createLogger,
  provisionApiKey,
  waitForHealth,
  writeJsonFile,
} = require('./common.js');

const TIMEOUT_MS = Number(process.env.PROVISION_TIMEOUT_MS ?? 180_000);
const POLL_INTERVAL_MS = 1500;

const N8N_URL = process.env.N8N_URL ?? 'http://n8n:5678';
const N8N_PUBLISHED_URL = process.env.N8N_PUBLISHED_URL ?? `http://localhost:${process.env.N8N_APISPEC_PORT ?? 5690}`;

const OWNER_EMAIL = process.env.OWNER_EMAIL ?? 'owner@example.com';
const OWNER_FIRST_NAME = process.env.OWNER_FIRST_NAME ?? 'Owner';
const OWNER_LAST_NAME = process.env.OWNER_LAST_NAME ?? 'User';
const OWNER_PASSWORD = process.env.OWNER_PASSWORD ?? 'OwnerPassword123!';
const API_KEY_LABEL = process.env.API_KEY_LABEL ?? 'api-sweep';
const LICENSE_ACTIVATION_KEY = process.env.N8N_LICENSE_ACTIVATION_KEY ?? '';

const log = createLogger('apispec-provisioner');

async function main() {
  const outPath = process.argv[2];
  if (!outPath) {
    console.error('Usage: node apispec-provision.js <output-json-path>');
    process.exit(2);
  }

  await waitForHealth(N8N_URL, { timeoutMs: TIMEOUT_MS, pollIntervalMs: POLL_INTERVAL_MS, log });
  const cookieJar = {};
  await authenticate(N8N_URL, cookieJar, {
    ownerEmail: OWNER_EMAIL,
    ownerFirstName: OWNER_FIRST_NAME,
    ownerLastName: OWNER_LAST_NAME,
    ownerPassword: OWNER_PASSWORD,
    log,
  });
  await activateLicense(N8N_URL, cookieJar, LICENSE_ACTIVATION_KEY, { log });
  const apiKey = await provisionApiKey(N8N_URL, cookieJar, { label: API_KEY_LABEL, log });

  const payload = { baseUrl: N8N_PUBLISHED_URL, apiKey };
  await writeJsonFile(outPath, payload, { log });
  console.log(JSON.stringify(payload));
}

main().catch((err) => {
  console.error(`[apispec-provisioner] fatal: ${err?.stack ?? err}`);
  process.exit(1);
});
