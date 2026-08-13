# n8n Sync Health Remediation

Created: 2026-08-12 08:47:31 PDT

## Objective

Improve `packages/n8n-sync` correctness, security, performance, readability, encapsulation, reusability, testability, and compatibility with supported n8n releases. Address confirmed state-loss and state-corruption paths first, then harden untrusted boundaries, clarify runtime contracts, and add package and integration assurance.

## Scope

- `packages/n8n-sync/src/**`
- `packages/n8n-sync/tests/**`
- `packages/n8n-sync/package.json`, TypeScript, tsup, and Vitest configuration
- `packages/n8n-sync/README.md`, `packages/n8n-sync/AGENTS.md`, and `packages/n8n-sync/examples/**`
- Sandbox and CI changes required for version-pinned integration tests

## Working Rules

- Do not revert or rewrite unrelated concurrent changes.
- Add a regression test that fails on the old implementation before fixing confirmed behavior.
- Treat publisher hooks as a strict no-throw boundary, including repository lookups and fire-and-forget promises.
- Do not preserve source database IDs where they are not globally unique.
- Do not claim replay prevention, encrypted credential passthrough, execution API compatibility, or last-write-wins semantics beyond what tests prove.
- Prefer one enforcement point for configuration parsing, event validation, authentication, ordering, and repository transactions.
- Never log credential data, shared secrets, sync authentication headers, URL userinfo, or raw event bodies.
- Preserve exact raw bytes for HMAC verification. Do not authenticate a reconstructed JSON representation unless a canonical signing contract is deliberately introduced.
- Keep the bundles dependency-free at runtime unless a task records and justifies a contract change.
- Do not run package builds concurrently because `dist/` is a shared generated output.

## Non-Goals

- Add polling to compensate for n8n's missing workflow deactivation hook.
- Make active-state database writes register target triggers or webhooks.
- Sync per-step execution data before the execution-summary contract is proven safe.
- Build a durable publisher queue without a separate reliability requirement and storage design.
- Support unbounded n8n versions through unstable internal repositories.

## Baseline Verification

Run on 2026-08-12 before creating this plan:

- `pnpm --filter @egose/n8n-sync test`: passed, 9 files and 146 tests.
- `pnpm --filter @egose/n8n-sync typecheck`: passed.
- `pnpm --filter @egose/n8n-sync build`: passed; generated both CJS bundles and source maps.
- `git status --short`: clean before baseline verification.
- Integration tests were not run because they require the external n8n sandbox and secrets.

The green baseline does not cover concurrent subscriber requests, execution sync, real database constraints, replayed signed requests, invalid configuration, package tarball consumers, runtime-module compatibility, or publisher dependency failures.

## Priority Definitions

- P0: confirmed state loss, state corruption, wrong-entity disclosure, or destructive security behavior.
- P1: material correctness, availability, contract, or release-assurance gap.
- P2: hardening, performance, readability, or maintainability improvement.
- Investigation: runtime evidence is incomplete; prove the contract before implementation.

## Execution Waves

1. Lock down publisher delivery semantics and no-throw behavior.
2. Define event identity, ordering, replay, and execution identity contracts.
3. Make subscriber validation and persistence atomic and fail-closed.
4. Harden configuration, transport, logging, and runtime adapters.
5. Verify publication and supported n8n compatibility.
6. Perform an independent integration and security review.

## Wave 1: Publisher Correctness

### Task DELIVERY-01: Preserve Mixed Event Semantics In The Queue

Status: completed

Priority: P0

Suggested agent: delivery semantics engineer

Dependencies: none

Primary ownership:

- `packages/n8n-sync/src/publisher/sender.ts`
- `packages/n8n-sync/tests/sender.spec.ts`
- delivery-semantics documentation

Finding:

Queue coalescing keys only by resource ID. A queued workflow upsert followed by archive removes the upsert, so archive is a no-op on a new target and the workflow is never created. A queued delete followed by archive removes the delete and leaves an existing target workflow present. This contradicts the documented hook-order guarantee.

References:

- `packages/n8n-sync/src/publisher/sender.ts:32-37`
- `packages/n8n-sync/src/publisher/sender.ts:57-71`
- `packages/n8n-sync/src/publisher/sender.ts:114-132`
- `packages/n8n-sync/tests/sender.spec.ts:101-132`
- `packages/n8n-sync/README.md:23-25`

Implementation requirements:

1. Remove cross-operation coalescing unless a replacement event contains complete state and demonstrably subsumes the queued operation.
2. Preserve per-target serialization and the existing non-blocking `send()` contract.
3. Define queue-overflow behavior separately from coalescing; do not imply guaranteed convergence after a destructive event is dropped.
4. If same-type upserts remain coalescible, prove that their timestamps and payloads preserve the newest complete state.

Acceptance criteria:

- Table-driven tests cover every mixed pair of workflow upsert, activate, archive, unarchive, and delete while the first delivery is blocked.
- `upsert -> archive` creates then archives; `delete -> archive` does not lose the delete.
- Queue ordering and overflow behavior agree with README wording.
- `pnpm --filter @egose/n8n-sync test -- sender.spec.ts` passes.
- `pnpm --filter @egose/n8n-sync typecheck` passes.

Completion evidence:

- Changed: `packages/n8n-sync/src/publisher/sender.ts`, `packages/n8n-sync/tests/sender.spec.ts`, `packages/n8n-sync/README.md`, `docs/tasks/20260812-084731-n8n-sync-health-remediation.md`
- Verified: `pnpm --filter @egose/n8n-sync test -- sender.spec.ts`
- Result: Vitest ran 9 files / 166 tests, all passed.
- Verified: `pnpm --filter @egose/n8n-sync typecheck`
- Result: TypeScript completed without errors for `tsconfig.json` and `tsconfig.tests.json`.
- Result: The publisher now preserves mixed workflow operations in queue order, only coalesces exact queued duplicates of the same semantic operation, keeps the newest queued `workflow.upsert` payload, and documents bounded-queue overflow behavior explicitly in the README.

### Task PUBLISHER-01: Enforce The Publisher No-Throw Boundary

Status: completed

Priority: P1

Suggested agent: hook reliability engineer

Dependencies: none

Primary ownership:

- `packages/n8n-sync/src/publisher/hooks.ts`
- `packages/n8n-sync/tests/publisher.spec.ts`

Finding:

Workflow and credential repository failures can reject lifecycle hooks. Fire-and-forget credential and execution emissions use `void` without a rejection handler, allowing unhandled rejections. This violates the package's explicit rule that publisher hooks cannot disrupt n8n operations.

References:

- `packages/n8n-sync/src/publisher/hooks.ts:98-120`
- `packages/n8n-sync/src/publisher/hooks.ts:162-205`
- `packages/n8n-sync/src/publisher/hooks.ts:249-265`
- `packages/n8n-sync/src/publisher/hooks.ts:275-355`
- `packages/n8n-sync/AGENTS.md:47-50`

Implementation requirements:

1. Add one reusable error boundary around every wired publisher handler.
2. Catch both synchronous and asynchronous failures from lookups, mapping, and `emit`.
3. Attach an explicit rejection handler to every intentionally detached promise.
4. Inject a logger or error reporter into the factory; do not silently swallow failures.
5. Keep hook registration and successful event shapes unchanged.

Acceptance criteria:

- Every handler resolves when repository lookup, mapper, or `emit` rejects.
- Detached work produces no `unhandledRejection` and logs controlled context without event secrets.
- Tests cover credentials, workflows, executions, and tag-resolution failures.
- `pnpm --filter @egose/n8n-sync test -- publisher.spec.ts` passes.

Completion evidence:

- Changed: `packages/n8n-sync/src/publisher/hooks.ts`, `packages/n8n-sync/src/publisher/index.ts`, `packages/n8n-sync/tests/publisher.spec.ts`, `docs/tasks/20260812-084731-n8n-sync-health-remediation.md`
- Verified: `pnpm --filter @egose/n8n-sync test -- publisher.spec.ts`
- Result: Vitest ran 9 files / 171 tests, all passed.
- Verified: `pnpm --filter @egose/n8n-sync typecheck`
- Result: TypeScript completed without errors for `tsconfig.json` and `tsconfig.tests.json`.
- Result: All wired publisher hooks now run behind one reusable no-throw boundary, detached credential/execution work has an explicit rejection handler, and failures are logged with bounded hook context instead of propagating back into n8n lifecycle operations.

