import N8nClient from '@egose/n8n-client';

const client = new N8nClient({
  baseUrl: process.env.N8N_BASE_URL || 'http://localhost:5678',
  apiKey: process.env.N8N_API_KEY,
});

// ─── Create Credentials ─────────────────────────────────────────────────────

const apiKeyCred = await client.credential().create({
  name: 'Service API Key',
  type: 'httpHeaderAuth',
  data: {
    headerName: 'X-API-Key',
    headerValue: 'my-secret-key',
  },
});
console.log(`Created API key credential: ${apiKeyCred.id}`);

const dbCred = await client.credential().create({
  name: 'PostgreSQL Connection',
  type: 'postgresDb',
  data: {
    host: 'localhost',
    port: 5432,
    database: 'mydb',
    user: 'admin',
    password: 'secret', // pragma: allowlist secret
  },
  projectId: 'proj-123',
});
console.log(`Created DB credential: ${dbCred.id}`);

// ─── List Credentials ───────────────────────────────────────────────────────

const { data: credentials } = await client.credential().list({ limit: 20 });
console.log(`Total credentials: ${credentials.length}`);

// ─── Test Credentials ───────────────────────────────────────────────────────

const testResult = await client.credential().test(apiKeyCred.id);
if (testResult.success) {
  console.log('API key credential is valid');
} else {
  console.log(`Credential test failed: ${testResult.message}`);
}

// ─── Update Credentials ─────────────────────────────────────────────────────

const updated = await client.credential().update(apiKeyCred.id, {
  name: 'Production API Key',
  data: {
    headerName: 'X-API-Key',
    headerValue: 'production-secret-key',
  },
});
console.log(`Updated credential: ${updated.name}`);

// ─── Get Credential Schema ──────────────────────────────────────────────────

const schema = await client.credential().getSchema('httpHeaderAuth');
console.log('HTTP Header Auth schema:', Object.keys(schema));

// ─── Transfer Credential ────────────────────────────────────────────────────

await client.credential().transfer(dbCred.id, 'target-project-id');
console.log('Credential transferred to another project');

// ─── Delete Credential ──────────────────────────────────────────────────────

const deleted = await client.credential().delete(apiKeyCred.id);
console.log(`Deleted credential: ${deleted.id}`);
