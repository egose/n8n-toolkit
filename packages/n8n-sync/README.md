# @egose/n8n-sync

Sync n8n credentials and workflows between n8n instances using [n8n external hooks](https://docs.n8n.io/deploy/host-n8n/configure-n8n/external-hooks/).

The package builds two self-contained CommonJS hook bundles:

| Bundle                | Role                                                                                                                         |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `dist/publisher.cjs`  | Runs on the **source** instance. Lifecycle hooks POST sync events to one or more subscribers over HTTPS.                     |
| `dist/subscriber.cjs` | Runs on each **target** instance. Mounts an endpoint on n8n's own server and applies events via n8n's internal repositories. |

## How it works

```
┌──────────────┐   credentials.create/update/delete      ┌──────────────┐
│  source n8n  │   workflow.afterCreate/afterUpdate/…    │  target n8n  │
│              │ ──────────────────────────────────────► │   (1..n)     │
│ publisher.cjs│   POST /rest/sync/v1/events             │subscriber.cjs│
│              │   HMAC-signed or bearer-token auth      │              │
└──────────────┘                                         └──────────────┘
```

- **Fan-out**: the publisher delivers every event to every URL in `SYNC_SUBSCRIBER_URLS`. Each target has its own **serialized delivery queue** — events reach a given target in hook order, and a slow or unreachable target never delays the others.
- **Fire-and-forget hooks**: deliveries run in the background and failures are retried (1s, 2s, 4s, capped at 10s) then logged, so a sync outage cannot break n8n operations. The publisher never throws.
- The subscriber applies events **idempotently with source IDs preserved**, using the target instance's own TypeORM repositories (resolved from n8n's DI container at runtime).
- Credential `data` is passed through **encrypted** — all instances must share the same `N8N_ENCRYPTION_KEY` so targets can decrypt secrets at runtime.

## Authentication

Two schemes are available via `SYNC_AUTH_MODE` (must match on both sides):

| Mode             | Headers                                | Notes                                                                                                                                                                                                           |
| ---------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `hmac` (default) | `x-sync-timestamp`, `x-sync-signature` | Per-request HMAC-SHA256 of `<timestamp>.<rawBody>` keyed with the shared secret. Replay-protected: the subscriber rejects timestamps outside a 5-minute tolerance. Every retry re-signs with a fresh timestamp. |
| `token`          | `x-sync-token`                         | Static shared-secret bearer token. Simpler; use only over TLS.                                                                                                                                                  |

