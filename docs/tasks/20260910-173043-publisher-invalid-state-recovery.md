# Publisher invalid-state recovery (`SYNC_PUBLISHER_INVALID_STATE`)

Created: 20260910-173043

Related: `docs/tasks/20260823-114633-n8n-sync-residual-health-remediation.md` (STATE-01/DESIGN-01 long-term track),
`docs/adr-20260823-transactional-sync-metadata-store.md` (accepted STATE-01 design).
Follow-up: `docs/tasks/20260910-183944-publisher-lock-k8s-restart.md` (PUBLOCK track —
stale `.lock` false-positives across pod restarts).

## Objective and scope

On Kubernetes (shared RWX PVC for sync state, 1 publisher replica, pinned image), every pod
delete/redeploy produces:

```json
{
  "error": "Invalid sync publisher order state at /home/node/.n8n/sync-state/publisher-ordering.json",
  "context": "publisher hook",
  "hook": "workflow.afterUpdate",
  "level": "error",
  "module": "N8nSyncPublisher",
  "msg": "error"
}
```

while the hook event is dropped and sync halts silently.

Investigation evidence (2026-09-11): the on-disk file that triggers this is **valid v3 state** —

```json
{
  "version": 3,
  "sourceId": "n8n",
  "nextEventSequence": "33",
  "entityRevisions": { "[\"workflow\",\"cVEK5GA9Im9YPUAk\"]": "33" }
}
```

— which passes current validation in
`packages/n8n-sync/src/publisher/order-state.ts:82-97`. The throw site
(`order-state.ts:281-284`) is reached only when parsed JSON matches no known shape
(v1, v2, v3), which rules out missing files (fresh boot), truncated/0-byte files
(`JSON.parse` would throw `SyntaxError` with different text), and `SYNC_SOURCE_ID`
rotation (separate explicit error at `order-state.ts:285-290`). Conclusion: the bundle
baked into the pinned image **predates the v3 state format** (no v1/v2→v3 migration),
and the RWX PVC preserves the newer v3 file across pod generations. Each fresh pod boots
the old bundle and fails `loadState` on the first hook.

Scope of this file:

- Wave 0: immediate operator remediation (no code) — rebuild/redeploy current bundles.
- Waves 1–2: code hardening — diagnostic errors, quarantine, env-controlled recovery
  policy `SYNC_PUBLISHER_INVALID_STATE: fail | quarantine-reset` (name approved by maintainer),
  crash durability, startup visibility, tests, docs.
- Explicit non-goal: moving publisher counters to Postgres (STATE-01 track, still blocked
  on Docker-backed integration verification).

## Working rules and non-goals

- All `process.env` access lives in `packages/n8n-sync/src/shared/config.ts` — nowhere else.
- Never auto-reinit counters under the **same** `SYNC_SOURCE_ID`: reused
  `eventId`/`entityRevision` values are rejected by the subscriber as stale/conflict
  (`409 SYNC_REVISION_CONFLICT`) causing silent divergence. `quarantine-reset` is allowed
  only with an epoch rotation (different configured `sourceId` than the quarantined file).
- Never overwrite or delete the only copy of a corrupt state file: quarantine (rename to
  backup) instead.
- Hook handlers must never throw to n8n (existing `publisher/hooks.ts` error boundary stays).
- Do not import entry files (`publisher/index.ts`, `subscriber/index.ts`) from tests.
- Non-goals: STATE-01/IDENTITY-02/EXECUTION-01 transactional persistence; subscriber-side
  changes; multi-publisher topologies (still unsupported by design).

## Baseline verification

```bash
pnpm --filter @egose/n8n-sync test        # 434 tests green at baseline
npx tsc --noEmit -p packages/n8n-sync/tsconfig.json
npx tsc --noEmit -p packages/n8n-sync/tsconfig.tests.json
pnpm --filter @egose/n8n-sync build       # tsup → dist/publisher.cjs + dist/subscriber.cjs
```

Clean worktree at creation (`git status --short` empty, HEAD `1a0cd51`).

## Priority definitions

