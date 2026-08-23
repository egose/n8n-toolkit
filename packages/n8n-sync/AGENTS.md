# AGENTS.md — Coding Agent Reference

Package: `@egose/n8n-sync`
Purpose: n8n external-hook bundles that sync credentials and workflows between n8n instances.

## Quick Start

Build two self-contained CJS hook bundles and point n8n's `EXTERNAL_HOOK_FILES` at them:

- `dist/publisher.cjs` — source instance; lifecycle hooks fan sync events out to every target in `SYNC_SUBSCRIBER_URLS`
- `dist/subscriber.cjs` — target instance; mounts `POST /rest/sync/v1/events` plus `GET …/health` and `GET …/ready` on n8n's own server in the `n8n.ready` hook and applies events via n8n's internal repositories

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

- **Per-entity preparation order** (`publisher/hooks.ts`): async hook preparation and emission are serialized per source entity from hook entry, so a blocked workflow/credential/execution lookup cannot let a later same-entity archive/delete/update allocate and emit first. Unrelated entities prepare concurrently. Dropped preparations emit no event and consume no revision, but they release the same-entity chain.
- **Per-target serialized queue** (`publisher/sender.ts`): events for a given target are delivered one at a time in emitted hook order; a slow target never delays others. Hooks only enqueue (fire-and-forget) so n8n stays responsive.
- **The queue is still in-memory** — undelivered events are lost on restart, but every emitted event now carries a durable `eventId` and monotonic per-entity `entityRevision`, persisted with the explicit `SYNC_SOURCE_ID` by the publisher under `SYNC_PUBLISHER_STATE_PATH`.
- **Subscriber ordering is durable** (`subscriber/order-state.ts`): the last applied revision for each `(sourceId, entity)` is persisted under `SYNC_SUBSCRIBER_STATE_PATH`, including delete tombstones, so stale upserts / archives / deletes are rejected after restart. Format `2` stores keys as JSON tuples `[sourceId, entityKind, entityId]`; format `1` subscriber state is refused with backup/reset/resync guidance because its colon-separated keys are ambiguous.
- **Current persistence is file-backed**: JSON state writes are atomic per file only; they are not atomic with n8n database mutations or other JSON files, and they do not make multi-process subscriber or publisher topologies safe. Keep docs explicit about these residual crash windows until STATE-01/IDENTITY-02/EXECUTION-01 are implemented and Docker-verified.
- **Auth is dual-mode** (`SYNC_AUTH_MODE`, default `hmac`): per-request HMAC-SHA256 of `<timestamp>.<rawBody>` (replay-protected, re-signed per retry attempt) or static `x-sync-token` bearer. In hmac mode the subscriber rejects an exact replay of the same signed request from a process-local in-memory cache after success and while an identical request is in flight. `SYNC_REPLAY_CACHE_SIZE` bounds completed entries; in-flight entries are transient and are not evicted before completion/release. Parse, validation, and application failures release the replay reservation so the exact request can be retried. Subscriber authenticates exact raw bytes from n8n's global `rawBodyReader` (`req.rawBody`) when available, otherwise from the unread request stream, and fails closed if only a pre-parsed body remains. If `req.rawBody` and `req.body` both exist, HMAC mode parses and applies `req.rawBody` and ignores the pre-parsed object.

### Entry pattern

- Entry files end with `export = createHookConfig()` — n8n loads hook files via `require()` and expects the hook map directly (`IExternalHooksFileData`).
- `tsconfig.json` uses `module: CommonJS` because `export =` does not typecheck under ESM targets; tsup bundles to CJS regardless.
- Entries are thin wiring only. Logic lives in testable factories (`publisher/hooks.ts`, `publisher/sender.ts`, `subscriber/hooks.ts`, `subscriber/applier.ts`, `subscriber/routes.ts`) with injectable dependencies — do not import the entry files from tests.

### tsup

- Two entries (`publisher`, `subscriber`), `format: ['cjs']`, `splitting: false` → one fully self-contained `.cjs` file per entry (shared code is duplicated into each bundle).
- `dts: false` — the bundles are hook scripts, not importable libraries.
- **No runtime dependencies.** Publisher uses global `fetch`; subscriber registers routes directly on `server.app` (express is a type-only devDep) and reads request bodies with a zero-dep stream reader. n8n internals are lazy-`require()`d by absolute path at runtime (`N8N_DI_PATH`/`N8N_DB_PATH` env, defaults match the official docker image).

### Supported runtime matrix

- Pinned supported n8n runtime version: current `2.31.2`.
- `src/subscriber/n8n-runtime.ts` owns the runtime adapter and version matrix; keep startup validation and contract tests aligned there.
- `pnpm test:integration` at repo root runs the Docker-backed sync suite across the pinned matrix unless `N8N_VERSION` overrides a single version for debugging.

## Conventions