Signature verification uses the exact raw request bytes (read from n8n's global `rawBodyReader` middleware), so it survives n8n's own body parsing.

## Wired hooks

| Source hook                                         | Event                | Entity       |
| --------------------------------------------------- | -------------------- | ------------ |
| `credentials.create` / `credentials.update`         | `credentials.upsert` | credentials  |
| `credentials.delete`                                | `credentials.delete` | credentials  |
| `workflow.afterCreate` / `workflow.afterUpdate`     | `workflow.upsert`    | workflows    |
| `workflow.activate`                                 | `workflow.activate`  | workflows    |
| `workflow.afterDelete`                              | `workflow.delete`    | workflows    |
| `workflow.afterArchive` / `workflow.afterUnarchive` | `workflow.archive`   | workflows    |
| `workflow.postExecute`                              | `execution.upsert`   | executions ★ |

★ `workflow.postExecute` is **opt-in** — see `SYNC_ENTITIES`. It fires per execution (high volume) and the publisher handler is fire-and-forget so it never blocks n8n. The DTO carries only scalar lifecycle columns (`id`, `workflowId`, `status`, `mode`, `finished`, `startedAt`, `stoppedAt`, retry ids, `workflowVersionId`); per-step `fullRunData` is dropped to keep payloads small.

## Setup

Build the bundles (`pnpm --filter @egose/n8n-sync build`), copy them to both instances, and point n8n at the appropriate file via `EXTERNAL_HOOK_FILES`.

### Source instance (publisher)

```bash
export EXTERNAL_HOOK_FILES=/path/to/publisher.cjs
export SYNC_SUBSCRIBER_URLS=https://n8n-target-a.example.com,https://n8n-target-b.example.com
export SYNC_SHARED_SECRET=<shared-secret>
```

### Target instance(s) (subscriber)

```bash
export EXTERNAL_HOOK_FILES=/path/to/subscriber.cjs
export SYNC_SHARED_SECRET=<shared-secret>
# optional:
export SYNC_TARGET_PROJECT_ID=<project-id>   # link synced entities to this project
```

Restart both instances. The subscriber logs `n8n-sync subscriber routes active.` when ready and serves an unauthenticated health probe at `GET /rest/sync/v1/health`.

## Environment variables

### Both sides

| Variable             | Required | Default                 | Description                                                                                                                                                                                                                                                      |
| -------------------- | -------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SYNC_SHARED_SECRET` | yes      | —                       | Shared secret: HMAC key (hmac mode) or bearer token (token mode).                                                                                                                                                                                                |
| `SYNC_AUTH_MODE`     | no       | `hmac`                  | `hmac` \| `token` — must match on publisher and subscriber.                                                                                                                                                                                                      |
| `SYNC_ENTITIES`      | no       | `workflows,credentials` | Comma-separated subset of `workflows`, `credentials`, `executions` to sync. Unknown names are dropped. When `executions` is included, the publisher registers the high-volume `workflow.postExecute` hook and the subscriber resolves the `ExecutionRepository`. |
| `LOG_LEVEL`          | no       | `info`                  | `debug` \| `info` \| `warn` \| `error`.                                                                                                                                                                                                                          |

### Publisher

| Variable               | Required | Default                | Description                                                                               |
| ---------------------- | -------- | ---------------------- | ----------------------------------------------------------------------------------------- |
| `SYNC_SUBSCRIBER_URLS` | yes      | —                      | Comma-separated target base URLs (fan-out). Falls back to `SYNC_SUBSCRIBER_URL` if unset. |
| `SYNC_SUBSCRIBER_URL`  | no       | —                      | Legacy single-target form of `SYNC_SUBSCRIBER_URLS`.                                      |
| `SYNC_SOURCE_ID`       | no       | hostname               | Identifier stamped on every event.                                                        |
| `SYNC_EVENTS_PATH`     | no       | `/rest/sync/v1/events` | Endpoint path on the subscriber.                                                          |
| `SYNC_TIMEOUT_MS`      | no       | `10000`                | Per-attempt HTTP timeout.                                                                 |
| `SYNC_MAX_RETRIES`     | no       | `3`                    | Total delivery attempts per event.                                                        |

### Subscriber

| Variable                      | Required | Default                                                | Description                                                               |
| ----------------------------- | -------- | ------------------------------------------------------ | ------------------------------------------------------------------------- |
| `SYNC_ROUTE_BASE`             | no       | `/rest/sync/v1`                                        | Base path for the mounted routes.                                         |
| `SYNC_TARGET_PROJECT_ID`      | no       | —                                                      | Link newly synced workflows/credentials to this project (`*:owner` role). |
| `SYNC_APPLY_ACTIVE_STATE`     | no       | `false`                                                | Also write `active`/`activeVersionId` (see limitations).                  |
| `SYNC_MAX_BODY_BYTES`         | no       | `16777216`                                             | Request body size cap.                                                    |
| `SYNC_SIGNATURE_TOLERANCE_MS` | no       | `300000`                                               | Max signature age/skew accepted in hmac mode.                             |
| `N8N_DI_PATH`                 | no       | `/usr/local/lib/node_modules/n8n/node_modules/@n8n/di` | Path to n8n's `@n8n/di` module.                                           |
| `N8N_DB_PATH`                 | no       | `/usr/local/lib/node_modules/n8n/node_modules/@n8n/db` | Path to n8n's `@n8n/db` module.                                           |

## Limitations

- **Deactivation does not sync.** n8n fires no external hook on workflow deactivation; the target corrects state on the next update/activate event (or stays active until then).
- **`workflow.activate` fires pre-commit.** If a later hook rejects the activation, the subscriber may briefly hold an uncommitted state; the next event converges it.
- **Active state is DB-only.** With `SYNC_APPLY_ACTIVE_STATE=true`, the target's `active` flag is written to the database, but triggers/webhooks are not registered with the target's active workflow manager until restart or manual toggle. Keep it `false` for passive-standby targets.
- **Execution sync is summary-only.** `SYNC_ENTITIES=…,executions` upserts a row in the target's `execution_entity` table with the source ID and scalar lifecycle columns. The `execution_data` blob (per-step run data and the workflow snapshot at run time) is **not** written; target-side reads via the Public API will see the execution summary but not its run detail.
- **Execution staleness is based on `stoppedAt`.** In-flight executions (`running`, `waiting`, `new`) carry `stoppedAt: null`; for them the last-write-wins guard is skipped so a later delivery can still converge state. Re-deliveries of the same event are no-ops.
- **One-way, last-write-wins.** Sync is directional. Upserts carry the source monotonic timestamp (`updatedAt` for workflows/credentials, `stoppedAt` for executions) and are skipped when the target row is already at or beyond it, so out-of-order or duplicate deliveries cannot regress state. Deletes and archives are applied unconditionally.
- **Credential sync requires a shared `N8N_ENCRYPTION_KEY`** on all instances.
- **The delivery queue is in-memory.** Events queued but not yet delivered when the source instance restarts are lost; state converges on the next event for that entity (or stays divergent until then).

## Development

```bash
pnpm build       # bundle dist/publisher.cjs + dist/subscriber.cjs (single-file CJS)
pnpm test        # unit tests
npx tsc --noEmit -p tsconfig.json         # typecheck src
npx tsc --noEmit -p tsconfig.tests.json   # typecheck src + tests
```