- P0: data-loss or silent-divergence risk; blocks the k8s rollout.
- P1: required hardening for the approved behavior.
- P2: durability/observability improvements.

## Waves

- Wave 0 (ops, no code): rebuild + redeploy — immediate incident fix.
- Wave 1 (sequential, shared hotspot `publisher/order-state.ts`): PUBSTATE-01 → PUBSTATE-02.
- Wave 2 (parallelizable after Wave 1): PUBSTATE-03 (durability), PUBSTATE-04 (visibility).
- Wave 3: PUBSTATE-05 (docs) after behavior settles; PUBSTATE-06 final integration review last.

### Task PUBSTATE-00: Rebuild and redeploy current bundles (immediate fix)

Status: pending

Priority: P0

Suggested agent: operator / release

Dependencies: none

Primary ownership:

- `packages/n8n-sync/dist/publisher.cjs`, `dist/subscriber.cjs` (build artifacts)
- publisher image build + rollout

Finding:

Running publisher bundle rejects the valid on-disk v3 file because it predates the v3
format. Rebuilding from current `src` (which migrates v1/v2 → v3 and accepts v3) should
load the existing file untouched — no state surgery needed.

References:

- `packages/n8n-sync/src/publisher/order-state.ts:257-284`
- Captured v3 fixture in Objective above.

Implementation requirements:

1. Back up the live `publisher-ordering.json` from the PVC before any rollout.
2. `pnpm --filter @egose/n8n-sync build`, bake both bundles into the image, roll the
   publisher; confirm the `n8n-sync publisher hooks registered` info log with no
   `Invalid sync publisher order state` error on the next hook.
3. Verify the on-disk file is byte-identical after first boot (migration must be a no-op
   for a valid v3 file).

Acceptance criteria:

- Publisher pod boots clean; workflow save on the source produces a sync event with no
  error log.
- Backup file retained alongside the live path.

### Task PUBSTATE-01: Diagnostic invalid-state error + quarantine on `fail`

Status: completed

Priority: P0

Suggested agent: backend engineer

Dependencies: PUBSTATE-00 (so live incident is already mitigated; behavior work is independent)

Primary ownership:

- `packages/n8n-sync/src/publisher/order-state.ts` (loadState branch at :281-284)
- `packages/n8n-sync/tests/order-state.spec.ts`

Finding:

The current throw (`Invalid sync publisher order state at ${statePath}`) carries no
shape information, so the v3-vs-old-bundle skew was indistinguishable from genuine
corruption. There is also no backup: repeated restarts re-read the same file forever.

References:

- `packages/n8n-sync/src/publisher/order-state.ts:242-294`
- `packages/n8n-sync/src/subscriber/order-state.ts:37-41` (guidance-error style to mirror)

Implementation requirements:

1. On unknown-shape parsed JSON, throw an error containing: parsed `version` (or its
   JSON type when absent), stored `sourceId` preview, entity-key count, state path, and
   running package version, plus operator recovery steps (restore backup / resync).
2. Before throwing, quarantine the file via atomic rename to
   `<statePath>.corrupt.<UTC-timestamp>.bak`. Never write over or delete the original
   in place. Quarantine failure must not mask the original error (log and continue to throw).
3. Keep throwing (fail-closed): degraded `invalid_state` status, no counter reinit.
4. Add a regression test with a foreign-shape fixture (e.g. `{"version":99}` and `{}`):
   fails on old code (bare message, no backup), passes with backup present + diagnostic fields.

Acceptance criteria:

- Unknown-shape fixture produces a `.corrupt.*.bak` backup and an error naming the
  parsed version and recovery steps.
- `pnpm --filter @egose/n8n-sync test` passes; typechecks pass.

Completion evidence:

