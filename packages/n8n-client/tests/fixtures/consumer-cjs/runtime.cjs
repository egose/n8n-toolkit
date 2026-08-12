const assert = require('node:assert/strict');
const packageExports = require('@egose/n8n-client');

assert.equal(typeof packageExports.default, 'function');
assert.equal(typeof packageExports.HttpClient, 'function');
assert.equal(typeof packageExports.WorkflowClient, 'function');
assert.equal(packageExports.SUPPORTED_PUBLIC_API_VERSION, 'v1');

const client = new packageExports.default({
  baseUrl: 'http://localhost:5678',
  apiKey: 'test-api-key', // pragma: allowlist secret
});

assert.ok(client.workflows() instanceof packageExports.WorkflowClient);
