# @egose/n8n-sync

Sync n8n credentials and workflows between n8n instances using [n8n external hooks](https://docs.n8n.io/deploy/host-n8n/configure-n8n/external-hooks/).

The package builds two self-contained CommonJS hook bundles:

| Bundle                | Role                                                                                                                         |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `dist/publisher.cjs`  | Runs on the **source** instance. Lifecycle hooks POST sync events to one or more subscribers over HTTPS.                     |
| `dist/subscriber.cjs` | Runs on each **target** instance. Mounts an endpoint on n8n's own server and applies events via n8n's internal repositories. |

## Supported n8n versions

The subscriber runtime adapter is pinned and contract-tested against this matrix:

| Channel | Version  |
| ------- | -------- |
| current | `2.31.2` |

The repo-root `pnpm test:integration` command runs the Docker-backed sync suite across that matrix. Set `N8N_VERSION=<tag>` to debug a single pinned version locally.

## How it works

```
┌──────────────┐   credentials.create/update/delete      ┌──────────────┐
│  source n8n  │   workflow.afterCreate/afterUpdate/…    │  target n8n  │
│              │ ──────────────────────────────────────► │   (1..n)     │
│ publisher.cjs│   POST /rest/sync/v1/events             │subscriber.cjs│
│              │   HMAC-signed or bearer-token auth      │              │
└──────────────┘                                         └──────────────┘
```

- **Fan-out**: the publisher delivers every event to every URL in `SYNC_SUBSCRIBER_URLS`. Each target has its own **serialized delivery queue** — events reach a given target in hook order, and a slow or unreachable target never delays the others. Only exact queued duplicates of the same semantic operation are coalesced; mixed operations stay in order.
- **Fire-and-forget hooks**: deliveries run in the background and failures are retried (1s, 2s, 4s, capped at 10s) then logged, so a sync outage cannot break n8n operations. The publisher never throws.
- Every event carries a source-scoped `eventId` plus a monotonic per-entity `entityRevision`. The publisher persists those counters under `SYNC_PUBLISHER_STATE_PATH`, so distinct mutations stay ordered even when their source timestamps are equal.
- The subscriber applies events **idempotently with source IDs preserved**, using the target instance's own TypeORM repositories (resolved from n8n's DI container at runtime), conditional timestamp updates for workflow/credential last-write-wins guards, and transactions for required owner-link writes. It also persists last-applied ordering state plus delete tombstones under `SYNC_SUBSCRIBER_STATE_PATH`.
- Credential sync accepts only the stored **encrypted string blob** on the wire. Plain object payloads are dropped or rejected to avoid relying on undocumented repository-side encryption semantics. All instances must still share the same `N8N_ENCRYPTION_KEY` so targets can decrypt secrets at runtime.

## Tag-based filtering

The publisher can restrict and rewrite sync events based on n8n workflow tags. Enable it on a source instance with `SYNC_FILTER_BY_TAG=true`; the subscriber side is unaffected.