- Changed files:
  - `packages/n8n-sync/src/publisher/order-state.ts` — added exported
    `PUBLISHER_ORDER_STATE_VERSIONS = [1, 2, 3]`, exported quarantine helper
    `quarantineCorruptPublisherState(statePath: string): Promise<string>`
    (atomic `rename` to `<statePath>.corrupt.<UTC-timestamp>.bak`), internal
    `describeUnknownPublisherState` diagnostics, and a guidance-style
    invalid-state error (parsed version / stored sourceId preview / entity-key
    count / state path / supported versions / recovery steps). Quarantine
    failure is swallowed so it never masks the original error. Fail-closed:
    `invalid_state` degraded status, no counter reinit.
  - `packages/n8n-sync/tests/order-state.spec.ts` — two regression tests with
    `{"version":99}` and `{}` fixtures asserting backup creation (original
    bytes preserved in `.corrupt.*.bak`) plus diagnostic fields in the error.
- Package-version decision: no runtime `package.json` read and no new
  build-time define (fragile inside the tsup-bundled `dist/publisher.cjs` with
  no runtime deps; release version is only materialized into `package.json` at
  pack time by `scripts/materialize-release-metadata.mjs`). The error instead
  carries the supported state format versions (`supports publisher state
versions 1, 2, 3`), which is the stable identifier for bundle-skew triage.
- Verification (2026-09-11, from repo root):
  - `pnpm --filter @egose/n8n-sync test` → 15 files, 436 tests passed
    (baseline 434 + 2 new).
  - `npx tsc --noEmit -p packages/n8n-sync/tsconfig.json` → pass.
  - `npx tsc --noEmit -p packages/n8n-sync/tsconfig.tests.json` → pass.
  - `pnpm --filter @egose/n8n-sync build` → success
    (`dist/publisher.cjs` 67.68 KB, `dist/subscriber.cjs` 93.29 KB).

### Task PUBSTATE-02: `SYNC_PUBLISHER_INVALID_STATE` config + `quarantine-reset` with epoch guard

Status: completed

Priority: P0

Suggested agent: backend engineer

Dependencies: PUBSTATE-01 (builds on the quarantine helper and diagnostic error)

Primary ownership:

- `packages/n8n-sync/src/shared/config.ts` (new env parsing + `PublisherConfig` field)
- `packages/n8n-sync/src/publisher/order-state.ts` (allocator option + reset branch)
- `packages/n8n-sync/src/publisher/runtime.ts:66-69` (thread the option)
- `packages/n8n-sync/tests/config.spec.ts`, `tests/order-state.spec.ts`

Finding:

Operator approved an env-controlled recovery policy. Unconditional auto-reset would reuse
`eventId`/`entityRevision` values under the same source identity, which the subscriber
drops as stale/conflict — silent divergence. Reset is safe only as an epoch rotation.

References:

- `packages/n8n-sync/src/shared/config.ts:288-321` (publisher config parsing patterns)
- `packages/n8n-sync/README.md` source-rotation section

Implementation requirements:

1. Parse `SYNC_PUBLISHER_INVALID_STATE` as `fail | quarantine-reset`, default `fail`;
   invalid values fail startup with the allowed-values message.
2. `quarantine-reset` on unknown-shape state: quarantine (reuse PUBSTATE-01 helper),
   then reinit counters from zero **only if** configured `SYNC_SOURCE_ID` differs from
   the quarantined file's stored `sourceId` (when the stored value is a non-blank string;
   unparseable/missing stored identity counts as unknown — refuse reset, stay `fail`
   behavior). Same-identity reset → startup failure with an error explaining the
   stale/`409 SYNC_REVISION_CONFLICT` divergence risk.
3. On epoch reset, emit a prominent warn: old epoch quarantined at `<backup path>`,
   new epoch `<sourceId>`, mandatory subscriber full-resync required before trusting
   convergence.
4. v1/v2 migration paths unchanged; only the unknown-shape branch gains the policy.
5. Tests: default `fail`; both values parse; garbage rejects; reset + rotated identity →
   fresh counters + backup + warn; reset + same identity → throws; unparseable stored
   identity → throws.

Acceptance criteria:

- All new tests fail on the pre-change implementation and pass after.
- Existing `order-state` + `config` suites pass; typechecks + build pass.

Completion evidence:

- Changed files:
  - `packages/n8n-sync/src/shared/config.ts` — new `SyncPublisherInvalidState`
    (`'fail' | 'quarantine-reset'`) type, `DEFAULT_SYNC_PUBLISHER_INVALID_STATE =
'fail'`, and `PublisherConfig.invalidState` parsed from
    `SYNC_PUBLISHER_INVALID_STATE` via the existing `requireEnumValue` pattern
    (blank → default; garbage fails startup with the allowed-values message).
    All `process.env` access stays in config.ts.
  - `packages/n8n-sync/src/publisher/order-state.ts` — `createEventOrderingAllocator`
    accepts `invalidState` (default `'fail'`); only the unknown-shape branch
    gains the policy (v1/v2 migration unchanged). `quarantine-reset` quarantines
    via the PUBSTATE-01 helper (failure falls back to fail behavior), then reads
    the stored `sourceId` back from the quarantined backup: missing/unparseable/
    non-blank violations refuse reset with the fail diagnostic; same-identity
    throws a refusal naming the stale/`409 SYNC_REVISION_CONFLICT` divergence
    risk; rotated identity reinits counters from zero and records
    `PublisherInvalidStateResetInfo` (`backupPath`, `previousSourceId`,
    `newSourceId`), exposed via the optional `getInvalidStateReset()` on
    `EventOrderingAllocator` (optional so hand-rolled test fakes keep compiling;
    `order-state.ts` stays logger-free).
  - `packages/n8n-sync/src/publisher/runtime.ts` — threads
    `config.publisher.invalidState` into the allocator and, after successful
    `initialize()`, logs a prominent warn (old epoch backup path, new epoch
    sourceId, mandatory full subscriber resync) when `getInvalidStateReset()`
    reports a recovery.
  - Tests: `tests/config.spec.ts` (default `fail`, blank → default, both values
    parse, garbage rejects with allowed-values message), `tests/order-state.spec.ts`
    (rotation → fresh counters + backup + reset signal; same identity → throws;
    missing/non-string/blank stored identity → throws), `tests/publisher.spec.ts`
    (startup warn after `quarantine-reset` recovery; added `invalidState: 'fail'`
    to the manual `SyncConfig` fixture).
- Verification (2026-09-11, from repo root):
  - `pnpm --filter @egose/n8n-sync test` → 15 files, 446 tests passed
    (baseline 436 + 10 new).
  - `npx tsc --noEmit -p packages/n8n-sync/tsconfig.json` → pass.
  - `npx tsc --noEmit -p packages/n8n-sync/tsconfig.tests.json` → pass.
  - Pre-change check (src changes stashed, new tests kept): 11 failures —
    all 9 new PUBSTATE-02 tests plus the 2 PUBSTATE-01 quarantine tests (their
    src was stashed too); post-restore full suite green again.

### Task PUBSTATE-03: Crash durability for file writes

Status: completed

Priority: P1

Suggested agent: backend engineer

Dependencies: PUBSTATE-01 (quarantine helper location; otherwise independent of PUBSTATE-02)

Primary ownership:

- `packages/n8n-sync/src/shared/ordering.ts:180-185` (`writeJsonFileAtomic`)
- focused unit tests for the writer

Finding:

RWX volumes are commonly NFS/Ceph-backed, where rename durability across hard kills
differs from local FS, and tmp names `${path}.${pid}.${Date.now()}.tmp` can collide
across container PID namespaces sharing one volume.

References:

- `packages/n8n-sync/src/shared/ordering.ts:169-185`

Implementation requirements:

1. `fsync` the temp file handle and the containing directory handle after write/rename
   (best-effort: fsync failure warns but does not fail the write; existing staleness
   logic covers the remainder).
2. Add a random component (e.g. `randomUUID` prefix) to tmp names.
3. Keep the function dependency-free and safe for both publisher and subscriber paths.

Acceptance criteria:

- Concurrent multi-process writes to one path still always leave valid JSON (stress test
  with parallel writers in a temp dir).
- Full package test suite passes.

Completion evidence:

- Changed files:
  - `packages/n8n-sync/src/shared/ordering.ts` — `writeJsonFileAtomic` now opens
    the temp file via file handle, `sync()` (fsync) after write, `rename`, then
    `sync()` on the containing directory handle. Both fsyncs are best-effort
    and deliberately swallowed (log-free: module stays dependency-free, no
    logger import) so filesystems without fsync support never break writes —
    each swallow site carries a comment. Tmp names gained a `randomUUID()`
    component (`${path}.${pid}.${Date.now()}.${randomUUID()}.tmp`) so
    container PID namespaces sharing one RWX volume cannot collide.
    `randomUUID` comes from `node:crypto` (same builtin `publisher/order-state.ts`
    already uses); no runtime dependencies added. Writer is shared by publisher
    and subscriber paths, so both gain the durability.
  - `packages/n8n-sync/tests/ordering-io.spec.ts` (new) — stress test with 200
    parallel `writeJsonFileAtomic` calls (8 writers x 25 iterations) to one
    path plus 4 concurrent readers: every observed file is parseable JSON and
    internally consistent (`seq === echo`, 4 KiB filler embeds `seq`, final
    value deep-equals one written payload — no torn reads).
- Verification (2026-09-11, from repo root):
  - `pnpm --filter @egose/n8n-sync test` → 16 files, 447 tests passed
    (baseline 446 + 1 new).
  - `npx tsc --noEmit -p packages/n8n-sync/tsconfig.json` → pass.
  - `npx tsc --noEmit -p packages/n8n-sync/tsconfig.tests.json` → pass.

### Task PUBSTATE-04: Startup state visibility

Status: completed

Priority: P2

Suggested agent: backend engineer

Dependencies: PUBSTATE-02 (log the effective recovery mode alongside state info)

Primary ownership:

- `packages/n8n-sync/src/publisher/runtime.ts:81-95`

Finding:

Skew/invalid state currently surfaces only at the first hook (`workflow.afterUpdate`),
not at deploy time. The init path already loads state (`initialize()`), but logs only
generic readiness.

Implementation requirements:

1. On successful init, log at `info`: state shape version, stored `sourceId`,
   `nextEventSequence`, entity-key count, and effective `SYNC_PUBLISHER_INVALID_STATE` mode.
2. Keep the degraded-state warn path unchanged in structure (add the mode + backup path
   when present).

Acceptance criteria:

- Fresh boot against the captured v3 fixture logs version/sourceId/counters at info.
- No change to hook wiring or delivery behavior.

Completion evidence:

- Changed files:
  - `packages/n8n-sync/src/publisher/order-state.ts` — new exported
    `PublisherOrderStateSummary` (`version`, `sourceId`,
    `nextEventSequence`, `entityKeyCount`) and optional
    `getStateSummary()` on `EventOrderingAllocator` (optional +
    `typeof`-guarded like `getInvalidStateReset()`; returns primitives
    only, never mutable state; `undefined` when nothing is loaded yet).
    Implemented in both the in-memory and file-backed allocators.
  - `packages/n8n-sync/src/publisher/runtime.ts` — on successful
    `initialize()`, the `n8n-sync publisher hooks registered` info log
    now carries `publisherStateVersion`, `publisherStateSourceId`,
    `publisherNextEventSequence`, `publisherEntityKeyCount` (when a
    summary is available) plus the effective `invalidStateMode`
    (`config.publisher.invalidState`). The epoch-reset warn is
    unchanged. The degraded-state warn keeps its structure and gains
    `invalidStateMode` always plus `quarantinedBackupPath` when a reset
    was reported. No change to hook wiring or delivery.
  - `packages/n8n-sync/tests/publisher.spec.ts` — new test booting the
    real allocator against the captured v3 fixture
    (`version: 3, sourceId: 'n8n', nextEventSequence: '33'`, one
    entity key) asserting the info log carries version/sourceId/
    counters/mode; follows the PUBSTATE-02 runtime warn test style
    (temp dir, `parseConfig`, mocked logger, `vi.waitFor`).
