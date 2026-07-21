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

const fs = require('node:fs');
const path = require('node:path');

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

/**
 * Scopes to attach to the provisioned API key. n8n validates that the scope
 * set is a subset of those allowed for the user's role (see
 * `@n8n/permissions`'s `OWNER_API_KEY_SCOPES`). We replicate the owner scope
 * list verbatim so the key can call every Public API endpoint the tests use.
 *
 * Must be non-empty — n8n's schema rejects an empty `scopes` array.
 */
const OWNER_API_KEY_SCOPES = [
  'user:read',
  'user:list',
  'user:create',
  'user:changeRole',
  'user:delete',
  'sourceControl:pull',
  'securityAudit:generate',
  'project:create',
  'project:update',
  'project:delete',
  'project:list',
  'project:export',
  'variable:create',
  'variable:delete',
  'variable:list',
  'variable:update',
  'tag:create',
  'tag:read',
  'tag:update',
  'tag:delete',
  'tag:list',
  'workflowTags:update',
  'workflowTags:list',
  'executionTags:update',
  'executionTags:list',
  'workflow:create',
  'workflow:read',
  'workflow:update',
  'workflow:delete',
  'workflow:export',
  'workflow:import',
  'workflow:list',
  'workflow:move',
  'workflow:activate',
  'workflow:deactivate',
  'execution:delete',
  'execution:read',
  'execution:retry',
  'execution:stop',
  'execution:list',
  'testRun:read',
  'testRun:list',
  'credential:create',
  'credential:update',
  'credential:move',
  'credential:delete',
  'credential:list',
  'dataTable:create',
  'dataTable:read',
  'dataTable:update',
  'dataTable:delete',
  'dataTable:list',
  'dataTableRow:create',
  'dataTableRow:read',
  'dataTableRow:update',
  'dataTableRow:delete',
  'dataTableRow:upsert',
  'dataTableColumn:create',
  'dataTableColumn:read',
  'dataTableColumn:update',
  'dataTableColumn:delete',
  'folder:create',
  'folder:delete',
  'folder:read',
  'folder:update',
  'folder:list',
  'insights:read',
];

function log(msg, extra) {
  console.log(`[provisioner] ${msg}`, extra ?? '');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Minimal fetch wrapper that captures Set-Cookie and reuses cookies. */
async function http(method, url, { body, headers, cookieJar } = {}) {
  const finalHeaders = { ...(headers ?? {}) };
  let rawBody;
  if (body !== undefined) {
    rawBody = JSON.stringify(body);
    finalHeaders['content-type'] = 'application/json';
  }
  const res = await fetch(url, {
    method,
    headers: finalHeaders,
    body: rawBody,
    redirect: 'manual',
  });
  if (cookieJar) {
    const setCookie = res.headers.getSetCookie?.() ?? [];
    for (const c of setCookie) {
      const [pair] = c.split(';');
      const [k, v] = pair.split('=');
      if (k && v !== undefined) cookieJar[k.trim()] = v;
    }
  }
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : undefined;
  } catch {
    json = undefined;
  }
  return { status: res.status, headers: res.headers, text, json };
}

async function waitForHealth(baseUrl) {
  // n8n mounts:
  //   GET /healthz              → always 200 once the process is up (NOT readiness)
  //   GET /healthz/readiness    → 200 only after DB connected AND migrated
  //                              AND `fullyReady`. 503 otherwise.
  // Calling /rest/* before readiness returns "n8n is starting up. Please wait"
  // for *everything* (including authenticated routes), so we MUST wait for
  // readiness, not just liveness.
  const url = `${baseUrl}/healthz/readiness`;
  const deadline = Date.now() + TIMEOUT_MS;
  let lastErr;
  while (Date.now() < deadline) {
    try {
      const res = await http('GET', url);
      if (res.status === 200) {
        log(`${baseUrl} ready (status 200)`);
        return true;
      }
      lastErr = `status ${res.status}`;
    } catch (e) {
      lastErr = e.message;
    }
    await sleep(POLL_INTERVAL_MS);
  }
  throw new Error(`${baseUrl} did not become ready within ${TIMEOUT_MS}ms (last: ${lastErr})`);
}