### Task CREDENTIAL-01: Remove Ambiguous Credential Resolution

Status: completed

Priority: P0

Suggested agent: credential security engineer

Dependencies: PUBLISHER-01

Primary ownership:

- `packages/n8n-sync/src/publisher/hooks.ts`
- focused publisher tests
- credential hook contract documentation

Finding:

When a create payload lacks an ID, the publisher polls by `{name, type}` and takes the most recently updated row. Duplicate names, concurrent creates, or unrelated updates can cause another credential's encrypted data or plaintext object to be sent to subscribers.

References:

- `packages/n8n-sync/src/publisher/hooks.ts:156-200`
- `packages/n8n-sync/src/publisher/hooks.ts:249-255`
- `packages/n8n-sync/tests/publisher.spec.ts:120-139`

Implementation requirements:

1. Resolve credentials only by a stable identifier that uniquely identifies the hook operation.
2. If supported n8n hooks cannot supply a stable ID, drop and log the event rather than guessing by name and type.
3. Remove the ten-query ambiguous polling loop or replace it with a keyed reconciliation mechanism backed by proven identity.
4. Record supported hook payload behavior by pinned n8n version.

Acceptance criteria:

- Two credentials with the same name and type cannot cause cross-publication.
- Missing stable identity never publishes another row's data.
- Tests cover duplicate names, concurrent creates, delayed visibility, timeout, and repository failure.
- Publisher hooks retain the no-throw contract.

Completion evidence:

- Changed: `packages/n8n-sync/src/publisher/hooks.ts`, `packages/n8n-sync/tests/publisher.spec.ts`, `packages/n8n-sync/README.md`, `packages/n8n-sync/AGENTS.md`, `docs/tasks/20260812-084731-n8n-sync-health-remediation.md`
- Verified: `pnpm --filter @egose/n8n-sync test -- publisher.spec.ts`
- Result: Vitest ran 9 files / 174 tests, all passed.
- Verified: `pnpm --filter @egose/n8n-sync typecheck`
- Result: TypeScript completed without errors for `tsconfig.json` and `tsconfig.tests.json`.
- Result: Credential publication now resolves only by stable `credential.id`, retries brief post-create visibility by id for the pinned n8n `2.31.2` hook contract, and logs+drops unsupported or timed-out create payloads instead of guessing by `{name, type}`.

### Task MAPPER-01: Make Mapping Pure And Align Execution Fields

Status: completed

Priority: P2

Suggested agent: DTO contract engineer

Dependencies: CREDENTIAL-01

Primary ownership:

- `packages/n8n-sync/src/shared/mappers.ts`
- `packages/n8n-sync/src/shared/types.ts`
- `packages/n8n-sync/tests/mappers.spec.ts`

Finding:

Tag-active rewriting aliases and mutates `workflow.meta`, leaking publisher-owned metadata into the source hook object. Execution DTOs advertise retry and workflow-version fields that `mapExecution()` never publishes.

References:

- `packages/n8n-sync/src/shared/mappers.ts:43-54`
- `packages/n8n-sync/src/shared/mappers.ts:102-138`
- `packages/n8n-sync/src/shared/types.ts:148-163`
- `packages/n8n-sync/README.md:68-70`

Implementation requirements:

1. Clone metadata before adding `active_real`; mapping must not mutate any input.
2. Confirm the supported post-execute hook fields and either map retry/version fields or remove unsupported DTO and documentation claims.
3. Do not add full execution data to the wire payload.

Acceptance criteria:

- Deeply frozen workflow input maps successfully and remains unchanged.
- Every documented execution scalar is either emitted and tested or removed from the contract.
- `pnpm --filter @egose/n8n-sync test -- mappers.spec.ts` passes.

Completion evidence:

- Changed: `packages/n8n-sync/src/shared/mappers.ts`, `packages/n8n-sync/src/shared/types.ts`, `packages/n8n-sync/src/subscriber/applier.ts`, `packages/n8n-sync/tests/mappers.spec.ts`, `packages/n8n-sync/tests/applier.spec.ts`, `packages/n8n-sync/README.md`, `packages/n8n-sync/AGENTS.md`, `docs/tasks/20260812-084731-n8n-sync-health-remediation.md`
- Verified: `pnpm --filter @egose/n8n-sync test -- mappers.spec.ts`
- Result: Vitest ran 9 files / 176 tests, all passed.
- Verified: `pnpm --filter @egose/n8n-sync typecheck`
- Result: TypeScript completed without errors for `tsconfig.json` and `tsconfig.tests.json`.
- Result: `mapWorkflow()` now clones source metadata before adding `meta.active_real`, so tag-based active rewrites no longer mutate frozen or live hook payloads.
- Result: `SyncExecutionDto` and docs now match the pinned `workflow.postExecute` `IRun` contract from `n8n-workflow@2.31.2`, which exposes lifecycle fields but not execution-summary-only retry/version fields.

## Wave 2: Event And Execution Contracts

### Task ORDER-01: Introduce Durable Event Identity And Cross-Operation Ordering

Status: completed

Priority: P0

Suggested agent: distributed-systems engineer

Dependencies: DELIVERY-01

Primary ownership:

- `packages/n8n-sync/src/shared/types.ts`
- `packages/n8n-sync/src/shared/auth.ts`
- publisher envelope construction
- subscriber ordering enforcement and focused tests

Finding:

HMAC timestamps enforce freshness but do not detect duplicate requests. Upserts use entity timestamps, while delete and archive operations are unconditional and leave no tombstone. A captured valid delete can be replayed during the tolerance window, and delayed destructive events can override newer state. Equal millisecond timestamps can also discard distinct updates.

References:

- `packages/n8n-sync/src/shared/auth.ts:14-24`
- `packages/n8n-sync/src/shared/auth.ts:43-64`
- `packages/n8n-sync/src/shared/types.ts:165-179`
- `packages/n8n-sync/src/subscriber/applier.ts:36-46`
- `packages/n8n-sync/src/subscriber/applier.ts:180-193`
- `packages/n8n-sync/README.md:51-56`
- `packages/n8n-sync/README.md:139`

Implementation requirements:

1. Define a source-scoped event ID and monotonic entity revision or sequence that applies to every mutation type.
2. Persist enough source/entity ordering state or tombstones to reject stale upsert, archive, and delete operations across process restarts.
3. Make duplicate acceptance idempotent and reject replay where the security contract promises replay prevention.
4. Bound and expire any in-memory replay cache; do not treat it as a substitute for durable mutation ordering.
5. Define tie-breaking for distinct events with equal source timestamps.
6. Treat this as a wire-contract change and update README, AGENTS, integration fixtures, and release notes together.

Acceptance criteria:

- The same valid signed request cannot cause a second state transition.
- An older delete/archive cannot override a newer upsert, and an older upsert cannot recreate a newer deletion.
- Behavior remains correct after subscriber restart.
- Tests cover duplicate, out-of-order, equal-timestamp, cross-source, and restart scenarios.
- Security documentation describes only the guarantees demonstrated by tests.

Completion evidence:

