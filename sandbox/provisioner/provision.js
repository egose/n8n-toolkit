#!/usr/bin/env node
/**
 * n8n-sync integration-test provisioner.
 *
 * Brings up the owner account on each fresh n8n instance and provisions a
 * personal Public API key, then writes the keys to a JSON file that the
 * integration tests load.
 *
 * Flow per instance:
 *   1. GET /healthz                            → wait until ready
 *   2. POST /rest/owner/setup                  → sets the auth cookie
 *      (if owner already exists, fall back to POST /rest/login)
 *   3. POST /rest/api-keys {label}             → returns rawApiKey
 *   4. write the key into the output file
 *
 * Usage: node provision.js <output-json-path>
 *
 * Env:
 *   N8N1_URL                       default http://n8n1:5678
 *   N8N2_URL                       default http://n8n2:5678
 *   OWNER_EMAIL / OWNER_FIRST_NAME / OWNER_LAST_NAME / OWNER_PASSWORD
 *   API_KEY_LABEL                  default 'integration-tests'
 *
 * Output JSON shape:
 *   { "n8n1": { "baseUrl": "http://localhost:5678", "apiKey": "..." },
 *     "n8n2": { "baseUrl": "http://localhost:5679", "apiKey": "..." } }
 *
 * The host-side baseUrl ports come from N8N1_PUBLISHED_PORT / N8N2_PUBLISHED_PORT
 * (which must match the compose host port mapping — defaults 5678 / 5679).
 */

'use strict';

const { authenticate, createLogger, provisionApiKey, waitForHealth, writeJsonFile } = require('./common.js');

const TIMEOUT_MS = Number(process.env.PROVISION_TIMEOUT_MS ?? 120_000);
const POLL_INTERVAL_MS = 1500;

const N8N1_URL = process.env.N8N1_URL ?? 'http://n8n1:5678';
const N8N2_URL = process.env.N8N2_URL ?? 'http://n8n2:5678';
const N8N1_PUBLISHED_URL = process.env.N8N1_PUBLISHED_URL ?? `http://localhost:${process.env.N8N1_PORT ?? 5678}`;
const N8N2_PUBLISHED_URL = process.env.N8N2_PUBLISHED_URL ?? `http://localhost:${process.env.N8N2_PORT ?? 5679}`;

const OWNER_EMAIL = process.env.OWNER_EMAIL ?? 'owner@example.com';
const OWNER_FIRST_NAME = process.env.OWNER_FIRST_NAME ?? 'Owner';
const OWNER_LAST_NAME = process.env.OWNER_LAST_NAME ?? 'User';
const OWNER_PASSWORD = process.env.OWNER_PASSWORD ?? 'OwnerPassword123!';
const API_KEY_LABEL = process.env.API_KEY_LABEL ?? 'integration-tests';
const log = createLogger('provisioner');

async function provisionInstance(baseUrl) {
  await waitForHealth(baseUrl, { timeoutMs: TIMEOUT_MS, pollIntervalMs: POLL_INTERVAL_MS, log });
  const cookieJar = {};
  await authenticate(baseUrl, cookieJar, {
    ownerEmail: OWNER_EMAIL,
    ownerFirstName: OWNER_FIRST_NAME,
    ownerLastName: OWNER_LAST_NAME,
    ownerPassword: OWNER_PASSWORD,
    log,
  });
  const apiKey = await provisionApiKey(baseUrl, cookieJar, { label: API_KEY_LABEL, log });
  return apiKey;
}

async function main() {
  const outPath = process.argv[2];
  if (!outPath) {
    console.error('Usage: node provision.js <output-json-path>');
    process.exit(2);
  }

  log('provisioning n8n1', { url: N8N1_URL });
  const n8n1Key = await provisionInstance(N8N1_URL);
  log('provisioning n8n2', { url: N8N2_URL });
  const n8n2Key = await provisionInstance(N8N2_URL);

  const payload = {
    n8n1: { baseUrl: N8N1_PUBLISHED_URL, apiKey: n8n1Key },
    n8n2: { baseUrl: N8N2_PUBLISHED_URL, apiKey: n8n2Key },
  };

  await writeJsonFile(outPath, payload, { log });
  console.log(JSON.stringify(payload)); // surface on stdout for compose logs
}

main().catch((err) => {
  console.error(`[provisioner] fatal: ${err?.stack ?? err}`);
  process.exit(1);
});