function authenticate(baseUrl, cookieJar) {
  const login = async () => {
    log(`logging in as ${OWNER_EMAIL} on ${baseUrl}`);
    const res = await http('POST', `${baseUrl}/rest/login`, {
      body: { emailOrLdapLoginId: OWNER_EMAIL, password: OWNER_PASSWORD },
      cookieJar,
    });
    if (res.status !== 200) {
      throw new Error(`login failed: ${res.status} ${res.text}`);
    }
    log(`login ok on ${baseUrl}`);
  };

  return async () => {
    const cookieHeader = Object.entries(cookieJar)
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
    log(`setting up owner on ${baseUrl}`);
    const setupRes = await http('POST', `${baseUrl}/rest/owner/setup`, {
      body: {
        email: OWNER_EMAIL,
        firstName: OWNER_FIRST_NAME,
        lastName: OWNER_LAST_NAME,
        password: OWNER_PASSWORD,
      },
      cookieJar,
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
    });

    if (setupRes.status === 200) {
      log(`owner setup ok on ${baseUrl}`);
      return;
    }
    if (setupRes.status === 400 && /already setup/i.test(setupRes.text)) {
      log(`owner already set up on ${baseUrl}, falling back to login`);
      await login();
      return;
    }
    // Some n8n versions return 401 if owner already exists. Try login either way.
    log(`owner/setup returned ${setupRes.status}, trying login`);
    await login();
  };
}

async function sendWithCookie(method, url, cookieJar, body) {
  const cookieHeader = Object.entries(cookieJar)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
  return http(method, url, {
    body,
    cookieJar,
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
  });
}

async function findApiKeyByLabel(baseUrl, cookieJar, label) {
  const res = await sendWithCookie('GET', `${baseUrl}/rest/api-keys`, cookieJar);
  if (res.status !== 200) return null;
  // n8n wraps responses in { data: ... }; the list endpoint wraps further with
  // { data: { items: [...] } }.
  const dataField = res.json?.data ?? res.json;
  const list = Array.isArray(dataField) ? dataField : (dataField?.items ?? []);
  return list.find((k) => k.label === label) ?? null;
}

async function provisionApiKey(baseUrl, cookieJar, label) {
  // If an entry with this label already exists (e.g. provisioner re-run),
  // rotate it to get a fresh rawApiKey since the list endpoint only returns
  // a redacted apiKey. Otherwise create a new one.
  const existing = await findApiKeyByLabel(baseUrl, cookieJar, label);
  if (existing?.id) {
    log(`rotating existing API key "${label}" (id=${existing.id}) on ${baseUrl}`);
    const res = await sendWithCookie('POST', `${baseUrl}/rest/api-keys/${existing.id}/rotate`, cookieJar);
    if (res.status !== 200 && res.status !== 201) {
      throw new Error(`api-keys rotate failed: ${res.status} ${res.text}`);
    }
    const body = res.json?.data ?? res.json;
    const key = body?.rawApiKey ?? body?.apiKey;
    if (!key) throw new Error(`api-keys rotate response missing rawApiKey: ${res.text}`);
    log(`api key rotated on ${baseUrl}`);
    return key;
  }

  log(`creating API key "${label}" on ${baseUrl}`);
  const expiresAt = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60; // +1y, unix seconds
  const res = await sendWithCookie('POST', `${baseUrl}/rest/api-keys`, cookieJar, {
    label,
    scopes: OWNER_API_KEY_SCOPES,
    expiresAt,
  });
  if (res.status !== 200 && res.status !== 201) {
    throw new Error(`api-keys create failed: ${res.status} ${res.text}`);
  }
  // n8n wraps controller responses in { data: ... }.
  const body = res.json?.data ?? res.json;
  const key = body?.rawApiKey ?? body?.apiKey;
  if (!key) throw new Error(`api-keys response missing rawApiKey: ${res.text}`);
  log(`api key created on ${baseUrl}`);
  return key;
}

async function provisionInstance(baseUrl) {
  await waitForHealth(baseUrl);
  const cookieJar = {};
  await authenticate(baseUrl, cookieJar)();
  const apiKey = await provisionApiKey(baseUrl, cookieJar, API_KEY_LABEL);
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

  await fs.promises.mkdir(path.dirname(outPath), { recursive: true });
  await fs.promises.writeFile(outPath, JSON.stringify(payload, null, 2) + '\n', 'utf8');
  log(`wrote ${outPath}`);
  console.log(JSON.stringify(payload)); // surface on stdout for compose logs
}

main().catch((err) => {
  console.error(`[provisioner] fatal: ${err?.stack ?? err}`);
  process.exit(1);
});
