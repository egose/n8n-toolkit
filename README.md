# n8n client

<p align="center">
  <a href="https://www.npmjs.com/package/@egose/n8n-client"><img alt="npm version" src="https://img.shields.io/npm/v/%40egose%2Fn8n-client" /></a>
  <a href="https://www.npmjs.com/package/@egose/n8n-client"><img alt="npm downloads" src="https://img.shields.io/npm/dm/%40egose%2Fn8n-client" /></a>
  <a href="https://github.com/egose/n8n-client/blob/main/LICENSE"><img alt="license" src="https://img.shields.io/npm/l/%40egose%2Fn8n-client" /></a>
  <a href="https://n8n-client.pages.dev/"><img alt="docs" src="https://img.shields.io/badge/docs-online-blue" /></a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/egose/n8n-client/main/website/static/img/n8n-client-lockup-dark.png" alt="n8n Client" width="640" />
</p>

<p align="center">
  TypeScript client for the n8n Public API with cursor-based pagination and typed resource handles.
</p>

<p align="center">
  <a href="https://n8n-client.pages.dev">Documentation</a>
  ·
  <a href="https://github.com/egose/n8n-client">GitHub</a>
  ·
  <a href="https://www.npmjs.com/package/@egose/n8n-client">npm</a>
</p>

## What It Is

