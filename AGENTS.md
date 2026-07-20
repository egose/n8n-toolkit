# AGENTS.md — Coding Agent Reference

This monorepo contains two packages under `packages/`:

| Package             | Purpose                                                                        | Reference                          |
| ------------------- | ------------------------------------------------------------------------------ | ---------------------------------- |
| `@egose/n8n-client` | Typed TypeScript client for the n8n Public API v1.                             | this file + `packages/n8n-client/` |
| `@egose/n8n-sync`   | n8n external-hook bundles to sync credentials and workflows between instances. | `packages/n8n-sync/AGENTS.md`      |

---

Package: `@egose/n8n-client`
Purpose: Typed TypeScript client for the n8n Public API v1.

## Quick Start

```ts
import N8nClient from '@egose/n8n-client';

const client = new N8nClient({
  baseUrl: 'http://localhost:5678',
  apiKey: process.env.N8N_API_KEY, // OR bearerToken, never both
});

// List workflows
const { data, nextCursor } = await client.workflows().list({ limit: 10 });

// Get a bound resource instance
const workflow = await client.workflows().getResource('wf-123');
await workflow.activate();
```

## Architecture

Two-layer design:

1. **Collection clients** (`*Client`) — stateless, return plain DTOs
2. **Resource instances** (`*Resource`) — bound to a single entity, methods update local snapshot

```
N8nClient
  ├── workflows()      → WorkflowClient
  │     ├── list(), get(), create(), update(), delete()
  │     ├── getResource(), listResources(), createResource(), updateResource()
  │     ├── bound resources also support patch() where update() exists
  │     └── activate(), deactivate(), archive(), transfer(), getTags(), ...
  ├── executions()     → ExecutionClient
  ├── credentials()    → CredentialClient
  ├── tags()           → TagClient
  ├── users()          → UserClient
  ├── variables()      → VariableClient
  ├── projects()       → ProjectClient
  │     ├── workflows()     → nested collection (scoped to project)
  │     ├── folders()       → nested collection (scoped to project)
  │     ├── variables()     → nested collection (scoped to project)
  │     ├── dataTables()    → nested collection (scoped to project)
  │     └── executions()    → nested collection (scoped to project)
  ├── dataTables()     → DataTableClient
  ├── folders(projectId) → FolderClient (requires projectId at construction)
  ├── communityPackages() → CommunityPackageClient
  ├── audit()          → AuditClient (singleton)
  ├── insights()       → InsightsClient (singleton)
  ├── sourceControl()  → SourceControlClient (singleton)
  ├── discover()       → DiscoverClient (singleton)
  └── n8nPackage()     → N8nPackageClient (singleton)
```

## Method Naming Convention

- `list()`, `get()`, `create()`, `update()`, `delete()` — return plain API DTOs
- `listResources()`, `getResource()`, `createResource()`, `updateResource()` — return bound `*Resource` instances
- `patch()` on bound resources merges partial fields over the current snapshot before calling the underlying update path
- `patchResource()` exists on project-scoped nested collections where `updateResource()` exists
- Resource instances have methods like `activate()`, `refresh()`, `delete()` that update the local snapshot

## Key Gotchas

### WorkflowUpdate is a full body, not a patch

```ts
// WRONG — missing required fields
await client.workflows().update('wf-1', { name: 'New Name' });

// CORRECT — must include nodes, connections, settings
const current = await client.workflows().get('wf-1');
await client.workflows().update('wf-1', {
  name: 'New Name',
  nodes: current.nodes,
  connections: current.connections,
  settings: current.settings ?? {},
});
```

### VariableClient.get() uses paginated search

There is no `GET /variables/{id}` endpoint. `VariableClient.get()` iterates through all pages to find the variable by ID. On instances with many variables this is O(n) across pages.

### ProjectClient has no get(id) method

The n8n API does not expose `GET /projects/{id}`. Use `list()` to find projects, or work from IDs you already have.

### FolderClient requires projectId at construction

```ts
// folders are project-scoped
const folderClient = client.folders('project-id');
```

### FolderClient.listResources() does not paginate

`listResources()` always returns `nextCursor: undefined`. Use `list()` directly if you need cursor-based pagination.

### Singletons vs Collections

- Collection resources: `workflows()`, `executions()`, `credentials()`, `tags()`, `users()`, `variables()`, `projects()`, `dataTables()`, `communityPackages()`, `folders(projectId)`
- Singleton resources: `audit()`, `insights()`, `sourceControl()`, `discover()`, `n8nPackage()`

### Authentication

Exactly one of `apiKey` or `bearerToken` must be provided. The constructor validates this at construction time and throws if both or neither are given.

### Retry

Transient errors (408, 429, 500, 502, 503, 504) are retried with exponential backoff (1s, 2s, 4s, capped at 10s). Non-transient errors throw `HttpError` immediately.

## Types

All API types are exported from the package. The most commonly needed:

| Type                                                      | Purpose                                                      |
| --------------------------------------------------------- | ------------------------------------------------------------ |
| `N8nClientConfig`                                         | Constructor config (discriminated union for auth)            |
| `Workflow`, `WorkflowCreate`, `WorkflowUpdate`            | Workflow CRUD payloads                                       |
| `WorkflowNode`, `WorkflowConnections`, `WorkflowSettings` | Workflow graph internals                                     |
| `Execution`, `ExecutionStatus`                            | Execution data and status enum                               |
| `Credential`, `CredentialCreate`, `CredentialUpdate`      | Credential CRUD                                              |
| `DataTableFilter`                                         | Row filter for data table operations                         |
| `CreateDataTableRequest`                                  | Data table creation (supports `json` column type)            |
| `ImportPackageOptions`                                    | Package import config (`workflowConflictPolicy` is required) |
| `HttpError`                                               | Error class with `status`, `message`, `data` properties      |
| `PaginationParams`, `PaginatedResponse`                   | Pagination generics                                          |

## Low-Level Access

If a typed method doesn't exist for an endpoint:

```ts
// HTTP helpers
await client.get<T>('/path', query?, headers?);
await client.post<T>('/path', body?, query?, headers?);
await client.put<T>('/path', body?, query?, headers?);
await client.patch<T>('/path', body?, query?, headers?);
await client.delete<T>('/path', query?, headers?);

// Full control
await client.request<T>({ method: 'GET', path: '/path', query: {}, headers: {} });
```

## Running Tests

```bash
pnpm test          # all tests
pnpm typecheck     # type-check src + tests
pnpm build         # compile TypeScript to build/
pnpm bundle        # generate publishable dist/ artifacts + declarations
```

## File Structure

```
src/
  index.ts          — N8nClient root class, exports
  types.ts          — All API TypeScript types (~80+ types)
  http-client.ts    — Fetch-based HTTP client with retry
  pagination.ts     — Cursor-based pagination types
  clients/          — 15 collection client classes
  resources/        — 10 resource instance classes + BaseResource
  utils/retry.ts    — Exponential backoff
tests/
  *.spec.ts         — 20 test files, 253 tests
```
