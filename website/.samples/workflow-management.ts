import N8nClient from '@egose/n8n-client';

const client = new N8nClient({
  baseUrl: process.env.N8N_BASE_URL || 'http://localhost:5678',
  apiKey: process.env.N8N_API_KEY,
});

// ─── Create a Workflow ──────────────────────────────────────────────────────

const workflow = await client.workflow().create({
  name: 'Data Processing Pipeline',
  nodes: [
    {
      name: 'Start',
      type: 'n8n-nodes-base.start',
      position: [250, 300],
      parameters: {},
    },
    {
      name: 'HTTP Request',
      type: 'n8n-nodes-base.httpRequest',
      position: [450, 300],
      parameters: {
        url: 'https://api.example.com/data',
        method: 'GET',
      },
    },
  ],
  connections: {
    Start: { main: [[{ node: 'HTTP Request', type: 'main', index: 0 }]] },
  },
  settings: { executionOrder: 'v1' },
});
console.log(`Created workflow: ${workflow.id}`);

// ─── List Workflows with Filters ────────────────────────────────────────────

// List only active workflows
const { data: active } = await client.workflow().list({ active: true });
console.log(`Active workflows: ${active.length}`);

// List workflows by name
const { data: named } = await client.workflow().list({ name: 'Data Processing' });
console.log(`Matching workflows: ${named.length}`);

// Paginate through results
let cursor: string | undefined;
let allWorkflows: typeof active = [];
do {
  const page = await client.workflow().list({ limit: 25, cursor });
  allWorkflows = allWorkflows.concat(page.data);
  cursor = page.nextCursor;
} while (cursor);
console.log(`Total workflows: ${allWorkflows.length}`);

// ─── Activate & Deactivate ─────────────────────────────────────────────────

await client.workflow().activate(workflow.id);
console.log('Workflow activated');

await client.workflow().deactivate(workflow.id);
console.log('Workflow deactivated');

// ─── Archive & Unarchive ────────────────────────────────────────────────────

await client.workflow().archive(workflow.id);
console.log('Workflow archived');

await client.workflow().unarchive(workflow.id);
console.log('Workflow unarchived');

// ─── Version History ────────────────────────────────────────────────────────

const updated = await client.workflow().update(workflow.id, {
  name: 'Data Processing Pipeline v2',
});

const version = await client.workflow().getVersion(workflow.id, updated.versionId);
console.log(`Version: ${version.versionId}, Authors: ${version.authors}`);

// ─── Tags ───────────────────────────────────────────────────────────────────

const prodTag = await client.tag().create({ name: 'production' });
const dataTag = await client.tag().create({ name: 'data-pipeline' });

await client.workflow().updateTags(workflow.id, [{ id: prodTag.id }, { id: dataTag.id }]);

const tags = await client.workflow().getTags(workflow.id);
console.log(`Tags: ${tags.map((t) => t.name).join(', ')}`);

// ─── Transfer to Another Project ────────────────────────────────────────────

await client.workflow().transfer(workflow.id, 'target-project-id');
console.log('Workflow transferred');

// ─── Delete ─────────────────────────────────────────────────────────────────

const deleted = await client.workflow().delete(workflow.id);
console.log(`Deleted workflow: ${deleted.id}`);
