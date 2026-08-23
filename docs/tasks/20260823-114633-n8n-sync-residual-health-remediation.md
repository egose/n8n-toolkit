# n8n Sync Residual Health Remediation

Created: 2026-08-23 11:46:33 PDT

## Objective

Close residual correctness, security, performance, readability, encapsulation, and operational-assurance gaps in `packages/n8n-sync` after the earlier health work recorded in [`20260812-084731-n8n-sync-health-remediation.md`](./20260812-084731-n8n-sync-health-remediation.md). Prioritize cases where the subscriber acknowledges an event whose state was not applied, where a crash can split database and ordering state, and where one source can mutate another source's rows.

This document is executable by sub-agents without conversation context. It records current findings, dependencies, ownership boundaries, and observable completion criteria.

## Scope

- `packages/n8n-sync/src/**`
- `packages/n8n-sync/tests/**`
- `packages/n8n-sync/package.json`, build/test configuration, and package verification
- `packages/n8n-sync/README.md`, `packages/n8n-sync/AGENTS.md`, and examples
- `sandbox/**` and CI/release wiring needed for pinned-runtime verification
- The prior n8n-sync task document where status/evidence must be reconciled

## Working Rules

- Do not revert or overwrite unrelated concurrent changes.
- Add a regression test that fails on the current implementation before fixing a confirmed defect.
- Preserve the publisher hook no-throw contract, but do not convert persistence failure into an unobservable healthy state.
- Authenticate and apply the same exact request representation in HMAC mode.
- Never log credential data, raw event bodies, shared secrets, auth headers, or database query parameters that may contain those values.
- Do not claim atomicity when operations span the n8n database and JSON files.
- Do not introduce compatibility aliases unless a shipped external contract requires them.
- Keep n8n runtime access lazy inside `n8n.ready` and preserve dependency-free hook bundles unless a task explicitly changes that contract.
- Serialize package builds, tarball checks, and Docker integration tests because they share generated output and sandbox services.
- Mark a task `completed` only after its required tests and verification commands pass; otherwise record a blocker and evidence.

## Non-Goals

- Poll for workflow deactivation events that n8n does not expose.
- Treat database `active` writes as trigger/webhook registration.
- Add full execution run data to the wire format.
- Promise lossless publisher delivery without a separately approved outbox or durable queue design.
- Expand the supported n8n version matrix without runtime fixtures and Docker-backed verification.

## Baseline Verification

Run on 2026-08-23 before creating this plan:

- `git status --short`: clean.
- `pnpm --filter @egose/n8n-sync test`: passed, 13 files and 343 tests.
- `pnpm --filter @egose/n8n-sync typecheck`: passed for source and tests.
- Docker-backed integration tests were not rerun during this review.
- Build and `pack:verify` were not rerun because this was a review/task-authoring pass and those commands rewrite `dist/`.

The green unit baseline does not cover crash points between database and file commits, multiple OS processes, custom execution-identity paths, equal-timestamp updates through the real conditional-update adapter, subscriber entity gating, stalled response bodies, or multi-source workflow/credential collisions.

## Priority Definitions

- P0: confirmed state loss, stale resurrection, wrong-entity mutation, or acknowledged-but-unapplied state.
- P1: material correctness, security-boundary, availability, scalability, or release-assurance defect.
- P2: readability, type safety, maintainability, documentation, or defense-in-depth improvement.
- Investigation: evidence is incomplete or product semantics must be selected before implementation.

## Execution Waves

1. Add regression tests and fix acknowledged-but-unapplied events.
2. Decide source ownership and durable state architecture.
3. Implement atomic identity, ordering, and ownership persistence.
4. Harden request, transport, readiness, and overload boundaries.
5. Improve publisher sequencing, state scalability, and type contracts.
6. Reconcile package/release assurance and documentation.
7. Perform an independent final integration and security review.

## Wave 1: Immediate Correctness And Boundaries

### Task APPLY-01: Let Higher Revisions Win Equal Timestamp Ties

Status: completed

Priority: P0

Suggested agent: subscriber correctness engineer

Dependencies: none

Primary ownership:

- `packages/n8n-sync/src/subscriber/applier.ts`
- `packages/n8n-sync/src/subscriber/n8n-runtime.ts`
- focused unit and real-repository tests

Finding:

The ordering store accepts a higher `entityRevision`, but workflow, credential, and execution timestamp guards reject an update when the stored timestamp equals the incoming timestamp. The applier then records the higher revision as applied. Rapid updates sharing one millisecond can therefore be permanently discarded, contradicting the stated revision tie-break contract.

References:

- `packages/n8n-sync/src/subscriber/applier.ts:70-91`
- `packages/n8n-sync/src/subscriber/applier.ts:326-355`
- `packages/n8n-sync/src/subscriber/applier.ts:430-459`
- `packages/n8n-sync/src/subscriber/applier.ts:549-561`
- `packages/n8n-sync/src/subscriber/applier.ts:650`
- `packages/n8n-sync/src/subscriber/n8n-runtime.ts:272-293`
- `packages/n8n-sync/tests/applier.spec.ts:367-393`

Implementation requirements:

1. Once ordering accepts a strictly higher revision for the same source/entity, permit an equal entity timestamp to update the target row.
2. Preserve rejection of lower revisions. A higher revision carrying an older entity timestamp must throw or return a typed conflict outcome and must not advance ordering state; APPLY-02 owns its HTTP representation.
3. Apply the same rule to the fallback repository path and the real `conditionalUpdate` adapter.
4. Record ordering state only after the accepted payload is durably persisted.
5. Document the changed timestamp-conflict contract in README and `CHANGELOG.md` together with APPLY-02.

Acceptance criteria:

- Real-repository tests prove revision 2 changes workflow and credential state when revision 1 has the same `updatedAt`.
- An execution revision with the same `stoppedAt` updates the mapped target row when its lifecycle does not regress.
- A higher revision with an older timestamp produces a typed conflict and does not advance the checkpoint for workflows, credentials, or executions.
- Redelivery of the same `eventId` performs no repository write.
- `pnpm --filter @egose/n8n-sync test -- tests/applier.spec.ts tests/applier.persistence-db.spec.ts` passes.
- `pnpm --filter @egose/n8n-sync typecheck` passes.

Completion evidence:

- Changed: `packages/n8n-sync/src/subscriber/applier.ts`, `packages/n8n-sync/src/subscriber/n8n-runtime.ts`, `packages/n8n-sync/src/subscriber/order-state.ts`, `packages/n8n-sync/tests/applier.spec.ts`, `packages/n8n-sync/tests/applier.persistence-db.spec.ts`, `packages/n8n-sync/tests/n8n-runtime.spec.ts`, `packages/n8n-sync/README.md`, `packages/n8n-sync/AGENTS.md`, `CHANGELOG.md`, `docs/tasks/20260823-114633-n8n-sync-residual-health-remediation.md`.
- Verified: `pnpm --filter @egose/n8n-sync test -- tests/applier.spec.ts tests/applier.persistence-db.spec.ts`.
- Result: 13 test files passed, 354 tests passed.
- Verified: `pnpm --filter @egose/n8n-sync typecheck`.
- Result: `tsc --noEmit -p tsconfig.json && tsc --noEmit -p tsconfig.tests.json` passed.

### Task BOUNDARY-01: Enforce Subscriber Entity Selection

Status: completed

Priority: P1

Suggested agent: configuration and authorization-boundary engineer

Dependencies: APPLY-02

Primary ownership:

- `packages/n8n-sync/src/subscriber/runtime.ts`
- `packages/n8n-sync/src/subscriber/routes.ts` or `packages/n8n-sync/src/subscriber/applier.ts`
- `packages/n8n-sync/src/subscriber/n8n-runtime.ts`
- subscriber/config/runtime tests

Finding:

`SYNC_ENTITIES` controls publisher hook registration and whether `ExecutionRepository` is resolved, but workflow and credential events are always accepted by the subscriber. A workflow-only subscriber can still mutate credentials, and disabled execution events currently become retrying 500 responses rather than the documented controlled behavior.

References:

- `packages/n8n-sync/src/subscriber/runtime.ts:24-53`
- `packages/n8n-sync/src/subscriber/applier.ts:506-509`
- `packages/n8n-sync/src/subscriber/applier.ts:628-647`
- `packages/n8n-sync/src/subscriber/n8n-runtime.ts:364-390`
- `packages/n8n-sync/AGENTS.md:67-68`

Implementation requirements:

1. Pass the allowed entity set into one subscriber enforcement point before repository access or ordering-state mutation.
2. Return a documented non-retryable 4xx response for valid but disabled event families; do not silently acknowledge configuration mismatch.
3. Resolve only repositories required by enabled entity families where n8n's repository graph permits it.
4. Keep authentication and wire validation behavior unchanged.

Acceptance criteria:

- Every valid `SYNC_ENTITIES` combination has route-level tests for every event family.
- Disabled events make zero repository calls and create no ordering or identity state.
- Disabled events receive the documented stable status and error shape.
- Disabled repositories are not resolved at startup where they are not required.
- README and AGENTS describe the implemented behavior exactly.
- `CHANGELOG.md` records the disabled-event response contract change.
- `pnpm --filter @egose/n8n-sync test -- tests/config.spec.ts tests/subscriber.spec.ts tests/applier.spec.ts tests/n8n-runtime.spec.ts` and `pnpm --filter @egose/n8n-sync typecheck` pass.

Completion evidence:

- Changed: `packages/n8n-sync/src/subscriber/applier.ts`, `packages/n8n-sync/src/subscriber/routes.ts`, `packages/n8n-sync/src/subscriber/runtime.ts`, `packages/n8n-sync/src/subscriber/n8n-runtime.ts`, `packages/n8n-sync/tests/config.spec.ts`, `packages/n8n-sync/tests/subscriber.spec.ts`, `packages/n8n-sync/tests/applier.spec.ts`, `packages/n8n-sync/tests/n8n-runtime.spec.ts`, `packages/n8n-sync/README.md`, `packages/n8n-sync/AGENTS.md`, `CHANGELOG.md`, `docs/tasks/20260823-114633-n8n-sync-residual-health-remediation.md`.
- Verified: `pnpm --filter @egose/n8n-sync test -- tests/config.spec.ts tests/subscriber.spec.ts tests/applier.spec.ts tests/n8n-runtime.spec.ts`.
- Result: 13 test files passed, 383 tests passed.
- Verified: `pnpm --filter @egose/n8n-sync typecheck`.
- Result: `tsc --noEmit -p tsconfig.json && tsc --noEmit -p tsconfig.tests.json` passed.

### Task ORDER-KEY-01: Remove Composite Ordering Key Collisions

Status: completed

Priority: P1

Suggested agent: state-format engineer

Dependencies: none

Primary ownership:

- `packages/n8n-sync/src/shared/ordering.ts`
- publisher/subscriber ordering stores
- state migration and ordering tests

