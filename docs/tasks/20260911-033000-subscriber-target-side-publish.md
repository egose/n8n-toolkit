# Subscriber target-side publish via `active` tag

## Intent

`active` tag = publish on the target only, source stays a draft.
Previously `SYNC_APPLY_ACTIVE_STATE=true` only wrote the `active` DB column,
which never registered triggers with the target's active workflow manager.

## Change

- `N8N_CORE_PATH` (default `/usr/local/lib/node_modules/n8n`) added to
  `SubscriberConfig`; all `process.env` access stays in `src/shared/config.ts`.
- `src/subscriber/n8n-runtime.ts` resolves `WorkflowService` +
  `WorkflowHistoryService` tolerantly at startup (missing files/DI degrade to
  `undefined`, startup keeps working).
- New `src/subscriber/publication.ts` (`createWorkflowPublicationManager`):
  ensures a `workflow_history` version row (`findVersion` → `saveVersion`),
  then `activateWorkflow` / `deactivateWorkflow`. Never throws; returns
  `published | unpublished | unavailable | failed` with warn logs.
- `src/subscriber/applier.ts` syncs publication after create/update/race
  reconcile (skips stale, archived, missing `versionId`) and unpublishes
  before delete/archive. Failures are warn-only; the event still applies.
- Scope: symmetric activate + deactivate; failure handling: applied + warn.

## Verification

- `pnpm test`: 18 files, 471 tests pass (incl. new `tests/publication.spec.ts`
  13 tests, `n8n-runtime.spec.ts` +4, `config.spec.ts` +1).
- `tsc --noEmit` clean for `tsconfig.json`, `tsconfig.tests.json`,
  `tsconfig.contract-tests.json`; ESLint clean on touched files; `pnpm build`
  produces both bundles.
- Sandbox e2e (rebuilt images, `SYNC_FILTER_BY_TAG=true`):
  source `x3LLajQXwmWFSEbt` draft + `sync,active` tags → target
  `active=true`, `activeVersionId=versionId`, 4 history rows, subscriber log
  `Target workflow published`. Removing the `active` tag + re-save →
  `Target workflow unpublished`, target `active=false`. Tags restored after.
- Probe workflow `zMPN0GZdC9XQnBCJ` on n8n2 deactivated + deleted.

## Docs

- `packages/n8n-sync/AGENTS.md`: `SYNC_APPLY_ACTIVE_STATE` gotcha now
  describes real publishing + fallback; `N8N_CORE_PATH` added to runtime paths.
- `website/docs/n8n-sync/sync/environment.mdx`: `SYNC_APPLY_ACTIVE_STATE`
  row updated, `N8N_CORE_PATH` row added.
- `website/docs/n8n-sync/sync/limitations.mdx`: DB-only bullet replaced with
  publish-on-target behavior.

## Residual notes

- Target uses the legacy synchronous trigger path
  (`useWorkflowPublicationService=false`): `workflow_published_version` stays
  empty, same as a UI publish — expected, not a sync defect.
- Public API workflow update rejects `tags` (`request/body/tags is read-only`);
  e2e tag changes were done via direct `workflows_tags` edits + API re-save.
- Owner-permission path (`workflow:publish` via `findWorkflowForUser`) worked
  with the resolved owner entity in the sandbox; watch for rejections on other
  versions/topologies.
