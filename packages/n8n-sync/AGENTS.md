# AGENTS.md — Coding Agent Reference

Package: `@egose/n8n-sync`
Purpose: n8n external-hook bundles that sync credentials and workflows between n8n instances.

## Quick Start

Build two self-contained CJS hook bundles and point n8n's `EXTERNAL_HOOK_FILES` at them:

- `dist/publisher.cjs` — source instance; lifecycle hooks fan sync events out to every target in `SYNC_SUBSCRIBER_URLS`
- `dist/subscriber.cjs` — target instance; mounts `POST /rest/sync/v1/events` (+ `GET …/health`) on n8n's own server in the `n8n.ready` hook and applies events via n8n's internal repositories

## Architecture

```
publisher/index.ts  ── export = createPublisherHooks({ emit })
                      emit = fan out to one createEventSender per SYNC_SUBSCRIBER_URLS entry
                      each sender = serialized in-memory queue → sendSyncEvent
                      (fetch POST + retry + HMAC/bearer auth, never throws)
subscriber/index.ts ── export = createSubscriberHooks({ ready })
                      ready: buildN8nSyncRepositories() → createApplier()
                             → createSyncRouteHandler() → mountSyncRoutes()
```

### Delivery semantics

- **Per-target serialized queue** (`publisher/sender.ts`): events for a given target are delivered one at a time in hook order; a slow target never delays others. Hooks only enqueue (fire-and-forget) so n8n stays responsive.
- **The queue is in-memory** — undelivered events are lost on restart; the subscriber's last-write-wins guard converges state on later events.
- **Auth is dual-mode** (`SYNC_AUTH_MODE`, default `hmac`): per-request HMAC-SHA256 of `<timestamp>.<rawBody>` (replay-protected, re-signed per retry attempt) or static `x-sync-token` bearer. Subscriber verifies against exact raw bytes from n8n's global `rawBodyReader` (`req.rawBody`), never a re-serialized body when rawBody is available.

### Entry pattern

- Entry files end with `export = createHookConfig()` — n8n loads hook files via `require()` and expects the hook map directly (`IExternalHooksFileData`).
- `tsconfig.json` uses `module: CommonJS` because `export =` does not typecheck under ESM targets; tsup bundles to CJS regardless.
- Entries are thin wiring only. Logic lives in testable factories (`publisher/hooks.ts`, `publisher/sender.ts`, `subscriber/hooks.ts`, `subscriber/applier.ts`, `subscriber/routes.ts`) with injectable dependencies — do not import the entry files from tests.

### tsup

- Two entries (`publisher`, `subscriber`), `format: ['cjs']`, `splitting: false` → one fully self-contained `.cjs` file per entry (shared code is duplicated into each bundle).
- `dts: false` — the bundles are hook scripts, not importable libraries.
- **No runtime dependencies.** Publisher uses global `fetch`; subscriber registers routes directly on `server.app` (express is a type-only devDep) and reads request bodies with a zero-dep stream reader. n8n internals are lazy-`require()`d by absolute path at runtime (`N8N_DI_PATH`/`N8N_DB_PATH` env, defaults match the official docker image).

## Conventions

- All `process.env` access lives in `src/shared/config.ts` — nowhere else.
- n8n payload types (`IWorkflowBase`, `ICredentialsDb`, `N8nServer`) are local minimal copies in `src/shared/types.ts`; this package must stay free of n8n dependencies.
- The wire format is the `SyncEvent` discriminated union in `src/shared/types.ts`; validate inbound payloads with `parseSyncEvent` (`src/shared/validate.ts`).
- Logger is the zero-dep structured JSON logger in `src/shared/logger.ts` (`createLogger(module)`); keep it dependency-free.
- Hook handlers must never throw on the publisher side (a rejecting hook propagates to n8n users — e.g. cancels workflow activation).

## Wired hooks

`credentials.create/update/delete`, `workflow.afterCreate/afterUpdate/afterDelete`, `workflow.activate`, `workflow.afterArchive/afterUnarchive`, and `workflow.postExecute` (opt-in — see `SYNC_ENTITIES`).
Deliberately not wired: `workflow.preExecute` (fires per execution with no execution-summary counterpart on the subscriber), `workflow.create/update/delete` pre-hooks (redundant with after-hooks).

### `SYNC_ENTITIES` gating

All `process.env.SYNC_ENTITIES` access lives in `src/shared/config.ts` as a `ReadonlySet<'workflows' | 'credentials' | 'executions'>`. Unknown names are dropped; when the env var is empty it defaults to `workflows,credentials` (legacy behavior — executions are off). Both sides gate on it:

