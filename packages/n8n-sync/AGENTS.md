# AGENTS.md — Coding Agent Reference

Package: `@egose/n8n-sync`
Purpose: n8n external-hook bundles that sync credentials and workflows between two n8n instances.

## Quick Start

Build two self-contained CJS hook bundles and point n8n's `EXTERNAL_HOOKS_FILES` at them:

- `dist/publisher.cjs` — source instance; lifecycle hooks POST sync events to the subscriber
- `dist/subscriber.cjs` — target instance; mounts `POST /rest/sync/v1/events` on n8n's own server in the `n8n.ready` hook and applies events via n8n's internal repositories

## Architecture

```
publisher/index.ts  ── export = createPublisherHooks({ emit })
                      emit = sendSyncEvent (fetch POST + retry, never throws)
subscriber/index.ts ── export = createSubscriberHooks({ ready })
                      ready: buildN8nSyncRepositories() → createApplier()
                             → createSyncRouteHandler() → mountSyncRoutes()
```

### Entry pattern

- Entry files end with `export = createHookConfig()` — n8n loads hook files via `require()` and expects the hook map directly (`IExternalHooksFileData`).
- `tsconfig.json` uses `module: CommonJS` because `export =` does not typecheck under ESM targets; tsup bundles to CJS regardless.
- Entries are thin wiring only. Logic lives in testable factories (`publisher/hooks.ts`, `subscriber/hooks.ts`, `subscriber/applier.ts`, `subscriber/routes.ts`) with injectable dependencies — do not import the entry files from tests.

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

`credentials.create/update/delete`, `workflow.afterCreate/afterUpdate/afterDelete`, `workflow.activate`, `workflow.afterArchive/afterUnarchive`.
Deliberately not wired: `workflow.preExecute`/`workflow.postExecute` (fires per execution), `workflow.create/update/delete` pre-hooks (redundant with after-hooks).

## Key Gotchas

- **No deactivation hook exists in n8n** — `deactivateWorkflow` only emits an internal event. Deactivations do not sync; document this, do not try to work around it with polling.
- **`workflow.activate` fires before commit** — the applier treats it as an upsert so state converges on the next event.
- **Credential `data` is an encrypted blob passthrough** — both instances must share `N8N_ENCRYPTION_KEY`. Never attempt to decrypt it.
- **`SYNC_APPLY_ACTIVE_STATE` (default false)** — writing `active`/`activeVersionId` to the target DB does not register triggers with the target's active workflow manager.
- **Repository access** happens only inside the `n8n.ready` hook, where n8n's DI `Container` is initialized. Resolving it earlier crashes.
- Deletes/archives for unknown IDs are no-ops (`update`/`delete` on missing rows) — sync is eventually consistent by design.
- **Upserts are last-write-wins on `updatedAt`** (`isStaleEvent` in `applier.ts`) — an incoming upsert is skipped when the stored row's `updatedAt` is at or beyond the incoming one. This guards out-of-order delivery and makes retry re-deliveries no-ops. Preserve this guard when modifying the applier.

## Running Tests

```bash
pnpm build       # tsup → dist/publisher.cjs + dist/subscriber.cjs
pnpm test        # vitest unit tests (8 files, 63 tests)
npx tsc --noEmit -p tsconfig.json         # typecheck src
npx tsc --noEmit -p tsconfig.tests.json   # typecheck src + tests
```

Smoke-check bundle shape after building:

```bash
node -e "const h=require('./dist/publisher.cjs'); console.log(Object.keys(h))"
# → [ 'credentials', 'workflow' ]
```

## File Structure

```
src/
  shared/
    config.ts     — all env vars (SYNC_*, N8N_*_PATH, LOG_LEVEL)
    types.ts      — local n8n payload types + SyncEvent envelope union
    logger.ts     — zero-dep structured JSON logger
    mappers.ts    — IWorkflowBase/ICredentialsDb → JSON DTOs (Date → ISO)
    http.ts       — publisher sender: fetch POST, backoff retry, timeout
    body.ts       — zero-dep request-body JSON reader (size-capped)
    auth.ts       — x-sync-token constant-time check
    validate.ts   — parseSyncEvent payload guard
  publisher/
    hooks.ts      — createPublisherHooks(deps) → IExternalHooksFileData
    index.ts      — wires emit/sendSyncEvent; export =
  subscriber/
    hooks.ts      — createSubscriberHooks(deps) → n8n.ready
    n8n-runtime.ts— lazy require of @n8n/di + @n8n/db repositories
    applier.ts    — createApplier(repos, opts): idempotent upsert/delete/archive
    routes.ts     — createSyncRouteHandler + mountSyncRoutes
    index.ts      — wires ready handler; export =
tests/            — vitest unit tests (factories only, never entry files)
```