Finding:

Subscriber state keys concatenate `sourceId`, entity kind, and entity ID with `:`. Colons are valid in IDs, so distinct tuples can alias. For example, source `a` plus workflow `workflow:x` and source `a:workflow` plus workflow `x` both produce `a:workflow:workflow:x`.

References:

- `packages/n8n-sync/src/shared/ordering.ts:47-67`
- `packages/n8n-sync/src/shared/validate.ts:48-50`
- `packages/n8n-sync/src/subscriber/execution-identity.ts:51-53`

Implementation requirements:

1. Encode source/entity keys as unambiguous tuples, preferably using the established JSON tuple pattern.
2. Version the subscriber ordering state. Version-1 keys are not reversibly parseable, so either require operator-supplied migration identity metadata or refuse startup with explicit backup/reset/resync guidance; do not pretend automatic migration can preserve ambiguous tombstones.
3. Make and document a required decision on publisher key versioning; add an observable compatibility test for the selected result.
4. Add direct tests for state-store loading, migration, and restart behavior.

Acceptance criteria:

- The concrete collision pair above remains independent through apply and restart.
- Property-based or generated tests show distinct tuples do not collide.
- Version-1 state is migrated or startup fails with explicit operator guidance; stale delete protection is not silently lost.
- `pnpm --filter @egose/n8n-sync test` and typecheck pass.

Completion evidence:

- Changed: `packages/n8n-sync/src/shared/ordering.ts`, `packages/n8n-sync/src/subscriber/order-state.ts`, `packages/n8n-sync/src/publisher/order-state.ts`, `packages/n8n-sync/tests/order-state.spec.ts`, `packages/n8n-sync/tests/applier.spec.ts`, `packages/n8n-sync/README.md`, `packages/n8n-sync/AGENTS.md`, `CHANGELOG.md`, `docs/tasks/20260823-114633-n8n-sync-residual-health-remediation.md`.
- Subscriber ordering state is now format `2` with JSON tuple keys `[sourceId, entityKind, entityId]`; format-1 subscriber state fails with explicit backup/reset/resync guidance instead of unsafe migration.
- Publisher ordering state is now format `2` with JSON tuple entity keys; format-1 publisher state migrates automatically because legacy publisher keys are reversibly parseable.
- Tests prove the collision pair source `a` + workflow `workflow:x` and source `a:workflow` + workflow `x` stays independent through apply/restart, generated tuple samples do not collide, subscriber restart reloads v2 state, subscriber v1 state fails safely, and publisher v1 state migrates compatibly.
- Verified: `pnpm --filter @egose/n8n-sync test`.
- Result: 14 test files passed, 389 tests passed.
- Verified: `pnpm --filter @egose/n8n-sync typecheck`.
- Result: `tsc --noEmit -p tsconfig.json && tsc --noEmit -p tsconfig.tests.json` passed.

### Task APPLY-02: Reject Unapplied Revision Conflicts

Status: completed

Priority: P0

Suggested agent: subscriber protocol correctness engineer

Dependencies: APPLY-01

Primary ownership:

- `packages/n8n-sync/src/subscriber/applier.ts`
- `packages/n8n-sync/src/subscriber/routes.ts`
- ordering and route regression tests

Finding:

A distinct event that reuses an existing entity revision is classified as `conflict`, logged, and returned from the applier without throwing. The route then responds 200 even though the event was not applied. This can occur after duplicate publisher allocations from uncoordinated processes and hides a state divergence from the sender.

References:

- `packages/n8n-sync/src/shared/ordering.ts:69-77`
- `packages/n8n-sync/src/subscriber/applier.ts:618-625`
- `packages/n8n-sync/src/subscriber/routes.ts:101-107`
- `packages/n8n-sync/src/publisher/order-state.ts:56-92`

Implementation requirements:

1. Represent revision conflict as a typed controlled outcome, not a successful no-op.
2. Return a stable non-success response that distinguishes protocol conflict from retryable server failure.
3. Do not mutate the entity or checkpoint for the conflicting event.
4. Document operator recovery and prevent multi-process publisher allocation in SOURCE-01/STATE-01.
5. Document the externally visible conflict response in README and `CHANGELOG.md`.

Acceptance criteria:

- A distinct `eventId` reusing an applied revision receives the documented non-success response.
- The repository and durable checkpoint remain unchanged.
- A true duplicate retains the documented idempotent behavior.
- `pnpm --filter @egose/n8n-sync test -- tests/applier.spec.ts tests/subscriber.spec.ts` and `pnpm --filter @egose/n8n-sync typecheck` pass.

Completion evidence:

- Changed: `packages/n8n-sync/src/subscriber/applier.ts`, `packages/n8n-sync/src/subscriber/routes.ts`, `packages/n8n-sync/tests/applier.spec.ts`, `packages/n8n-sync/tests/subscriber.spec.ts`, `packages/n8n-sync/README.md`, `packages/n8n-sync/AGENTS.md`, `CHANGELOG.md`, `docs/tasks/20260823-114633-n8n-sync-residual-health-remediation.md`.
- Verified: `pnpm --filter @egose/n8n-sync test -- tests/applier.spec.ts tests/subscriber.spec.ts`.
- Result: 13 test files passed, 358 tests passed.
- Verified: `pnpm --filter @egose/n8n-sync typecheck`.
- Result: `tsc --noEmit -p tsconfig.json && tsc --noEmit -p tsconfig.tests.json` passed.

## Wave 2: Architecture Decisions

### Task DESIGN-01: Select A Transactional Sync Metadata Store

Status: blocked

Priority: P0 Investigation

Suggested agent: n8n persistence and distributed-systems architect

Dependencies: APPLY-01

Primary ownership:

- architecture decision record under `docs/`
- `packages/n8n-sync/src/subscriber/n8n-runtime.ts` capability probe
- disposable prototype and pinned-runtime integration tests

Finding:

Entity mutation occurs before `ordering.recordApplied()`, which writes a separate JSON file. A crash after a workflow/credential mutation but before the ordering write permits stale replay or deleted-entity resurrection after restart. The pinned n8n 2.31.2 adapter intentionally exposes no transaction wrapper, and a TypeORM transaction alone cannot atomically commit an external JSON file.

References:

- `packages/n8n-sync/src/subscriber/applier.ts:601-650`
- `packages/n8n-sync/src/subscriber/order-state.ts:71-77`
- `packages/n8n-sync/src/subscriber/n8n-runtime.ts:397-404`
- `packages/n8n-sync/src/shared/ordering.ts:99-103`

Implementation requirements:

1. Evaluate a package-owned database metadata table for ordering tombstones and source-to-target identities, committed through the same transaction manager as entity mutations.
2. Prove table creation/migration, repository rebinding, rollback, uniqueness, and upgrade behavior on pinned n8n 2.31.2/Postgres.
3. Compare a recoverable journal only if a same-database transaction is impossible; document exactly which crash windows remain.
4. Define backup, restore, downgrade, and cleanup semantics.
5. Record whether multiple publisher/subscriber processes are supported. Process-local locks and JSON rename are not sufficient for multi-process operation.

Acceptance criteria:

- An ADR selects one design and documents rejected alternatives and residual risks.
- A prototype fault-injection test crashes after entity mutation but before checkpoint and proves stale events cannot win after restart.
- Two independent subscriber processes cannot lose or overwrite each other's metadata.
- If no design satisfies atomicity, affected guarantees are removed from docs and execution sync remains blocked/experimental rather than being presented as durable.
- `pnpm --filter @egose/n8n-sync typecheck` and root `pnpm test:integration` pass with the prototype enabled.

Blocked evidence:

- Changed: `docs/adr-20260823-transactional-sync-metadata-store.md`, `packages/n8n-sync/src/subscriber/n8n-runtime.ts`, `packages/n8n-sync/tests/n8n-runtime.spec.ts`, `packages/n8n-sync/tests/integration-sync.spec.ts`, `packages/n8n-sync/tests/integration-utils.ts`, `sandbox/run-integration.ts`, `docs/tasks/20260823-114633-n8n-sync-residual-health-remediation.md`.
- Decision: selected package-owned `n8n_sync_*` metadata tables in the n8n Postgres database, committed through raw `EntityManager.transaction()`/`query()` rather than n8n repository rebinding.
- Prototype: added schema SQL, runtime capability probe, unit coverage, and a Docker/Postgres integration prototype enabled by `N8N_SYNC_METADATA_PROTOTYPE=1` in the root integration runner.
- Verified: `pnpm --filter @egose/n8n-sync typecheck` passed.
- Verified: `pnpm --filter @egose/n8n-sync test -- tests/n8n-runtime.spec.ts` passed; Vitest reported 14 files and 392 tests passed under the package config.
- Blocked: root `pnpm test:integration` failed before tests because Docker is unavailable in this WSL distro: `The command 'docker' could not be found in this WSL 2 distro.`
- Residual risk: pinned n8n 2.31.2/Postgres DDL, transaction rollback, and concurrent metadata compare-and-set behavior are designed and checked into the prototype but not verified in this environment. DESIGN-01 must remain blocked until root Docker integration passes with the prototype enabled.

### Task IDENTITY-01: Decide The Source Ownership Contract

Status: completed

Priority: P0 Investigation

Suggested agent: sync domain-model architect

Dependencies: none

Primary ownership:

- source/entity identity contract
- architecture decision record and migration design
- proof-of-concept collision tests

Finding:

Ordering is scoped by `sourceId`, but workflow and credential rows use source-provided IDs directly as target primary keys. Two publishers with the same ID, or a source colliding with a native target row, can overwrite, archive, or delete the same row. Shared HMAC credentials also let any authorized publisher claim any `sourceId`.

References:

- `packages/n8n-sync/src/shared/ordering.ts:64-67`
- `packages/n8n-sync/src/subscriber/applier.ts:318-324`
- `packages/n8n-sync/src/subscriber/applier.ts:383-399`
- `packages/n8n-sync/src/subscriber/applier.ts:427-428`
- `packages/n8n-sync/src/subscriber/applier.ts:487-489`
- `packages/n8n-sync/tests/applier.spec.ts:993-1017`

Implementation requirements:

1. Decide whether one subscriber supports exactly one authoritative source or aggregates multiple sources.
2. For single-source mode, specify durable subscriber/source binding and how the authorized source is prevented from claiming a pre-existing native row.
3. For multi-source mode, specify durable workflow and credential mappings or immutable ownership records that cannot collide with native rows.
4. Decide whether authentication credentials must bind to an allowed `sourceId`; a global shared secret alone cannot isolate mutually untrusted sources.
5. Define deletion, source retirement, ownership transfer, migration of existing target IDs, and externally visible conflict responses.

Acceptance criteria:

- An approved ADR selects one policy and contains concrete schemas, request outcomes, migration steps, and rejected alternatives.
- Prototype tests demonstrate the selected behavior for a native-row collision and two sources sharing one workflow/credential ID.
- IDENTITY-02 can implement the decision without making additional product-policy choices.
- `pnpm --filter @egose/n8n-sync typecheck` and the prototype's documented targeted test command pass.

Completion evidence:

- Changed: `docs/adr-20260823-source-ownership-contract.md`, `packages/n8n-sync/tests/identity-contract.spec.ts`, `docs/tasks/20260823-114633-n8n-sync-residual-health-remediation.md`.
- Decision: selected multi-source aggregation with durable source records, source-bound authentication credentials, target-generated workflow/credential IDs, and durable `(source_id, entity_kind, source_entity_id) -> target_entity_id` ownership mappings. Native target rows remain unclaimed unless an explicit operator migration manifest claims them.
- ADR defines schema, request outcomes, deletion/tombstone retention, source retirement, ownership transfer, migration of existing target IDs, conflict responses, and rejected alternatives.
- Prototype: added POC contract tests for native workflow/credential row collisions, two sources sharing one workflow/credential ID, source-bound credential mismatch, and retired-source rejection.
- Verified: `pnpm --filter @egose/n8n-sync test -- tests/identity-contract.spec.ts`.
- Result: Vitest passed; package config reported 15 test files and 398 tests passed.
- Verified: `pnpm --filter @egose/n8n-sync typecheck`.
- Result: `tsc --noEmit -p tsconfig.json && tsc --noEmit -p tsconfig.tests.json` passed.

## Wave 3: Atomic Persistence And Recovery

### Task STATE-01: Commit Mutation And Ordering Atomically

Status: blocked

Priority: P0

Suggested agent: transactional persistence engineer

Dependencies: APPLY-02, BOUNDARY-01, ORDER-KEY-01, DESIGN-01, IDENTITY-01

Primary ownership:

- subscriber metadata storage implementation
- `packages/n8n-sync/src/subscriber/applier.ts`
- `packages/n8n-sync/src/subscriber/n8n-runtime.ts`
- migration and fault-injection integration tests

Finding:

Workflow upsert/delete/archive, credential upsert/delete, execution upsert, owner links, and ordering checkpoints are separate commits. Current JSON-file durability cannot provide all-or-nothing behavior with target database rows.

References:

- `packages/n8n-sync/src/subscriber/applier.ts:243-286`
- `packages/n8n-sync/src/subscriber/applier.ts:383-410`
- `packages/n8n-sync/src/subscriber/applier.ts:487-489`
- `packages/n8n-sync/src/subscriber/applier.ts:578-598`
- `packages/n8n-sync/src/subscriber/applier.ts:601-650`

Implementation requirements:

1. Put ordering inspection, conditional mutation, owner relation changes, identity mapping, and ordering checkpoint in one database transaction where applicable.
2. Use database uniqueness/compare-and-set constraints rather than process-local promise chains as the correctness boundary.
3. Ensure destructive operations retain durable tombstones.
4. Return success only after the complete transaction commits.
5. Follow ORDER-KEY-01's migration decision: preserve the highest revision only where operator-supplied identity metadata makes conversion unambiguous; otherwise refuse startup with explicit backup/reset/resync guidance.
6. Do not mutate in-memory checkpoint state before durable commit. If checkpoint persistence fails, same-process retry must not be classified as duplicate.
7. Treat equal-revision/different-event conflicts as non-success and leave state unchanged.

Acceptance criteria:

- Fault injection at every mutation/checkpoint boundary leaves either the old complete state or new complete state.
- A stale upsert cannot recreate a committed newer delete after restart.
- A stale archive/delete cannot override a committed newer upsert.
- Two processes concurrently applying revisions converge to the highest valid revision.
- Tests run against the pinned Postgres-backed n8n repositories.
- Injected checkpoint failure followed by same-process retry does not acknowledge an undurable checkpoint as already applied.
- `pnpm --filter @egose/n8n-sync test`, `pnpm --filter @egose/n8n-sync typecheck`, and root `pnpm test:integration` pass.

Blocked evidence:

- Blocked by dependency `DESIGN-01`, which is still `blocked` because root `pnpm test:integration` failed before tests when Docker was unavailable in this WSL distro: `The command 'docker' could not be found in this WSL 2 distro.`
- Residual risk inherited from `DESIGN-01`: pinned n8n 2.31.2/Postgres DDL, transaction rollback, and concurrent metadata compare-and-set behavior are designed and checked into the prototype but not verified in this environment.
- No STATE-01 implementation changes were made because the selected transactional metadata architecture is not sufficiently verified; implementing mutation, ordering, owner links, identity mapping, checkpoints, tombstones, and CAS semantics now would rely on unsupported persistence assumptions.

### Task IDENTITY-02: Enforce Source Ownership At Persistence Boundaries

Status: blocked

Priority: P0

Suggested agent: sync identity persistence engineer

Dependencies: STATE-01

Primary ownership:

- workflow and credential identity/ownership persistence
- subscriber apply and authentication boundaries
- migration and multi-source integration tests

Finding:

IDENTITY-01 defines the required ownership policy. The current implementation still uses source-provided workflow and credential IDs directly, so that policy must be enforced at every upsert, archive, and delete boundary using the transactional metadata capabilities from STATE-01.

References:

- IDENTITY-01 and its approved ADR
- `packages/n8n-sync/src/subscriber/applier.ts:318-324`
- `packages/n8n-sync/src/subscriber/applier.ts:383-410`
- `packages/n8n-sync/src/subscriber/applier.ts:427-489`

Implementation requirements:

1. Implement the selected single-source or multi-source ownership model without changing the approved policy.
2. Reject native-row and cross-source collisions before mutation.
3. Include upsert, archive, delete, owner relations, source retirement, and authentication-to-source binding where selected.
4. Migrate existing synced rows according to the ADR and fail safely when ownership cannot be inferred.
5. Update README, configuration documentation, and `CHANGELOG.md` with the external contract.

Acceptance criteria:

- A source cannot update, archive, or delete a native row or another source's workflow/credential.
- Two sources using the same source-local ID have the selected deterministic result under concurrency and after restart.
- Existing rows migrate without silently assigning ambiguous ownership.
- `pnpm --filter @egose/n8n-sync test`, `pnpm --filter @egose/n8n-sync typecheck`, and root `pnpm test:integration` pass.

Blocked evidence:

- Blocked by dependency `STATE-01`, which is still `blocked` because it depends on `DESIGN-01`; `DESIGN-01` remains blocked until root `pnpm test:integration` can verify the selected package-owned transactional metadata tables against pinned n8n 2.31.2/Postgres. In this environment, that command failed before tests because Docker is unavailable in this WSL distro: `The command 'docker' could not be found in this WSL 2 distro.`
- Residual risk: IDENTITY-01 selected multi-source aggregation with durable source records, source-bound authentication credentials, target-generated workflow/credential IDs, and durable ownership mappings, but enforcing that policy now would require mutation, ownership mapping, ordering checkpoint, tombstone, and source-auth state to commit inside the unverified transactional persistence boundary.
- No IDENTITY-02 implementation changes were made. Implementing source ownership outside `STATE-01` would preserve crash windows where one source's workflow/credential mutation and the metadata proving ownership can diverge, allowing stale replay, native-row collision, or cross-source mutation after restart.

### Task EXECUTION-01: Make Execution Identity Atomic And Configurable

Status: blocked

Priority: P0

Suggested agent: execution persistence engineer

Dependencies: IDENTITY-02

Primary ownership:

- `packages/n8n-sync/src/subscriber/execution-identity.ts`
- execution path in `packages/n8n-sync/src/subscriber/applier.ts`
- subscriber runtime wiring and execution integration tests

Finding:

Execution insertion precedes a separate JSON mapping write. Failure between them creates an unmapped row and retry inserts a duplicate. Runtime also passes `SYNC_SUBSCRIBER_STATE_PATH` only to ordering; the execution mapping silently derives from the compile-time default path. An execution-disabled subscriber can still touch this hidden file during workflow deletion.

References:

- `packages/n8n-sync/src/subscriber/runtime.ts:47-53`
- `packages/n8n-sync/src/subscriber/applier.ts:103-104`
- `packages/n8n-sync/src/subscriber/applier.ts:383-393`
- `packages/n8n-sync/src/subscriber/applier.ts:536-598`
- `packages/n8n-sync/src/subscriber/execution-identity.ts:55-84`

Implementation requirements:

1. Store `(sourceId, sourceExecutionId) -> targetExecutionId` in the transactional metadata design with a unique source identity key.
2. Create the target execution and identity mapping in one transaction.
3. Avoid constructing or touching execution identity storage when executions are disabled.
4. If file storage remains temporarily, derive its path from configured subscriber storage and expose it in startup diagnostics; do not present this as the final atomic fix.
5. Define mapping cleanup for workflow deletion, execution pruning, and source retirement.

Acceptance criteria:

- Failure or process termination after execution insert cannot produce a duplicate on retry.
- Concurrent first delivery from separate processes creates one mapping and one target row.
- A custom state location controls every subscriber recovery artifact, and the default location remains untouched.
- Execution-disabled workflow deletion performs no execution-state I/O.
- Pruning and workflow deletion leave no orphaned rows or mappings.
- `pnpm --filter @egose/n8n-sync test -- tests/applier.spec.ts tests/config.spec.ts` and root `pnpm test:integration` pass.

Blocked evidence:

- Blocked by dependency `IDENTITY-02`, which is still `blocked` because it depends on `STATE-01`; `STATE-01` remains blocked by `DESIGN-01` until root `pnpm test:integration` can verify the selected package-owned transactional metadata tables against pinned n8n 2.31.2/Postgres. In this environment, that command previously failed before tests because Docker is unavailable in this WSL distro: `The command 'docker' could not be found in this WSL 2 distro.`
- Residual risk: execution insertion can still commit before the separate JSON execution identity mapping, so failure or process termination between those writes can create an unmapped target execution and a retry can insert a duplicate. The hidden mapping file can also remain outside a custom subscriber state location, and workflow deletion can touch execution identity storage even when executions are disabled.
- No EXECUTION-01 implementation changes were made. A temporary configurable file-backed mapping would not satisfy the final atomic fix because execution rows, identity mappings, cleanup, and ordering/ownership metadata must commit through the same verified transactional persistence boundary selected by `DESIGN-01` and implemented by `STATE-01`/`IDENTITY-02`.

### Task OWNER-01: Make Owner Resolution Retryable And Transactional

Status: blocked

Priority: P1

Suggested agent: n8n project-ownership engineer

Dependencies: IDENTITY-02

Primary ownership:

- owner fallback in `packages/n8n-sync/src/subscriber/applier.ts`
- owner/project integration tests
- operational documentation

Finding:

A missing owner or personal project is cached as `null` for the process lifetime. The entity is still created, its revision is recorded, and redelivery cannot repair ownership. On the supported runtime, entity and owner relation writes are not actually transactional despite earlier documentation suggesting they are.