- All `process.env` access lives in `src/shared/config.ts` — nowhere else.
- n8n payload types (`IWorkflowBase`, `ICredentialsDb`, `N8nServer`) are local minimal copies in `src/shared/types.ts`; this package must stay free of n8n dependencies.
- The wire format is the `SyncEvent` discriminated union in `src/shared/types.ts`; every event now includes `eventId` and `entityRevision`. Validate inbound payloads with `parseSyncEvent` (`src/shared/validate.ts`).
- Logger is the zero-dep structured JSON logger in `src/shared/logger.ts` (`createLogger(module)`); keep it dependency-free.
- Hook handlers must never throw on the publisher side (a rejecting hook propagates to n8n users — e.g. cancels workflow activation).

## Wired hooks

`credentials.create/update/delete`, `workflow.afterCreate/afterUpdate/afterDelete`, `workflow.activate`, `workflow.afterArchive/afterUnarchive`, and `workflow.postExecute` (opt-in — see `SYNC_ENTITIES`).
Deliberately not wired: `workflow.preExecute` (fires per execution with no execution-summary counterpart on the subscriber), `workflow.create/update/delete` pre-hooks (redundant with after-hooks).

### `SYNC_ENTITIES` gating

All `process.env.SYNC_ENTITIES` access lives in `src/shared/config.ts` as a `ReadonlySet<'workflows' | 'credentials' | 'executions'>`. When the env var is absent or blank it defaults to `workflows,credentials` (legacy behavior — executions are off). Explicit invalid names fail startup instead of silently falling back. Both sides gate on it:

- **Publisher** (`publisher/hooks.ts` + `publisher/index.ts`): when an entity is disabled, the corresponding hook handler is **not wired at all** (key absent from the returned hook map), so n8n pays zero fan-out overhead for it. E.g. with the default value the publisher emits no execution events — `workflow.postExecute` is re-registered only when `SYNC_ENTITIES` includes `executions`.
- **Subscriber** (`subscriber/applier.ts` + `subscriber/index.ts`): `buildN8nSyncRepositories` skips disabled workflow, credential, and execution repository services where the selected entity set does not require them. The applier enforces the allowed set before ordering inspection or repository access; valid events for disabled families return non-retryable HTTP `422` with `{ "error": "sync entity disabled", "code": "SYNC_ENTITY_DISABLED", "entity": "workflows" | "credentials" | "executions" }`.

## Key Gotchas