`@egose/n8n-client` provides a TypeScript client for the [n8n Public API](https://docs.n8n.io/api/). Instead of manually constructing HTTP requests and parsing responses, you work through resource handles:

```ts
const client = new N8nClient({ baseUrl: 'http://localhost:5678', apiKey: 'your-api-key' }); // pragma: allowlist secret

const workflows = await client.workflow().list({ limit: 10 });
const workflow = await client.workflow().get('wf-1');
const executions = await client.execution().list({ workflowId: 'wf-1', status: 'success' });
```

## Why Use It

- Typed request/response objects for all n8n API endpoints
- Cursor-based pagination built in
- Automatic retry on transient server errors (5xx, 429, 408)
- Consistent resource handle pattern across all resource types
- Supports both API key and Bearer token authentication

## Installation

Requirements:

- Node.js `>=20`

```bash
npm install @egose/n8n-client
```

## Quick Start

```ts
import N8nClient from '@egose/n8n-client';

const client = new N8nClient({
  baseUrl: 'http://localhost:5678',
  apiKey: 'your-api-key', // or use bearerToken: 'your-jwt' // pragma: allowlist secret
});

// List workflows
const { data: workflows, nextCursor } = await client.workflow().list({ limit: 10 });

// Create a workflow
const workflow = await client.workflow().create({
  name: 'My Workflow',
  nodes: [{ name: 'Start', type: 'n8n-nodes-base.start', position: [250, 300] }],
  connections: {},
});

// Activate it
await client.workflow().activate(workflow.id);

// List executions
const { data: executions } = await client.execution().list({ workflowId: workflow.id });

// Create a credential
const credential = await client.credential().create({
  name: 'My GitHub Token',
  type: 'githubApi',
  data: { accessToken: 'ghp_xxx' },
});

// Test the credential
const testResult = await client.credential().test(credential.id);

// Manage tags
const tag = await client.tag().create({ name: 'production' });
await client.workflow().updateTags(workflow.id, [{ id: tag.id }]);

// Manage projects
const projects = await client.project().list();
await client.project().addMembers(projects.data[0].id, [{ userId: 'user-1', role: 'project:editor' }]);

// Insights
const summary = await client.insights().getSummary({
  startDate: '2024-01-01T00:00:00Z',
  endDate: '2024-01-31T23:59:59Z',
});
```

## Authentication

The n8n API supports two authentication methods:

### API Key

```ts
const client = new N8nClient({
  baseUrl: 'http://localhost:5678',
  apiKey: 'your-n8n-api-key', // pragma: allowlist secret
});
```

### Bearer Token (JWT)

```ts
const client = new N8nClient({
  baseUrl: 'http://localhost:5678',
  bearerToken: 'your-jwt-token',
});
```

## Resource Handles

### Workflow

```ts
const workflowApi = client.workflow();

// List with filters
const { data, nextCursor } = await workflowApi.list({
  limit: 10,
  active: true,
  tags: 'production',
  name: 'deploy',
  projectId: 'proj-1',
});

// CRUD
const workflow = await workflowApi.get('wf-1');
const created = await workflowApi.create({ name: 'New', nodes: [], connections: {} });
const updated = await workflowApi.update('wf-1', { name: 'Updated' });
await workflowApi.delete('wf-1');

// Actions
await workflowApi.activate('wf-1');
await workflowApi.deactivate('wf-1');
await workflowApi.archive('wf-1');
await workflowApi.unarchive('wf-1');
await workflowApi.transfer('wf-1', 'proj-2');

// Tags
const tags = await workflowApi.getTags('wf-1');
await workflowApi.updateTags('wf-1', [{ id: 'tag-1' }]);

// Versioning
const version = await workflowApi.getVersion('wf-1', 'v-1');
```

### Execution

```ts
const executionApi = client.execution();

const { data } = await executionApi.list({ status: 'success', workflowId: 'wf-1' });
const execution = await executionApi.get(1, { includeData: true });
await executionApi.delete(1);
await executionApi.retry(1, { loadWorkflow: true });
await executionApi.stop(1);
await executionApi.stopMany({ status: ['running', 'waiting'] });

const tags = await executionApi.getTags(1);
await executionApi.updateTags(1, [{ id: 'tag-1' }]);
```

### Credential

```ts
const credentialApi = client.credential();

const { data } = await credentialApi.list({ limit: 10 });
const credential = await credentialApi.get('c-1');
const created = await credentialApi.create({
  name: 'GitHub',
  type: 'githubApi',
  data: { accessToken: 'ghp_xxx' },
});
const updated = await credentialApi.update('c-1', { name: 'GitHub Updated' });
await credentialApi.delete('c-1');
await credentialApi.test('c-1');
await credentialApi.transfer('c-1', 'proj-2');
const schema = await credentialApi.getSchema('githubApi');
```

### Tag

```ts
const tagApi = client.tag();

const { data } = await tagApi.list({ limit: 10 });
const tag = await tagApi.get('t-1');
const created = await tagApi.create({ name: 'production' });
const updated = await tagApi.update('t-1', { name: 'prod' });
await tagApi.delete('t-1');
```

### User

```ts
const userApi = client.user();

const { data } = await userApi.list({ limit: 10 });
const user = await userApi.get('u-1');
const created = await userApi.create([{ email: 'alice@example.com', role: 'global:member' }]);
await userApi.delete('u-1');
await userApi.changeRole('u-1', 'global:admin');
```

### Variable

```ts
const variableApi = client.variable();

const { data } = await variableApi.list({ projectId: 'proj-1' });
await variableApi.create({ key: 'MY_VAR', value: 'hello', projectId: 'proj-1' });
await variableApi.update('v-1', { key: 'MY_VAR', value: 'world' });
await variableApi.delete('v-1');
```

### Project

```ts
const projectApi = client.project();

const { data } = await projectApi.list({ limit: 10 });
await projectApi.create({ name: 'New Project' });
await projectApi.update('p-1', { name: 'Updated' });
await projectApi.delete('p-1');

// Members
const members = await projectApi.listMembers('p-1');
await projectApi.addMembers('p-1', [{ userId: 'u-1', role: 'project:viewer' }]);
await projectApi.changeMemberRole('p-1', 'u-1', 'project:editor');
await projectApi.removeMember('p-1', 'u-1');
```

### DataTable

```ts
const dataTableApi = client.dataTable();

const { data } = await dataTableApi.list({ limit: 10 });
const table = await dataTableApi.get('dt-1');
const created = await dataTableApi.create({
  name: 'Users',
  columns: [
    { name: 'email', type: 'string' },
    { name: 'age', type: 'number' },
  ],
});
await dataTableApi.update('dt-1', { name: 'Users Updated' });
await dataTableApi.delete('dt-1');

// Rows
const rows = await dataTableApi.listRows('dt-1', { limit: 25 });
await dataTableApi.insertRows('dt-1', { data: [{ email: 'alice@example.com', age: 30 }] });

// Columns
const columns = await dataTableApi.listColumns('dt-1');
await dataTableApi.createColumn('dt-1', { name: 'active', type: 'boolean' });
await dataTableApi.updateColumn('dt-1', 'col-1', { name: 'is_active' });
await dataTableApi.deleteColumn('dt-1', 'col-1');
```

### Folder

```ts
const folderApi = client.folder('proj-1');

const { data } = await folderApi.list({ take: '10' });
const folder = await folderApi.get('f-1');
const created = await folderApi.create({ name: 'My Folder' });
const updated = await folderApi.update('f-1', { name: 'Renamed' });
await folderApi.delete('f-1', 'f-2'); // transfer contents to f-2
```

### Community Package

```ts
const pkgApi = client.communityPackage();

const packages = await pkgApi.list();
const installed = await pkgApi.install({ name: 'n8n-nodes-foo' });
await pkgApi.update('n8n-nodes-foo', { version: '2.0.0' });
await pkgApi.uninstall('n8n-nodes-foo');
```

### Audit

```ts
const audit = await client.audit().generate({
  additionalOptions: {
    daysAbandonedWorkflow: 30,
    categories: ['credentials', 'nodes'],
  },
});
```

### Insights

```ts
const summary = await client.insights().getSummary({
  startDate: '2024-01-01T00:00:00Z',
  endDate: '2024-01-31T23:59:59Z',
  projectId: 'proj-1',
});
```

### Source Control

```ts
const files = await client.sourceControl().pull({ force: false, autoPublish: 'none' });
```

### Discover

```ts
const capabilities = await client.discover().get({ include: 'schemas' });
```

## Error Handling

```ts
import { HttpError } from '@egose/n8n-client';

try {
  await client.workflow().get('nonexistent');
} catch (error) {
  if (error instanceof HttpError) {
    console.log(error.status); // 404
    console.log(error.message); // "Not Found"
    console.log(error.data); // response body
  }
}
```

Transient errors (408, 429, 5xx) are automatically retried up to 3 times with exponential backoff.

## Main Entry Points

### N8nClient

| Method               | Returns                  | Description                                      |
| -------------------- | ------------------------ | ------------------------------------------------ |
| `workflow()`         | `WorkflowHandle`         | Workflow CRUD + activate/deactivate/archive/tags |
| `execution()`        | `ExecutionHandle`        | Execution list/get/delete/retry/stop/tags        |
| `credential()`       | `CredentialHandle`       | Credential CRUD + test/transfer/schema           |
| `tag()`              | `TagHandle`              | Tag CRUD                                         |
| `user()`             | `UserHandle`             | User list/get/create/delete/changeRole           |
| `variable()`         | `VariableHandle`         | Variable CRUD                                    |
| `project()`          | `ProjectHandle`          | Project CRUD + member management                 |
| `dataTable()`        | `DataTableHandle`        | DataTable CRUD + rows/columns                    |
| `folder(projectId)`  | `FolderHandle`           | Folder CRUD scoped to project                    |
| `communityPackage()` | `CommunityPackageHandle` | Package install/update/uninstall                 |
| `audit()`            | `AuditHandle`            | Generate security audit                          |
| `insights()`         | `InsightsHandle`         | Execution insights summary                       |
| `sourceControl()`    | `SourceControlHandle`    | Git-based source control pull                    |
| `discover()`         | `DiscoverHandle`         | API capability discovery                         |
| `n8nPackage()`       | `N8nPackageHandle`       | Package export/import (beta)                     |

## Documentation

- Site: `https://n8n-client.pages.dev`
- Quick Start: `https://n8n-client.pages.dev/about/quick-start/`
- API Reference: `https://n8n-client.pages.dev/api/`
- n8n API Docs: `https://docs.n8n.io/api/`

## Development

```bash
npm install
npm run build
npm test
```

### Test Layers

- `npm run test:unit` — Runs mocked unit tests in `tests/implementation-*.spec.ts`. These verify the client's HTTP method selection, parameter forwarding, and response handling.
- `npm run test:integration` — Reserved for live integration tests against a running n8n instance.
- `npm test` — Runs the full suite.

## License

Apache-2.0