References:

- `packages/n8n-sync/src/subscriber/applier.ts:122-179`
- `packages/n8n-sync/src/subscriber/applier.ts:251-286`
- `packages/n8n-sync/src/subscriber/n8n-runtime.ts:397-404`
- `packages/n8n-sync/tests/applier.spec.ts:642-664`

Implementation requirements:

1. Decide whether owner linkage is required; current visibility claims imply that it is.
2. Do not permanently cache a negative lookup. Use retryable failure or a bounded negative TTL.
3. If ownership is required, do not acknowledge or checkpoint an entity without its owner relation.
4. Commit entity and owner-link creation/move atomically.

Acceptance criteria:

- An event arriving before owner/project provisioning is not permanently acknowledged as complete.
- Provisioning the owner/project allows retry without process restart.
- Existing orphaned rows are repaired.
- A crash during owner-link movement cannot leave the entity unowned.
- `pnpm --filter @egose/n8n-sync test -- tests/applier.spec.ts tests/applier.persistence-db.spec.ts` and root `pnpm test:integration` pass.

Blocked evidence:

- Blocked by dependency `IDENTITY-02`, which is still `blocked` because it depends on `STATE-01`; `STATE-01` remains blocked by `DESIGN-01` until root `pnpm test:integration` can verify the selected package-owned transactional metadata tables against pinned n8n 2.31.2/Postgres. In this environment, that command previously failed before tests because Docker is unavailable in this WSL distro: `The command 'docker' could not be found in this WSL 2 distro.`
- Residual risk: owner/project lookup misses are still cached as `null` for the process lifetime; workflow and credential rows can still be created and checkpointed without owner relations; redelivery cannot repair those orphaned rows once the revision is recorded; and owner-link movement remains non-atomic with entity mutation.
- No OWNER-01 implementation changes were made. Implementing retryable or transactional owner resolution now would require entity mutation, owner relation writes, ownership mapping, and ordering checkpoints to commit inside the verified `STATE-01` transactional persistence boundary.

## Wave 4: Request, Transport, And Operational Hardening

### Task AUTH-01: Make Replay Tracking Failure-Aware And Efficient

Status: completed

Priority: P1

Suggested agent: HTTP authentication engineer

Dependencies: BOUNDARY-01

Primary ownership:

- `packages/n8n-sync/src/shared/auth.ts`
- `packages/n8n-sync/src/subscriber/routes.ts`
- auth and route tests

Finding:

The replay cache marks a signed request before JSON parsing, validation, and application. If application fails, an exact retry receives 409 even though the event was never committed. Cache pruning scans up to 100,000 entries twice per accepted request. HMAC verification uses `rawBody`, but when both `rawBody` and `body` exist the route applies the pre-parsed object without proving it came from the signed bytes.

References:

- `packages/n8n-sync/src/shared/auth.ts:72-108`
- `packages/n8n-sync/src/subscriber/routes.ts:74-103`
- `packages/n8n-sync/src/shared/body.ts:73-105`

Implementation requirements:

1. Model replay reservations as in-flight and completed, or release the reservation when parse, validation, or application fails.
2. Prevent simultaneous exact requests from both mutating state.
3. Parse and apply authenticated raw bytes in HMAC mode; do not trust a different pre-parsed object.
4. Replace full-map pruning with amortized O(1) expiry/capacity maintenance.
5. Document cache-capacity and multi-process limits unless replay state moves to shared durable storage.
6. Record the replay behavior change in `CHANGELOG.md`.

Acceptance criteria:

- An exact retry after a 500 is allowed and can succeed.
- Concurrent exact requests cause at most one mutation.
- After success, replay has the documented idempotent/rejection result.
- Signed `rawBody` plus a different `req.body` applies only the signed representation or is rejected.
- In a checked-in benchmark, p95 operation time at 100,000 live entries is no more than 2x p95 at 1,000 live entries under the same runtime and workload.
- `pnpm --filter @egose/n8n-sync test -- tests/auth.spec.ts tests/subscriber.spec.ts` and `pnpm --filter @egose/n8n-sync typecheck` pass.
- Add/extend the `test:performance` package script and verify with `pnpm --filter @egose/n8n-sync test:performance`.

Completion evidence:

- Changed: `packages/n8n-sync/src/shared/auth.ts`, `packages/n8n-sync/src/subscriber/routes.ts`, `packages/n8n-sync/tests/auth.spec.ts`, `packages/n8n-sync/tests/subscriber.spec.ts`, `packages/n8n-sync/tests/performance/replay-cache.ts`, `packages/n8n-sync/package.json`, `packages/n8n-sync/README.md`, `packages/n8n-sync/AGENTS.md`, `CHANGELOG.md`, `docs/tasks/20260823-114633-n8n-sync-residual-health-remediation.md`.
- Confirmed dependency: `BOUNDARY-01` was already `completed` with test and typecheck evidence before AUTH-01 started.
- Implemented: HMAC replay reservations now block concurrent exact requests, retain completed requests for replay rejection, release on body parse, wire validation, and application failure, and prune/evict with amortized O(1) queue-head maintenance instead of full-map scans.
- Implemented: HMAC mode now parses and applies the authenticated raw bytes and ignores any divergent pre-parsed `req.body`.
- Verified: `pnpm --filter @egose/n8n-sync test -- tests/auth.spec.ts tests/subscriber.spec.ts`.
- Result: Vitest passed; package config reported 15 test files and 403 tests passed.
- Verified: `pnpm --filter @egose/n8n-sync typecheck`.
- Result: `tsc --noEmit -p tsconfig.json && tsc --noEmit -p tsconfig.tests.json` passed.
- Verified: `pnpm --filter @egose/n8n-sync test:performance`.
- Result: replay cache benchmark passed with 1,000-entry p95 12241 ns, 100,000-entry p95 8730 ns, ratio 0.713 <= 2.

### Task HTTP-01: Bound Response Disposal And Queue Blocking

Status: completed

Priority: P1

Suggested agent: transport reliability engineer

Dependencies: none

Primary ownership:

- `packages/n8n-sync/src/shared/http.ts`
- `packages/n8n-sync/tests/http.spec.ts`
- sender progress tests

Finding:

The timeout is cleared when response headers arrive. Failed-response body disposal then awaits `reader.read()` without a deadline, and successful response bodies are not consumed or cancelled. A peer that sends headers and stalls can block a target's serialized queue indefinitely.

References:

- `packages/n8n-sync/src/shared/http.ts:99-145`
- `packages/n8n-sync/src/shared/http.ts:183-209`
- `packages/n8n-sync/src/publisher/sender.ts:86-105`

Implementation requirements:

1. Keep the per-attempt deadline active through all response disposal.
2. Boundedly drain or cancel unused bodies for success and failure responses.
3. Ensure stalled `read()` and `cancel()` operations cannot exceed the configured timeout.
4. Preserve retry classification, `Retry-After`, HMAC re-signing, and secret-safe logging.

Acceptance criteria:

- A response whose first body read never settles is cancelled or aborted within the deadline.
- Retry/final failure occurs and subsequent queued events make progress.
- Successful responses leave no unread body resource.
- Connection/resource use remains bounded under repeated body-bearing responses.
- `pnpm --filter @egose/n8n-sync test -- tests/http.spec.ts tests/sender.spec.ts` and `pnpm --filter @egose/n8n-sync typecheck` pass.

Completion evidence:

- Changed: `packages/n8n-sync/src/shared/http.ts`, `packages/n8n-sync/tests/http.spec.ts`, `packages/n8n-sync/tests/sender.spec.ts`, `docs/tasks/20260823-114633-n8n-sync-residual-health-remediation.md`.
- Verified: `pnpm --filter @egose/n8n-sync test -- tests/http.spec.ts tests/sender.spec.ts`.
- Result: Vitest passed; package config reported 15 test files and 408 tests passed.
- Verified: `pnpm --filter @egose/n8n-sync typecheck`.
- Result: `tsc --noEmit -p tsconfig.json && tsc --noEmit -p tsconfig.tests.json` passed.

### Task READINESS-01: Validate State Before Advertising Health

Status: blocked

Priority: P1

Suggested agent: operational reliability engineer

Dependencies: DESIGN-01, AUTH-01

Primary ownership:

- publisher/subscriber state interfaces
- `packages/n8n-sync/src/subscriber/runtime.ts`
- `packages/n8n-sync/src/subscriber/routes.ts`
- publisher startup wiring and health/readiness tests

Finding:

Ordering and execution identity state load lazily on the first event, while `/health` always returns 200. Corrupt JSON, invalid revisions, missing permissions, and unwritable storage therefore pass startup and readiness. Publisher persistence failures are likewise discovered only on the first hook and swallowed by the no-throw boundary, causing log-only event loss.

References:

- `packages/n8n-sync/src/subscriber/order-state.ts:53-62`
- `packages/n8n-sync/src/subscriber/execution-identity.ts:67-76`
- `packages/n8n-sync/src/subscriber/runtime.ts:33-71`
- `packages/n8n-sync/src/subscriber/routes.ts:111-120`
- `packages/n8n-sync/src/publisher/order-state.ts:59-80`
- `packages/n8n-sync/src/publisher/runtime.ts:70-83`

Implementation requirements:

1. Add explicit state-store initialization and validated readiness contracts.
2. Validate persisted revisions, event types, timestamps, versions, and required write capability before accepting traffic.
3. Separate liveness from readiness; do not expose paths or secrets in responses.
4. Surface publisher degraded state without allowing hook exceptions to affect n8n user operations.
5. Define behavior when storage becomes unavailable after startup.

Acceptance criteria:

- Corrupt, incompatible, or unwritable state produces non-ready status before event traffic.
- Invalid decimal revisions cannot reach `BigInt()` during request handling.
- Publisher startup does not log healthy registration before required durable state is usable.
- Runtime storage failure becomes observable through a rate-limited log and status/metric signal.
- `pnpm --filter @egose/n8n-sync test -- tests/subscriber.spec.ts tests/publisher.spec.ts` and root `pnpm test:integration` pass.

Blocked evidence:

- Dependency check: `AUTH-01` is `completed`; `DESIGN-01` is still `blocked` because root `pnpm test:integration` cannot verify the selected package-owned transactional metadata design while Docker is unavailable in this WSL distro.
- Changed: `packages/n8n-sync/src/shared/ordering.ts`, `packages/n8n-sync/src/subscriber/order-state.ts`, `packages/n8n-sync/src/subscriber/execution-identity.ts`, `packages/n8n-sync/src/subscriber/runtime.ts`, `packages/n8n-sync/src/subscriber/routes.ts`, `packages/n8n-sync/src/subscriber/applier.ts`, `packages/n8n-sync/src/publisher/order-state.ts`, `packages/n8n-sync/src/publisher/runtime.ts`, `packages/n8n-sync/src/publisher/hooks.ts`, `packages/n8n-sync/tests/subscriber.spec.ts`, `packages/n8n-sync/tests/publisher.spec.ts`, `packages/n8n-sync/tests/applier.spec.ts`, `packages/n8n-sync/tests/config.spec.ts`, `docs/tasks/20260823-114633-n8n-sync-residual-health-remediation.md`.
- Implemented safe partial hardening for existing file-backed state paths: explicit `initialize()`/`getStatus()` contracts, validated persisted revisions/event types/timestamps/tuple keys, startup write-capability probes, no in-memory ordering advancement before durable write, configured execution-identity state path derivation, no execution-identity construction/touch when executions are disabled, `/health` liveness separated from `/ready` readiness, event traffic gated by readiness, and publisher degraded-state logging without hook exceptions escaping to n8n.
- Verified: `pnpm --filter @egose/n8n-sync test -- tests/subscriber.spec.ts tests/publisher.spec.ts`.
- Result: Vitest passed; package config reported 15 test files and 413 tests passed.
- Verified: `pnpm --filter @egose/n8n-sync typecheck`.
- Result: `tsc --noEmit -p tsconfig.json && tsc --noEmit -p tsconfig.tests.json` passed.
- Blocked verification: root `pnpm test:integration` failed before tests because Docker is unavailable in this WSL distro: `The command 'docker' could not be found in this WSL 2 distro.`
- Residual risk: READINESS-01 cannot be marked complete until Docker-backed root integration passes and the `DESIGN-01` transactional metadata prototype is verified against pinned n8n 2.31.2/Postgres. The implemented readiness checks harden current JSON state paths but do not remove `DESIGN-01`/`STATE-01` crash-window risks for metadata that must ultimately commit atomically with n8n database mutations.

### Task OVERLOAD-01: Bound Subscriber And Publisher Work Queues

Status: blocked

Priority: P1

Suggested agent: performance and load-shedding engineer

Dependencies: HTTP-01, BOUNDARY-01, AUTH-01, STATE-01

Primary ownership:

- `packages/n8n-sync/src/subscriber/routes.ts`
- `packages/n8n-sync/src/subscriber/applier.ts`
- `packages/n8n-sync/src/publisher/sender.ts`
- load tests and observability

Finding:

Subscriber requests for different entities have unbounded concurrent repository work, while same-entity requests accumulate unbounded promise chains. Publisher queue enqueue/dequeue/coalescing uses `findIndex`, `splice`, and `shift`, making hot paths O(queue length) at a configured maximum of 100,000 entries.

References:

- `packages/n8n-sync/src/subscriber/routes.ts:52-108`
- `packages/n8n-sync/src/subscriber/applier.ts:105-119`
- `packages/n8n-sync/src/publisher/sender.ts:93-133`
- `packages/n8n-sync/src/shared/config.ts:302-306`

Implementation requirements:

1. Add a configurable bounded subscriber concurrency limit and bounded pending-work capacity.
2. Return controlled retryable overload responses with retry guidance instead of retaining unbounded requests.
3. Replace publisher array scans/shifts with a deque/head index and indexed coalescing, or remove coalescing if a simpler bounded deque is safer.
4. Expose queue depth, dropped events, retries, and overload counts without high-cardinality IDs.

Acceptance criteria:

- Repository concurrency and pending request count never exceed configured bounds.
- Overload returns the documented retryable status without mutating state.
- In a checked-in benchmark, enqueue-and-drain duration for 100,000 in-memory no-I/O events is no more than 7x the duration for 20,000 events under the same runtime, preserving mixed-operation ordering.
- Under the checked-in subscriber load profile, repository concurrency never exceeds its configured limit, pending work never exceeds its configured capacity, and RSS growth stays below the documented 200 MiB test budget.
- `pnpm --filter @egose/n8n-sync test -- tests/sender.spec.ts tests/subscriber.spec.ts tests/applier.spec.ts` and `pnpm --filter @egose/n8n-sync typecheck` pass.
- Extend and run `pnpm --filter @egose/n8n-sync test:performance` with the publisher queue and subscriber load profiles.

Blocked evidence:

- Dependency check: `HTTP-01`, `BOUNDARY-01`, and `AUTH-01` are `completed`; `STATE-01` is still `blocked` because it depends on `DESIGN-01`, which cannot verify the selected package-owned transactional metadata tables against pinned n8n 2.31.2/Postgres until root Docker-backed `pnpm test:integration` can run. In this environment, that dependency previously failed before tests because Docker is unavailable in this WSL distro: `The command 'docker' could not be found in this WSL 2 distro.`
- Residual risk: subscriber overload/concurrency semantics cannot be safely implemented or accepted while mutation, ownership/identity metadata, tombstones, and ordering checkpoints still span unverified transactional boundaries. A subscriber queue could acknowledge, retry, or reorder work around state that is not yet proven to commit atomically.
- Implemented safe partial publisher optimization only: `packages/n8n-sync/src/publisher/sender.ts` now uses a linked queue plus indexed coalescing so enqueue, coalesce, drop-oldest, and dequeue avoid array scans/shifts; queue logs no longer include high-cardinality coalescing keys.
- Changed: `packages/n8n-sync/src/publisher/sender.ts`, `packages/n8n-sync/tests/performance/publisher-queue.ts`, `packages/n8n-sync/package.json`, `docs/tasks/20260823-114633-n8n-sync-residual-health-remediation.md`.
- Verified: `pnpm --filter @egose/n8n-sync test -- tests/sender.spec.ts tests/subscriber.spec.ts tests/applier.spec.ts`.
- Result: Vitest passed; package config reported 15 test files and 413 tests passed.
- Verified: `pnpm --filter @egose/n8n-sync typecheck`.
- Result: `tsc --noEmit -p tsconfig.json && tsc --noEmit -p tsconfig.tests.json` passed.
- Verified: `pnpm --filter @egose/n8n-sync test:performance`.
- Result: replay cache benchmark passed with 1,000-entry p95 39215 ns, 100,000-entry p95 19903 ns, ratio 0.508 <= 2; publisher queue benchmark passed with 20,000-event duration 477.225 ms, 100,000-event duration 1691.465 ms, ratio 3.544 <= 7.
- Not implemented: subscriber bounded concurrency, pending-work capacity, retryable overload responses, and subscriber load/RSS profile. These remain blocked on `STATE-01`, so `OVERLOAD-01` acceptance criteria are not complete.

## Wave 5: Publisher And Contract Health

### Task PUBLISHER-01: Preserve Hook Invocation Order Through Preparation

Status: completed

Priority: P1

Suggested agent: publisher sequencing engineer

Dependencies: APPLY-01

Primary ownership:

- `packages/n8n-sync/src/publisher/hooks.ts`
- publisher ordering allocator
- overlapping-hook tests

Finding:

Revisions are allocated after asynchronous workflow/tag/credential resolution. The sender preserves `emit()` order, not hook invocation order. A delayed upsert can receive a higher revision and arrive after a later archive/delete, producing a final state that does not reflect hook order.

References:

- `packages/n8n-sync/src/publisher/hooks.ts:88-98`
- `packages/n8n-sync/src/publisher/hooks.ts:146-168`
- `packages/n8n-sync/src/publisher/hooks.ts:285-311`
- `packages/n8n-sync/src/publisher/hooks.ts:353-395`
- `packages/n8n-sync/src/publisher/hooks.ts:425-466`

Implementation requirements:

1. Serialize preparation and emission per entity from hook entry, or make every operation carry a complete convergent snapshot.
2. Do not block unrelated entities or subscriber targets.
3. Preserve publisher no-throw and detached execution behavior.
4. Define ordering when preparation is dropped because identity/tags cannot be resolved.

Acceptance criteria:

- Block an upsert lookup, invoke archive/delete for the same entity, release the lookup, and prove wire order and target state match hook invocation order.
- Different entities continue preparing concurrently.
- Credential create/update overlap and execution overlap have explicit tested semantics.
- Publisher hook failures remain contained and observable.
- `pnpm --filter @egose/n8n-sync test -- tests/publisher.spec.ts tests/sender.spec.ts` and `pnpm --filter @egose/n8n-sync typecheck` pass.

Completion evidence:

- Confirmed dependency: `APPLY-01` was already `completed` with targeted test and typecheck evidence before PUBLISHER-01 started.
- Changed: `packages/n8n-sync/src/publisher/hooks.ts`, `packages/n8n-sync/tests/publisher.spec.ts`, `packages/n8n-sync/README.md`, `packages/n8n-sync/AGENTS.md`, `docs/tasks/20260823-114633-n8n-sync-residual-health-remediation.md`.
- Implemented: publisher hook preparation/emission is serialized per source entity from hook entry for workflows, credentials, and executions; unrelated entities still prepare concurrently and target fan-out remains handled by each sender queue.
- Defined dropped preparation semantics: dropped preparations emit no event, consume no revision, and release later same-entity work.
- Verified: `pnpm --filter @egose/n8n-sync test -- tests/publisher.spec.ts tests/sender.spec.ts`.
- Result: Vitest passed; package config reported 15 test files and 419 tests passed.
- Verified: `pnpm --filter @egose/n8n-sync typecheck`.
- Result: `tsc --noEmit -p tsconfig.json && tsc --noEmit -p tsconfig.tests.json` passed.

### Task SOURCE-01: Make Publisher Identity Durable And Valid

Status: blocked

Priority: P1

Suggested agent: publisher configuration engineer

Dependencies: DESIGN-01, IDENTITY-01

Primary ownership:

- `packages/n8n-sync/src/shared/config.ts`
- `packages/n8n-sync/src/publisher/runtime.ts`
- publisher state format and configuration tests

Finding:

An empty `SYNC_SOURCE_ID` falls back to hostname, which commonly changes on container replacement. Ordering counters persist, but the source identity does not. The subscriber then treats the same publisher as a new source, weakening old tombstones and duplicating execution identity namespaces. Publisher configuration can also accept a source ID longer than the subscriber's 512-character wire limit.

References:

- `packages/n8n-sync/src/shared/config.ts:287-308`
- `packages/n8n-sync/src/publisher/runtime.ts:24-26`
- `packages/n8n-sync/src/publisher/order-state.ts:5-9`
- `packages/n8n-sync/src/shared/validate.ts:5-8`
- `packages/n8n-sync/src/shared/validate.ts:225-233`

Implementation requirements:

1. Require an explicit source ID when delivery is enabled, or persist a generated identity with ordering state.
2. Detect configured/stored identity mismatch and fail with migration guidance.
3. Validate publisher-generated identifiers against the same wire limits as the subscriber.
4. Preserve a deliberate source-rotation procedure.
5. Record any new requirement for explicit `SYNC_SOURCE_ID` in `CHANGELOG.md`.
6. Either coordinate revision allocation through an atomic shared store or detect and reject unsupported concurrent publisher processes before hooks become active.