- **No deactivation hook exists in n8n** — `deactivateWorkflow` only emits an internal event. Deactivations do not sync; document this, do not try to work around it with polling.
- **`workflow.activate` fires before commit** — the applier treats it as an upsert so state converges on the next event.
- **Credential `data` sync is encrypted-string-only** — publish and accept only the stored encrypted blob. Drop or reject object-form payloads rather than assuming repository `save()` will encrypt them. All instances must share `N8N_ENCRYPTION_KEY`. Never attempt to decrypt it.
- **Credential create publication is id-only** — on the pinned n8n `2.31.2` contract used by this repo's example images, publish immediately when the hook payload includes `credential.id` and `data`, or briefly retry `dbCollections.Credentials.findOne({ where: { id } })` when only the stable id is available. Never fall back to `{name, type}`; payloads without `id` must be logged and dropped to avoid cross-publishing another credential.
- **`SYNC_TARGET_PROJECT_ID` (default empty)** — when set, newly created workflows/credentials are linked to that project on a best-effort basis. When empty, the applier falls back to the target instance owner's personal project (resolved lazily via `UserRepository` + `ProjectRepository.getPersonalProjectForUser`, cached for the process lifetime including the negative case). Owner-link failures are logged but are not currently retryable or transactional with the entity mutation. An explicit `SYNC_TARGET_PROJECT_ID` always wins.
- **`SYNC_APPLY_ACTIVE_STATE` (default false)** — writing `active`/`activeVersionId` to the target DB does not register triggers with the target's active workflow manager.
- **Repository access** happens only inside the `n8n.ready` hook, where n8n's DI `Container` is initialized. Resolving it earlier crashes.
- Deletes/archives for unknown IDs are no-ops (`update`/`delete` on missing rows) — sync is eventually consistent by design.
- **Mutation ordering is two-layered.** After subscriber entity selection accepts the event family, the subscriber enforces source-scoped `entityRevision` ordering (durable across restart, including delete tombstones), then the upsert paths use the row timestamp guard (`updatedAt` for workflows/credentials, `stoppedAt` for executions). After revision ordering accepts a newer event, equal timestamps may update the row; older timestamps are rejected without advancing the checkpoint. A valid event for a disabled family returns `422 SYNC_ENTITY_DISABLED` before ordering/repository/identity access. A distinct `eventId` that reuses an already-applied `entityRevision` returns `409 SYNC_REVISION_CONFLICT`; the entity and checkpoint stay unchanged. Treat both as non-retryable protocol/configuration failures, not retryable subscriber failures.
- **Publisher source identity is explicit and source-bound.** When `SYNC_SUBSCRIBER_URLS` enables delivery, `SYNC_SOURCE_ID` must be non-blank and no longer than the subscriber's 512-character ID limit. Publisher state format `3` stores that `sourceId` with JSON tuple entity keys; legacy publisher formats `1` and `2` migrate to format `3` using the configured source ID. A later configured/stored mismatch fails startup with source-rotation guidance instead of silently changing identity. The file-backed publisher allocator also creates a best-effort `.lock` next to `SYNC_PUBLISHER_STATE_PATH` and rejects another live process using the same path; remove only verified stale lock files after stopping duplicate publishers.
- **Source ownership enforcement is not complete.** IDENTITY-01 selected multi-source aggregation with source-bound credentials, target-generated workflow/credential IDs, and durable ownership mappings, but production workflow/credential writes still use source-provided target IDs until IDENTITY-02 lands. Do not document native-row or cross-source collision safety as implemented.
- **Execution payloads are intentionally minimal** — the publisher's `workflow.postExecute` handler maps only the scalar lifecycle columns exposed by that hook (`id`, `workflowId`, `status`, `mode`, `finished`, `startedAt`, `stoppedAt`) and a best-effort `workflowSnapshot`. Per-step `fullRunData` is dropped to keep payloads small; the target gains an `execution_entity` row but not the `execution_data` blob. Subscriber-side reads via the Public API will see the summary but not the run detail.
- **StartedAt / createdAt are immutable post-insert** on `execution_entity` — the applier mirrors n8n's own `updateExistingExecution` semantics and drops them from update payloads.
- **HMAC verification needs exact raw bytes** — authenticate before JSON parsing, then parse and apply those same bytes. Use `req.rawBody` (n8n sets this globally) or the unread stream. Do not verify against a re-serialized `req.body`; in hmac mode that path must fail closed, and any divergent pre-parsed `req.body` must be ignored. Token mode may still reuse `req.body` after token verification.
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
pnpm test        # vitest unit tests
npx tsc --noEmit -p tsconfig.json         # typecheck src
npx tsc --noEmit -p tsconfig.tests.json   # typecheck src + tests
npx tsc --noEmit -p tsconfig.contract-tests.json # typecheck compile-only contract fixtures
pnpm pack:verify # materialize release metadata, pack, inspect, CJS-consume, verify publish metadata
```

Release metadata is materialized by `scripts/materialize-release-metadata.mjs` from the repo-root `VERSION` and root package metadata before packing. The release workflow must run `pnpm --filter @egose/n8n-sync build` and `pnpm --filter @egose/n8n-sync pack:verify` before publication.

Smoke-check bundle shape after building:

```bash
node -e "const h=require('./dist/publisher.cjs'); console.log(Object.keys(h))"
# → [ 'credentials', 'workflow' ]                   (default SYNC_ENTITIES)
# SYNC_ENTITIES=workflows,credentials,executions → [ 'credentials', 'workflow' ]
# SYNC_ENTITIES=executions                       → startup error            (`executions` requires `workflows`)
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
    auth.ts       — HMAC sign/verify + exact-request replay cache + bearer token check + SyncAuthMode dispatcher
    ordering.ts   — entity key derivation, decimal revision helpers, per-file atomic JSON persistence helpers
    validate.ts   — parseSyncEvent payload guard
  publisher/
    hooks.ts      — createPublisherHooks(deps) → IExternalHooksFileData (gates per-resource on SYNC_ENTITIES; respects SYNC_FILTER_BY_TAG; stamps eventId/entityRevision)
    order-state.ts— durable publisher counter store for source-scoped event identity and per-entity revisions
    sender.ts     — createEventSender: per-target serialized delivery queue (fire-and-forget + drain)
    index.ts      — wires one sender per SYNC_SUBSCRIBER_URLS entry, fan-out emit; reads filterByTag/syncWorkflowTag/activeTag from config; export =
  subscriber/
    hooks.ts      — createSubscriberHooks(deps) → n8n.ready
    n8n-runtime.ts— lazy require of @n8n/di + @n8n/db repositories (disabled entity-family repositories are not resolved where possible)
    applier.ts    — createApplier(repos, opts): idempotent upsert/delete/archive/execution-upsert with durable per-source/entity ordering before the row timestamp guard
    order-state.ts— durable subscriber ordering/tombstone store keyed by `(sourceId, entity)`
    execution-identity.ts — file-backed source-execution to target-execution mapping, derived from `SYNC_SUBSCRIBER_STATE_PATH`
    routes.ts     — createSyncRouteHandler (readiness → auth → validate → apply) + mountSyncRoutes (events + health + ready)
    index.ts      — wires ready handler; export =
tests/            — vitest unit tests (factories only, never entry files)
```