- Verification (2026-09-11, from repo root):
  - `pnpm --filter @egose/n8n-sync test` → 16 files, 448 tests passed.
  - `npx tsc --noEmit -p packages/n8n-sync/tsconfig.json` → pass.
  - `npx tsc --noEmit -p packages/n8n-sync/tsconfig.tests.json` → pass.
  - Pre-change check (PUBSTATE-04 src changes stashed, new test kept):
    the new test fails in isolation
    (`tests/publisher.spec.ts -t "logs publisher state version"` →
    1 failed); post-restore full suite green again.

### Task PUBSTATE-05: Docs and runbook

Status: completed

Priority: P1

Suggested agent: technical writer / engineer

Dependencies: PUBSTATE-02, PUBSTATE-04 (document final behavior)

Primary ownership:

- `packages/n8n-sync/README.md` (env table + recovery runbook)
- `website/docs/n8n-sync/sync/environment.mdx`, `website/docs/n8n-sync/sync/persistence-readiness.mdx`

Implementation requirements:

1. Document `SYNC_PUBLISHER_INVALID_STATE` (`fail` default | `quarantine-reset`), the
   quarantine backup naming, and the epoch-rotation requirement (new `SYNC_SOURCE_ID` +
   full subscriber resync; same-identity reset is refused and why).
2. Recovery runbook: backup → inspect parsed version fields → rebuild/redeploy on skew →
   restore/resync on genuine corruption.
3. Topology guidance: dedicated RWO PVC preferred over RWX for sync state, `Recreate`
   strategy for the publisher, digest-pinned images, stable `SYNC_SOURCE_ID`.

Acceptance criteria:

- README table, website env page, and readiness page all describe the new variable and
  the runbook consistently with the implementation.

Completion evidence:

- Changed files (docs only; no `src/` or `tests/` touched):
  - `packages/n8n-sync/README.md` — new `SYNC_PUBLISHER_INVALID_STATE`
    row after the `SYNC_PUBLISHER_STATE_PATH` row (`fail` default |
    `quarantine-reset`, `<statePath>.corrupt.<UTC-timestamp>.bak` quarantine
    naming, epoch-rotation requirement, same-identity refusal with the
    stale/`409 SYNC_REVISION_CONFLICT` divergence rationale, invalid values
    fail startup), plus a `Publisher invalid-state recovery` runbook
    subsection (backup → inspect parsed version fields → rebuild/redeploy on
    skew → restore/resync on genuine corruption; epoch-rotation warn fields
    `previousSourceId`/`newSourceId`/`quarantinedBackupPath`/
    `invalidStateMode`; startup info fields `publisherStateVersion`,
    `publisherStateSourceId`, `publisherNextEventSequence`,
    `publisherEntityKeyCount`, `invalidStateMode`; degraded-state warn gains
    `invalidStateMode` plus `quarantinedBackupPath`).
  - `website/docs/n8n-sync/sync/environment.mdx` — matching
    `SYNC_PUBLISHER_INVALID_STATE` publisher-table row in existing style.
  - `website/docs/n8n-sync/sync/persistence-readiness.mdx` — Recovery Notes
    gains quarantine behavior, the runbook, and startup-visibility fields;
    new Topology (Kubernetes) section (dedicated RWO PVC over shared RWX,
    single replica + `Recreate`, digest-pinned images, stable
    `SYNC_SOURCE_ID`); Related Docs link lists the new variable.
- Claim verification against implementation: default `fail`
  (`shared/config.ts:75`), enum parsing via `requireEnumValue` with
  allowed-values startup failure (`shared/config.ts:324-329`), backup naming
  `` `${statePath}.corrupt.${timestamp}.bak` `` with
  `toISOString().replace(/[:.]/g, '-')` (`publisher/order-state.ts:92-97`),
  fail-closed `invalid_state` degraded status with no counter reinit plus
  quarantine-failure fallback (`publisher/order-state.ts:402-412`), epoch
  guard reading stored identity back from the quarantined backup and refusing
  same-identity/missing-identity resets
  (`publisher/order-state.ts:420-458`), reset warn fields
  (`publisher/runtime.ts:90-99`), startup info fields
  (`publisher/runtime.ts:101-114`), degraded warn fields
  (`publisher/runtime.ts:116-127`).