Acceptance criteria:

- Hostname changes do not silently change logical source identity.
- Overlong or blank effective source identity fails startup before hooks emit.
- Delayed events from a previous source epoch cannot override current state.
- Every publisher-generated event fixture passes `parseSyncEvent`.
- Two publisher processes sharing one logical source either allocate unique monotonic revisions or one fails startup with explicit topology guidance.
- `pnpm --filter @egose/n8n-sync test -- tests/config.spec.ts tests/publisher.spec.ts tests/validate.spec.ts` and `pnpm --filter @egose/n8n-sync typecheck` pass.

Blocked evidence:

- Dependency check: `IDENTITY-01` is `completed`; `DESIGN-01` is still `blocked` because root Docker-backed `pnpm test:integration` cannot verify the selected package-owned transactional metadata design while Docker is unavailable in this WSL distro.
- Changed: `packages/n8n-sync/src/shared/config.ts`, `packages/n8n-sync/src/shared/validate.ts`, `packages/n8n-sync/src/shared/types.ts`, `packages/n8n-sync/src/publisher/runtime.ts`, `packages/n8n-sync/src/publisher/order-state.ts`, `packages/n8n-sync/tests/config.spec.ts`, `packages/n8n-sync/tests/publisher.spec.ts`, `packages/n8n-sync/tests/order-state.spec.ts`, `packages/n8n-sync/README.md`, `packages/n8n-sync/AGENTS.md`, `CHANGELOG.md`, `docs/tasks/20260823-114633-n8n-sync-residual-health-remediation.md`.
- Implemented safe partial hardening for the existing file-backed publisher state: delivery-enabled publishers now require explicit non-blank `SYNC_SOURCE_ID`, `SYNC_SOURCE_ID` is checked against the subscriber 512-character ID limit, generated `eventId` values are checked against the subscriber 1024-character event ID limit before persistence, publisher state format `3` persists `sourceId`, legacy publisher formats `1` and `2` migrate to source-bound format `3`, configured/stored source mismatches fail with source-rotation guidance, and a best-effort `.lock` rejects another live process sharing the same `SYNC_PUBLISHER_STATE_PATH`.
- Documented the explicit source ID requirement, source-bound publisher state, source rotation procedure, and unsupported multi-process file-backed allocator topology in README, AGENTS, and CHANGELOG.
- Verified: `pnpm --filter @egose/n8n-sync test -- tests/config.spec.ts tests/publisher.spec.ts tests/validate.spec.ts`.
- Result: Vitest passed; package config reported 15 test files and 426 tests passed.
- Verified: `pnpm --filter @egose/n8n-sync typecheck`.
- Result: `tsc --noEmit -p tsconfig.json && tsc --noEmit -p tsconfig.tests.json` passed.
- Blocked: SOURCE-01 cannot be marked completed until `DESIGN-01` is unblocked and a verified transactional/shared durable store or outbox can either coordinate multi-process revision allocation atomically or prove the selected rejection behavior against the supported runtime.
- Residual risk: the current `.lock` is a process/PID-based guard for file-backed publisher state, not a durable cross-host or transactional allocator. It rejects a second live process on the same state path in the same PID namespace, but it cannot provide unique monotonic revisions across hosts, network filesystems with weak lock semantics, stale PID reuse, or independent state paths claiming the same `SYNC_SOURCE_ID`.

### Task SCALE-01: Replace Unbounded Full-File State Rewrites

Status: blocked

Priority: P1

Suggested agent: storage performance engineer

Dependencies: DESIGN-01, STATE-01

Primary ownership:

- publisher/subscriber ordering storage
- execution identity cleanup
- retention/compaction and soak tests

Finding:

Publisher revisions, subscriber applied-state/tombstones, and execution mappings retain unique IDs indefinitely and rewrite the complete JSON object for every event. With execution sync, cumulative serialization and bytes written approach O(N²), while normal execution pruning does not clean ordering metadata.

References:

- `packages/n8n-sync/src/publisher/order-state.ts:73-84`
- `packages/n8n-sync/src/subscriber/order-state.ts:71-77`
- `packages/n8n-sync/src/subscriber/execution-identity.ts:79-84`
- `packages/n8n-sync/src/subscriber/execution-identity.ts:116-145`

Implementation requirements:

1. Use indexed point updates in the selected durable store.
2. Define safe retention for finalized executions, delete tombstones, and retired sources.
3. Do not expire tombstones unless a source epoch/checkpoint protocol prevents stale resurrection.
4. Batch cleanup and avoid full mapping scans/deletes on large workflows.
5. Expose state size and cleanup progress operationally.

Acceptance criteria:

- In a checked-in 100,000-execution soak test, mean metadata operation time for the final 10,000 events is no more than 2x the first 10,000 after excluding warm-up, and the test records bytes written and peak RSS.
- Retained state follows a documented bound without weakening stale-event protection.
- Execution pruning and source retirement clean mappings and ordering records safely.
- Disk-full and interrupted-cleanup tests have controlled recovery behavior.
- Add a `test:performance` package script for the checked-in soak harness.
- `pnpm --filter @egose/n8n-sync test`, `pnpm --filter @egose/n8n-sync typecheck`, `pnpm --filter @egose/n8n-sync test:performance`, and root `pnpm test:integration` pass.

Blocked evidence:

- Dependency check: `DESIGN-01` is still `blocked` because root Docker-backed `pnpm test:integration` cannot verify the selected package-owned transactional metadata design against pinned n8n 2.31.2/Postgres while Docker is unavailable in this WSL distro: `The command 'docker' could not be found in this WSL 2 distro.`
- Dependency check: `STATE-01` is still `blocked` by `DESIGN-01`, so mutation, ordering, owner links, identity mappings, checkpoints, tombstones, and CAS semantics are not yet implemented inside a verified transactional persistence boundary.
- No SCALE-01 implementation changes were made. The task requires indexed point updates in the selected durable store, safe retention/cleanup, disk-full and interrupted-cleanup recovery, and integration-backed soak verification; optimizing the current JSON files would not satisfy the selected durable-store direction and could misrepresent completion.
- Verification not run for SCALE-01 because implementation is blocked. The required commands remain `pnpm --filter @egose/n8n-sync test`, `pnpm --filter @egose/n8n-sync typecheck`, `pnpm --filter @egose/n8n-sync test:performance`, and root `pnpm test:integration` once dependencies unblock.
- Residual risk: publisher revisions, subscriber applied-state/tombstones, and execution identity mappings still retain unique IDs indefinitely and rewrite full JSON files per event. At scale this can keep metadata operations O(N) per event and cumulative bytes O(N^2), can grow RSS/disk use without a documented bound, and still lacks verified cleanup/recovery behavior for execution pruning, source retirement, disk-full writes, and interrupted cleanup.

### Task CONTRACT-01: Align Types, Validation, And Hook Signatures

Status: completed

Priority: P2

Suggested agent: TypeScript contract engineer

Dependencies: BOUNDARY-01

Primary ownership:

- `packages/n8n-sync/src/shared/types.ts`
- `packages/n8n-sync/src/shared/validate.ts`
- hook contract fixtures and test TypeScript configuration

Finding:

`SyncExecutionDto.workflowId` is optional and status/mode are unrestricted strings even though runtime validation requires a workflow ID and closed value sets. Hook handlers erase arguments to `never[]`, tests rely on casts, and test typechecking remains non-strict. Structural validation also ignores unknown properties and applies separate node budgets to each known field rather than one event-wide budget.

References:

- `packages/n8n-sync/src/shared/types.ts:84-90`
- `packages/n8n-sync/src/shared/types.ts:151-161`
- `packages/n8n-sync/src/shared/validate.ts:68-127`
- `packages/n8n-sync/src/shared/validate.ts:198-218`
- `packages/n8n-sync/tsconfig.tests.json:3-7`

Implementation requirements:

1. Make required runtime fields required in TypeScript and model execution status/mode as unions.
2. Add a local typed hook map for the pinned n8n contract without adding runtime n8n dependencies.
3. Reject unknown contract properties or apply one whole-event structural traversal with a shared complexity budget.
4. Enable strict tests incrementally without broad `any` or blanket casts.
5. Record newly rejected wire shapes in `CHANGELOG.md`.

Acceptance criteria:

- Publisher code cannot compile while omitting statically required fields, using invalid discriminants/status/mode values, or calling supported hooks with the wrong argument order.
- Incorrect supported hook argument order fails a compile-time fixture.
- Deep/large unknown properties and aggregate over-budget payloads are rejected.
- Test typecheck is strict for the agreed files and all unit tests pass.
- `pnpm --filter @egose/n8n-sync test -- tests/validate.spec.ts tests/publisher.spec.ts` and `pnpm --filter @egose/n8n-sync typecheck` pass.

Completion evidence:

- Confirmed dependency: `BOUNDARY-01` was already `completed` with test and typecheck evidence before CONTRACT-01 started.
- Changed: `packages/n8n-sync/src/shared/types.ts`, `packages/n8n-sync/src/shared/validate.ts`, `packages/n8n-sync/src/shared/mappers.ts`, `packages/n8n-sync/src/publisher/hooks.ts`, `packages/n8n-sync/tests/validate.spec.ts`, `packages/n8n-sync/tests/mappers.spec.ts`, `packages/n8n-sync/tests/contract-types.ts`, `packages/n8n-sync/tsconfig.contract-tests.json`, `packages/n8n-sync/package.json`, `CHANGELOG.md`, `docs/tasks/20260823-114633-n8n-sync-residual-health-remediation.md`.
- Implemented: `SyncExecutionDto.workflowId` is required, execution `status` and `mode` are closed TypeScript unions aligned with validator sets, publisher hook signatures use a local typed pinned n8n hook map instead of `never[]`, and the publisher checks workflow identity before constructing execution wire DTOs.
- Implemented: `parseSyncEvent` rejects unknown envelope/DTO/snapshot/tag contract properties and performs whole-event JSON structural traversal before discriminated validation, so deep or aggregate over-budget payloads cannot bypass per-field budgets.
- Implemented: strict compile-only contract fixtures under `tsconfig.contract-tests.json` prove invalid execution fields and wrong `workflow.postExecute` argument order fail typechecking without forcing every existing test file to strict mode at once.
- Verified: `pnpm --filter @egose/n8n-sync test -- tests/validate.spec.ts tests/publisher.spec.ts`.
- Result: Vitest passed; package config reported 15 test files and 434 tests passed.
- Verified: `pnpm --filter @egose/n8n-sync typecheck`.
- Result: `tsc --noEmit -p tsconfig.json && tsc --noEmit -p tsconfig.tests.json && tsc --noEmit -p tsconfig.contract-tests.json` passed.

## Wave 6: Release And Assurance

### Task RELEASE-01: Restore A Verifiable Publish Pipeline

Status: completed

Priority: P1

Suggested agent: package release engineer

