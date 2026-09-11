# Publisher lock false-positives across Kubernetes pod restarts

Created: 20260910-183944

Follows: `docs/tasks/20260910-173043-publisher-invalid-state-recovery.md` (PUBSTATE track;
that file's PUBSTATE-00 redeploy also refreshes the bundle discussed here).
Long-term track: `docs/tasks/20260823-114633-n8n-sync-residual-health-remediation.md`
(STATE-01 atomic shared allocator).

## Objective and scope

Every pod delete/redeploy on Kubernetes (shared RWX PVC, 1 publisher replica, pinned
image with a pre-heartbeat bundle) produces:

```json
{
  "error": "Publisher state lock already exists at /home/node/.n8n/sync-state/publisher-ordering.json.lock. Multiple publisher processes sharing one SYNC_SOURCE_ID/SYNC_PUBLISHER_STATE_PATH are unsupported without an atomic shared allocator. ..."
}
```

with `publisherStateReady:false, publisherStateReason:"storage_error"`, and every hook
event is dropped while the lock file persists.

Root cause chain (confirmed against code + history):

- The deployed bundle predates commit `809dcf2` (heartbeat staleness). Its lock logic is
  PID-only: a stale `.lock` from the previous pod generation survives on the shared PVC,
  and the new pod boots in a **new PID namespace** where the recorded PID exists again
  (its own process) — `process.kill(pid, 0)` succeeds, so the stale lock always looks
  "live". Guaranteed false-positive on every redeploy.
- Residual hole even in current code (`src/publisher/order-state.ts:395-447`): the lock
  records `host` but never compares it, so cross-namespace PID aliasing still feeds the
  decision within the heartbeat-fresh window (~120s > pod replacement time of seconds).
- Rolling overlap is genuinely ambiguous (old pod still heartbeating during grace), so
  neither instant-steal nor instant-fail is correct — the startup path must wait.

Scope: harden the file-backed lock only. Explicit non-goal: cross-host distributed
locking or the STATE-01 atomic shared allocator (still the long-term fix).

## Working rules and non-goals

- All `process.env` access lives in `src/shared/config.ts`. New tunables (if any) go
  there with defaults preserving current behavior; prefer constants over env unless the
  reviewer justifies operator tuning.
- Never shorten the staleness window to where event-loop stalls could cause false
  steals and duplicate live writers (silent revision reuse → subscriber `409`
  divergence). Split-brain must still fail loud.
- Hook handlers must never throw to n8n (existing error boundary stays).
- Do not import entry files from tests. No runtime dependencies (`node:` builtins only).
- Non-goals: STATE-01, subscriber changes, multi-publisher support, docs website changes
  (README runbook touch-up only if behavior warrants).

## Baseline verification

```bash
pnpm --filter @egose/n8n-sync test        # 448 tests green at creation
npx tsc --noEmit -p packages/n8n-sync/tsconfig.json
npx tsc --noEmit -p packages/n8n-sync/tsconfig.tests.json
pnpm --filter @egose/n8n-sync build
```

Worktree at creation: PUBSTATE-01–06 implementation diff uncommitted (same files below
plus docs); `git status --short` must be inspected before starting.

## Priority definitions

- P0: every k8s redeploy breaks sync until manual `rm` of the lock file.
- P1: review + regression proof.

### Task PUBLOCK-00: Immediate operator unblock (no code)

Status: pending

Priority: P0

Suggested agent: operator

Dependencies: none

Primary ownership: target cluster / PVC

Implementation requirements:

1. Ensure the old publisher pod is fully terminated (no rolling overlap).
2. `rm /home/node/.n8n/sync-state/publisher-ordering.json.lock` on the shared volume.
3. Restart/redeploy with the current build (also resolves the PUBSTATE skew).

Acceptance criteria:

- Next hook allocates cleanly; no `storage_error` in publisher logs.
- Never delete the lock while an old pod may still be terminating.

### Task PUBLOCK-01: Host-aware lock + sync SIGTERM release + startup wait-and-retry

Status: completed

Completion evidence:

- Behavior: `acquireLock` is host-aware (foreign-host locks ignore the PID
  check, staleness-only decision; same/unknown host keeps PID + staleness
  logic); SIGTERM/SIGINT remove the owned lock synchronously
  (`tryRemovePublisherLockSync`, best-effort, never throws), `beforeExit`
  keeps the async path; live-held locks are waited out (poll 1s, timeout
  180s = staleness window + 60s margin, progress via `getStatus()`
  `storage_error` + optional `onLockWait` callback, no logger added) and the
  existing duplicate-publisher error (atomic-shared-allocator wording kept)
  is thrown only after the timeout. Staleness constants unchanged
  (30s heartbeat / 120s stale = 4-heartbeat margin).
- New tests: `packages/n8n-sync/tests/publisher-lock.spec.ts` (5 tests:
  cross-host wait-then-steal, same-host wait-then-fail-loud, sync removal
  unit tests, SIGTERM integration, pre-heartbeat legacy behavior).
  Pre-change proof (src restored to HEAD): all 5 fail — cross-host throws
  the duplicate error instantly (10ms, no wait), same-host/pre-heartbeat
  elapsed 1–2ms vs required ≥350ms wait, `tryRemovePublisherLockSync is
not a function`, SIGTERM leaves the lock file behind; old-API probe
  confirmed the instant-failure bug. Post-change all pass.
- Existing test update: `tests/publisher.spec.ts` concurrent-allocator test
  now injects a short wait window (`lock: { waitTimeoutMs: 500, pollMs: 20 }`)
  since same-host live locks intentionally wait before failing loud.
- Verification: `pnpm --filter @egose/n8n-sync test` → 17 files / 453 tests
  pass (448 baseline + 5 new); `npx tsc --noEmit` on both
  `tsconfig.json` and `tsconfig.tests.json` → clean; `pnpm --filter
@egose/n8n-sync build` → publisher.cjs + subscriber.cjs success; bundle
  smoke check → default hook keys `[credentials, workflow]`.
- Boundaries kept: only `src/publisher/order-state.ts` + tests touched
  (`shared/ordering.ts`, `shared/config.ts`, `subscriber/*`, `hooks.ts`,
  docs otherwise untouched); no new runtime deps (`node:fs` builtin only);
  no `process.env` outside `config.ts` (comment mention only); no entry-file
  imports in tests.

Priority: P0

Suggested agent: backend engineer

Dependencies: PUBLOCK-00 (incident mitigation; code work independent)

Primary ownership:

- `packages/n8n-sync/src/publisher/order-state.ts` (`acquireLock`, `releaseLock`,
  `registerExitCleanup`, lock constants)
- `packages/n8n-sync/tests/order-state.spec.ts` (or focused new spec)

Finding:

`acquireLock` (`order-state.ts:395-447`) treats PID aliveness as a liveness signal even
when the recorded `host` differs from the current host — across k8s pods that signal is
meaningless (separate PID namespaces, recycled PIDs). Shutdown cleanup is async
fire-and-forget, so graceful SIGTERM redeploys routinely leave the lock behind. And a
fresh-but-foreign lock fails instantly instead of waiting out the old pod's grace period.

References:

- `packages/n8n-sync/src/publisher/order-state.ts:174-182` (`isProcessRunning`),
  `195-236` (lock constants/content), `296-378` (write/heartbeat/release/cleanup),
  `395-447` (`acquireLock`)

Implementation requirements:

1. **Host-aware decision:** when the existing lock's `host` is present and differs from
   the current hostname, disregard the PID check entirely (different PID namespace —
   proves nothing) and decide on heartbeat/mtime staleness only. Same host (or missing
   host field from pre-heartbeat locks): keep the current PID + staleness logic
   unchanged. Missing/blank recorded host must be treated as "unknown", never as
   same-host.
2. **Synchronous release on SIGTERM/SIGINT:** remove the lock file synchronously
   (`rmSync`-style, best-effort, never throw) in the signal handlers so graceful
   redeploys leave no lock behind. Keep the existing async best-effort path for
   `beforeExit` and other exits. Handler registration must stay exception-safe.
3. **Startup wait-and-retry:** when the lock is held live (fresh heartbeat, or
   same-host live PID), do not throw immediately. Poll at a short interval until the
   lock is released or goes stale (then steal per existing rules), up to a bounded
   total timeout that exceeds the staleness window plus margin; only then throw the
   existing duplicate-publisher error (keep its "atomic shared allocator" wording and
   guidance). Log waiting at `debug`... note the allocator is logger-free: surface wait
   progress via the existing status mechanism (`markDegraded`/status reason) or a
   lightweight optional callback — do NOT add a logger dependency to order-state.ts.
   Check how `runtime.ts` surfaces degraded state and reuse that channel.
4. **Preserve the split-brain guard:** staleness constants keep a margin of several
   missed heartbeats; genuinely live duplicates still fail loud after the timeout. Do
   not invent cross-host fencing.
5. Tests (must fail pre-change): cross-host lock with live-PID-number + fresh heartbeat
   → waits then proceeds after heartbeat goes stale (use short injected windows if the
   implementation makes them injectable for tests, else real-but-short sleeps);
   same-host live PID + fresh heartbeat → still waits/fails per timeout (no instant
   steal); SIGTERM-handler path removes the lock file (unit-test the handler if
   extractable, else integration-style with a child process only if cheap — prefer
   direct unit tests); pre-heartbeat lock shape (no `host`/`heartbeatAt`) keeps legacy
   behavior.

Acceptance criteria:

- Simulated pod-restart sequence (write lock as "old pod" with foreign host + fresh
  heartbeat, then acquire as "new pod") no longer fails instantly on PID aliasing.
- Graceful-signal path leaves no lock file.
- Full package suite + both typechecks + build pass.

### Task PUBLOCK-02: Final review

Status: completed

Completion evidence:

- Independent reviewer probes (throwaway `/tmp/publock-probes.ts` via repo `tsx`,
  cleaned up afterwards — `/tmp` verified empty of probe artifacts):
  - probe1 foreign-host fresh lock → waited 314ms (14 `onLockWait` pings,
    `getStatus()` degraded `storage_error` observed), then stole after the
    injected 300ms staleness window; new owner + real hostname recorded.
  - probe2 same-host live PID + fresh heartbeat → loud timeout after 402ms
    (19 waits), error matches `/atomic shared allocator/`, lock owner
    preserved (`live-other`).
  - probe3 stale lock (dead PID, 60s-old heartbeat/mtime) → immediate steal
    in 8ms with zero waits.
  - probe4 sync remover unit checks: owned lock removed, foreign-owner and
    unparseable locks preserved, missing file never throws; SIGTERM
    integration (`process.emit('SIGTERM')` after `allocate()`) left no lock
    file behind.
  - probe5 split-brain edge: two consecutive contenders against a same-host
    live lock both failed loud; lock never stolen.
- Split-brain audit (traced `classifyLock` + `acquireLock` wait loop in
  `src/publisher/order-state.ts:696-830`): steal requires observed staleness
  (`!heartbeatFresh || !mtimeFresh`) or same/unknown-host dead PID;
  `hostDiffers` forces `pidDead=false` so foreign PIDs never confer liveness
  nor deadness. All three steal sites are gated on `!live`; both `EEXIST`
  race losses fall through to continued waiting (never silent acquire);
  owner-adoption paths only fire for the allocator's own `lockOwner` UUID;
  `tryRemovePublisherLockSync` returns early unless `existing.owner ===
owner`. No path touches the state file or reinits counters during the
  wait (steal only `rm`s the `.lock`).
- Scope check: `git status --short` shows only
  `src/publisher/order-state.ts`, `tests/publisher.spec.ts` (short wait
  window injection), new `tests/publisher-lock.spec.ts`, the 2-line
  bidirectional link in the PUBSTATE task file, and this (untracked) task
  file. No `package.json` change; `order-state.ts` imports are
  `node:` builtins only; `process.env` matches pre-existing sites only
  (`shared/config.ts` owner + entry `process.env` passthrough +
  comment mention in `order-state.ts`); tests import
  `../src/publisher/order-state` only, never entry files; hooks boundary
  untouched.
- Verification:
  - `pnpm --filter @egose/n8n-sync test` → `Test Files 17 passed (17)`,
    `Tests 453 passed (453)`.
  - `npx tsc --noEmit -p packages/n8n-sync/tsconfig.json` → exit 0, no output.
  - `npx tsc --noEmit -p packages/n8n-sync/tsconfig.tests.json` → exit 0,
    no output.
  - `pnpm --filter @egose/n8n-sync build` → `dist/publisher.cjs 75.80 KB`,
    `dist/subscriber.cjs 94.00 KB`, build success; bundle smoke
    `node -e "const h=require('./packages/n8n-sync/dist/publisher.cjs');
console.log(Object.keys(h))"` → `[ 'credentials', 'workflow' ]`.
- No behavioral fixes made during review (read-only; only this status block
  written).

Priority: P1

Suggested agent: independent reviewer (not the PUBLOCK-01 implementer)

Dependencies: PUBLOCK-01

Primary ownership: `packages/n8n-sync/src/publisher/order-state.ts` + tests

Implementation requirements:

1. Re-verify empirically (throwaway probes in /tmp, cleaned up afterwards): foreign-host
   fresh lock → wait then acquire; same-host live lock → timeout then loud duplicate
   error; stale lock → steal; signal handler → no residue.
2. Trace every path to confirm no same-host live lock can be stolen early (split-brain
   audit) and no path reinits counters.
3. Run: `pnpm --filter @egose/n8n-sync test`, both `tsc --noEmit` configs,
   `pnpm --filter @egose/n8n-sync build` + bundle smoke check. Record outputs.
4. Confirm no new runtime dependencies and no `process.env` access outside
   `src/shared/config.ts`.

Acceptance criteria:

- Reviewer sign-off with command outputs as completion evidence, or `blocked` with the
  exact defect + follow-up proposal (no silent behavior fixes).

## Dependency and parallelization guidance

- PUBLOCK-00 first (operator, unblocks the cluster independently).
- PUBLOCK-01 single implementer (one hotspot file). PUBLOCK-02 strictly after, different agent.

## Deferred decisions

- New env tunables for wait interval/timeout: only if reviewer justifies; defaults must
  stand alone.
- Distributed lock / STATE-01 atomic allocator: out of scope, tracked by the residual
  remediation file.

## Definition of done

- Redeploy-then-hook sequence succeeds with no manual lock removal and no dropped events.
- Genuine duplicates still fail loud with the existing guidance error.
- 448+ tests green, typechecks + build pass, reviewer sign-off recorded.
- Bidirectional link: this file follows
  `docs/tasks/20260910-173043-publisher-invalid-state-recovery.md`.