- Verification (2026-09-11, from repo root):
  - `pnpm --filter @egose/n8n-sync test` → 16 files, 448 tests passed
    (untouched by this docs-only change).
  - `git status --short` confirms this change touches only the three
    markdown files above plus this task file (pre-existing `src/`/`tests/`
    modifications from PUBSTATE-01–04 left as-is).

### Task PUBSTATE-06: Final integration review

Status: completed

Priority: P1

Suggested agent: independent reviewer (not the Wave 1–2 implementer)

Dependencies: PUBSTATE-01 – PUBSTATE-05

Primary ownership: whole `packages/n8n-sync` surface touched above

Implementation requirements:

1. Verify each acceptance criterion against runtime behavior (foreign-shape fixture,
   rotated-identity reset, same-identity refusal) — not just code reading.
2. Confirm `fail` default preserves current safe behavior; confirm no path reinits
   counters under an unchanged `SYNC_SOURCE_ID`.
3. Confirm public types, README/website docs, and implementation agree; confirm
   `pnpm --filter @egose/n8n-sync test`, both typechecks, and `pnpm --filter
@egose/n8n-sync build` + bundle smoke check pass.
4. Record residual risk: file-backed state remains until STATE-01; link back to
   `20260823-114633-n8n-sync-residual-health-remediation.md`.

Acceptance criteria:

- Reviewer sign-off with command outputs recorded as completion evidence.

Completion evidence:

- Independent runtime probes (throwaway `tsx` scripts in `/tmp`, since
  removed; exercised built factories `createEventOrderingAllocator`,
  `parseConfig`, `createPublisherHookConfig` against temp dirs — 9/9 pass):
  - (a) `{"version":99}` and `{}` under default mode → throw with parsed
    version (`99` / `missing`) + recovery steps, exactly one
    `.corrupt.<UTC-timestamp>.bak` backup with byte-identical original,
    status `{ ready: false, reason: 'invalid_state' }`.
  - (b) `quarantine-reset` + rotated `SYNC_SOURCE_ID` (`old-epoch` →
    `new-epoch`) → `initialize()` succeeds, `getInvalidStateReset()` reports
    `{ previousSourceId: 'old-epoch', newSourceId: 'new-epoch', backupPath }`,
    summary `nextEventSequence '0'`, live file rewritten as valid v3, and the
    runtime emits the epoch-reset warn (`previousSourceId`, `newSourceId`,
    `quarantinedBackupPath`, `invalidStateMode: 'quarantine-reset'`) followed
    by the hooks-registered info (`publisherStateVersion 3`, …).
  - (c) `quarantine-reset` + same identity → refusal naming same
    `SYNC_SOURCE_ID` + `409 SYNC_REVISION_CONFLICT` risk, no reset recorded,
    `invalid_state` status; missing stored identity → refusal naming no usable
    stored identity.
  - (d) Valid v3 fixture (`version 3`, `sourceId "n8n"`, `nextEventSequence
"33"`, one entity key) → loads unchanged (byte-identical after init),
    summary `{ version 3, sourceId 'n8n', nextEventSequence '33',
entityKeyCount 1 }`; runtime info log carries `publisherStateVersion`,
    `publisherStateSourceId`, `publisherNextEventSequence`,
    `publisherEntityKeyCount`, `invalidStateMode: 'fail'`.
  - (e) `SYNC_PUBLISHER_INVALID_STATE=reset` → `parseConfig` throws
    `SYNC_PUBLISHER_INVALID_STATE must be one of "fail", "quarantine-reset"`;
    unset/blank → default `'fail'`.
- Counter-reinit trace (`src/publisher/order-state.ts`): the only zeroing
  branch is line ~454 inside the `quarantine-reset` path, guarded by
  quarantine success + non-blank stored `sourceId` + `storedSourceId !==
sourceId` (same-identity → throw ~448-453; missing/unparseable → throw
  ~442-446; quarantine failure → throw ~420-429). `fail` default quarantines
  then throws with no reinit (~402-413). Missing file creates a fresh zeroed
  state only when no file exists (~367-370); v1/v2 migration preserves
  counters (~372-395); stored/configured `sourceId` mismatch throws without
  reinit (~460-465). No path reinits counters under an unchanged
  `SYNC_SOURCE_ID`.
