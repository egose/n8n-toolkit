import assert from 'node:assert/strict';
import N8nClient, { HttpClient, WorkflowClient, SUPPORTED_PUBLIC_API_VERSION } from '@egose/n8n-client';

assert.equal(typeof N8nClient, 'function');
assert.equal(typeof HttpClient, 'function');
assert.equal(typeof WorkflowClient, 'function');
assert.equal(SUPPORTED_PUBLIC_API_VERSION, 'v1');

const client = new N8nClient({
  baseUrl: 'http://localhost:5678',
  apiKey: 'test-api-key', // pragma: allowlist secret
});

assert.ok(client.workflows() instanceof WorkflowClient);
