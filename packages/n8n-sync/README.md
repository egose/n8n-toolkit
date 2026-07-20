# @egose/n8n-sync

Sync n8n credentials and workflows between two n8n instances using [n8n external hooks](https://docs.n8n.io/deploy/host-n8n/configure-n8n/external-hooks/).

The package builds two self-contained CommonJS hook bundles:

| Bundle                | Role                                                                                                                        |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `dist/publisher.cjs`  | Runs on the **source** instance. Lifecycle hooks POST sync events to the subscriber over HTTPS.                             |
| `dist/subscriber.cjs` | Runs on the **target** instance. Mounts an endpoint on n8n's own server and applies events via n8n's internal repositories. |

## How it works

```
┌──────────────┐   credentials.create/update/delete      ┌──────────────┐
│  source n8n  │   workflow.afterCreate/afterUpdate/…    │  target n8n  │
│              │ ──────────────────────────────────────► │              │
│ publisher.cjs│   POST /rest/sync/v1/events             │subscriber.cjs│
│              │   x-sync-token: <shared secret>         │              │
└──────────────┘                                         └──────────────┘
```

- The publisher never throws: delivery failures are retried (1s, 2s, 4s, capped at 10s) and then logged, so a sync outage cannot break n8n operations.
- The subscriber applies events **idempotently with source IDs preserved**, using the target instance's own TypeORM repositories (resolved from n8n's DI container at runtime).
- Credential `data` is passed through **encrypted** — both instances must share the same `N8N_ENCRYPTION_KEY` so the target can decrypt secrets at runtime.

## Wired hooks

| Source hook                                         | Event                |
| --------------------------------------------------- | -------------------- |
| `credentials.create` / `credentials.update`         | `credentials.upsert` |
| `credentials.delete`                                | `credentials.delete` |
| `workflow.afterCreate` / `workflow.afterUpdate`     | `workflow.upsert`    |
| `workflow.activate`                                 | `workflow.activate`  |
| `workflow.afterDelete`                              | `workflow.delete`    |
| `workflow.afterArchive` / `workflow.afterUnarchive` | `workflow.archive`   |

## Setup

Build the bundles (`pnpm --filter @egose/n8n-sync build`), copy them to both instances, and point n8n at the appropriate file via `EXTERNAL_HOOKS_FILES`.

### Source instance (publisher)

```bash
export EXTERNAL_HOOKS_FILES=/path/to/publisher.cjs
export SYNC_SUBSCRIBER_URL=https://n8n-target.example.com
export SYNC_SHARED_SECRET=<shared-secret>
```

### Target instance (subscriber)

```bash
export EXTERNAL_HOOKS_FILES=/path/to/subscriber.cjs
export SYNC_SHARED_SECRET=<shared-secret>
# optional:
export SYNC_TARGET_PROJECT_ID=<project-id>   # link synced entities to this project
```

Restart both instances. The subscriber logs `n8n-sync subscriber routes active.` when ready and serves an unauthenticated health probe at `GET /rest/sync/v1/health`.

## Environment variables

### Both sides

| Variable             | Required | Default | Description                                  |
| -------------------- | -------- | ------- | -------------------------------------------- |
| `SYNC_SHARED_SECRET` | yes      | —       | Shared secret sent as `x-sync-token` header. |
| `LOG_LEVEL`          | no       | `info`  | `debug` \| `info` \| `warn` \| `error`.      |

### Publisher

| Variable              | Required | Default                | Description                                        |
| --------------------- | -------- | ---------------------- | -------------------------------------------------- |
| `SYNC_SUBSCRIBER_URL` | yes      | —                      | Base URL of the target instance (no trailing `/`). |
| `SYNC_SOURCE_ID`      | no       | hostname               | Identifier stamped on every event.                 |
| `SYNC_EVENTS_PATH`    | no       | `/rest/sync/v1/events` | Endpoint path on the subscriber.                   |
| `SYNC_TIMEOUT_MS`     | no       | `10000`                | Per-attempt HTTP timeout.                          |
| `SYNC_MAX_RETRIES`    | no       | `3`                    | Total delivery attempts per event.                 |

### Subscriber

| Variable                  | Required | Default                                                | Description                                                               |
| ------------------------- | -------- | ------------------------------------------------------ | ------------------------------------------------------------------------- |
| `SYNC_ROUTE_BASE`         | no       | `/rest/sync/v1`                                        | Base path for the mounted routes.                                         |
| `SYNC_TARGET_PROJECT_ID`  | no       | —                                                      | Link newly synced workflows/credentials to this project (`*:owner` role). |
| `SYNC_APPLY_ACTIVE_STATE` | no       | `false`                                                | Also write `active`/`activeVersionId` (see limitations).                  |
| `SYNC_MAX_BODY_BYTES`     | no       | `16777216`                                             | Request body size cap.                                                    |
| `N8N_DI_PATH`             | no       | `/usr/local/lib/node_modules/n8n/node_modules/@n8n/di` | Path to n8n's `@n8n/di` module.                                           |
| `N8N_DB_PATH`             | no       | `/usr/local/lib/node_modules/n8n/node_modules/@n8n/db` | Path to n8n's `@n8n/db` module.                                           |

## Limitations

- **Deactivation does not sync.** n8n fires no external hook on workflow deactivation; the target corrects state on the next update/activate event (or stays active until then).
- **`workflow.activate` fires pre-commit.** If a later hook rejects the activation, the subscriber may briefly hold an uncommitted state; the next event converges it.
- **Active state is DB-only.** With `SYNC_APPLY_ACTIVE_STATE=true`, the target's `active` flag is written to the database, but triggers/webhooks are not registered with the target's active workflow manager until restart or manual toggle. Keep it `false` for passive-standby targets.
- **One-way, last-write-wins.** Sync is directional. Upserts carry the source `updatedAt` and are skipped when the target row is already at or beyond it, so out-of-order or duplicate deliveries cannot regress state. Deletes and archives are applied unconditionally.
- **Credential sync requires a shared `N8N_ENCRYPTION_KEY`** on both instances.

## Development

```bash
pnpm build       # bundle dist/publisher.cjs + dist/subscriber.cjs (single-file CJS)
pnpm test        # unit tests
npx tsc --noEmit -p tsconfig.json         # typecheck src
npx tsc --noEmit -p tsconfig.tests.json   # typecheck src + tests
```
