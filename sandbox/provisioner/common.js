'use strict';

const fs = require('node:fs');
const path = require('node:path');

// Conservative fallback for older n8n versions that may not expose
// GET /rest/api-keys/scopes. Newer versions should use the server-returned,
// role-validated scope list instead.
const FALLBACK_OWNER_API_KEY_SCOPES = [
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

function createLogger(prefix) {
  return (msg, extra) => {
    console.log(`[${prefix}] ${msg}`, extra ?? '');
  };
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

async function waitForHealth(baseUrl, options) {
  const { timeoutMs, pollIntervalMs, log } = options;
  const url = `${baseUrl}/healthz/readiness`;
  const deadline = Date.now() + timeoutMs;
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
    await sleep(pollIntervalMs);
  }

  throw new Error(`${baseUrl} did not become ready within ${timeoutMs}ms (last: ${lastErr})`);
}

async function authenticate(baseUrl, cookieJar, options) {
  const { ownerEmail, ownerFirstName, ownerLastName, ownerPassword, log } = options;
  const cookieHeader = () =>
    Object.entries(cookieJar)
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');

  const login = async () => {
    log(`logging in as ${ownerEmail} on ${baseUrl}`);
    const res = await http('POST', `${baseUrl}/rest/login`, {
      body: { emailOrLdapLoginId: ownerEmail, password: ownerPassword },
      cookieJar,
    });
    if (res.status !== 200) {
      throw new Error(`login failed: ${res.status} ${res.text}`);
    }
    log(`login ok on ${baseUrl}`);
  };

  log(`setting up owner on ${baseUrl}`);
  const setupRes = await http('POST', `${baseUrl}/rest/owner/setup`, {
    body: {
      email: ownerEmail,
      firstName: ownerFirstName,
      lastName: ownerLastName,
      password: ownerPassword,
    },
    cookieJar,
    headers: cookieHeader() ? { cookie: cookieHeader() } : undefined,
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

async function activateLicense(baseUrl, cookieJar, activationKey, options) {
  const { log } = options;
  if (!activationKey) {
    log('N8N_LICENSE_ACTIVATION_KEY is empty — skipping license activation');
    return;
  }

  log(`activating Enterprise license on ${baseUrl}`);
  const res = await sendWithCookie('POST', `${baseUrl}/rest/license/activate`, cookieJar, {
    activationKey,
  });
  if (res.status === 200) {
    log(`license activated on ${baseUrl}`);
    return;
  }

  // Surface the failure but don't abort — the sweep can still run and record
  // the license-gated 403s.
  log(`license activation returned ${res.status}: ${res.text}`);
}

async function findApiKeyByLabel(baseUrl, cookieJar, label) {
  const res = await sendWithCookie('GET', `${baseUrl}/rest/api-keys`, cookieJar);
  if (res.status !== 200) return null;

  const dataField = res.json?.data ?? res.json;
  const list = Array.isArray(dataField) ? dataField : (dataField?.items ?? []);
  return list.find((k) => k.label === label) ?? null;
}

async function getAllowedApiKeyScopes(baseUrl, cookieJar, options = {}) {
  const { log = () => {}, fallbackScopes = FALLBACK_OWNER_API_KEY_SCOPES } = options;
  const res = await sendWithCookie('GET', `${baseUrl}/rest/api-keys/scopes`, cookieJar);
  if (res.status !== 200) {
    log(`api-keys/scopes returned ${res.status}; falling back to bundled owner scope list`);
    return fallbackScopes;
  }

  const scopes = res.json?.data ?? res.json;
  if (!Array.isArray(scopes) || scopes.length === 0) {
    log('api-keys/scopes returned an empty or invalid payload; falling back to bundled owner scope list');
    return fallbackScopes;
  }

  log(`resolved ${scopes.length} allowed API key scopes from ${baseUrl}`);
  return scopes;
}

async function provisionApiKey(baseUrl, cookieJar, options) {
  const { label, log, fallbackScopes = FALLBACK_OWNER_API_KEY_SCOPES } = options;

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

  const scopes = await getAllowedApiKeyScopes(baseUrl, cookieJar, { log, fallbackScopes });

  log(`creating API key "${label}" on ${baseUrl}`);
  const expiresAt = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;
  const res = await sendWithCookie('POST', `${baseUrl}/rest/api-keys`, cookieJar, {
    label,
    scopes,
    expiresAt,
  });
  if (res.status !== 200 && res.status !== 201) {
    throw new Error(`api-keys create failed: ${res.status} ${res.text}`);
  }

  const body = res.json?.data ?? res.json;
  const key = body?.rawApiKey ?? body?.apiKey;
  if (!key) throw new Error(`api-keys response missing rawApiKey: ${res.text}`);
  log(`api key created on ${baseUrl}`);
  return key;
}

async function writeJsonFile(outPath, payload, options = {}) {
  const { log = () => {} } = options;
  await fs.promises.mkdir(path.dirname(outPath), { recursive: true });
  await fs.promises.writeFile(outPath, JSON.stringify(payload, null, 2) + '\n', 'utf8');
  log(`wrote ${outPath}`);
}

module.exports = {
  FALLBACK_OWNER_API_KEY_SCOPES,
  activateLicense,
  authenticate,
  createLogger,
  findApiKeyByLabel,
  getAllowedApiKeyScopes,
  http,
  provisionApiKey,
  sendWithCookie,
  sleep,
  waitForHealth,
  writeJsonFile,
};