| Tag (default name)           | Effect                                                                                                                                                                             |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sync` (`SYNC_WORKFLOW_TAG`) | Workflow is eligible for syncing. Without it the publisher emits `workflow.delete` for that id (targets remove it).                                                                |
| `active` (`SYNC_ACTIVE_TAG`) | With the `sync` tag present, presence of this tag rewrites the DTO `active` to `true`; absence rewrites it to `false`. The source's real value is preserved in `meta.active_real`. |

Rules when `SYNC_FILTER_BY_TAG=true`:

- **Sync tag missing** → `workflow.afterCreate`, `workflow.afterUpdate`, and `workflow.activate` emit `workflow.delete` instead of upsert (so targets converge to "absent").
- **Sync tag present, `active` tag missing** → DTO `active=false`, `meta.active_real` holds the real source value.
- **Sync tag present, `active` tag present** → DTO `active=true`, `meta.active_real` holds the real source value.
- **Execution events** (`workflow.postExecute`) for workflows lacking the sync tag are silently dropped (no `workflow.delete` is emitted for executions).
- **Tag resolution** — n8n's hook payload sometimes passes an inline `tags` array; otherwise the publisher falls back to `dbCollections.Workflow.findOne({ relations: ['tags'] })`.

When `SYNC_FILTER_BY_TAG=false` (default): all workflows pass through unmodified, the DTO carries no `tags` field, and no `meta.active_real` is set. No tag-resolving DB queries run.

## Authentication

Two schemes are available via `SYNC_AUTH_MODE` (must match on both sides):

| Mode             | Headers                                | Notes                                                                                                                                                                                                                                                                                                         |
| ---------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `hmac` (default) | `x-sync-timestamp`, `x-sync-signature` | Per-request HMAC-SHA256 of `<timestamp>.<rawBody>` keyed with the shared secret. Replay-protected: the subscriber rejects timestamps outside a 5-minute tolerance and rejects an exact re-send of the same signed request from a bounded in-memory replay cache. Every retry re-signs with a fresh timestamp. |
| `token`          | `x-sync-token`                         | Static shared-secret bearer token. Simpler; use only over TLS. Delivery remains idempotent via `eventId` / `entityRevision`, but token mode does not reject request replay at the auth boundary.                                                                                                              |

Requests must use `Content-Type: application/json`; unsupported `Content-Encoding` values are rejected.

In `hmac` mode the subscriber authenticates the exact raw request bytes before JSON parsing. It uses `req.rawBody` when n8n's global `rawBodyReader` is present, otherwise it reads the unread request stream itself, and it fails closed if only a pre-parsed `req.body` is available.

In `token` mode the subscriber still enforces the same JSON content-type and size limits, but it may reuse an already parsed `req.body` because authentication does not depend on the raw bytes.

Every valid sync event also includes:

- `eventId` — unique within a publisher source (`<sourceId>:<sequence>`)
- `entityRevision` — decimal-string revision monotonic for that `(sourceId, entity)`

The subscriber uses `entityRevision` as the tie-breaker when two distinct mutations share the same source timestamp.

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

★ `workflow.postExecute` is **opt-in** — see `SYNC_ENTITIES`. It fires per execution (high volume) and the publisher handler is fire-and-forget so it never blocks n8n. The DTO carries only the scalar lifecycle columns exposed by that hook (`id`, `workflowId`, `status`, `mode`, `finished`, `startedAt`, `stoppedAt`); per-step `fullRunData` is dropped to keep payloads small.

Credential hook contract, pinned to the n8n `2.31.2` image used by this repository's example builds:

- `credentials.create` and `credentials.update` publish only when the hook payload or resolved repository row includes the stable row `id` plus an encrypted string `data` blob.
- When `credentials.create` includes an `id` but the row is not yet queryable, the publisher retries `dbCollections.Credentials.findOne({ where: { id } })` briefly in the background and emits only that exact row when the stored `data` is the encrypted string blob.
- Payloads without a stable credential `id` are unsupported for sync publication and are dropped with a warning instead of guessing by `{name, type}`.
- Object-form credential payloads are unsupported for sync publication and are dropped with a warning; the subscriber also rejects them if they bypass publisher validation.

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

| Variable             | Required | Default                 | Description                                                                                                                                                                                                                                                                                                        |
| -------------------- | -------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `SYNC_SHARED_SECRET` | yes      | —                       | Shared secret: HMAC key (hmac mode) or bearer token (token mode).                                                                                                                                                                                                                                                  |
| `SYNC_AUTH_MODE`     | no       | `hmac`                  | `hmac` \| `token` — must match on publisher and subscriber.                                                                                                                                                                                                                                                        |
| `SYNC_ENTITIES`      | no       | `workflows,credentials` | Comma-separated subset of `workflows`, `credentials`, `executions` to sync. Explicit invalid names fail startup; `executions` also requires `workflows`. When `executions` is included, the publisher registers the high-volume `workflow.postExecute` hook and the subscriber resolves the `ExecutionRepository`. |
| `LOG_LEVEL`          | no       | `info`                  | `debug` \| `info` \| `warn` \| `error`.                                                                                                                                                                                                                                                                            |

### Publisher

| Variable                    | Required | Default                                              | Description                                                                                                                                                                                                                                                          |
| --------------------------- | -------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SYNC_SUBSCRIBER_URLS`      | yes      | —                                                    | Comma-separated target base URLs (fan-out). Falls back to `SYNC_SUBSCRIBER_URL` if unset. Must be absolute base URLs with no path, query, fragment, or userinfo. HTTPS is required unless `SYNC_ALLOW_INSECURE_HTTP=true` and `NODE_ENV` is `development` or `test`. |
| `SYNC_SUBSCRIBER_URL`       | no       | —                                                    | Legacy single-target form of `SYNC_SUBSCRIBER_URLS`.                                                                                                                                                                                                                 |
| `SYNC_ALLOW_INSECURE_HTTP`  | no       | `false`                                              | Development-only escape hatch for `http://` subscriber URLs. Ignored unless `NODE_ENV` is `development` or `test`.                                                                                                                                                   |
| `SYNC_SOURCE_ID`            | no       | hostname                                             | Identifier stamped on every event.                                                                                                                                                                                                                                   |
| `SYNC_EVENTS_PATH`          | no       | `/rest/sync/v1/events`                               | Endpoint path on the subscriber. Must be a local absolute path with no query or fragment.                                                                                                                                                                            |
| `SYNC_TIMEOUT_MS`           | no       | `10000`                                              | Per-attempt HTTP timeout. Integer range: `1` to `300000`.                                                                                                                                                                                                            |
| `SYNC_MAX_RETRIES`          | no       | `3`                                                  | Total delivery attempts per event. Integer range: `1` to `10`.                                                                                                                                                                                                       |
| `SYNC_MAX_QUEUE_SIZE`       | no       | `1000`                                               | Max queued events per target. Integer range: `1` to `100000`. When full, the oldest queued event is dropped and logged before the new event is enqueued.                                                                                                             |
| `SYNC_PUBLISHER_STATE_PATH` | no       | `/home/node/.n8n/sync-state/publisher-ordering.json` | Durable publisher counter store for `eventId` and per-entity `entityRevision`. Put this on persistent storage if the source restarts.                                                                                                                                |
| `SYNC_FILTER_BY_TAG`        | no       | `false`                                              | When `true`, sync only workflows that carry `SYNC_WORKFLOW_TAG` (see [Tag-based filtering](#tag-based-filtering)).                                                                                                                                                   |
| `SYNC_WORKFLOW_TAG`         | no       | `sync`                                               | Workflow tag name that gates syncing. Effective only when `SYNC_FILTER_BY_TAG=true`.                                                                                                                                                                                 |
| `SYNC_ACTIVE_TAG`           | no       | `active`                                             | Tag name that rewrites the DTO `active` to `true` (real value preserved in `meta.active_real`). Effective only when `SYNC_FILTER_BY_TAG=true`.                                                                                                                       |

### Subscriber

| Variable                      | Required | Default                                                | Description                                                                                                                                        |
| ----------------------------- | -------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SYNC_ROUTE_BASE`             | no       | `/rest/sync/v1`                                        | Base path for the mounted routes. Must be a local absolute path with no query or fragment.                                                         |
| `SYNC_TARGET_PROJECT_ID`      | no       | —                                                      | Link newly synced workflows/credentials to this project (`*:owner` role).                                                                          |
| `SYNC_APPLY_ACTIVE_STATE`     | no       | `false`                                                | Also write `active`/`activeVersionId` (see limitations).                                                                                           |
| `SYNC_MAX_BODY_BYTES`         | no       | `16777216`                                             | Request body size cap. Integer range: `1` to `67108864`.                                                                                           |
| `SYNC_SIGNATURE_TOLERANCE_MS` | no       | `300000`                                               | Max signature age/skew accepted in hmac mode. Integer range: `1` to `3600000`.                                                                     |
| `SYNC_REPLAY_CACHE_SIZE`      | no       | `10000`                                                | Max exact signed HMAC requests remembered for replay rejection. Integer range: `1` to `100000`. Entries expire with `SYNC_SIGNATURE_TOLERANCE_MS`. |
| `SYNC_SUBSCRIBER_STATE_PATH`  | no       | `/home/node/.n8n/sync-state/subscriber-ordering.json`  | Durable subscriber ordering and tombstone store keyed by `(sourceId, entity)`.                                                                     |
| `N8N_DI_PATH`                 | no       | `/usr/local/lib/node_modules/n8n/node_modules/@n8n/di` | Path to n8n's `@n8n/di` module.                                                                                                                    |
| `N8N_DB_PATH`                 | no       | `/usr/local/lib/node_modules/n8n/node_modules/@n8n/db` | Path to n8n's `@n8n/db` module.                                                                                                                    |

## Limitations

- **Deactivation does not sync.** n8n fires no external hook on workflow deactivation; the target corrects state on the next update/activate event (or stays active until then).
- **`workflow.activate` fires pre-commit.** If a later hook rejects the activation, the subscriber may briefly hold an uncommitted state; the next event converges it.
- **Active state is DB-only.** With `SYNC_APPLY_ACTIVE_STATE=true`, the target's `active` flag is written to the database, but triggers/webhooks are not registered with the target's active workflow manager until restart or manual toggle. Keep it `false` for passive-standby targets.
- **Execution sync requires workflow sync.** `SYNC_ENTITIES` cannot enable `executions` without also enabling `workflows`; startup fails fast on that invalid configuration.
- **Execution sync is summary-only.** `SYNC_ENTITIES=…,executions` upserts a row in the target's `execution_entity` table with the source ID and scalar lifecycle columns. The `execution_data` blob (per-step run data and the workflow snapshot at run time) is **not** written; target-side reads via the Public API will see the execution summary but not its run detail.
- **Malformed execution summaries are rejected.** The subscriber rejects execution events that omit `workflowId`, carry no lifecycle timestamps, or refer to a target workflow that does not exist yet. The request is not acknowledged as success, so the publisher keeps retrying instead of silently dropping the configured event.
- **Terminal execution rows do not regress.** Once the target holds a terminal execution (`success`, `error`, `crashed`, `canceled`) with a terminal timestamp, a later non-terminal or timestamp-less event is ignored even if its `entityRevision` is newer.
- **Workflow deletion removes synced executions first.** Before applying `workflow.delete`, the subscriber deletes mapped synced execution rows for that source/workflow so the target workflow delete does not fail on dependent execution rows.
- **Execution staleness still uses `stoppedAt` for terminal-to-terminal updates.** When both the stored row and incoming event are terminal, the row-level timestamp guard still treats `stoppedAt` as the last-write-wins field, while the outer `entityRevision` ordering contract decides whether the event is newer at the source level.
- **Workflow and credential ownership is reconciled on every upsert.** Missing `*:owner` rows are repaired, and when `SYNC_TARGET_PROJECT_ID` changes, the next upsert moves the owner relation to the new project instead of leaving the entity orphaned or linked to the old project.
- **Wire compatibility changed.** Publisher and subscriber upgrades must roll out together. The subscriber now requires `eventId` and `entityRevision` on every event; an older publisher will be rejected as an invalid payload.
- **Replay rejection is HMAC-only.** Exact signed replays are rejected only in `hmac` mode and only while the bounded replay cache still remembers that signature. Durable ordering still makes stale re-delivery a no-op after cache expiry or restart.
- **Ordering state must be on persistent storage.** If `SYNC_PUBLISHER_STATE_PATH` or `SYNC_SUBSCRIBER_STATE_PATH` points at ephemeral storage, restarts can forget counters or tombstones and weaken stale-event protection until newer revisions arrive.
- **Credential sync requires a shared `N8N_ENCRYPTION_KEY`** on all instances.
- **Credential create publication requires a stable source id.** On the pinned n8n `2.31.2` hook contract, this means the payload must include `credential.id` directly or expose it soon after commit through `dbCollections.Credentials.findOne({ where: { id } })`. Payloads without `id` are logged and dropped to avoid publishing another credential's data.
- **The delivery queue is in-memory and bounded.** Events queued but not yet delivered when the source instance restarts are lost. If `SYNC_MAX_QUEUE_SIZE` is exceeded, the oldest queued event for that target is dropped and logged before enqueueing the new one. Later upserts may still converge state, but dropped deletes, archives, or other mixed operations are not reconstructed automatically.
- **Tag filtering is source-side only.** `SYNC_FILTER_BY_TAG` rewrites the publisher's DTOs and may turn an upsert into a delete; the subscriber never sees or honors tag fields. Tagging a workflow on the source does not propagate the tag itself to the target.

## Development

```bash
pnpm build       # bundle dist/publisher.cjs + dist/subscriber.cjs (single-file CJS)
pnpm test        # unit tests
npx tsc --noEmit -p tsconfig.json         # typecheck src
npx tsc --noEmit -p tsconfig.tests.json   # typecheck src + tests
pnpm test:integration # repo root: runs the supported pinned n8n version matrix
```