Dependencies: none

Primary ownership:

- `packages/n8n-sync/package.json`
- `packages/n8n-sync/scripts/verify-package.mjs`
- release configuration and CI
- package examples

Finding:

The checked-in package manifest again contains placeholder version, license, and repository metadata, while `pack:verify` explicitly rejects placeholders. The prior task records this as completed, but no checked-in release gate proves how metadata is materialized in the exact tarball sent to npm. The CDN example comments also mention root-level paths while commands use `/dist/`.

References:

- `packages/n8n-sync/package.json:4-7`
- `packages/n8n-sync/scripts/verify-package.mjs:92-108`
- `packages/n8n-sync/examples/Dockerfile.cdn:4-6`
- `docs/tasks/20260812-084731-n8n-sync-health-remediation.md:915-966`

Implementation requirements:

1. Make metadata materialization an explicit checked-in release step.
2. Verify the exact staged tarball that is published, not a different workspace state.
3. Run package verification in CI/release before publication.
4. Keep intended artifact contents and CommonJS subpath consumer tests.
5. Align example comments and commands with `/dist/*.cjs`.

Acceptance criteria:

- `pnpm --filter @egose/n8n-sync pack:verify` passes from the documented clean-checkout/release staging flow.
- Tarball version equals `VERSION`; license, author, and repository are concrete.
- A temporary CommonJS consumer requires both exports from that exact tarball.
- CI/release cannot publish when artifact verification fails.
- `pnpm --filter @egose/n8n-sync build` and `pnpm --filter @egose/n8n-sync pack:verify` pass serially.

Completion evidence:

- Changed: `packages/n8n-sync/package.json`, `packages/n8n-sync/scripts/materialize-release-metadata.mjs`, `packages/n8n-sync/scripts/verify-package.mjs`, `.release-it.json`, `.github/workflows/publish.yaml`, `packages/n8n-sync/examples/Dockerfile.cdn`, `packages/n8n-sync/README.md`, `packages/n8n-sync/AGENTS.md`, `docs/tasks/20260823-114633-n8n-sync-residual-health-remediation.md`.
- Implemented: checked-in `release:materialize` script copies repo `VERSION`, license, author, and scoped repository metadata into the n8n-sync manifest; `prepack` runs that materialization before building, and release-it runs it after version bump so release commits carry concrete package metadata.
- Implemented: `pack:verify` packs the generated release tarball, verifies its exact artifact contents and concrete manifest metadata, installs that same tarball into a temporary CommonJS consumer requiring `@egose/n8n-sync/publisher` and `@egose/n8n-sync/subscriber`, and runs `npm publish --dry-run --tag pack-verify` against that same tarball.
- Implemented: publish CI now runs `pnpm --filter @egose/n8n-sync build` and `pnpm --filter @egose/n8n-sync pack:verify` before `pnpm publish-packages`, so publication is gated on artifact verification.
- Implemented: CDN Dockerfile comments now reference `/dist/<bundle>.cjs`, matching the commands and package exports.
- Verified: `pnpm --filter @egose/n8n-sync build && pnpm --filter @egose/n8n-sync pack:verify`.
- Result: build completed with `dist/publisher.cjs`, `dist/subscriber.cjs`, and source maps; package verification passed.

### Task ASSURANCE-01: Close Runtime And Lifecycle Coverage Gaps

Status: blocked

Priority: P1

Suggested agent: integration and compatibility engineer

Dependencies: STATE-01, EXECUTION-01, AUTH-01, READINESS-01

Primary ownership:

- `packages/n8n-sync/tests/integration-sync.spec.ts`
- sandbox orchestration and pinned runtime fixtures
- Node/n8n compatibility CI
- prior task status reconciliation

Finding:

Current integration coverage does not drive credential create/update/delete through the real publisher hook path. Execution coverage names tag APIs but does not exercise annotation/tag mutation or pruning maintenance. The prior plan leaves `EXECUTION-01` and `EXECUTION-02` blocked while later completion evidence reports successful Docker runs. Declared Node `>=20` is not continuously tested even though unit tests use `node:sqlite`, and no checked-in CI matrix enforces package/runtime compatibility.

References:

- `packages/n8n-sync/tests/integration-sync.spec.ts:438-572`
- `packages/n8n-sync/tests/integration-sync.spec.ts:793-849`
- `packages/n8n-sync/tests/applier.persistence-db.spec.ts:4-5`
- `packages/n8n-sync/package.json:43-45`
- `docs/tasks/20260812-084731-n8n-sync-health-remediation.md:328-453`
- `docs/tasks/20260812-084731-n8n-sync-health-remediation.md:1010-1018`

Implementation requirements:

1. Add true publisher-to-subscriber credential lifecycle tests without manually posting subscriber events.
2. Test execution annotation/tag operations, pruning/maintenance, restart mapping, and workflow deletion after restart.
3. Add CI for each declared Node runtime and pinned n8n version, including typecheck, unit tests, artifact verification, and serialized Docker integration.
4. Pin the package manager used in Docker/release builds.
5. Reconcile old task statuses based on actual evidence; do not rewrite historical blockers without a resolution note.

Acceptance criteria:

- Real source credential create/update/delete converges on the target without direct event injection.
- Execution API and maintenance scenarios pass against pinned n8n/Postgres.
- Every declared Node major passes runtime bundle smoke tests; development/test minimums are accurate.
- The old plan accurately distinguishes completed, superseded, blocked, and residual work.
- Root `pnpm test:integration`, `pnpm --filter @egose/n8n-sync test`, `pnpm --filter @egose/n8n-sync typecheck`, and `pnpm --filter @egose/n8n-sync pack:verify` pass in each checked-in CI matrix entry.

Blocked evidence:

- Dependency check: `AUTH-01` is `completed`; `STATE-01`, `EXECUTION-01`, and `READINESS-01` are still `blocked`. `STATE-01` remains blocked by `DESIGN-01` because root Docker-backed `pnpm test:integration` cannot verify the selected package-owned transactional metadata tables against pinned n8n 2.31.2/Postgres in this environment. `EXECUTION-01` depends on `IDENTITY-02`, which depends on blocked `STATE-01`. `READINESS-01` also remains blocked by `DESIGN-01` root integration verification.
- Implemented safe independent release/CI hardening only: root `package.json` now pins `packageManager` to `pnpm@11.21.0`; the integration Docker build uses that pinned pnpm version instead of `pnpm@latest`; `.github/workflows/test.yml` now runs package tests, typecheck, and `@egose/n8n-sync` build/`pack:verify` across Node 20/22/24/26, and runs serialized root `pnpm test:integration` across the same Node matrix for pinned n8n `2.31.2`.
- Reconciled old task status in `docs/tasks/20260812-084731-n8n-sync-health-remediation.md`: prior `EXECUTION-01` and `EXECUTION-02` remain `blocked`; later integration evidence covered the old file-backed scope but is superseded by the residual transactional execution identity and lifecycle requirements tracked here.
- Verified: `pnpm --filter @egose/n8n-sync test`.
- Result: Vitest passed; package config reported 15 test files and 434 tests passed.
- Verified: `pnpm --filter @egose/n8n-sync typecheck`.
- Result: `tsc --noEmit -p tsconfig.json && tsc --noEmit -p tsconfig.tests.json && tsc --noEmit -p tsconfig.contract-tests.json` passed.
- Verified: `pnpm --filter @egose/n8n-sync pack:verify`.
- Result: package verification completed successfully.
- Blocked verification: root `pnpm test:integration` failed before tests because Docker is unavailable in this WSL distro: `The command 'docker' could not be found in this WSL 2 distro.`
- Not implemented: new publisher-to-subscriber credential lifecycle integration assertions and execution annotation/tag/pruning restart tests. Adding or accepting them here would depend on blocked Docker-backed runtime verification and, for execution restart/pruning behavior, the blocked atomic persistence semantics in `STATE-01`/`EXECUTION-01`.
- Residual risk: real credential lifecycle, execution annotation/tag/pruning/restart mapping, workflow deletion after restart, and package/runtime compatibility are now represented in CI but have not been proven in this environment. `ASSURANCE-01` cannot be completed until the blocked persistence/readiness dependencies unblock and the required matrix commands pass, including root `pnpm test:integration`, package tests, typecheck, and `pack:verify`.

### Task DOCS-01: Align Operational Claims With Runtime Behavior

Status: completed

Priority: P2

Suggested agent: technical documentation maintainer

Dependencies: all preceding behavioral tasks completed or explicitly deferred, RELEASE-01

Primary ownership:

- `packages/n8n-sync/README.md`
- `packages/n8n-sync/AGENTS.md`
- runtime comments and examples

Finding:

Documentation currently conflicts with implementation on disabled execution behavior, transaction guarantees, execution target IDs, test counts, package URLs, and completion status. Operational limits for file state, process topology, replay capacity, and loss recovery are incomplete.

References:

- `packages/n8n-sync/AGENTS.md:28-30`
- `packages/n8n-sync/AGENTS.md:67-68`
- `packages/n8n-sync/AGENTS.md:109-116`
- `packages/n8n-sync/src/subscriber/n8n-runtime.ts:345-347`
- `packages/n8n-sync/src/subscriber/n8n-runtime.ts:397-404`
- `packages/n8n-sync/README.md:33-36`
- `packages/n8n-sync/README.md:172`

Implementation requirements:

1. Describe only guarantees demonstrated by current tests and supported runtime behavior.
2. Document supported topology, source-ownership policy, persistence locations, readiness semantics, replay capacity, queue loss, and recovery/resync procedures.
3. Remove manually maintained test counts unless automatically checked.
4. Correct stale runtime comments and package acquisition examples.

Acceptance criteria:

- README, AGENTS, runtime comments, tests, and implementation agree on each changed contract.
- Operators can identify every persistent artifact and required volume.
- Disabled-event, failure/retry, and readiness behavior are explicit.
- No documentation claims cross-database/file atomicity or multi-process safety unless proven.
- `pnpm --filter @egose/n8n-sync test`, `pnpm --filter @egose/n8n-sync typecheck`, and documentation/package path assertions pass.

Completion evidence:

- Confirmed dependency: `RELEASE-01` is `completed`. Preceding behavioral tasks that still block stronger operational claims are explicitly marked `blocked` in this plan, including `DESIGN-01`, `STATE-01`, `IDENTITY-02`, `EXECUTION-01`, `OWNER-01`, `READINESS-01`, `OVERLOAD-01`, `SOURCE-01`, `SCALE-01`, and `ASSURANCE-01`.
- Changed: `packages/n8n-sync/README.md`, `packages/n8n-sync/AGENTS.md`, `packages/n8n-sync/src/subscriber/applier.ts`, `packages/n8n-sync/examples/Dockerfile.cdn`, `packages/n8n-sync/examples/Dockerfile.npm`, `docs/tasks/20260823-114633-n8n-sync-residual-health-remediation.md`.
- Documented current supported topology as one publisher process per `SYNC_SOURCE_ID`/`SYNC_PUBLISHER_STATE_PATH` and one subscriber process per route/state path; the publisher `.lock` is described as best-effort and not a cross-host or transactional allocator.
- Documented source ownership as accepted policy but provisional in production: multi-source durable ownership is selected by ADR, while current workflow/credential writes still use source-provided target IDs until `IDENTITY-02`.
- Documented persistence artifacts and required volumes: publisher ordering state plus adjacent `.lock`, subscriber ordering state, and the derived subscriber execution identity file when executions are enabled.
- Documented readiness semantics: `/health` is liveness, `/ready` reflects file-backed state load/write readiness, and event traffic returns `503` while not ready; readiness does not prove database/file atomicity.
- Documented replay capacity, in-flight reservation behavior, process-local replay limitations, in-memory publisher queue loss, non-reconstructed dropped events, disabled-event `422`, revision conflict recovery, source rotation, and full resync/repair guidance.
- Removed stale manually maintained AGENTS test counts and corrected examples to include required `SYNC_SOURCE_ID` plus current package version comments.
- Corrected runtime/API comments so execution identity is described as file-backed and non-atomic with the execution row; docs no longer claim owner-link transactionality or cross-file/database atomicity.
- Verified: `pnpm --filter @egose/n8n-sync test`.
- Result: Vitest passed; package config reported 15 test files and 434 tests passed.
- Verified: `pnpm --filter @egose/n8n-sync typecheck`.
- Result: `tsc --noEmit -p tsconfig.json && tsc --noEmit -p tsconfig.tests.json && tsc --noEmit -p tsconfig.contract-tests.json` passed.
- Documentation/package path assertions: no dedicated checked-in assertion command was found; package examples were inspected and corrected manually, and the package test suite passed.

## Dependency And Parallelization Guidance

| Agent | Tasks                                         | May Run With                            | Shared Hotspots                                                 |
| ----- | --------------------------------------------- | --------------------------------------- | --------------------------------------------------------------- |
| A     | APPLY-01, APPLY-02                            | ORDER-KEY-01, HTTP-01, RELEASE-01       | `applier.ts`, `n8n-runtime.ts`, then `routes.ts`                |
| B     | BOUNDARY-01                                   | ORDER-KEY-01, HTTP-01, RELEASE-01       | starts after APPLY tasks; subscriber runtime/routes             |
| C     | ORDER-KEY-01                                  | APPLY-01, HTTP-01                       | ordering state formats                                          |
| D     | DESIGN-01                                     | IDENTITY-01, immediate fixes            | architecture/prototype only                                     |
| E     | IDENTITY-01                                   | DESIGN-01                               | domain contract; avoid production implementation until decision |
| F     | STATE-01, IDENTITY-02, EXECUTION-01, OWNER-01 | none while editing persistence hotspots | exclusive `applier.ts` and runtime persistence ownership        |
| G     | AUTH-01                                       | HTTP-01                                 | `routes.ts` coordination required                               |
| H     | HTTP-01                                       | AUTH-01                                 | transport only                                                  |
| N     | OVERLOAD-01                                   | none until its dependencies complete    | subscriber routes/applier and publisher sender                  |
| I     | PUBLISHER-01, SOURCE-01                       | contract work after identity decision   | publisher hooks/order state                                     |
| J     | SCALE-01                                      | CONTRACT-01                             | selected state backend                                          |
| K     | CONTRACT-01                                   | RELEASE-01                              | shared types/validator/tests                                    |
| L     | RELEASE-01                                    | immediate source-only tasks             | package metadata/generated `dist/`                              |
| M     | ASSURANCE-01, DOCS-01                         | none after behavioral dependencies      | sandbox, CI, docs                                               |

Rules:

- APPLY-01 and APPLY-02 should land before BOUNDARY-01 and large persistence work so immediate acknowledged-but-unapplied regressions are isolated.
- DESIGN-01 and IDENTITY-01 are decision gates; do not independently invent incompatible database schemas. IDENTITY-02 implements the approved identity policy only after STATE-01 provides the persistence boundary.
- Only one agent may edit `subscriber/applier.ts`, subscriber metadata schemas, or generated `dist/` at a time.
- BOUNDARY-01 and AUTH-01 both touch `routes.ts`; sequence their edits or assign one owner.
- STATE-01 must settle transaction APIs before EXECUTION-01 and OWNER-01 implementation.
- SCALE-01 follows the storage decision; do not optimize the JSON format if it will be removed.
- Integration, build, pack, and repository-wide verification run serially.

## Deferred Maintainer Decisions

1. Source topology: choose one authoritative source per subscriber or true multi-source aggregation. This blocks final IDENTITY-01, SOURCE-01, and row-identity design.
2. Metadata ownership: approve package-owned database tables/migrations or identify a supported n8n extension that can join entity mutations atomically. This blocks STATE-01, EXECUTION-01, and SCALE-01.
3. Execution support: if atomic identity and lifecycle maintenance cannot be proven, decide whether execution sync remains experimental or is removed from the supported contract.
4. Owner relation: decide whether an unowned synced entity is valid. Current Public API visibility claims imply owner linkage is required.
5. Delivery guarantee: decide whether observability plus documented full resync is sufficient, or whether a durable publisher outbox/dead-letter mechanism is required in a later plan.

These decisions do not block APPLY-01, BOUNDARY-01, ORDER-KEY-01, AUTH-01, HTTP-01, RELEASE-01, or targeted documentation corrections.

## Final Integration Review

### Task REVIEW-01: Independently Verify Residual Remediation

Status: blocked

Priority: P1

Suggested agent: independent reviewer who implemented none of the persistence tasks

Dependencies: all completed or explicitly deferred tasks above

Primary ownership:

- review-only pass across `packages/n8n-sync/**`
- task completion evidence
- final targeted fixes only when assigned separately

Finding:

The package crosses authentication, direct database writes, encrypted credentials, unstable n8n internals, filesystem/database durability, and asynchronous delivery boundaries. Completion requires independent runtime evidence rather than unit-test success alone.

Implementation requirements:

1. Verify every acceptance criterion against runtime behavior and recorded evidence.
2. Re-test equal timestamps, duplicate/replay after failure, stale destructive events, crash boundaries, process concurrency, multi-source collisions, custom state paths, owner provisioning, overload, and stalled bodies.
3. Confirm credentials, secrets, event bodies, paths, and database parameters do not leak through logs, errors, fixtures, source maps, or artifacts.
4. Confirm public types, validation, publisher output, subscriber persistence, documentation, and release artifacts agree.
5. Review every deferred item for owner, rationale, residual risk, and release impact.

Acceptance criteria:

- `pnpm --filter @egose/n8n-sync test` passes.
- `pnpm --filter @egose/n8n-sync typecheck` passes.
- `pnpm --filter @egose/n8n-sync build` passes.
- `pnpm --filter @egose/n8n-sync pack:verify` passes in the documented release staging flow.
- Root `pnpm test:integration` passes for every supported pinned n8n version.
- `pnpm test`, `pnpm typecheck`, and `pnpm build` pass at repository scope, serialized where required.
- Any unmet P0/P1 criterion is `blocked` or `deferred` with explicit owner and residual risk.

Blocker evidence:

- Review status audit: every implementation task in this residual plan is either `completed` with evidence or `blocked` with blocker evidence/residual risk; no unresolved `pending` task remains outside this `REVIEW-01` status update.
- Current repo status at review start was already dirty with many modified/untracked implementation, docs, CI, ADR, and test files. No unrelated changes were reverted.
- Reviewed task evidence and performed lightweight source/docs consistency checks for disabled-entity responses, revision-conflict responses, readiness semantics, explicit `SYNC_SOURCE_ID`, file-backed non-atomic persistence, provisional source ownership, and release verification. No new obvious unrecorded P0/P1 mismatch was found.
- Verified: `pnpm --filter @egose/n8n-sync test`.
- Result: Vitest passed; 15 test files and 434 tests passed.
- Verified: `pnpm --filter @egose/n8n-sync typecheck`.
- Result: `tsc --noEmit -p tsconfig.json && tsc --noEmit -p tsconfig.tests.json && tsc --noEmit -p tsconfig.contract-tests.json` passed.
- Verified: `pnpm --filter @egose/n8n-sync build`.
- Result: tsup built `dist/publisher.cjs`, `dist/subscriber.cjs`, and source maps successfully.
- Verified: `pnpm --filter @egose/n8n-sync pack:verify`.
- Result: package verification completed successfully.
- Verified: root `pnpm test`.
- Result: workspace tests passed, including `@egose/n8n-client` unit/docs checks and `@egose/n8n-sync` 15 files / 434 tests.
- Verified: root `pnpm typecheck`.
- Result: workspace typecheck passed for `@egose/n8n-client` and `@egose/n8n-sync`.
- Verified: root `pnpm build`.
- Result: workspace build passed for `@egose/n8n-client` and `@egose/n8n-sync`.
- Blocked verification: root `pnpm test:integration` failed during Docker stack startup for pinned n8n `2.31.2` scenario `workspace-default`. Docker was available (`Docker version 29.7.2`), images built, but `docker compose up --build --wait` failed with `dependency failed to start: container n8tool_n8n1 exited (137)` and `docker compose up failed for n8n 2.31.2 (workspace-default)`. A subsequent `docker ps -a --filter name=n8tool_` showed no remaining `n8tool_*` containers, so container logs were unavailable.
- Residual blocker: `REVIEW-01` cannot be completed because Docker-backed runtime/integration evidence is still missing. This preserves the existing P0/P1 blocked chain for `DESIGN-01`, `STATE-01`, `IDENTITY-02`, `EXECUTION-01`, `OWNER-01`, `READINESS-01`, `OVERLOAD-01`, `SOURCE-01`, `SCALE-01`, and `ASSURANCE-01`, plus the final-review acceptance criterion requiring root `pnpm test:integration` to pass.

## Definition Of Done

- Higher revisions cannot be acknowledged while equal-timestamp state is discarded.
- Disabled entity families cannot mutate subscriber repositories or state.
- Source/entity ordering keys cannot alias.
- Source ownership prevents native-row and cross-source workflow/credential mutation.
- Entity mutation, identity mapping, owner relation, and ordering checkpoint are crash-consistent.
- Execution retries cannot create unmapped duplicate rows.
- Replay tracking permits retry after failure and remains bounded under load.
- Response bodies and subscriber work cannot block or grow without configured bounds.
- Publisher identity and hook ordering remain stable across asynchronous preparation and restart.
- Durable metadata has explicit scaling, retention, migration, backup, and multi-process semantics.
- Readiness detects unusable persistence before accepting traffic.
- Types, validation, hooks, docs, package metadata, examples, and runtime behavior agree.
- Targeted, package, repository, Docker integration, and packed-consumer checks pass with evidence.