- **Publisher** (`publisher/hooks.ts` + `publisher/index.ts`): when an entity is disabled, the corresponding hook handler is **not wired at all** (key absent from the returned hook map), so n8n pays zero fan-out overhead for it. E.g. with the default value the publisher emits no execution events — `workflow.postExecute` is re-registered only when `SYNC_ENTITIES` includes `executions`.
- **Subscriber** (`subscriber/applier.ts` + `subscriber/index.ts`): when `executions` is disabled, `buildN8nSyncRepositories` skips resolving the `ExecutionRepository` entirely (so the symbol can be absent from the loaded `@n8n/db`), and the applier logs + drops any stray `execution.*` events that arrive.

## Key Gotchas

- **No deactivation hook exists in n8n** — `deactivateWorkflow` only emits an internal event. Deactivations do not sync; document this, do not try to work around it with polling.
- **`workflow.activate` fires before commit** — the applier treats it as an upsert so state converges on the next event.
- **Credential `data` is an encrypted blob passthrough** — all instances must share `N8N_ENCRYPTION_KEY`. Never attempt to decrypt it.
- **`SYNC_TARGET_PROJECT_ID` (default empty)** — when set, newly created workflows/credentials are linked to that project. When empty, the applier falls back to the target instance owner's personal project (resolved lazily via `UserRepository` + `ProjectRepository.getPersonalProjectForUser`, cached for the process lifetime including the negative case). The fallback makes synced entities visible through the target's Public API without explicit configuration. An explicit `SYNC_TARGET_PROJECT_ID` always wins.
- **`SYNC_APPLY_ACTIVE_STATE` (default false)** — writing `active`/`activeVersionId` to the target DB does not register triggers with the target's active workflow manager.
- **Repository access** happens only inside the `n8n.ready` hook, where n8n's DI `Container` is initialized. Resolving it earlier crashes.
- Deletes/archives for unknown IDs are no-ops (`update`/`delete` on missing rows) — sync is eventually consistent by design.
- **Upserts are last-write-wins on a monotonic timestamp** (`isStaleEvent` in `applier.ts`) — an incoming upsert is skipped when the stored row's timestamp is at or beyond the incoming one. For workflows/credentials the invariant column is `updatedAt`; for executions it is `stoppedAt` (the moment the run transitioned to a terminal state). This guards out-of-order delivery and makes retry re-deliveries no-ops. Preserve this guard when modifying the applier.
- **Execution payloads are intentionally minimal** — the publisher's `workflow.postExecute` handler maps only the scalar lifecycle columns (`id`, `workflowId`, `status`, `mode`, `finished`, `startedAt`, `stoppedAt`, retry ids, `workflowVersionId`) and a best-effort `workflowSnapshot`. Per-step `fullRunData` is dropped to keep payloads small; the target gains an `execution_entity` row but not the `execution_data` blob. Subscriber-side reads via the Public API will see the summary but not the run detail.
- **StartedAt / createdAt are immutable post-insert** on `execution_entity` — the applier mirrors n8n's own `updateExistingExecution` semantics and drops them from update payloads.
- **HMAC verification needs exact raw bytes** — `readJsonBody` resolves in order: `req.rawBody` (n8n sets this globally) → own stream read → `JSON.stringify(req.body)` fallback. Do not verify against a re-serialized body when rawBody is available.
- **Auth modes do not cross-accept** — a token-mode subscriber rejects hmac-signed requests and vice versa. Both sides must use the same `SYNC_AUTH_MODE`.
- **Tag-based filtering on the source only** — `SYNC_FILTER_BY_TAG` rewrites the publisher's `active` field and may emit `workflow.delete` in place of `workflow.upsert`; the subscriber never sees or honors tag fields. Preserve this asymmetry when modifying either side.

## Tag-based filtering (`SYNC_FILTER_BY_TAG`)

Source-side opt-in: only the publisher inspects tags, the subscriber remains tag-agnostic.

Three env vars live in `src/shared/config.ts`:

| Env var              | Default  | Purpose                                                                                                              |
| -------------------- | -------- | -------------------------------------------------------------------------------------------------------------------- |
| `SYNC_FILTER_BY_TAG` | `false`  | Master switch. When false (default), all workflows/credentials pass through unchanged with no tag inspection.        |
| `SYNC_WORKFLOW_TAG`  | `sync`   | Name of the tag a workflow must carry to be eligible for syncing.                                                    |
| `SYNC_ACTIVE_TAG`    | `active` | When the sync tag is present, presence of this tag rewrites the DTO `active` to `true`; absence rewrites to `false`. |