- Docs/implementation agreement: env name `SYNC_PUBLISHER_INVALID_STATE`,
  default `fail` (`shared/config.ts:75`), backup naming
  `<statePath>.corrupt.<UTC-timestamp>.bak` (`order-state.ts:92-97`), log
  fields (`runtime.ts:90-99` reset warn, `:101-114` startup info, `:116-127`
  degraded warn), and epoch requirement all match across README, website
  `environment.mdx`, and `persistence-readiness.mdx`. One trivial doc
  imprecision fixed by reviewer (README env-table row said both modes
  quarantine "before failing"; now notes reset under `quarantine-reset`
  epoch rotation). No behavioral inconsistencies found; no `src/` changes made.
- Zero-runtime-dependency holds: all `src/` value imports resolve to `node:`
  builtins (`crypto`, `fs/promises`, `os`, `path`) or relative modules;
  `express` is `import type` only; `package.json` has no `dependencies`.
- Verification (2026-09-11, from repo root):
  - `pnpm --filter @egose/n8n-sync test` → 16 files, 448 tests passed.
  - `npx tsc --noEmit -p packages/n8n-sync/tsconfig.json` → pass.
  - `npx tsc --noEmit -p packages/n8n-sync/tsconfig.tests.json` → pass.
  - `pnpm --filter @egose/n8n-sync build` → success (`dist/publisher.cjs`
    72.42 KB, `dist/subscriber.cjs` 94.00 KB).
  - Bundle smoke `node -e "const h=require('./packages/n8n-sync/dist/publisher.cjs');
console.log(Object.keys(h))"` → `[ 'credentials', 'workflow' ]`.
- Residual risk: file-backed publisher state remains until STATE-01
  (`docs/tasks/20260823-114633-n8n-sync-residual-health-remediation.md`,
  blocked on DESIGN-01 Docker-backed verification); this task file links it in
  Related (line 5), Working rules non-goals, and Deferred decisions. PUBSTATE-00
  (rebuild/redeploy) remains `pending` — operator action outside code review.

## Dependency and parallelization guidance

- PUBSTATE-00 first (incident mitigation, unblocks k8s rollout independently).
- PUBSTATE-01 → PUBSTATE-02 strictly sequential (shared quarantine helper + error type
  in `publisher/order-state.ts`).
- PUBSTATE-03 and PUBSTATE-04 may run in parallel after PUBSTATE-01 (disjoint files:
  `shared/ordering.ts` vs `publisher/runtime.ts`). Do not run two builds concurrently
  (tsup writes shared `dist/`).
- PUBSTATE-05 after PUBSTATE-02/PUBSTATE-04 behavior is final. PUBSTATE-06 last.

## Deferred decisions requiring maintainer input (all resolved or tracked)

- Env var name/shape: **resolved** — `SYNC_PUBLISHER_INVALID_STATE`, `fail | quarantine-reset`.
- Same-identity auto-reset: **decided against** (silent-divergence risk); enforced refusal.
- Transactional publisher counters: **deferred** to STATE-01
  (`20260823-114633-n8n-sync-residual-health-remediation.md`, blocked on DESIGN-01
  Docker-backed verification). This file must not invent a competing schema.
- k8s topology (RWO vs RWX, `Recreate`): operator decision at rollout; recommendation
  recorded in PUBSTATE-05.

## Definition of done

- Current-bundle redeploy (PUBSTATE-00) loads the existing v3 file unchanged on k8s.
- `fail` (default): foreign-shape file → quarantined backup + diagnostic error, no data loss.
- `quarantine-reset` + rotated identity → fresh epoch with warn; same identity → startup refusal.
- `pnpm --filter @egose/n8n-sync test` (434+ tests incl. new regression tests), both
  `tsc --noEmit` project typechecks, and `pnpm --filter @egose/n8n-sync build` all pass.
- README + website docs consistent with behavior; reviewer sign-off recorded (PUBSTATE-06).