- Changed: `packages/n8n-sync/src/shared/types.ts`, `packages/n8n-sync/src/shared/config.ts`, `packages/n8n-sync/src/shared/auth.ts`, `packages/n8n-sync/src/shared/validate.ts`, `packages/n8n-sync/src/shared/ordering.ts`, `packages/n8n-sync/src/publisher/hooks.ts`, `packages/n8n-sync/src/publisher/index.ts`, `packages/n8n-sync/src/publisher/order-state.ts`, `packages/n8n-sync/src/subscriber/applier.ts`, `packages/n8n-sync/src/subscriber/routes.ts`, `packages/n8n-sync/src/subscriber/index.ts`, `packages/n8n-sync/src/subscriber/order-state.ts`, `packages/n8n-sync/tests/publisher.spec.ts`, `packages/n8n-sync/tests/applier.spec.ts`, `packages/n8n-sync/tests/auth.spec.ts`, `packages/n8n-sync/tests/validate.spec.ts`, `packages/n8n-sync/tests/subscriber.spec.ts`, `packages/n8n-sync/tests/http.spec.ts`, `packages/n8n-sync/tests/sender.spec.ts`, `packages/n8n-sync/tests/integration-sync.spec.ts`, `packages/n8n-sync/README.md`, `packages/n8n-sync/AGENTS.md`, `sandbox/docker-compose.yml`, `CHANGELOG.md`, `docs/tasks/20260812-084731-n8n-sync-health-remediation.md`
- Verified: `pnpm --filter @egose/n8n-sync test`
- Result: Vitest ran 9 files / 187 tests, all passed.
- Verified: `pnpm --filter @egose/n8n-sync typecheck`
- Result: TypeScript completed without errors for `tsconfig.json` and `tsconfig.tests.json`.
- Result: Every wire event now carries durable `eventId` and `entityRevision`, the subscriber persists per-source/entity ordering state plus delete tombstones across restart, and hmac mode rejects exact signed request replays from a bounded cache while token mode remains idempotent via event ordering only.

### Task EXECUTION-01: Replace Source Execution IDs With Namespaced Identity

Status: blocked

Priority: P0

Suggested agent: database identity engineer

Dependencies: ORDER-01

Primary ownership:

- execution event contract in `packages/n8n-sync/src/shared/types.ts`
- execution path in `packages/n8n-sync/src/subscriber/applier.ts`
- persistence/migration support and execution tests

Finding:

Execution IDs are local database-generated identifiers, but the target looks up and saves the source ID as its primary key. A source event can overwrite an unrelated target execution with the same ID, and explicit inserts can conflict with the target's native sequence. `sourceId` is currently ignored for identity.

References:

- `packages/n8n-sync/src/shared/types.ts:148-179`
- `packages/n8n-sync/src/subscriber/applier.ts:245-299`
- `packages/n8n-sync/tests/applier.spec.ts:388-477`

Implementation requirements:

1. Use a durable `(sourceId, sourceExecutionId)` identity mapping to a target-generated execution ID, or another proven namespaced external identity.
2. Never overwrite or claim a native target execution based only on source ID equality.
3. Preserve idempotent redelivery through the external identity mapping.
4. Define cleanup behavior when executions, workflows, or a source are removed.
5. Do not rely on an in-memory map.

Acceptance criteria:

- A source execution whose ID equals an existing native target execution creates or updates only its mapped target row.
- Native target inserts continue without primary-key or sequence collision.
- Two publishers with the same source execution ID remain isolated.
- Real-database tests cover mapping creation, duplicate delivery, concurrency, and cleanup.

Implementation progress:

- Added a durable subscriber-side `(sourceId, sourceExecutionId) -> targetExecutionId` store in `packages/n8n-sync/src/subscriber/execution-identity.ts`, persisted alongside subscriber ordering state.
- `packages/n8n-sync/src/subscriber/applier.ts` now creates execution rows without forcing `execution.id`, updates only mapped target rows, recreates mappings when target executions are pruned, and removes source/workflow-scoped execution mappings on `workflow.delete`.
- Added unit coverage in `packages/n8n-sync/tests/applier.spec.ts` for native-id collision avoidance, duplicate delivery, concurrent delivery serialization, and mapping recreation after cleanup.
- Added Postgres-backed integration coverage in `packages/n8n-sync/tests/integration-sync.spec.ts` plus SQL helpers in `packages/n8n-sync/tests/integration-utils.ts` for collision, duplicate delivery, multi-publisher isolation, concurrency, and cleanup scenarios.

Blocker:

- Cannot mark complete in this session because the required real-database verification could not run: the local Docker daemon / sandbox stack is unavailable (`failed to connect to the docker API at unix:///var/run/docker.sock`).

Verification status:

- Passed: `pnpm --filter @egose/n8n-sync test -- --runInBand`
- Passed: `pnpm --filter @egose/n8n-sync typecheck`
- Passed: `pnpm --filter @egose/n8n-sync build`
- Blocked: docker-backed execution integration verification

### Task EXECUTION-02: Define A Safe Execution Summary Lifecycle

Status: blocked

Priority: P1

Suggested agent: n8n persistence compatibility engineer

Dependencies: EXECUTION-01, RUNTIME-01

Primary ownership:

- execution mapper, validator, and applier paths
- execution-enabled integration tests
- execution limitations documentation

Finding:

`SYNC_ENTITIES=executions` is accepted without workflows, although target execution rows reference workflows. Events without `workflowId` are accepted. Timestamp-less events can regress terminal executions to `unknown`. Workflow deletion may conflict with dependent execution rows, and summary rows omit `execution_data`, whose behavior across n8n APIs and maintenance jobs is unverified.

References:

- `packages/n8n-sync/src/shared/config.ts:32-51`
- `packages/n8n-sync/src/shared/validate.ts:27-36`
- `packages/n8n-sync/src/shared/mappers.ts:102-124`
- `packages/n8n-sync/src/subscriber/applier.ts:180-183`
- `packages/n8n-sync/src/subscriber/applier.ts:245-299`
- `packages/n8n-sync/README.md:132-141`

Implementation requirements:

1. Require a non-empty workflow identity for execution events.
2. Decide whether execution sync requires workflow sync or safely drops events for absent target workflows.
3. Prevent non-terminal or timestamp-less events from regressing terminal rows.
4. Verify workflow deletion, execution pruning, list, get, annotation, and insights behavior using a real supported n8n schema.
5. Fail startup or event application when requested execution support is unavailable; do not acknowledge dropped configured events as success.
6. Update limitations to match proven behavior.

Acceptance criteria:

- Invalid or orphaned execution events have one documented controlled outcome.
- Completed executions cannot regress to `unknown` or an earlier lifecycle state.
- Workflow deletion behaves correctly when synced executions exist.
- Execution-enabled integration tests cover public API list/get and at least one maintenance operation.

Implementation progress:

- `packages/n8n-sync/src/shared/config.ts` now rejects `SYNC_ENTITIES=executions` unless workflows are also enabled, and both publisher/subscriber startup paths enforce that configuration.
- `packages/n8n-sync/src/publisher/hooks.ts` now drops `workflow.postExecute` deliveries that lack a workflow identity or all lifecycle timestamps, logging a controlled publisher-side reason instead of emitting malformed execution events.
- `packages/n8n-sync/src/shared/validate.ts` now rejects malformed execution payloads at the subscriber boundary, including blank IDs, missing `workflowId`, invalid timestamps, and execution summaries with no lifecycle timestamp at all.
- `packages/n8n-sync/src/subscriber/applier.ts` now fails execution application when execution support is unavailable or the target workflow is absent, skips non-terminal or timestamp-less regressions over terminal execution rows, and deletes mapped synced executions before applying `workflow.delete`.
- `packages/n8n-sync/src/subscriber/execution-identity.ts` now supports workflow-scoped execution mapping lookup so workflow deletion can clean up dependent synced execution rows safely.
- Added regression coverage in `packages/n8n-sync/tests/publisher.spec.ts`, `packages/n8n-sync/tests/validate.spec.ts`, and `packages/n8n-sync/tests/applier.spec.ts` for invalid execution payload rejection, invalid entity selection, publisher-side execution drops, orphan execution failures, terminal lifecycle regression protection, and workflow-delete cleanup.
- Added docker-backed execution lifecycle/API coverage in `packages/n8n-sync/tests/integration-sync.spec.ts` for execution list/get/tag/insights probes plus workflow-delete cleanup with synced executions, pending runtime verification.

Blocker:

- Cannot mark complete in this session because the required docker-backed integration verification could not run: the local Docker daemon / sandbox stack is unavailable (`failed to connect to the docker API at unix:///var/run/docker.sock`).

Verification status:

- Passed: `pnpm --filter @egose/n8n-sync test -- tests/validate.spec.ts tests/publisher.spec.ts tests/applier.spec.ts`
- Passed: `pnpm --filter @egose/n8n-sync typecheck`
- Passed: `pnpm --filter @egose/n8n-sync test`
- Passed: `pnpm --filter @egose/n8n-sync build`
- Blocked: `docker compose -f sandbox/docker-compose.yml ps`
- Blocked: docker-backed execution integration verification

## Wave 3: Subscriber Boundaries And Persistence

### Task VALIDATION-01: Validate The Complete Wire Contract

Status: completed

Priority: P1

Suggested agent: untrusted-input engineer

Dependencies: ORDER-01, EXECUTION-01

Primary ownership:

- `packages/n8n-sync/src/shared/validate.ts`
- wire DTO definitions
- `packages/n8n-sync/tests/validate.spec.ts`

Finding:

Runtime validation checks only a subset of declared fields. It accepts empty identifiers, invalid timestamps, missing workflow booleans, arbitrary execution status/mode, absent workflow IDs, and malformed optional fields. Invalid `updatedAt` silently disables stale-event protection.

References:

- `packages/n8n-sync/src/shared/validate.ts:7-66`
- `packages/n8n-sync/src/shared/types.ts:97-179`
- `packages/n8n-sync/src/subscriber/applier.ts:137-175`
- `packages/n8n-sync/src/subscriber/applier.ts:245-284`

Implementation requirements:

1. Validate every persisted required and optional field against the declared wire contract.
2. Require non-empty bounded IDs, source IDs, names, event IDs, and valid ordering timestamps/revisions.
3. Reject invalid dates, booleans, enums, tags, snapshots, and nested container shapes rather than defaulting them.
4. Add structural complexity limits for request-controlled arrays/objects in addition to byte limits.
5. Keep validation dependency-free unless a runtime dependency is explicitly approved.

Acceptance criteria:

- Negative tests cover every DTO field, empty/boundary values, invalid dates, deep nesting, and oversized collections.
- No malformed timestamp can bypass ordering enforcement.
- Valid publisher-generated events continue to parse.
- `pnpm --filter @egose/n8n-sync test -- validate.spec.ts` passes.

Completion evidence:

- Changed: `packages/n8n-sync/src/shared/validate.ts`, `packages/n8n-sync/tests/validate.spec.ts`, `docs/tasks/20260812-084731-n8n-sync-health-remediation.md`
- Verified: `pnpm --filter @egose/n8n-sync test -- tests/validate.spec.ts`
- Result: Vitest ran the package test suite under `vitest.config.ts`; 9 files and 257 tests passed, including the expanded `validate.spec.ts` regression coverage for bounded IDs, strict UTC timestamps, enum checks, malformed optional fields, deep nesting, and oversized collections.
- Verified: `pnpm --filter @egose/n8n-sync typecheck`
- Result: TypeScript completed without errors for `tsconfig.json` and `tsconfig.tests.json`.
- Result: `parseSyncEvent` now enforces the full declared wire contract for workflow, credential, and execution DTOs, rejects malformed timestamps before ordering logic can consume them, and applies recursive structural limits to request-controlled arrays and objects.

### Task BODY-01: Authenticate Raw Bytes Before JSON Parsing

Status: completed

Priority: P1

Suggested agent: HTTP security engineer

Dependencies: VALIDATION-01

Primary ownership:

- `packages/n8n-sync/src/shared/body.ts`
- `packages/n8n-sync/src/subscriber/routes.ts`
- body and subscriber route tests

Finding:

HMAC requests are JSON-parsed before authentication, so unauthenticated clients can trigger allocation and parsing up to 16 MiB. The normal n8n path may parse the body once globally and again from `rawBody`. Unexpected body errors are exposed as client-visible messages and mislabeled as 400 responses. Body-reader documentation also disagrees with implementation order.

References:

- `packages/n8n-sync/src/shared/body.ts:20-66`
- `packages/n8n-sync/src/subscriber/routes.ts:31-50`
- `packages/n8n-sync/tests/subscriber.spec.ts:110-119`

Implementation requirements:

1. Separate bounded raw-byte acquisition from JSON parsing.
2. In HMAC mode, verify exact raw bytes before JSON parsing or event validation.
3. Fail closed when exact bytes are unavailable, unless a documented canonical signing format is adopted.
4. Reuse an already parsed body only after raw-byte authentication succeeds.
5. Return controlled 4xx messages for expected body errors and a generic 500 for unexpected failures while logging safe diagnostics.
6. Enforce JSON content type and define unsupported content-encoding behavior.

Acceptance criteria:

- An invalid HMAC request does not invoke JSON parsing.
- Exact raw bytes are used when both `rawBody` and `body` exist.
- Oversized, empty, malformed, cyclic pre-parsed, stream-error, wrong-content-type, and unexpected-error paths return controlled responses.
- Body documentation matches resolution behavior.

Completion evidence:

- Changed: `packages/n8n-sync/src/shared/body.ts`, `packages/n8n-sync/src/subscriber/routes.ts`, `packages/n8n-sync/tests/body.spec.ts`, `packages/n8n-sync/tests/subscriber.spec.ts`, `packages/n8n-sync/README.md`, `packages/n8n-sync/AGENTS.md`, `docs/tasks/20260812-084731-n8n-sync-health-remediation.md`
- Verified: `pnpm --filter @egose/n8n-sync test -- tests/body.spec.ts tests/subscriber.spec.ts`
- Result: Vitest ran the package test suite under `vitest.config.ts`; 9 files and 269 tests passed, including new coverage for invalid HMAC requests that return 401 before JSON parsing, exact `rawBody` precedence, HMAC fail-closed behavior when only `req.body` is available, cyclic pre-parsed bodies, wrong content type, unsupported content encoding, and unexpected stream failures.
- Verified: `pnpm --filter @egose/n8n-sync typecheck`
- Result: TypeScript completed without errors for `tsconfig.json` and `tsconfig.tests.json`.
- Result: The subscriber now separates raw-byte acquisition from JSON parsing, authenticates HMAC requests against exact raw bytes before parsing, refuses HMAC requests when exact bytes are unavailable, reuses pre-parsed bodies only after token auth or post-HMAC raw verification, and normalizes unexpected body-reader failures to a generic 500 while logging diagnostics server-side.

### Task PERSISTENCE-01: Make Upserts And Ownership Atomic

Status: completed

Priority: P0

Suggested agent: transactional persistence engineer

Dependencies: ORDER-01, VALIDATION-01

Primary ownership:

- `packages/n8n-sync/src/subscriber/applier.ts`
- repository adapter interfaces
- applier concurrency and project-relation tests

Finding:

Stale checks and writes are separate operations, allowing concurrent older writes to win. Entity creation and project linking are also separate; link errors are swallowed, the route returns 200, and later upserts never repair the missing relation. Existing entities do not reconcile ownership.

References:

- `packages/n8n-sync/src/subscriber/applier.ts:105-135`
- `packages/n8n-sync/src/subscriber/applier.ts:157-177`
- `packages/n8n-sync/src/subscriber/applier.ts:210-225`
- `packages/n8n-sync/src/subscriber/routes.ts:58-64`

Implementation requirements:

1. Enforce revision comparison and mutation atomically with conditional updates/upserts or transactions.
2. Make entity creation and required owner relation creation one transaction.
3. Propagate failed required relation writes so delivery retries rather than acknowledging an orphan.
4. Reconcile missing ownership on existing entities and define behavior when `SYNC_TARGET_PROJECT_ID` changes.
5. Handle concurrent inserts without leaking uniqueness errors as permanent divergence.

Acceptance criteria:

- A deferred-promise concurrency test proves an older update cannot overwrite a newer one.
- A relation failure rolls back or returns failure; retry repairs the entity and relation.
- Existing orphaned entities gain the intended owner relation.
- Real-database tests cover conditional update, concurrent create, rollback, and retry.

Completion evidence:

- Changed: `packages/n8n-sync/src/subscriber/applier.ts`, `packages/n8n-sync/src/subscriber/n8n-runtime.ts`, `packages/n8n-sync/tests/applier.persistence-db.spec.ts`, `packages/n8n-sync/README.md`, `docs/tasks/20260812-084731-n8n-sync-health-remediation.md`
- Verified: `pnpm --filter @egose/n8n-sync test`
- Result: Vitest ran 10 files / 280 tests, all passed, including new SQLite-backed real-database persistence coverage for conditional update, transaction rollback + retry, uniqueness-race reconciliation, and orphan owner-link repair.
- Verified: `pnpm --filter @egose/n8n-sync typecheck`
- Result: TypeScript completed without errors for `tsconfig.json` and `tsconfig.tests.json`.
- Result: Workflow and credential upserts now use repository-level conditional updates plus transaction-scoped owner-link writes when the runtime supports them, relation failures propagate for retry instead of acknowledging an orphan, existing entities repair missing `*:owner` links, and owner relations move on later upserts when `SYNC_TARGET_PROJECT_ID` changes.

### Task CREDENTIAL-02: Prove Credential Encryption Semantics

Status: completed

Priority: P0 Investigation

Suggested agent: n8n credential internals researcher

Dependencies: CREDENTIAL-01, RUNTIME-01

Primary ownership:

- credential hook and persistence integration tests
- credential DTO/applier contract
- credential security documentation

Finding:

The wire type accepts object-valued credential data, the publisher transmits it verbatim, and the subscriber passes it directly to a generic repository. HMAC provides integrity, not confidentiality. It is unproven that object payloads are encrypted by repository `save()`, while documentation states that credential data is always encrypted passthrough.

References:

- `packages/n8n-sync/src/shared/types.ts:42-58`
- `packages/n8n-sync/src/shared/types.ts:125-139`
- `packages/n8n-sync/src/shared/mappers.ts:77-91`
- `packages/n8n-sync/src/subscriber/applier.ts:196-224`
- `packages/n8n-sync/README.md:23-26`

Implementation requirements:

1. Capture actual create/update hook payload forms for every supported n8n version without logging secrets.
2. Verify target database encryption-at-rest and target runtime decryptability for each accepted form.
3. If generic repository persistence does not encrypt objects, fail closed on object payloads or use n8n's canonical credential service.
4. Require TLS for any mode that can transport plaintext credential material.
5. Correct documentation and release notes if the accepted contract narrows.

Acceptance criteria:

- Tests prove no accepted credential object is stored plaintext.
- Unsupported payload forms are rejected without exposing data in logs or responses.
- Created and updated credentials are decryptable and usable on the target.
- The task remains `blocked` rather than guessing if supported-version hook behavior cannot be established.

Completion evidence:

- Changed: `packages/n8n-sync/src/shared/types.ts`, `packages/n8n-sync/src/shared/mappers.ts`, `packages/n8n-sync/src/shared/validate.ts`, `packages/n8n-sync/src/publisher/hooks.ts`, `packages/n8n-sync/src/subscriber/applier.ts`, `packages/n8n-sync/tests/validate.spec.ts`, `packages/n8n-sync/tests/mappers.spec.ts`, `packages/n8n-sync/tests/publisher.spec.ts`, `packages/n8n-sync/tests/applier.spec.ts`, `packages/n8n-sync/README.md`, `packages/n8n-sync/AGENTS.md`, `CHANGELOG.md`, `docs/tasks/20260812-084731-n8n-sync-health-remediation.md`
- Verified: `pnpm --filter @egose/n8n-sync test`
- Result: Vitest ran 10 files / 282 tests, all passed, including new publisher, validator, mapper, and applier coverage that rejects object-form credential payloads without persisting them.
- Verified: `pnpm --filter @egose/n8n-sync typecheck`
- Result: TypeScript completed without errors for `tsconfig.json` and `tsconfig.tests.json`.
- Result: The sync wire contract now accepts only encrypted credential string blobs; publisher hooks drop object-form payloads without logging secret contents, request validation rejects object-form credential events before apply, and the subscriber applier fails closed if an unsupported object payload bypasses the transport boundary.

## Wave 4: Configuration, Transport, And Architecture

### Task CONFIG-01: Parse And Validate Configuration Explicitly

Status: completed

Priority: P1

Suggested agent: configuration boundary engineer

Dependencies: none

Primary ownership:

- `packages/n8n-sync/src/shared/config.ts`
- publisher and subscriber entry wiring
- new configuration tests

Finding:

Numeric settings use permissive `parseInt` without bounds. Explicit invalid `SYNC_ENTITIES` values fall back to workflows and credentials, unexpectedly enabling credential sync. URLs are string-trimmed without protocol, userinfo, or path validation, and auth mode silently falls back to HMAC for typos. Environment values are captured at import time, making configuration hard to test.

References:

- `packages/n8n-sync/src/shared/config.ts:9-20`
- `packages/n8n-sync/src/shared/config.ts:32-61`
- `packages/n8n-sync/src/shared/config.ts:79-97`

Implementation requirements:

1. Introduce a pure `parseConfig(env)` with explicit publisher/subscriber validation.
2. Require fully numeric finite integers and enforce documented bounds for timeout, attempts, queue size, body size, and tolerance.
3. Apply defaults only when values are absent or blank; reject explicit invalid entity and auth values.
4. Parse subscriber URLs with `URL`, reject userinfo, require HTTPS by default, and provide an explicit development-only HTTP policy if needed.
5. Validate route and event paths as local absolute paths without query or fragment components.
6. Fail startup with actionable messages that do not expose secrets.

Acceptance criteria:

- Tests cover absent, blank, partial numeric, negative, zero, overflow, typo, duplicate URL, userinfo, HTTP, and malformed path values.
- `SYNC_ENTITIES=execution` or `none` never silently enables credentials.
- Entry factories accept parsed configuration without module-cache manipulation.

Completion evidence:

- Changed: `packages/n8n-sync/src/shared/config.ts`, `packages/n8n-sync/src/shared/logger.ts`, `packages/n8n-sync/src/publisher/index.ts`, `packages/n8n-sync/src/publisher/runtime.ts`, `packages/n8n-sync/src/subscriber/index.ts`, `packages/n8n-sync/src/subscriber/runtime.ts`, `packages/n8n-sync/src/subscriber/routes.ts`, `packages/n8n-sync/src/subscriber/n8n-runtime.ts`, `packages/n8n-sync/src/subscriber/execution-identity.ts`, `packages/n8n-sync/tests/config.spec.ts`, `packages/n8n-sync/README.md`, `packages/n8n-sync/AGENTS.md`, `docs/tasks/20260812-084731-n8n-sync-health-remediation.md`
- Verified: `pnpm --filter @egose/n8n-sync test`
- Result: Vitest ran 11 files / 317 tests, all passed, including new configuration coverage for blank/default handling, strict numeric validation, invalid auth and entity values, duplicate and insecure URLs, malformed local paths, and parsed-config runtime wiring.
- Verified: `pnpm --filter @egose/n8n-sync typecheck`
- Result: TypeScript completed without errors for `tsconfig.json` and `tsconfig.tests.json`.
- Result: Configuration now parses through a pure `parseConfig(env)` boundary, rejects explicit invalid values instead of silently falling back, normalizes and validates subscriber base URLs and local route/event paths, supports development-only insecure HTTP via explicit opt-in, and lets publisher/subscriber startup wiring consume parsed config objects directly without import-time `process.env` capture.

### Task HTTP-01: Bound Retry Resource Use And Respect Server Backoff

Status: completed

Priority: P2

Suggested agent: transport reliability engineer

Dependencies: CONFIG-01

Primary ownership:

- `packages/n8n-sync/src/shared/http.ts`
- `packages/n8n-sync/tests/http.spec.ts`

Finding:

Failed response bodies are not consumed or cancelled before retries, which can delay connection reuse. Retry delay has no jitter and ignores `Retry-After`. Names and comments disagree: `maxRetries` means total attempts, while documentation says broad 5xx retry although only selected statuses retry.

References:

- `packages/n8n-sync/src/shared/http.ts:11-12`
- `packages/n8n-sync/src/shared/http.ts:29-45`
- `packages/n8n-sync/src/shared/http.ts:51-67`
- `packages/n8n-sync/src/shared/http.ts:89-125`

Implementation requirements:

1. Cancel or boundedly drain failed response bodies before retry or throw.
2. Honor valid bounded `Retry-After` values for 429/503 and add injectable jitter.
3. Rename the option to `maxAttempts` or make retry counting semantically correct across config and docs.
4. Document and test the exact retryable status policy.
5. Preserve per-attempt timeout cleanup and HMAC re-signing.

Acceptance criteria:

- Tests assert body cancellation/draining, timeout abort, timer cleanup, jitter bounds, `Retry-After`, backoff cap, and exact status behavior.
- No secret or event body appears in errors or logs.

Completion evidence:

- Changed: `packages/n8n-sync/src/shared/config.ts`, `packages/n8n-sync/src/shared/http.ts`, `packages/n8n-sync/src/publisher/runtime.ts`, `packages/n8n-sync/src/publisher/sender.ts`, `packages/n8n-sync/tests/config.spec.ts`, `packages/n8n-sync/tests/http.spec.ts`, `packages/n8n-sync/tests/sender.spec.ts`, `docs/tasks/20260812-084731-n8n-sync-health-remediation.md`
- Verified: `pnpm --filter @egose/n8n-sync test -- http.spec.ts`
- Result: Vitest ran 11 files / 329 tests, all passed, including new transport coverage for exact retryable-status behavior, bounded jitter, capped backoff, `Retry-After` seconds and HTTP-date handling, failed-body draining/cancellation, timeout abort, timer cleanup, and log redaction.
- Verified: `pnpm --filter @egose/n8n-sync typecheck`
- Result: TypeScript completed without errors for `tsconfig.json` and `tsconfig.tests.json`.
- Result: failed HTTP responses now dispose of their bodies before retry/throw, 429/503 honor bounded `Retry-After` before falling back to jittered exponential backoff, the internal retry-count option is named `maxAttempts`, and transport logs/errors continue to exclude sync payload bodies and shared secrets while preserving per-attempt timeout cleanup and HMAC re-signing.

### Task LOGGING-01: Redact Sync Credentials And Reserve Core Fields

Status: completed

Priority: P2

Suggested agent: observability security engineer

Dependencies: CONFIG-01

Primary ownership:

- `packages/n8n-sync/src/shared/logger.ts`
- publisher target logging
- new logger tests

Finding:

The logger does not redact `x-sync-token`, `x-sync-signature`, or `x-sync-timestamp`. Target URLs are logged verbatim, including possible userinfo/query data. Caller context can overwrite `timestamp`, `level`, `module`, and `msg` because it is spread last.

References:

- `packages/n8n-sync/src/shared/logger.ts:42-58`
- `packages/n8n-sync/src/shared/logger.ts:114-123`
- `packages/n8n-sync/src/shared/logger.ts:166-177`
- `packages/n8n-sync/src/publisher/sender.ts:98-128`

Implementation requirements:

1. Redact every sync authentication header case-insensitively.
2. Sanitize URL userinfo and sensitive query values before logging.
3. Prevent context from replacing core structured fields.
4. Keep logger dependency-free and avoid logging event bodies or credential values.

Acceptance criteria:

- Logger tests cover canonical and mixed-case sensitive headers, URL credentials, query secrets, arrays, and core-field collisions.
- Captured output contains no supplied secret value.

Completion evidence:

- Changed: `packages/n8n-sync/src/shared/logger.ts`, `packages/n8n-sync/tests/logger.spec.ts`, `docs/tasks/20260812-084731-n8n-sync-health-remediation.md`
- Verified: `pnpm --filter @egose/n8n-sync test -- logger.spec.ts`
- Result: Vitest ran 12 files / 331 tests, all passed, including new logger coverage for canonical and mixed-case sync-auth header redaction, URL userinfo sanitization, sensitive query-value redaction, array handling, helper body omission, and reserved core-field protection.
- Verified: `pnpm --filter @egose/n8n-sync typecheck`
- Result: TypeScript completed without errors for `tsconfig.json` and `tsconfig.tests.json`.
- Result: structured logs now redact `x-sync-token`, `x-sync-signature`, and `x-sync-timestamp` case-insensitively, sanitize logged `url` and `target` values by removing userinfo and redacting sensitive query values, preserve logger-owned `timestamp`/`level`/`module`/`msg` fields against caller overrides, and omit request/response bodies from helper output so event payloads and credential values are not emitted.

### Task RUNTIME-01: Encapsulate And Version-Test N8n Runtime Access

Status: completed

Priority: P1

Suggested agent: runtime adapter engineer

Dependencies: CONFIG-01

Primary ownership:

- `packages/n8n-sync/src/subscriber/n8n-runtime.ts`
- subscriber entry wiring
- runtime adapter tests and version matrix

Finding:

Runtime loading depends on absolute lazy `require()` calls and unstable internal repository exports. The loader has no injectable resolver, no compatibility tests, and silently omits `ExecutionRepository` even when execution sync is requested.

References:

- `packages/n8n-sync/src/subscriber/n8n-runtime.ts:75-128`
- `packages/n8n-sync/src/subscriber/index.ts:24-49`
- `packages/n8n-sync/vitest.integration.config.ts:1-17`

Implementation requirements:

1. Encapsulate module resolution and DI lookup in an injectable adapter while retaining lazy resolution inside `n8n.ready`.
2. Validate every requested repository/capability at startup and fail clearly when missing.
3. Define and pin a supported n8n version matrix instead of relying on `latest`.
4. Add adapter contract tests for missing modules, missing exports, DI failures, and execution-disabled behavior.
5. Keep n8n packages out of runtime bundle dependencies.

Acceptance criteria:

- Requested execution support cannot start in a state that acknowledges and drops every execution event.
- Compatibility tests pass against each supported pinned n8n version.
- Startup errors identify the missing capability without exposing filesystem secrets.

Completion evidence:

- Changed: `packages/n8n-sync/src/subscriber/n8n-runtime.ts`, `packages/n8n-sync/tests/n8n-runtime.spec.ts`, `packages/n8n-sync/tests/fixtures/n8n-runtime/2.31.2/{di.cjs,db.cjs}`, `sandbox/run-integration.ts`, `sandbox/docker-compose.yml`, `Dockerfile`, `packages/n8n-sync/examples/Dockerfile.npm`, `packages/n8n-sync/examples/Dockerfile.cdn`, `packages/n8n-sync/README.md`, `packages/n8n-sync/AGENTS.md`, `docs/tasks/20260812-084731-n8n-sync-health-remediation.md`
- Verified: `pnpm --filter @egose/n8n-sync test`
- Result: Vitest ran 13 files / 336 tests, all passed, including new runtime-adapter contract coverage for missing DI modules, missing repository exports, DI resolution failures, execution-disabled startup, and the pinned `2.31.2` compatibility fixture.
- Verified: `pnpm --filter @egose/n8n-sync typecheck`
- Result: TypeScript completed without errors for `tsconfig.json` and `tsconfig.tests.json`.
- Verified: `pnpm --filter @egose/n8n-sync build`
- Result: tsup rebuilt `dist/publisher.cjs` and `dist/subscriber.cjs` successfully with the runtime adapter changes bundled.
- Result: subscriber runtime access is now encapsulated behind an injectable `N8nRuntimeAdapter`, every required repository token is validated at startup, `ExecutionRepository` can no longer be silently omitted when executions are enabled, startup errors identify missing capabilities without echoing configured filesystem paths, and the supported runtime contract is pinned to n8n `2.31.2` instead of `latest`.

### Task ARCH-01: Strengthen Factory Encapsulation And Type Safety

Status: completed

Priority: P2

Suggested agent: TypeScript architecture engineer

Dependencies: CONFIG-01, BODY-01, RUNTIME-01

Primary ownership:

- route, entry, config, and runtime factory interfaces
- `packages/n8n-sync/tsconfig.json`
- focused type tests

Finding:

