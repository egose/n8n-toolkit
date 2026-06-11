import N8nClient from '@egose/n8n-client';

// Initialize the client
const client = new N8nClient({
  baseUrl: process.env.N8N_BASE_URL || 'http://localhost:5678',
  apiKey: process.env.N8N_API_KEY,
});

// ─── Workflows ──────────────────────────────────────────────────────────────

// List active workflows
const { data: activeWorkflows, nextCursor } = await client.workflow().list({
  limit: 10,
  active: true,
});
console.log(`Found ${activeWorkflows.length} active workflows`);

// Create a new workflow
const workflow = await client.workflow().create({
  name: 'My Automation',
  nodes: [
    {
      name: 'Start',
      type: 'n8n-nodes-base.start',
      position: [250, 300],
      parameters: {},
    },
  ],
  connections: {},
  settings: { executionOrder: 'v1' },
});
console.log(`Created workflow: ${workflow.id}`);

// Activate it
await client.workflow().activate(workflow.id);

// ─── Credentials ────────────────────────────────────────────────────────────

// Create a credential
const credential = await client.credential().create({
  name: 'My API Key',
  type: 'httpHeaderAuth',
  data: {
    headerName: 'Authorization',
    headerValue: 'Bearer secret-token',
  },
});
console.log(`Created credential: ${credential.id}`);

// Test the credential
const testResult = await client.credential().test(credential.id);
console.log(`Credential test: ${testResult.success ? 'passed' : 'failed'}`);

// ─── Projects ───────────────────────────────────────────────────────────────

// Create a project
await client.project().create({ name: 'Production' });

// List projects
const { data: projects } = await client.project().list();
const prod = projects.find((p) => p.name === 'Production');

if (prod) {
  // Add a member
  await client.project().addMembers(prod.id, [{ userId: 'user-id-1', role: 'project:admin' }]);

  // Move workflow to project
  await client.workflow().transfer(workflow.id, prod.id);
}

// ─── Tags ───────────────────────────────────────────────────────────────────

// Create and assign tags
const tag = await client.tag().create({ name: 'production' });
await client.workflow().updateTags(workflow.id, [{ id: tag.id }]);

// ─── Users ──────────────────────────────────────────────────────────────────

// List users
const { data: users } = await client.user().list({ limit: 5 });
console.log(`Users: ${users.map((u) => u.email).join(', ')}`);

// ─── Executions ─────────────────────────────────────────────────────────────

// List recent error executions
const { data: errors } = await client.execution().list({
  status: 'error',
  limit: 5,
});
console.log(`Recent errors: ${errors.length}`);