Behavior when `SYNC_FILTER_BY_TAG=true`:

- **Sync tag missing** → the publisher emits `workflow.delete` for that workflowId (so the target removes it) instead of `workflow.upsert`/`workflow.activate`. This applies to `workflow.afterCreate`, `workflow.afterUpdate`, and `workflow.activate` hooks.
- **Sync tag present, `active` tag missing** → DTO `active` is rewritten to `false`; the real source value is preserved in `meta.active_real`.
- **Sync tag present, `active` tag present** → DTO `active` is rewritten to `true`; the real source value is preserved in `meta.active_real`.
- **Execution events (`workflow.postExecute`)** are also gated by the sync tag — events for workflows that lack the sync tag are dropped (no `workflow.delete` is emitted for executions, the event is simply suppressed).
- **Tag resolution** — the publisher prefers inline `workflowData.tags` from the hook payload; when n8n passes only a workflow id, it falls back to `dbCollections.Workflow.findOne({ where: { id }, relations: ['tags'] })`.

When `SYNC_FILTER_BY_TAG=false` (default): workflows pass through unmodified, the `tags` field is omitted from the DTO, no `meta.active_real` is set, and no tag resolution queries run.

## Running Tests

```bash
pnpm build       # tsup → dist/publisher.cjs + dist/subscriber.cjs
pnpm test        # vitest unit tests (9 files, 140 tests)
npx tsc --noEmit -p tsconfig.json         # typecheck src
npx tsc --noEmit -p tsconfig.tests.json   # typecheck src + tests
```

Smoke-check bundle shape after building:

```bash
node -e "const h=require('./dist/publisher.cjs'); console.log(Object.keys(h))"
# → [ 'credentials', 'workflow' ]                   (default SYNC_ENTITIES)
# SYNC_ENTITIES=workflows,credentials,executions → [ 'credentials', 'workflow' ]
# SYNC_ENTITIES=executions                       → [ 'workflow' ]           (only postExecute wired under workflow)
SYNC_FILTER_BY_TAG=true SYNC_WORKFLOW_TAG=sync SYNC_ACTIVE_TAG=active \
  node -e "const h=require('./dist/publisher.cjs'); console.log(Object.keys(h))"
# → [ 'credentials', 'workflow' ]  (filterByTag/syncWorkflowTag/activeTag surfaced in the startup log line)
```

## File Structure

```
src/
  shared/
    config.ts     — all env vars (SYNC_*, N8N_*_PATH, LOG_LEVEL) + SYNC_ENTITIES ReadonlySet gate + SYNC_FILTER_BY_TAG / SYNC_WORKFLOW_TAG / SYNC_ACTIVE_TAG
    types.ts      — local n8n payload types (IWorkflowBase/ICredentialsDb/IRunPayload + IWorkflowTag) + SyncEvent envelope union + SyncExecutionDto
    logger.ts     — zero-dep structured JSON logger
    mappers.ts    — IWorkflowBase/ICredentialsDb/IRun → JSON DTOs (Date → ISO); mapWorkflow accepts { tags?, rewriteActive?, rewriteActiveTo? }
    http.ts       — fetch POST with backoff retry, timeout, per-attempt auth headers
    body.ts       — zero-dep request-body reader preserving raw bytes (rawBody → stream → re-serialize)
    auth.ts       — HMAC sign/verify + bearer token check + SyncAuthMode dispatcher
    validate.ts   — parseSyncEvent payload guard
  publisher/
    hooks.ts      — createPublisherHooks(deps) → IExternalHooksFileData (gates per-resource on SYNC_ENTITIES; respects SYNC_FILTER_BY_TAG)
    sender.ts     — createEventSender: per-target serialized delivery queue (fire-and-forget + drain)
    index.ts      — wires one sender per SYNC_SUBSCRIBER_URLS entry, fan-out emit; reads filterByTag/syncWorkflowTag/activeTag from config; export =
  subscriber/
    hooks.ts      — createSubscriberHooks(deps) → n8n.ready
    n8n-runtime.ts— lazy require of @n8n/di + @n8n/db repositories (ExecutionRepository resolved only when SYNC_ENTITIES includes executions)
    applier.ts    — createApplier(repos, opts): idempotent upsert/delete/archive/execution-upsert, last-write-wins on updatedAt / stoppedAt
    routes.ts     — createSyncRouteHandler (auth → validate → apply) + mountSyncRoutes (events + health)
    index.ts      — wires ready handler; export =
tests/            — vitest unit tests (factories only, never entry files)
```
