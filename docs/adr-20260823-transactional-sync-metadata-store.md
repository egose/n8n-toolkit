# ADR: Transactional Sync Metadata Store

Date: 2026-08-23

Status: Accepted for STATE-01 implementation

Package: `@egose/n8n-sync`

## Context

The subscriber currently mutates n8n entities through n8n repositories and then writes ordering state to JSON. A crash after the entity mutation but before `ordering.recordApplied()` can let an older event replay after restart, recreate a deleted row, or lose an execution identity mapping. JSON rename and process-local locks cannot make a database row and an external file commit atomically, and they do not support multiple subscriber processes.

The pinned runtime for this package is n8n `2.31.2` on Postgres. The current runtime adapter has evidence that `EntityManager.withRepository()` or repository rebinding breaks the resolved repository instances on that runtime, so STATE-01 must not depend on rebound repositories as the transaction boundary.

## Decision

Use package-owned metadata tables in the same n8n Postgres database and commit sync metadata in the same database transaction as the affected n8n entity rows.

Implementation should use a raw TypeORM `EntityManager.transaction()` plus `manager.query()` boundary obtained from a resolved n8n repository manager. Do not rebind n8n repositories inside the transaction on n8n `2.31.2`. The STATE-01 implementation should either perform the entity mutations with transaction-scoped raw SQL or prove a transaction-scoped n8n repository API works before using it.

The added prototype exposes:

- `SYNC_METADATA_SCHEMA_SQL` in `packages/n8n-sync/src/subscriber/n8n-runtime.ts` for the concrete initial schema.
- `probeSyncMetadataTransactionCapability()` to verify a resolved n8n repository manager exposes both `transaction()` and raw `query()`.
- A Docker/Postgres integration prototype gated by `N8N_SYNC_METADATA_PROTOTYPE=1`, enabled by the root integration runner, that verifies rollback and concurrent compare-and-set behavior on the target Postgres database.

## Schema

Initial STATE-01 schema should use these tables, matching the checked-in prototype SQL:

```sql
create table if not exists n8n_sync_source (
  source_id text primary key,
  source_epoch text not null,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create table if not exists n8n_sync_entity_state (
  source_id text not null,
  entity_kind text not null check (entity_kind in ('workflow', 'credential', 'execution')),
  source_entity_id text not null,
  target_entity_id text,
  last_event_id text not null,
  last_revision numeric(78, 0) not null,
  last_event_type text not null,
  entity_updated_at timestamptz,
  deleted_at timestamptz,
  archived_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (source_id, entity_kind, source_entity_id),
  unique (entity_kind, target_entity_id)
);

create table if not exists n8n_sync_execution_identity (
  source_id text not null,
  source_execution_id text not null,
  target_execution_id text not null,
  source_workflow_id text not null,
  target_workflow_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (source_id, source_execution_id),
  unique (target_execution_id)
);

create table if not exists n8n_sync_schema_migration (
  id integer primary key,
  version integer not null,
  applied_at timestamptz not null default now()
);
```

STATE-01 may split tombstones, mappings, or migration rows further if implementation evidence requires it, but it must preserve the same uniqueness guarantees:

- One ordering/tombstone row per `(source_id, entity_kind, source_entity_id)`.
- One target workflow or credential owner per `(entity_kind, target_entity_id)` once IDENTITY-01 defines the ownership policy.
- One execution mapping per `(source_id, source_execution_id)` and per `target_execution_id`.

## Transaction Approach

Each accepted event should run inside one database transaction:

1. Acquire a transaction-scoped advisory lock for migration or coarse source/entity coordination where needed.
2. Read or upsert `n8n_sync_source` and validate source epoch policy from IDENTITY-01/SOURCE-01.
3. Compare `(last_revision, last_event_id)` in `n8n_sync_entity_state` with the incoming event using a database compare-and-set condition.
4. If the event is stale or a revision conflict, return the documented non-success or no-op result without mutating n8n rows.
5. Mutate the n8n entity row, owner link rows, execution row, and execution identity row using the same transaction manager.
6. Commit the metadata state and tombstone in the same transaction before returning success.

The core ordering write should use a conditional upsert pattern equivalent to:

```sql
insert into n8n_sync_entity_state (..., last_event_id, last_revision, ...)
values (...)
on conflict (source_id, entity_kind, source_entity_id) do update set
  last_event_id = excluded.last_event_id,
  last_revision = excluded.last_revision,
  last_event_type = excluded.last_event_type,
  entity_updated_at = excluded.entity_updated_at,
  deleted_at = excluded.deleted_at,
  archived_at = excluded.archived_at,
  updated_at = now()
where n8n_sync_entity_state.last_revision < excluded.last_revision
returning *;
```

Equal-revision/different-event conflicts must not update the row. Duplicate event IDs may return idempotent success only when the stored row proves the same event was already committed.

## Migration And Upgrade

Table creation is subscriber-owned and should happen during subscriber startup/readiness before accepting traffic. Startup must use a transaction-scoped advisory lock and record schema version in `n8n_sync_schema_migration` so multiple subscriber processes cannot race migrations.

Existing JSON ordering state cannot be safely auto-migrated when format `1` keys are ambiguous. Format `2` JSON state can be imported only if the operator explicitly enables an import mode and the target ownership policy is already unambiguous. Otherwise startup must fail with backup/reset/resync guidance rather than silently weakening tombstones.

## Backup, Restore, Downgrade, And Cleanup

Backups must include the n8n database and the `n8n_sync_*` tables in the same snapshot. Restoring entity rows without metadata is unsafe because stale publisher events can resurrect deleted or older state. Restoring metadata without matching entity rows is also unsafe because duplicate detection can hide required repairs.

Downgrading to a version that still uses JSON state is not automatic. Operators must either keep the database metadata tables unused for later upgrade, export/import to a supported JSON state format when unambiguous, or reset subscriber state and perform a full source resync. The package must not delete `n8n_sync_*` tables on downgrade.

Cleanup should be explicit and conservative:

- Retain workflow and credential delete tombstones until a source epoch/checkpoint protocol proves older events cannot arrive.
- Remove execution mappings only when matching execution rows are pruned and ordering retention rules still prevent duplicate insertion.
- Provide source-retirement cleanup only after IDENTITY-01 defines source ownership and epoch semantics.
- Never run unbounded table scans during request handling.

## Multi-Process Support

Multiple subscriber processes are supported by the selected design if all of them use the same Postgres database and the STATE-01 implementation uses database constraints, transaction isolation, row-level conditional updates, and advisory locks for migrations. Process-local promise chains remain an optimization only; they are not a correctness boundary.

Multiple publisher processes are not solved by this ADR. SOURCE-01 must either provide shared durable revision allocation or reject concurrent publishers for one logical source before hooks emit.

## Rejected Alternatives

JSON ordering state with atomic rename is rejected because it cannot commit atomically with n8n database mutations and cannot coordinate independent OS processes.

A recoverable journal beside JSON state is rejected for STATE-01 because it still has crash windows across two durability domains. A journal could detect and repair some incomplete commits, but it cannot prove the database row and checkpoint were committed as one unit without idempotent compensation for every n8n mutation path.

Rebinding n8n repositories with `EntityManager.withRepository()` is rejected for pinned n8n `2.31.2` because the current adapter evidence says rebound repositories lose required internal manager state. This can be revisited only with a pinned-runtime integration test that proves `save`, `update`, query builders, owner-link writes, rollback, and commit all work through rebound repositories.

Using a separate database or queue for metadata is rejected because it reintroduces distributed transaction requirements and complicates backup/restore consistency.

## Residual Risks

The current checked-in code is a capability probe and prototype, not the STATE-01 implementation. The production applier still writes JSON ordering state after entity mutations until STATE-01 replaces that path.

Raw SQL must track n8n table and column names for the pinned runtime. Runtime upgrades need explicit integration coverage before support is expanded.

The schema enforces target uniqueness before IDENTITY-01 has selected the final single-source or multi-source ownership policy. STATE-01/IDENTITY-02 may need a compatible migration if that policy requires additional ownership columns.

Postgres-specific advisory locks and SQL are selected. Other n8n database engines are not supported by this ADR.

Execution sync remains operationally risky until execution identity moves from JSON to `n8n_sync_execution_identity` in STATE-01/EXECUTION-01.

## Verification

Required verification for this ADR is:

- `pnpm --filter @egose/n8n-sync typecheck`
- root `pnpm test:integration` with `N8N_SYNC_METADATA_PROTOTYPE=1` enabled by `sandbox/run-integration.ts`

If Docker/Postgres integration cannot run, DESIGN-01 must remain blocked and the residual risk is that pinned-runtime DDL, rollback, and concurrency behavior are not proven.