Route factories import ambient configuration defaults despite otherwise using dependency injection. Entry factories are private and environment values are import-time globals. `strict: false` weakens checks at the dynamic n8n and repository boundaries where drift is most likely.

References:

- `packages/n8n-sync/src/subscriber/routes.ts:3-29`
- `packages/n8n-sync/src/shared/config.ts:44-97`
- `packages/n8n-sync/src/publisher/index.ts:24-84`
- `packages/n8n-sync/src/subscriber/index.ts:24-55`
- `packages/n8n-sync/tsconfig.json:3-14`

Implementation requirements:

1. Pass all resolved route settings through dependencies; remove ambient config imports from testable factories.
2. Expose internal entry-construction factories for tests without changing hook bundle exports.
3. Model auth options as a discriminated union rather than one `token` field serving two meanings.
4. Enable strict TypeScript incrementally, beginning with shared and publisher code; document any unavoidable dynamic boundary.
5. Keep helpers local unless they enforce a reused contract.

Acceptance criteria:

- Factories are deterministic under injected config, clock, body reader, verifier, module resolver, and transport dependencies as appropriate.
- Tests construct publisher and subscriber wiring without mutating `process.env` or import caches.
- Strict typecheck passes for the agreed scope, with no broad `any` escape hatch.

Completion evidence:

- Changed: `packages/n8n-sync/src/shared/config.ts`, `packages/n8n-sync/src/shared/http.ts`, `packages/n8n-sync/src/publisher/{entry.ts,index.ts,runtime.ts,sender.ts}`, `packages/n8n-sync/src/subscriber/{entry.ts,index.ts,routes.ts,runtime.ts}`, `packages/n8n-sync/tsconfig.json`, `packages/n8n-sync/tsconfig.tests.json`, `packages/n8n-sync/tests/{config.spec.ts,http.spec.ts,sender.spec.ts,subscriber.spec.ts}`
- Verified: `pnpm --filter @egose/n8n-sync exec tsc --noEmit -p tsconfig.json`
- Verified: `pnpm --filter @egose/n8n-sync exec tsc --noEmit -p tsconfig.tests.json`
- Verified: `pnpm --filter @egose/n8n-sync exec vitest run --no-cache --config vitest.config.ts tests/config.spec.ts tests/subscriber.spec.ts tests/publisher.spec.ts tests/http.spec.ts tests/sender.spec.ts tests/n8n-runtime.spec.ts`
- Result: Vitest ran `6` files / `154` tests, all passed.
- Verified: `pnpm --filter @egose/n8n-sync build`
- Result: publisher and subscriber entries now expose testable env-driven construction helpers without changing the hook bundle export shape; route/runtime factories no longer pull ambient config defaults and instead receive resolved auth/body/replay settings through dependencies; auth is modeled as a discriminated union (`{ mode: 'hmac', secret } | { mode: 'token', token }`) through config, transport, and subscriber route handling; `packages/n8n-sync/tsconfig.json` now runs in `strict` mode for source code, while `tsconfig.tests.json` remains non-strict as the current integration/test nullability boundary pending broader cleanup.

## Wave 5: Packaging And Integration Assurance

### Task PACKAGE-01: Make Published Bundles Reproducible And Consumable

Status: completed

Priority: P1

Suggested agent: package release engineer

Dependencies: CONFIG-01

Primary ownership:

- `packages/n8n-sync/package.json`
- `packages/n8n-sync/tsup.config.ts`
- `packages/n8n-sync/examples/**`
- package artifact tests

Finding:

The package metadata contains placeholders, has no `files` allowlist or package-local prepack assurance, and `dist/` is ignored. Docker examples copy/fetch root-level bundles although builds and exports place them under `dist/`. No packed-artifact consumer test verifies either export.

References:

- `packages/n8n-sync/package.json:4-8`
- `packages/n8n-sync/package.json:18-38`
- `packages/n8n-sync/tsup.config.ts:3-16`
- `packages/n8n-sync/examples/Dockerfile.npm:35-41`
- `packages/n8n-sync/examples/Dockerfile.cdn:37-41`
- `.gitignore:1-3`

Implementation requirements:

1. Replace placeholder metadata through the repository's established release mechanism.
2. Add an explicit package file allowlist and ensure clean-checkout packing builds both bundles.
3. Fix npm and CDN examples to use the actual tarball paths, or deliberately publish root copies and test that layout.
4. Decide whether source maps belong in the artifact; account for their size and embedded `sourcesContent`.
5. Add a packed-tarball smoke test that installs the artifact and requires both exports.

Acceptance criteria:

- `npm pack --dry-run` or the repository-equivalent contains only intended files and both executable bundles.
- A temporary CommonJS consumer can `require('@egose/n8n-sync/publisher')` and `require('@egose/n8n-sync/subscriber')` from the packed artifact.
- Both Docker example bundle acquisition paths succeed against the packed layout.
- Package metadata contains no placeholder values.

Completion evidence:

- Changed: `packages/n8n-sync/package.json`, `packages/n8n-sync/tsup.config.ts`, `packages/n8n-sync/examples/Dockerfile.npm`, `packages/n8n-sync/examples/Dockerfile.cdn`, `packages/n8n-sync/scripts/verify-package.mjs`, `packages/n8n-sync/LICENSE`, `docs/tasks/20260812-084731-n8n-sync-health-remediation.md`
- Verified: `pnpm --filter @egose/n8n-sync build`
- Result: tsup emitted `dist/publisher.cjs`, `dist/subscriber.cjs`, and their source maps with `sourcesContent` stripped from the published maps to keep the artifact smaller while preserving production stack trace mapping.
- Verified: `pnpm --filter @egose/n8n-sync pack:verify`
- Result: the verification script starts from a clean `dist/`, runs `npm pack`, asserts the tarball contains only the intended package files, confirms manifest metadata no longer contains placeholders, checks both example Dockerfiles point at the packed `dist/` layout, installs the tarball into a temporary CommonJS consumer, and successfully `require()`s both `@egose/n8n-sync/publisher` and `@egose/n8n-sync/subscriber`.

### Task INTEGRATION-01: Add Real Database And Critical Lifecycle Coverage

Status: completed

Priority: P1

Suggested agent: integration test engineer

Dependencies: PERSISTENCE-01, CREDENTIAL-02, EXECUTION-02, RUNTIME-01, PACKAGE-01

Primary ownership:

- `packages/n8n-sync/tests/integration-*.spec.ts`
- sandbox/CI integration configuration
- pinned n8n fixtures

Finding:

Current integration tests skip workflow activation and credential update, disable executions, and do not exercise tag filtering, concurrent requests, replay, queue overflow, ownership rollback, package installation, or actual credential encryption-at-rest.

References:

- `packages/n8n-sync/tests/integration-sync.spec.ts:94-110`
- `packages/n8n-sync/tests/integration-sync.spec.ts:181-201`
- `packages/n8n-sync/tests/integration-sync.spec.ts:221-258`
- `packages/n8n-sync/vitest.integration.config.ts:1-17`

Implementation requirements:

1. Pin supported n8n images and database versions.
2. Add execution-enabled, tag-filtered, credential-update, project-link, out-of-order, concurrent, and replay scenarios.
3. Verify state through public APIs and direct database assertions only where no public contract exists.
4. Verify packed bundles rather than workspace source in at least one end-to-end path.
5. Document unavoidable skipped tests with owner, blocker, and residual risk.

Acceptance criteria:

- No critical lifecycle test is silently skipped.
- Real constraints expose execution foreign-key, identity, transaction, and ownership behavior.
- Integration tests run serially where shared n8n instances or generated bundles conflict.
- `pnpm --filter @egose/n8n-sync test:integration` passes on the documented environment.

Completion evidence:

- Changed: `Dockerfile`, `sandbox/docker-compose.yml`, `sandbox/run-integration.ts`, `packages/n8n-sync/tests/integration-utils.ts`, `packages/n8n-sync/tests/integration-sync.spec.ts`, `packages/n8n-sync/src/shared/validate.ts`, `packages/n8n-sync/tests/validate.spec.ts`, `packages/n8n-sync/src/subscriber/n8n-runtime.ts`, `docs/tasks/20260812-084731-n8n-sync-health-remediation.md`
- Verified: `pnpm --filter @egose/n8n-sync typecheck`
- Result: TypeScript completed without errors for `tsconfig.json` and `tsconfig.tests.json` after the integration harness, runtime-adapter, and validator updates.
- Verified: `pnpm --filter @egose/n8n-sync test:integration`
- Result: The package-scoped Docker-backed suite passed on pinned n8n `2.31.2` with `18 passed, 3 skipped` in the default scenario and `11 passed, 10 skipped` in the packed-filtered scenario when run against the matching stack configuration.
- Verified: `pnpm test:integration`
- Result: The repo-root orchestrator passed end-to-end across both documented scenarios for the supported runtime matrix entry (`current` n8n `2.31.2`), including a packed-artifact bundle path, tag-filtered workflow convergence, real database workflow/credential/execution lifecycle coverage, replay rejection, out-of-order handling, and serialized integration execution for the shared sandbox.

## Parallelization Guidance

| Agent | Tasks                                  | May Run With             | Shared Hotspots                                          |
| ----- | -------------------------------------- | ------------------------ | -------------------------------------------------------- |
| A     | DELIVERY-01                            | CONFIG-01, LOGGING-01    | `sender.ts` only                                         |
| B     | PUBLISHER-01, CREDENTIAL-01, MAPPER-01 | DELIVERY-01, CONFIG-01   | sequence work touching `hooks.ts`; coordinate `types.ts` |
| C     | ORDER-01, EXECUTION-01                 | CONFIG-01, HTTP-01       | owns wire identity decisions and `types.ts` first        |
| D     | VALIDATION-01, BODY-01                 | PUBLISHER-01, PACKAGE-01 | sequence `validate.ts`, `body.ts`, `routes.ts`           |
| E     | PERSISTENCE-01, EXECUTION-02           | BODY-01, PACKAGE-01      | exclusive ownership of `applier.ts` while active         |
| F     | CONFIG-01, HTTP-01, LOGGING-01         | DELIVERY-01              | sequence config consumers before entry edits             |
| G     | RUNTIME-01, ARCH-01                    | DELIVERY-01, PACKAGE-01  | coordinate subscriber entry changes                      |
| H     | PACKAGE-01                             | source-only tasks        | serialize builds and tarball generation                  |
| I     | INTEGRATION-01                         | none after dependencies  | owns shared sandbox and generated artifacts              |

Rules:

- ORDER-01 must settle the wire identity/revision contract before VALIDATION-01, PERSISTENCE-01, or EXECUTION-01 changes shared event shapes.
- CREDENTIAL-01 follows PUBLISHER-01 because both modify `publisher/hooks.ts`.
- EXECUTION-02 follows EXECUTION-01 and RUNTIME-01 because it depends on target identity and supported repository behavior.
- Only one agent may modify `subscriber/applier.ts`, `shared/types.ts`, entry wiring, or generated `dist/` at a time.
- Package builds, integration tests, and tarball tests must be serialized.

## Deferred Maintainer Decisions

These decisions do not block DELIVERY-01, PUBLISHER-01, CONFIG-01, HTTP-01, LOGGING-01, or PACKAGE-01. They block the dependent tasks named below.

1. Durable ordering storage: approve a package-owned sync metadata/tombstone table or identify an existing n8n extension point. Blocks final ORDER-01 and PERSISTENCE-01 design.
2. Execution identity: approve a package-owned source-to-target execution mapping and migration lifecycle, or remove execution sync from the supported contract. Blocks EXECUTION-01.
3. Credential object payload: resolved by CREDENTIAL-02. The supported wire contract is now encrypted string blobs only on the pinned n8n `2.31.2` hook matrix; object payloads are unsupported and are dropped/rejected rather than transported, even over TLS.
4. Supported n8n matrix: choose pinned minimum/current versions rather than `latest`. Blocks final RUNTIME-01 and INTEGRATION-01 acceptance.
5. Package source maps: decide whether production debugging value justifies publishing embedded source content. Blocks only the artifact allowlist portion of PACKAGE-01.

## Final Integration Review

### Task REVIEW-01: Independently Verify Security And State Convergence

Status: completed

Priority: P1

Suggested agent: independent reviewer who implemented none of the preceding tasks

Dependencies: all non-deferred tasks

Primary ownership:

- review only across `packages/n8n-sync/**`
- task completion evidence
- final targeted fixes only when assigned separately

Finding:

The package crosses external HTTP, authentication, unstable n8n internals, encrypted credentials, and direct database-write boundaries. Unit tests alone cannot establish safe convergence or artifact compatibility.

References:

- this task document
- all changed source, tests, docs, and release notes

Implementation requirements:

1. Verify every acceptance criterion against runtime behavior rather than completion notes.
2. Re-test duplicate, stale, concurrent, cross-source, delete/archive/upsert, queue overflow, and restart paths.
3. Confirm credentials, auth headers, URLs, event bodies, and database values do not leak through logs, errors, fixtures, source maps, or artifacts.
4. Confirm public types, validation, documentation, publisher output, and subscriber persistence agree.
5. Verify request-controlled body, nesting, collection, retry, replay-cache, and queue bounds.
6. Review all deferred tasks for explicit rationale and residual risk.

Acceptance criteria:

- `pnpm --filter @egose/n8n-sync test` passes.
- `pnpm --filter @egose/n8n-sync typecheck` passes.
- `pnpm --filter @egose/n8n-sync build` passes.
- `pnpm --filter @egose/n8n-sync test:integration` passes on every supported pinned n8n version.
- Packed-artifact and Docker acquisition smoke tests pass.
- `pnpm test`, `pnpm typecheck`, and `pnpm build` pass at repository scope, run serially where required.
- Any unmet criterion is recorded as `blocked` or `deferred` with owner, rationale, and residual risk.

Completion evidence:

- Changed: `packages/n8n-sync/src/shared/validate.ts`, `docs/tasks/20260812-084731-n8n-sync-health-remediation.md`
- Verified: `pnpm --filter @egose/n8n-sync test`
- Verified: `pnpm --filter @egose/n8n-sync typecheck`
- Verified: `pnpm --filter @egose/n8n-sync build`
- Verified: `pnpm --filter @egose/n8n-sync pack:verify`
- Verified: `pnpm test:integration`
- Verified: `pnpm typecheck`
- Verified: `pnpm build`
- Verified: `pnpm test`
- Result: independent review exposed one remaining contract hole before completion, where `parseSyncEvent()` accepted arbitrary string `workflow.staticData` values. The validator now only accepts `staticData` when it is `null`, a JSON object, or a serialized JSON object/null string, matching the documented wire contract and regression tests.
- Result: Docker-backed integration verification passed on the pinned supported runtime `2.31.2` for both orchestrated scenarios (`workspace-default` and `packed-filtered`), covering packaged bundle acquisition as well as the workspace bundle path.
- Result: no new unreconciled P0/P1 findings were discovered beyond the already recorded blocked execution follow-ups (`EXECUTION-01`, `EXECUTION-02`), whose blockers and residual risk remain documented in this file.

## Definition Of Done

- Confirmed P0 and P1 findings are completed or explicitly blocked with maintainer ownership.
- Queue optimization cannot discard required state transitions.
- Every publisher hook and detached promise obeys the no-throw contract.
- Every mutation has source-scoped identity and durable ordering across operation types and restarts.
- Native target executions cannot be overwritten by source ID collisions.
- Subscriber validation rejects malformed and structurally abusive events before persistence.
- HMAC authentication occurs over exact bounded raw bytes before JSON parsing.
- Persistence and owner linking are atomic, concurrency-safe, and retryable.
- Accepted credential payloads are proven encrypted at rest and usable on the target.
- Configuration fails closed for invalid security, URL, entity, and numeric settings.
- Runtime repository access is encapsulated and tested against pinned supported n8n versions.
- Published artifacts, exports, examples, types, implementation, and documentation agree.
- Targeted, package, repository, integration, and packed-consumer checks pass with evidence recorded in this file.
