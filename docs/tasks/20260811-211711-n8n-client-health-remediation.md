# n8n Client Health Remediation

Created: 2026-08-11 21:17:11 local time

## Objective

Improve `packages/n8n-client` readability, security, performance, encapsulation, reusability, testability, and fidelity to the observed n8n API. The work is ordered around confirmed runtime defects first, then transport hardening, response contracts, resource architecture, and package-consumer assurance.

The primary runtime reference is `sandbox/api-sweep-results.json`, generated on 2026-07-22 against 72 operations with the privileges and feature state available to that sweep. Successful entries are evidence of observed response shapes. Failed entries are evidence only of that request and environment; they do not by themselves prove that an endpoint is absent or unsupported.

## Scope

- `packages/n8n-client/src/**`
- `packages/n8n-client/tests/**`
- `packages/n8n-client/package.json`, build/type/test configuration, and README
- `packages/n8n-client/.public-api/**`
- `sandbox/api-sweep-results.json` and `sandbox/run-api-sweep.ts` as contract evidence
- Focused package/repository documentation needed to describe changed public contracts

## Working Rules

- Do not revert or rewrite unrelated concurrent changes.
- Add a regression test that fails on the old implementation before changing confirmed behavior.
- Prefer one shared enforcement point for path encoding, query serialization, response parsing, and resource snapshot rules.
- Preserve API credentials from logs, errors, fixtures, snapshots, and package artifacts.
- Treat endpoint response omission as unknown, not as an authoritative empty array, empty string, `false`, or `null`, unless n8n documents that default.
- Do not add compatibility overloads unless release policy or known external usage requires them. Record intentional breaking changes.
- Do not infer endpoint availability from `/discover` alone. The sweep shows callable routes that discovery omitted, and optional routes may be hidden by version, license, feature state, or privilege.
- Do not run builds that rewrite shared `dist/` concurrently. `dist/` is generated output, not primary ownership.

## Non-Goals

- Implement every endpoint listed as absent in `.public-api/DIFF-v1.1.1.md` without confirming the supported n8n version and product scope.
- Turn the client into a general runtime schema-validation framework.
- Preserve unsafe header override or raw serialized-filter behavior without a concrete compatibility requirement.
- Interpret the current security-policy 404 as proof of an authorization defect.

## Baseline Verification

Run on 2026-08-11 before creating this plan:

- `pnpm --filter @egose/n8n-client typecheck`: passed.
- `pnpm --filter @egose/n8n-client test`: passed, 20 files and 262 tests.
- The test command also completed the package build and declaration generation.
- `git status --short`: clean before review and after baseline commands.

The green baseline does not cover installed-package consumers, live integration tests, malformed transport responses, scoped package names, or most sweep-derived response variants.

## Priority Definitions

- P0: confirmed request failure, state corruption, or credential exposure risk requiring earliest remediation.
- P1: public contract unsoundness, material correctness/performance problem, or missing release assurance.
- P2: maintainability, capability clarity, and hardening work with lower immediate impact.
- Investigation: evidence is incomplete; confirm behavior before changing the contract.

## Execution Waves

1. Confirm and lock down request/security behavior.
2. Establish truthful wire/public response contracts and resource snapshot semantics.
3. Improve strictness, performance, and scoped-resource architecture.
4. Add sweep/capability and installed-package assurance.
5. Perform an independent integration and security review.

## Wave 1: Request Correctness And Transport Security

### Task REQ-01: Serialize Data-Table Filters And Validate Column Names

Status: completed

Priority: P0

Suggested agent: API contract and validation engineer

Dependencies: none

Primary ownership:

- `packages/n8n-client/src/types.ts`
- `packages/n8n-client/src/clients/data-table.ts`
- `packages/n8n-client/tests/data-table.spec.ts`
- focused transport tests

Finding:

`deleteRows()` requires callers to pre-serialize `filter` as a string while other row operations accept `DataTableFilter`. The sweep request failed with HTTP 400 because the server requires the query value to match its JSON-string format. Column create/update types also accept names the server rejects; the sweep rejected `flag-renamed` against `^[a-zA-Z][a-zA-Z0-9_]*$`.

References:

- `packages/n8n-client/src/types.ts:982-994`
- `packages/n8n-client/src/types.ts:1028-1101`
- `packages/n8n-client/src/clients/data-table.ts:121-128`
- `packages/n8n-client/tests/data-table.spec.ts:198-213`
- `sandbox/api-sweep-results.json:1282-1289`
- `sandbox/api-sweep-results.json:1347-1354`

Implementation requirements:

1. Accept `DataTableFilter` at the public `deleteRows()` boundary and JSON-serialize it exactly once before query serialization.
2. Keep `returnData` overload behavior and `dryRun` unchanged.
3. Add one reusable column-name validator for create and update paths, with an actionable local error before transport.
4. Decide explicitly whether `DataTableListParams.filter` and `DataTableRowListParams.filter` should also accept structured filters; do not silently broaden them without endpoint evidence.
5. If changing raw-string filter compatibility is breaking, document it in release notes rather than retaining an ambiguous union by default.

Acceptance criteria:

- A structured delete filter produces a URL query value that decodes to valid JSON matching the supplied filter.
- Invalid column names including a leading digit, hyphen, and space fail before `fetch`; valid underscore names pass.
- Tests cover `returnData: true`, default/false, and `dryRun` serialization.
- `pnpm --filter @egose/n8n-client test -- data-table.spec.ts` passes.
- `pnpm --filter @egose/n8n-client typecheck` passes.

Completion evidence:

- Changed: `packages/n8n-client/src/types.ts`, `packages/n8n-client/src/clients/data-table.ts`, `packages/n8n-client/tests/data-table.spec.ts`, `packages/n8n-client/tests/contracts.spec.ts`, `CHANGELOG.md`
- Verified: `pnpm --filter @egose/n8n-client test -- data-table.spec.ts`
- Verified: `pnpm --filter @egose/n8n-client typecheck`
- Result: `deleteRows()` now accepts structured `DataTableFilter`, serializes it once before transport, keeps `returnData` and `dryRun` behavior intact, validates column names locally, and documents the breaking raw-string removal in release notes.

### Task REQ-02: Encode Every Dynamic Path Segment

Status: completed

Priority: P0

Suggested agent: HTTP boundary engineer

Dependencies: none

Primary ownership:

- `packages/n8n-client/src/clients/**`
- one shared URL/path helper
- transport/path regression tests

Finding:

Clients interpolate IDs, package names, credential type names, project IDs, and column IDs directly into paths. Reserved characters can alter routing. Scoped npm names such as `@scope/n8n-nodes-example` contain a slash and are a concrete supported-domain failure case.

References:

- `packages/n8n-client/src/clients/community-package.ts:35-44`
- `packages/n8n-client/src/clients/credential.ts:26-27,71-74`
- `packages/n8n-client/src/clients/workflow.ts:36-37,101-115`
- `packages/n8n-client/src/clients/folder.ts:23-30`
- `packages/n8n-client/src/clients/data-table.ts:44-45,81-147`

Implementation requirements:

1. Introduce one helper that encodes an individual path segment with `encodeURIComponent` semantics.
2. Apply it to every caller-controlled dynamic segment; never encode a complete path.
3. Preserve static separators and endpoint structure.
4. Test slash, `?`, `#`, `%`, Unicode, and already-percent-looking input without double interpretation.

Acceptance criteria:

- Updating and uninstalling `@scope/n8n-nodes-example` targets one encoded path segment.
- IDs cannot append query parameters or additional path segments.
- A repository search finds no unreviewed direct interpolation of dynamic path parameters in client request paths.
- Focused client tests and `pnpm --filter @egose/n8n-client typecheck` pass.

Completion evidence:

- Changed: `packages/n8n-client/src/path.ts`, `packages/n8n-client/src/clients/community-package.ts`, `packages/n8n-client/src/clients/credential.ts`, `packages/n8n-client/src/clients/data-table.ts`, `packages/n8n-client/src/clients/execution.ts`, `packages/n8n-client/src/clients/folder.ts`, `packages/n8n-client/src/clients/project.ts`, `packages/n8n-client/src/clients/tag.ts`, `packages/n8n-client/src/clients/user.ts`, `packages/n8n-client/src/clients/variable.ts`, `packages/n8n-client/src/clients/workflow.ts`, `packages/n8n-client/tests/regressions.spec.ts`
- Verified: `pnpm --filter @egose/n8n-client test`
- Verified: `pnpm --filter @egose/n8n-client typecheck`
- Verified: `rg --pcre2 '\$\{(?!encodePathSegment\()' packages/n8n-client/src/clients -g '*.ts'`
- Result: all reviewed caller-controlled path segments now pass through one shared `encodePathSegment()` helper; regression tests cover scoped package names and reserved-character IDs including slash, `?`, `#`, `%`, and Unicode.

### Task HTTP-01: Make Authentication And Redirect Handling Non-Overridable And Origin-Safe

Status: completed

Priority: P0

Suggested agent: transport security engineer

Dependencies: none

Primary ownership:

- `packages/n8n-client/src/http-client.ts`
- `packages/n8n-client/src/types.ts` when configuration changes are needed
- `packages/n8n-client/tests/client.spec.ts`

Finding:

Caller headers are spread after authentication headers, allowing case-insensitive credential replacement. Fetch redirect behavior is left at its default while the API key is a custom sensitive header. Whether supported Node/Undici versions retain that header on a cross-origin redirect must be verified; until then this is a credential-disclosure hypothesis, not a confirmed vulnerability.

References:

- `packages/n8n-client/src/http-client.ts:53-65`
- `packages/n8n-client/src/http-client.ts:87-124`
- `packages/n8n-client/src/index.ts:94-115`
- `packages/n8n-client/tests/client.spec.ts:56-66,69-150`

Implementation requirements:

1. Reject caller attempts to set `Authorization` or `X-N8N-API-KEY`, case-insensitively, unless maintainers approve a separately named unsafe escape hatch.
2. Verify cross-origin redirect behavior on the minimum supported Node version and record the result in tests/task evidence.
3. Follow redirects only under an explicit policy that never sends credentials to a different origin. Preserve safe same-origin redirects if n8n relies on them.
4. Do not include credentials in thrown errors or diagnostics.
5. Build a fresh `Headers` object per attempt and handle multipart `content-type` case-insensitively so Fetch can supply its boundary.

Acceptance criteria:

- Header overrides using canonical and alternate casing fail locally.
- A cross-origin redirect test proves neither auth scheme reaches the target origin.
- Same-origin behavior is explicitly tested and documented.
- Lowercase multipart `content-type` cannot suppress the generated boundary.
- `pnpm --filter @egose/n8n-client test -- client.spec.ts` passes.

Completion evidence:

- Changed: `packages/n8n-client/src/http-client.ts`, `packages/n8n-client/tests/client.spec.ts`
- Verified: `pnpm --filter @egose/n8n-client test -- client.spec.ts`
- Verified: `pnpm --filter @egose/n8n-client typecheck`
- Verified: `ASDF_NODEJS_VERSION=20.10.0 node --input-type=module -e "..."`
- Result: caller overrides for `Authorization` and `X-N8N-API-KEY` now fail locally case-insensitively, each request attempt builds a fresh `Headers` object, lowercase multipart `content-type` is removed for `FormData`, same-origin redirects preserve auth, and cross-origin redirects are blocked before credentials reach the target origin. The direct Node 20.10.0 runtime verification confirmed `sameOriginRequests` retained the API key on the redirected same-origin hop, `targetRequests` stayed empty for a cross-origin redirect, and the client raised `Cross-origin redirect blocked`.

### Task HTTP-02: Make Response Parsing And Query Serialization Total And Typed

Status: completed

Priority: P1

Suggested agent: transport correctness engineer

Dependencies: REQ-01

Primary ownership:

- `packages/n8n-client/src/http-client.ts`
- `packages/n8n-client/tests/client.spec.ts`
- query value types exported from the transport boundary

Finding:

Malformed JSON error bodies throw `SyntaxError` before `HttpError` can preserve status, which also bypasses transient retry classification. Empty successful 200/201 responses become `'' as T`. Query values are converted with `String()`, so arrays become comma-separated and objects become `[object Object]`; an empty query object produces a trailing `?`. Method handling also compares raw casing for GET body suppression.

References:

- `packages/n8n-client/src/http-client.ts:16-24`
- `packages/n8n-client/src/http-client.ts:68-96`
- `packages/n8n-client/src/http-client.ts:108-145`
- `packages/n8n-client/tests/client.spec.ts:69-150`

Implementation requirements:

1. Read each response body once, parse JSON when possible, and always return `HttpError` for non-2xx responses even when JSON is empty, invalid, or truncated.
2. Preserve status, safe method/path, status text, response headers, and raw fallback data on `HttpError`; never preserve request auth headers.
3. Return `undefined` for any successful zero-length body, including empty 200/201 and HEAD.
4. Define a narrow query-value contract. Deliberately support primitives and arrays or reject unsupported values; never stringify nested objects implicitly.
5. Omit `?` when no query entries remain.
6. Normalize the HTTP method once and reject bodies for GET and HEAD.

Acceptance criteria:

- Invalid JSON with status 502 remains a retryable `HttpError` carrying status and raw body.
- Empty 200, 201, and 204 responses return `undefined`; empty HEAD does the same.
- Unsupported nested query values fail locally instead of producing `[object Object]`.
- Empty queries have no trailing `?`; array behavior is covered according to the chosen contract.
- Lowercase methods behave identically to uppercase methods.
- Focused transport tests and package typecheck pass.

Completion evidence:

- Changed: `packages/n8n-client/src/http-client.ts`, `packages/n8n-client/src/index.ts`, `packages/n8n-client/tests/client.spec.ts`
- Verified: `pnpm --filter @egose/n8n-client test -- client.spec.ts`
- Verified: `pnpm --filter @egose/n8n-client typecheck`
- Result: response bodies are now read once, non-2xx responses always throw `HttpError` with status, status text, method, path, response headers, and raw fallback body data, empty successful 200/201/204 and HEAD responses return `undefined`, arrays serialize as repeated query keys, unsupported nested query values fail locally, empty queries omit the trailing `?`, and lowercase methods are normalized before retry and body rules are applied.

### Task HTTP-03: Define Retry, Deadline, Cancellation, And Test-Injection Policy

Status: completed

Priority: P1

Suggested agent: resilience and testability engineer

Dependencies: HTTP-02

Primary ownership:

- `packages/n8n-client/src/http-client.ts`
- `packages/n8n-client/src/utils/retry.ts`
- transport configuration types
- `packages/n8n-client/tests/client.spec.ts`
- retry documentation

Finding:

The timeout is per attempt, so a default GET can take about 93 seconds despite a 30-second setting. Abort timeouts are retried, `Retry-After` is discarded, backoff has no jitter, and network errors are classified by checking whether a `TypeError` message contains `fetch`. Global `fetch`, timers, attempts, and backoff are hard-coded, reducing deterministic testability.

References:

- `packages/n8n-client/src/http-client.ts:105-138`
- `packages/n8n-client/src/utils/retry.ts:1-34`
- `packages/n8n-client/tests/client.spec.ts:83-149`
- `packages/n8n-client/README.md:42,508`

Implementation requirements:

1. Decide and document whether `requestTimeoutMs` is a total deadline or per-attempt timeout. Prefer a total deadline while allowing a caller `AbortSignal`.
2. Classify network failures at the fetch boundary rather than by error-message text.
3. Honor valid delta-seconds and HTTP-date `Retry-After` values within a documented cap and add bounded jitter.
4. Permit injected fetch and sleep/clock functions for deterministic tests while retaining zero-config defaults.
5. Keep unsafe methods non-retryable by default; make explicit retry overrides visible in the request contract.

Acceptance criteria:

- Total elapsed time cannot silently exceed the documented deadline policy.
- Caller abort stops attempts and pending delays.
- 429/503 tests cover both `Retry-After` forms, cap behavior, and deterministic jitter injection.
- Network failures are tested without relying on exact error text.
- README states exact retryable statuses, methods, timeout semantics, and overrides.

Completion evidence:

- Changed: `packages/n8n-client/src/types.ts`, `packages/n8n-client/src/http-client.ts`, `packages/n8n-client/src/utils/retry.ts`, `packages/n8n-client/tests/client.spec.ts`, `packages/n8n-client/tests/contracts.spec.ts`, `packages/n8n-client/README.md`
- Verified: `pnpm --filter @egose/n8n-client typecheck`
- Verified: `pnpm --filter @egose/n8n-client exec vitest run --no-cache --config vitest.unit.config.ts tests/client.spec.ts tests/contracts.spec.ts`
- Verified: `pnpm --filter @egose/n8n-client test`
- Result: `requestTimeoutMs` and per-request `timeoutMs` now act as total deadlines across attempts and backoff, callers can cancel with `signal`, retry sleeps are abortable, `Retry-After` delta-seconds and HTTP-date values are honored up to a 30-second cap with deterministic positive jitter, fetch/network failures are classified at the transport boundary, and the client config supports injected `fetch`, `sleep`, `now`, and `random` hooks for deterministic tests.

## Wave 2: Truthful Response Contracts And Resource State

### Task MODEL-01: Introduce Endpoint-Specific Workflow Wire Shapes

Status: completed

Priority: P0

Suggested agent: API modeling engineer

Dependencies: none

Primary ownership:

- workflow sections of `packages/n8n-client/src/types.ts`
- `packages/n8n-client/src/response-mappers.ts`
- `packages/n8n-client/src/clients/workflow.ts`
- `packages/n8n-client/src/resources/workflow.ts`
- workflow tests and sweep-derived fixtures

Finding:

One required `Workflow` shape is used for list, detail, and mutation endpoints even though observed fields differ. The normalizer converts absent enrichment fields to empty/null defaults, and bound resource mutations replace the full snapshot. In the sweep, update omitted `shared` and `parentFolder`; deactivate and unarchive omitted tags and active-version fields. A successful mutation can therefore erase known local state.

References:

- `packages/n8n-client/src/types.ts:61-114`
- `packages/n8n-client/src/response-mappers.ts:71-94,353-359`
- `packages/n8n-client/src/resources/workflow.ts:55-90`
- `packages/n8n-client/tests/workflow.spec.ts:8-23,105-170`
- `sandbox/api-sweep-results.json:42-64,69-115,119-174,178-213,226-279,341-394`

Implementation requirements:

1. Model list items, details, and compact mutation responses separately where observed fields materially differ.
2. Model `SharedWorkflow.project` according to endpoint enrichment instead of forcing missing values to `null` under a required contract.
3. Validate required identity/core fields at the wire boundary; do not accept `Partial<Workflow> | null` as a complete entity.
4. Merge compact mutation responses over an existing bound snapshot while honoring explicit `null` and empty arrays returned by the server.
5. Preserve the full-body `WorkflowUpdate` requirement and make `patch()` read the snapshot once.
6. Document public type changes and add release notes if this changes consumer-facing signatures.

Acceptance criteria:

- Sweep-shaped create, list, get, update, deactivate, archive, and unarchive fixtures type-check and map without invented authoritative fields.
- A create/get resource retains known `shared`, tags, folder, and version fields after compact mutation responses omit them.
- Explicit server `tags: []`, `shared: []`, and `parentFolder: null` still clear state.
- Missing core identity fields fail at the response boundary with an actionable error.
- Unit tests, typecheck, and README examples pass.

Completion evidence:

- Changed: `packages/n8n-client/src/types.ts`, `packages/n8n-client/src/response-mappers.ts`, `packages/n8n-client/src/clients/workflow.ts`, `packages/n8n-client/src/resources/workflow.ts`, `packages/n8n-client/src/resources/project.ts`, `packages/n8n-client/tests/workflow.spec.ts`, `packages/n8n-client/tests/project.spec.ts`, `packages/n8n-client/tests/regressions.spec.ts`, `packages/n8n-client/tests/contracts.spec.ts`, `packages/n8n-client/README.md`, `CHANGELOG.md`
- Verified: `pnpm --filter @egose/n8n-client typecheck`
- Verified: `pnpm --filter @egose/n8n-client test`
- Result: workflow responses now distinguish list/detail/compact-mutation shapes, `SharedWorkflow.project` remains omitted unless the endpoint enriches it, workflow mappers reject missing core identity/graph fields at the response boundary, and bound workflow resources merge compact mutation responses so omitted enrichment fields do not erase known snapshot state while explicit clears still take effect.

### Task MODEL-02: Replace Partial-To-Complete Mapper Assertions

Status: completed

Priority: P1

Suggested agent: TypeScript contract engineer

Dependencies: MODEL-01

Primary ownership:

- non-workflow sections of `packages/n8n-client/src/response-mappers.ts`
- corresponding wire/public types in `packages/n8n-client/src/types.ts`
- mapper/client tests

Finding:

Most mappers accept `Partial<T> | null | undefined`, fill selected defaults, and cast to complete public DTOs without checking required IDs, names, timestamps, or nested structures. This fabricates valid-looking objects from malformed responses and masks API drift.

References:

- `packages/n8n-client/src/response-mappers.ts:61-69`
- `packages/n8n-client/src/response-mappers.ts:114-141`
- `packages/n8n-client/src/response-mappers.ts:178-266`
- `packages/n8n-client/src/response-mappers.ts:273-359`
- `packages/n8n-client/src/response-mappers.ts:384-432`

Implementation requirements:

1. Define a small, consistent boundary policy: validate mandatory identity/core fields and normalize only documented optional fields.
2. Remove broad `as CompleteType` assertions from mappers.
3. Do not replace absent permission data with `role: ''` or `scopes: []`; distinguish not included from authoritative empty.
4. Standardize cursor fields on one runtime and public representation, preferably `string | null` at API response boundaries.
5. Add negative tests for null top-level values and missing mandatory fields, plus positive sweep-shaped fixtures.

Acceptance criteria:

- No mapper accepts arbitrary `Partial<PublicEntity>` and returns a complete public entity solely through assertion.
- Invalid entity identity fails close to response parsing, not during a later resource request.
- Permission/enrichment omission remains distinguishable from empty permission/enrichment data.
- Mapper/client tests and package typecheck pass.

Completion evidence:

- Changed: `packages/n8n-client/src/types.ts`, `packages/n8n-client/src/response-mappers.ts`, `packages/n8n-client/tests/contracts.spec.ts`, `packages/n8n-client/tests/credential.spec.ts`, `packages/n8n-client/tests/data-table.spec.ts`, `packages/n8n-client/tests/discover.spec.ts`, `packages/n8n-client/tests/folder.spec.ts`, `packages/n8n-client/tests/project.spec.ts`, `packages/n8n-client/tests/regressions.spec.ts`, `packages/n8n-client/tests/tag.spec.ts`, `packages/n8n-client/tests/user.spec.ts`, `packages/n8n-client/tests/variable.spec.ts`
- Verified: `pnpm --filter @egose/n8n-client typecheck`
- Verified: `pnpm --filter @egose/n8n-client test`
- Result: non-workflow response mappers now validate required identity/core fields from `unknown` inputs instead of asserting `Partial<T>` into complete DTOs, cursor responses consistently expose `nextCursor: string | null`, and optional permission/enrichment fields such as project role/scopes, variable project/type, tag timestamps, folder metadata, and data-table row/column metadata remain omitted unless the API explicitly returns them.

### Task MODEL-03: Model Folder, Tag, Project, And Data-Table Response Variants

Status: completed

Priority: P1

Suggested agent: endpoint response modeling engineer

Dependencies: MODEL-02

Primary ownership:

- relevant sections of `packages/n8n-client/src/types.ts`
- relevant clients/resources/mappers
- folder, tag, project, and data-table tests

Finding:

Observed endpoints return materially different shapes that are currently forced into one complete model. Folder create/list/get/update differ; tag update returns only ID/name; project create includes role/scopes while list omits them; data-table list columns omit `dataTableId` while detail endpoints include it. Current defaults make omitted fields look authoritative and bound resources can lose known state.

References:

- `packages/n8n-client/src/types.ts:806-841,930-948,1116-1165`
- `packages/n8n-client/src/response-mappers.ts:61-69,220-238,282-333`
- `sandbox/api-sweep-results.json:660-666,769-985,1029-1091,1095-1222`

Implementation requirements:

1. Introduce endpoint-specific list/detail/mutation types only where shape differences are observed and useful.
2. For bound resources, merge compact mutation results over known snapshots and distinguish omission from explicit clearing.
3. For nested list columns, either use a list-column type or populate the known parent table ID deliberately; do not invent `null` without documenting it.
4. Keep role/scopes tied to the response that includes effective permissions.
5. Review nullable writable fields for actual clear semantics, including workflow/folder/project descriptions, folder parent, and project icon; add `null` only where handler/runtime evidence confirms it.

Acceptance criteria:

- Sweep-shaped fixtures for every listed endpoint map without fabricated timestamps, permissions, counts, or relationships.
- Tag/folder/project resource updates preserve fields omitted by compact responses.
- Explicit clear operations are representable where confirmed.
- Public API changes are documented and type-tested.

Completion evidence:

- Changed: `packages/n8n-client/src/types.ts`, `packages/n8n-client/src/response-mappers.ts`, `packages/n8n-client/src/clients/tag.ts`, `packages/n8n-client/src/clients/folder.ts`, `packages/n8n-client/src/clients/project.ts`, `packages/n8n-client/src/resources/tag.ts`, `packages/n8n-client/src/resources/folder.ts`, `packages/n8n-client/src/resources/project.ts`
- Changed: `packages/n8n-client/tests/tag.spec.ts`, `packages/n8n-client/tests/folder.spec.ts`, `packages/n8n-client/tests/project.spec.ts`, `packages/n8n-client/tests/data-table.spec.ts`, `packages/n8n-client/tests/contracts.spec.ts`, `packages/n8n-client/README.md`
- Verified: `pnpm typecheck`
- Verified: `pnpm exec vitest run --no-cache --config vitest.unit.config.ts tests/tag.spec.ts tests/folder.spec.ts tests/project.spec.ts tests/data-table.spec.ts tests/contracts.spec.ts`
- Result: 114 focused unit and contract tests passed; compact tag/folder mutation responses now preserve known resource snapshot fields, project create responses expose permission-bearing variants without inventing omitted permissions, and data-table list columns inherit the parent table ID instead of fabricating `null`.

### Task RESOURCE-01: Define Confirmed Snapshot And Patch Semantics

Status: completed

Priority: P1

Suggested agent: resource-model architect

Dependencies: MODEL-01, MODEL-03

Primary ownership:

- `packages/n8n-client/src/resources/**`
- `packages/n8n-client/src/resources/base.ts`
- resource behavior tests

Finding:

Resource methods inconsistently replace snapshots, optimistically merge request payloads when endpoints return no DTO, or expand true partial updates from stale state. Variable, project, and user resources can present optimistic data as confirmed. Credential/folder `patch()` can overwrite concurrent server changes, and community-package empty `patch()` may convert “latest” behavior into a no-op.

References:

- `packages/n8n-client/src/resources/base.ts:1-34`
- `packages/n8n-client/src/resources/variable.ts:26-39`
- `packages/n8n-client/src/resources/project.ts:144-150`
- `packages/n8n-client/src/resources/credential.ts:31-43`
- `packages/n8n-client/src/resources/folder.ts:25-34`
- `packages/n8n-client/src/resources/community-package.ts:25-33`

Implementation requirements:

1. Document whether `resource.data` is confirmed server state, optimistic state, or a mix. Prefer confirmed state where a follow-up read is practical.
2. Whitelist fields eligible for optimistic merge when mutation endpoints return no body; never merge request-only fields such as project relations into entity snapshots.
3. For true partial-update endpoints, forward the partial argument instead of expanding it from stale snapshots.
4. Reserve full snapshot expansion for endpoints such as workflow update that require a complete body.
5. Test concurrent-change preservation conceptually by asserting that omitted fields are not resent by partial updates.

Acceptance criteria:

- Equivalent `update()`/`patch()` behavior is documented per resource family.
- Request-only fields cannot appear in public resource snapshots.
- Partial endpoints send only caller-supplied mutable fields.
- Void mutation snapshots are either refreshed or explicitly represented/documented as optimistic.

Completion evidence:

- Changed: `packages/n8n-client/src/resources/base.ts`, `packages/n8n-client/src/resources/variable.ts`, `packages/n8n-client/src/resources/project.ts`, `packages/n8n-client/src/resources/user.ts`, `packages/n8n-client/src/resources/credential.ts`, `packages/n8n-client/src/resources/folder.ts`, `packages/n8n-client/src/resources/community-package.ts`, `packages/n8n-client/README.md`, `packages/n8n-client/tests/variable.spec.ts`, `packages/n8n-client/tests/project.spec.ts`, `packages/n8n-client/tests/credential.spec.ts`, `packages/n8n-client/tests/folder.spec.ts`, `packages/n8n-client/tests/community-package.spec.ts`, `packages/n8n-client/tests/user.spec.ts`
- Verified: `pnpm --filter @egose/n8n-client test -- variable.spec.ts project.spec.ts credential.spec.ts folder.spec.ts community-package.spec.ts user.spec.ts`
- Verified: `pnpm --filter @egose/n8n-client typecheck`
- Result: void mutations on variables, projects, and users now refresh before exposing `resource.data`; project request-only `relations` no longer leak into snapshots; credential/folder/community-package partial helpers no longer resend omitted fields from stale local state; and the README now documents per-resource-family `update()`/`patch()` semantics.

## Wave 3: Type Safety, Performance, And Encapsulation

### Task TYPE-01: Enable Strict Null Checking And Then Strict Mode

Status: completed

Priority: P1

Suggested agent: TypeScript migration engineer

Dependencies: MODEL-01, MODEL-02, MODEL-03

Primary ownership:

- `packages/n8n-client/tsconfig.json`
- `packages/n8n-client/tsconfig.tests.json`
- narrow source/test fixes exposed by strictness

Finding:

`strict: false` and `skipLibCheck: true` hide runtime/declaration mismatches. One known example is `TestCaseExecutionListResponse.nextCursor` excluding `null` while its mapper returns nullable cursors. Folder DTO/resource nullability has also drifted.

References:

- `packages/n8n-client/tsconfig.json:3-14`
- `packages/n8n-client/src/types.ts:421-424`
- `packages/n8n-client/src/response-mappers.ts:108-112`
- `packages/n8n-client/src/resources/folder.ts:21-23`

Implementation requirements:

1. Enable `strictNullChecks` after response contracts are corrected.
2. Resolve errors through truthful types and narrowing, not non-null assertions or broad casts.
3. Enable full `strict` mode in the same task if manageable; otherwise record remaining strict flags as uniquely numbered follow-up tasks with error counts.
4. Add strict consumer checks for emitted declarations with `skipLibCheck: false`; package-internal dependency noise may remain separately configured if documented.

Acceptance criteria:

- Source and tests compile with `strictNullChecks` enabled.
- No new broad `any`, `unknown as`, or non-null assertions are introduced merely to silence migration errors.
- Emitted declarations type-check from strict ESM and CJS consumer fixtures.

Completion evidence:

- Changed: `packages/n8n-client/tsconfig.json`, `packages/n8n-client/package.json`, `packages/n8n-client/src/types.ts`, `packages/n8n-client/src/resources/folder.ts`, `packages/n8n-client/tests/contracts.spec.ts`, `packages/n8n-client/tests/fixtures/consumer-esm/index.mts`, `packages/n8n-client/tests/fixtures/consumer-esm/tsconfig.json`, `packages/n8n-client/tests/fixtures/consumer-cjs/index.cts`, `packages/n8n-client/tests/fixtures/consumer-cjs/tsconfig.json`
- Verified: `pnpm --filter @egose/n8n-client typecheck`
- Verified: `pnpm --filter @egose/n8n-client exec vitest run --no-cache --config vitest.unit.config.ts tests/contracts.spec.ts tests/workflow.spec.ts tests/folder.spec.ts`
- Result: `@egose/n8n-client` now compiles with `strict: true`, `skipLibCheck: false`, keeps folder/workflow nullability aligned with runtime shapes, updates contract assertions to the stricter paginated/resource types, and type-checks the emitted declarations from both strict ESM and CJS consumer fixtures.

### Task PERF-01: Stop Cloning Whole Resources During Internal Reads

Status: completed

Priority: P1

Suggested agent: performance-focused resource engineer

Dependencies: RESOURCE-01

Primary ownership:

- `packages/n8n-client/src/resources/base.ts`
- resource classes that use `this.data` internally
- resource isolation/performance tests

Finding:

Every `this.data` access performs `structuredClone`. Workflow `patch()` accesses it repeatedly and can clone a large workflow graph seven times. Public clone isolation is useful, but internal methods can read the protected snapshot directly.

References:

- `packages/n8n-client/src/resources/base.ts:6-33`
- `packages/n8n-client/src/resources/workflow.ts:35-69`
- `packages/n8n-client/src/resources/project.ts:132-146`
- `packages/n8n-client/src/resources/data-table.ts:98-112`

Implementation requirements:

1. Keep defensive clones at public escape boundaries such as `data`, `toObject`, and `toJSON`.
2. Use protected snapshot reads internally and read once per operation when building a request.
3. Preserve constructor, replace, and merge isolation from caller-owned mutable objects.
4. Add a clone-count or equivalent large-object regression test without brittle wall-clock thresholds.

Acceptance criteria:

- Workflow patch construction performs no public `data` clone per field.
- Mutating objects returned by `data`/`toObject` cannot mutate internal state.
- Mutating request/response fixture objects after resource construction cannot mutate internal state.

Completion evidence:

- Changed: `packages/n8n-client/src/resources/community-package.ts`, `packages/n8n-client/src/resources/credential.ts`, `packages/n8n-client/src/resources/data-table.ts`, `packages/n8n-client/src/resources/execution.ts`, `packages/n8n-client/src/resources/folder.ts`, `packages/n8n-client/src/resources/project.ts`, `packages/n8n-client/src/resources/tag.ts`, `packages/n8n-client/src/resources/user.ts`, `packages/n8n-client/src/resources/variable.ts`, `packages/n8n-client/src/resources/workflow.ts`, `packages/n8n-client/tests/contracts.spec.ts`, `packages/n8n-client/tests/workflow.spec.ts`
- Verified: `pnpm --filter @egose/n8n-client typecheck`
- Verified: `pnpm --filter @egose/n8n-client exec vitest run --no-cache --config vitest.unit.config.ts tests/contracts.spec.ts tests/workflow.spec.ts tests/data-table.spec.ts tests/project.spec.ts`
- Result: resource getters and request-building paths now read the protected in-memory snapshot instead of cloning whole resources; public `data`/`toObject`/`toJSON` boundaries remain defensive clones; workflow patch now proves a single clone during request/update flow, and snapshot-isolation tests cover constructor input, public snapshot output, and stored mutation responses.

### Task PERF-02: Remove Hidden Full-Collection Scans From Scoped Get Paths

Status: completed

Priority: P1

Suggested agent: API performance and scoping engineer

Dependencies: MODEL-01, RESOURCE-01

Primary ownership:

- `packages/n8n-client/src/resources/project.ts`
- `packages/n8n-client/src/resources/workflow.ts`
- relevant clients and scoped-resource tests

Finding:

Project workflow/execution and workflow execution `get` paths scan every paginated item before issuing a direct get. This makes nominal get/update operations O(collection size), duplicates requests, and does not provide atomic ownership enforcement because scope can change between list and mutation. Variable `get()` is necessarily a scan because no direct endpoint exists, but resources currently retain transient cursor/state filters that can make refresh falsely return 404.

References:

- `packages/n8n-client/src/resources/project.ts:173-203,278-351`
- `packages/n8n-client/src/resources/workflow.ts:110-143`
- `packages/n8n-client/src/clients/variable.ts:13-25,48-63`
- `packages/n8n-client/src/resources/variable.ts:6-10,26-35`

Implementation requirements:

1. Prefer direct get and validate returned project/workflow ownership fields where the API exposes them.
2. Where direct responses cannot prove scope, do not hide an O(n) advisory scan behind ordinary `get`; expose/document an explicit assertion operation or accept server authorization as the boundary after maintainer review.
3. Persist only stable variable scope (`projectId`) in bound resources; discard cursor, limit, and state filters.
4. Add request-count tests for multi-page collections and refresh-after-filter-change tests.

Acceptance criteria:

- Scoped direct get paths use O(1) requests where returned data can verify ownership.
- Remaining O(n) paths are explicit and documented with rationale.
- Variable refresh starts from the first page and does not retain transient state/limit/cursor filters.
- Negative cross-project cases continue to return controlled errors where scope can be verified.

Completion evidence:

- Changed: `packages/n8n-client/src/resources/project.ts`, `packages/n8n-client/src/resources/workflow.ts`, `packages/n8n-client/src/clients/variable.ts`, `packages/n8n-client/src/resources/variable.ts`, `packages/n8n-client/tests/project.spec.ts`, `packages/n8n-client/tests/workflow.spec.ts`, `packages/n8n-client/tests/variable.spec.ts`
- Verified: `pnpm --filter @egose/n8n-client typecheck`
- Verified: `pnpm --filter @egose/n8n-client exec vitest run --no-cache --config vitest.unit.config.ts tests/project.spec.ts tests/workflow.spec.ts tests/variable.spec.ts tests/contracts.spec.ts`
- Result: project-scoped workflow lookups now use a single direct workflow fetch and validate membership from `shared[].projectId`; project-scoped execution lookups no longer hide paginated advisory scans and instead rely on direct execution fetches; workflow-scoped execution lookups validate `execution.workflowId` from the direct response; variable-bound resources now retain only `projectId`, so refresh/update restart from the first scoped page instead of reusing transient cursor/limit/state filters.

### Task ARCH-01: Extract Reusable Scoped Collection Objects And Bound Caches

Status: completed

Priority: P2

Suggested agent: client architecture engineer

Dependencies: PERF-02

Primary ownership:

- `packages/n8n-client/src/resources/project.ts`
- `packages/n8n-client/src/resources/workflow.ts`
- `packages/n8n-client/src/clients/project.ts`
- `packages/n8n-client/src/index.ts`
- scoped collection tests

Finding:

`ProjectResource` owns five client dependencies, five hand-written interfaces, scope policy, and fresh facade objects on each accessor. Similar nested execution logic exists in `WorkflowResource`. Root and project clients also cache folder clients independently and without bounds, retaining arbitrary project IDs for the client lifetime.

References:

- `packages/n8n-client/src/resources/project.ts:43-130,173-291`
- `packages/n8n-client/src/resources/workflow.ts:19-24,110-129`
- `packages/n8n-client/src/clients/project.ts:27-32,114-121`
- `packages/n8n-client/src/index.ts:55,167-174`

Implementation requirements:

1. Extract small project/workflow-scoped collection classes only after scoping behavior is settled.
2. Reuse these classes as the public nested collection contracts rather than duplicating method interfaces and object literals.
3. Remove cheap unbounded folder-client caches or use one shared bounded registry if identity reuse is a required contract.
4. Preserve current public method names unless an explicit breaking-change decision is recorded.
5. Avoid a general service container; keep dependencies explicit and unit-testable.

Acceptance criteria:

- Nested collection behavior has one implementation per scope type.
- Accessors do not rebuild facade object literals on every call.
- High-cardinality project IDs do not cause unbounded retained folder clients.
- Existing nested collection contract tests and new focused unit tests pass.

Completion evidence:

- Changed: `packages/n8n-client/src/resources/project.ts`, `packages/n8n-client/src/resources/workflow.ts`, `packages/n8n-client/src/clients/project.ts`, `packages/n8n-client/src/index.ts`, `packages/n8n-client/tests/client.spec.ts`, `packages/n8n-client/tests/project.spec.ts`, `packages/n8n-client/tests/workflow.spec.ts`
- Verified: `pnpm --filter @egose/n8n-client typecheck`
- Verified: `pnpm --filter @egose/n8n-client exec vitest run --no-cache --config vitest.unit.config.ts tests/client.spec.ts tests/project.spec.ts tests/workflow.spec.ts tests/contracts.spec.ts`
- Result: project- and workflow-scoped nested collection handles are now exported reusable classes with one implementation per scope; `ProjectResource` and `WorkflowResource` reuse stable collection instances on repeated accessor calls; root and project folder accessors no longer retain unbounded per-project `FolderClient` caches; focused and contract tests passed (`121` tests across `4` files).

### Task PAGE-01: Correct Folder Pagination Semantics

Status: completed

Priority: P2

Suggested agent: pagination contract engineer

Dependencies: MODEL-03

Primary ownership:

- folder types/client/resource tests
- shared pagination types only if truly shared behavior changes

Finding:

`FolderListParams` extends cursor pagination while exposing `skip`/`take`, and folder list responses use `count/data` without `nextCursor`. `listResources()` currently returns `nextCursor: undefined`, making generic cursor traversal appear supported when it is not.

References:

- `packages/n8n-client/src/types.ts:1155-1174`
- `packages/n8n-client/src/clients/folder.ts:37-43`
- `packages/n8n-client/src/pagination.ts:1-10`

Implementation requirements:

1. Model folder parameters using the endpoint's actual offset/take semantics and correct scalar types from handler/spec evidence.
2. Return a dedicated folder resource page with count information instead of a misleading cursor page.
3. Document any public signature change and update project-scoped folder collections together.

Acceptance criteria:

- No folder API advertises unusable cursor iteration.
- Count, skip, and take behavior has boundary tests.
- Project and root folder clients expose the same pagination semantics.

Completion evidence:

- Changed: `packages/n8n-client/src/types.ts`, `packages/n8n-client/src/clients/folder.ts`, `packages/n8n-client/src/resources/project.ts`, `packages/n8n-client/src/index.ts`, `packages/n8n-client/README.md`, `packages/n8n-client/tests/folder.spec.ts`, `packages/n8n-client/tests/project.spec.ts`, `packages/n8n-client/tests/contracts.spec.ts`
- Verified: `pnpm --filter @egose/n8n-client typecheck`
- Verified: `pnpm --filter @egose/n8n-client exec vitest run --no-cache --config vitest.unit.config.ts tests/folder.spec.ts tests/project.spec.ts tests/contracts.spec.ts`
- Result: folder list params now model offset pagination with numeric `skip`/`take`; `FolderClient.listResources()` and `ProjectFolderResourceCollection.listResources()` return `FolderResourcePage` with `{ count, data }` instead of a cursor-shaped page; README examples and contract tests document the public signature change; focused verification passed (`74` tests across `3` files).

## Wave 4: Capability, Contract, And Packaging Assurance

### Task CAP-01: Define Supported API Version And Capability Semantics

Status: completed

Priority: P1

Suggested agent: API compatibility maintainer

Dependencies: MODEL-03

Primary ownership:

- `packages/n8n-client/.public-api/**`
- capability/discover/security-policy types and docs
- `packages/n8n-client/README.md`
- capability tests

Finding:

The checked-in v1.1.1 spec is known to omit upstream operations, while the README claims all endpoints. Runtime discovery omitted package export even though the route was callable, and omitted security policy while both probes returned 404. Security-policy availability can depend on version, licensing, route registration, and privileges. Discover itself manually reads the API-key header according to the local handler analysis, so bearer behavior may differ.

References:

- `packages/n8n-client/.public-api/DIFF-v1.1.1.md:18-30,39-59`
- `packages/n8n-client/tests/spec-coverage.spec.ts:7-92`
- `packages/n8n-client/src/clients/discover.ts:5-8`
- `packages/n8n-client/src/clients/security-policy.ts:4-11`
- `sandbox/api-sweep-results.json:1500-1516,1518-2146,2148-2155`
- `packages/n8n-client/README.md:40`

Implementation requirements:

1. State the supported n8n/spec version and define how upstream drift is reviewed.
2. Replace “all endpoints” claims with accurate support language or implement/track confirmed missing operations.
3. Distinguish API-key scopes, project-effective scopes, and feature/license capability in names/types/docs; do not treat arbitrary `string[]` as interchangeable authorization evidence.
4. Document that 404 for optional endpoints may mean unavailable route/version/feature and cannot be diagnosed as privilege alone.
5. Confirm bearer behavior for `/discover`; if API-key-only in supported versions, fail clearly or document/type the limitation.
6. Correct source-control documentation that currently advertises “list files” although only pull is implemented and discovered.

Acceptance criteria:

- CI detects upstream/spec drift or requires an explicit reviewed allowlist.
- Public docs make no unsupported completeness claim.
- Capability and scope categories are not represented as interchangeable concepts.
- Security-policy and discover tests cover supported auth/capability behavior without interpreting ambiguous 404s as one cause.

Completion evidence:

- Changed: `packages/n8n-client/.public-api/reviewed-drift.json`, `packages/n8n-client/src/public-api-contract.ts`, `packages/n8n-client/src/types.ts`, `packages/n8n-client/src/response-mappers.ts`, `packages/n8n-client/src/clients/discover.ts`, `packages/n8n-client/src/clients/security-policy.ts`, `packages/n8n-client/src/index.ts`, `packages/n8n-client/README.md`, `packages/n8n-client/tests/discover.spec.ts`, `packages/n8n-client/tests/security-policy.spec.ts`, `packages/n8n-client/tests/project.spec.ts`, `packages/n8n-client/tests/contracts.spec.ts`, `packages/n8n-client/tests/spec-coverage.spec.ts`, `packages/n8n-client/tests/schema-shapes.spec.ts`
- Verified: `pnpm --filter @egose/n8n-client typecheck`
- Verified: `pnpm --filter @egose/n8n-client exec vitest run --no-cache --config vitest.unit.config.ts tests/discover.spec.ts tests/security-policy.spec.ts tests/project.spec.ts tests/contracts.spec.ts tests/spec-coverage.spec.ts tests/schema-shapes.spec.ts`
- Result: the package now pins the reviewed `v1.1.1` public API contract in code/docs, enforces a reviewed upstream drift allowlist in CI, exposes discover API-key scopes separately from project-effective scopes, fails fast for bearer-auth `/discover`, documents ambiguous optional-endpoint 404 semantics, and removes the incorrect source-control "list files" claim. Focused verification passed (`132` tests across `6` files).

### Task TEST-01: Add Sweep-Backed Contract Fixtures And A Privilege Matrix

Status: completed

Priority: P1

Suggested agent: integration and contract test engineer

Dependencies: REQ-01, MODEL-01, MODEL-03, CAP-01

Primary ownership:

- `packages/n8n-client/tests/**`
- fixture-generation/selection tooling
- `sandbox/run-api-sweep.ts`
- sweep documentation

Finding:

Current spec coverage checks only that verb/path literals exist in source, and schema tests compare the same checked-in OpenAPI to manual lists. Mock fixtures often use idealized or sparse shapes that conceal endpoint variants. The current sweep has 17 failed probes, many caused by invalid fixture setup or feature state, so they must be classified rather than treated as endpoint failures.

References:

- `packages/n8n-client/tests/spec-coverage.spec.ts:32-92`
- `packages/n8n-client/tests/schema-shapes.spec.ts:93-269`
- `packages/n8n-client/tests/workflow.spec.ts:8-23,36-45`
- `packages/n8n-client/tests/folder.spec.ts:6-52`
- `sandbox/api-sweep-results.json:1-7`

Implementation requirements:

1. Extract sanitized successful sweep payloads into endpoint-specific immutable fixtures; do not read a machine/environment-specific sweep wholesale during ordinary unit tests.
2. Validate request placement, body/query serialization, response mapping, and public reachability, not only verb/path presence.
3. Classify each failed sweep probe as validation, missing fixture/resource, authorization, feature/license state, disconnected integration, or unknown.
4. Expand the sweep using a real destination project, real execution, activatable workflow, connected/disconnected feature states where feasible, and owner versus restricted API keys.
5. Add dedicated security-policy behavior tests, workflow unarchive tests, and non-empty evaluation/test-run fixtures.
6. Redact base URLs, emails, API keys, tokens, and tenant-specific IDs before committing fixtures where appropriate.

Acceptance criteria:

- Successful observed response variants have mapping regressions independent of a live n8n instance.
- Every failed probe has an explicit classification and does not inflate endpoint coverage claims.
- Integration output records n8n version, auth mode/role, relevant feature/license state, and probe preconditions.
- No secrets or personal data are present in committed fixtures.

Completion evidence:

- Changed: `packages/n8n-client/tests/api-sweep-contracts.spec.ts`, `packages/n8n-client/tests/fixtures/api-sweep/*.json`, `sandbox/api-sweep-catalog.ts`, `sandbox/api-sweep-failure-classification.json`, `sandbox/api-sweep-privilege-matrix.json`, `sandbox/run-api-sweep.ts`, `sandbox/provisioner/common.js`, `sandbox/provisioner/apispec-provision.js`, `sandbox/README.md`
- Verified: `pnpm test:unit -- api-sweep-contracts.spec.ts`
- Verified: `pnpm typecheck`
- Verified: `node --check sandbox/provisioner/common.js && node --check sandbox/provisioner/apispec-provision.js`
- Result: added redacted sweep-backed workflow and security-policy fixtures, non-empty test-run fixtures, explicit failed-probe classification and privilege-matrix artifacts, and sweep/provisioning metadata support for auth profiles, version/license context, and probe preconditions.

### Task PACK-01: Verify The Published Tarball In ESM And CommonJS Consumers

Status: completed

Priority: P1

Suggested agent: package publishing engineer

Dependencies: TYPE-01

Primary ownership:

- `packages/n8n-client/package.json`
- `packages/n8n-client/tsup.config.ts`
- package consumer fixtures/scripts
- release workflow checks as needed

Finding:

Tests import source directly and do not prove the tarball can load or type-check. The build emits `index.d.ts` and `index.d.cts`, but the export map points both import and require consumers at `index.d.ts`. Package metadata contains placeholders and there is no local files allowlist or prepack validation.

References:

- `packages/n8n-client/package.json:4-8,18-35`
- `packages/n8n-client/tsup.config.ts:3-14`
- `packages/n8n-client/tests/client.spec.ts:1-3`
- `packages/n8n-client/tests/contracts.spec.ts:2-34`

Implementation requirements:

1. Add conditional type entries matching ESM `.d.ts` and CommonJS `.d.cts` branches.
2. Build and pack the exact publishable package, install it in isolated ESM and CommonJS Node 20 fixtures, and exercise default/named runtime and type exports.
3. Run strict NodeNext declaration checks with `skipLibCheck: false` and package-analysis tooling such as `publint` and/or `@arethetypeswrong/cli`.
4. Add a files allowlist and assert no `PLACEHOLDER` metadata reaches a publishable tarball.
5. Assert the tarball contains intended runtime chunks, declarations, sourcemaps, README, package metadata, and license only.
6. Decide whether documented client classes are public. Export them and test imports, or document them as inferred/opaque and stop presenting them as importable concepts.

Acceptance criteria:

- `import('@egose/n8n-client')` and `require('@egose/n8n-client')` work from installed tarball fixtures on Node 20.
- Strict ESM and CJS TypeScript consumers resolve the corresponding declarations.
- Package analyzers report no unresolved export/declaration errors.
- Dry-run package contents and final metadata pass explicit assertions.

Completion evidence:

- Changed: `packages/n8n-client/package.json`, `packages/n8n-client/src/index.ts`, `packages/n8n-client/scripts/verify-package.mjs`, `packages/n8n-client/tests/fixtures/consumer-esm/index.mts`, `packages/n8n-client/tests/fixtures/consumer-esm/runtime.mjs`, `packages/n8n-client/tests/fixtures/consumer-esm/tsconfig.json`, `packages/n8n-client/tests/fixtures/consumer-cjs/index.cts`, `packages/n8n-client/tests/fixtures/consumer-cjs/runtime.cjs`, `packages/n8n-client/tests/fixtures/consumer-cjs/tsconfig.json`, `pnpm-lock.yaml`
- Verified: `pnpm --filter @egose/n8n-client typecheck`
- Verified: `pnpm --filter @egose/n8n-client pack:verify`
- Verified: `npx -y node@20 packages/n8n-client/scripts/verify-package.mjs`
- Result: the package now ships real publish metadata plus a tarball-only files allowlist, uses conditional ESM/CJS declaration branches, exports the documented client classes from the root entrypoint, and has repeatable tarball verification that packs the publishable artifact, asserts packed contents/metadata, runs `publint` and `attw`, and installs the tarball into isolated ESM and CommonJS consumers for runtime and strict NodeNext type checks.

### Task DOC-01: Make README Examples And Commands Executable

Status: completed

Priority: P2

Suggested agent: developer experience engineer

Dependencies: CAP-01, PACK-01

Primary ownership:

- `packages/n8n-client/README.md`
- documentation test tooling

Finding:

The README has a same-block `const workflow` redeclaration, omits the security-policy accessor from the main table, references the old standalone repository, describes nonexistent test filename conventions, uses npm despite pnpm-based scripts, and overstates retry/API coverage.

References:

- `packages/n8n-client/README.md:6,11,21,40-42,70,105,508,514-550`
- `packages/n8n-client/src/index.ts:192-200`

Implementation requirements:

1. Compile all TypeScript README blocks in CI or a focused documentation test.
2. Align accessor tables, retry behavior, support/version claims, repository links, and development commands with implementation.
3. Keep examples concise and executable against the public package entry, not internal source paths.

Acceptance criteria:

- Every TypeScript code block compiles in its intended context.
- Documented clean-checkout commands execute successfully.
- Accessor and endpoint capability descriptions agree with exported runtime behavior.

Completion evidence:

- Changed: `packages/n8n-client/README.md`, `packages/n8n-client/package.json`, `packages/n8n-client/scripts/check-readme-examples.mjs`
- Verified: `pnpm --filter @egose/n8n-client docs:check`
- Verified: `pnpm --filter @egose/n8n-client typecheck`
- Verified: `pnpm --filter @egose/n8n-client test`
- Result: the README now uses current monorepo links and `pnpm` commands, the Quick Start examples no longer redeclare `workflow`, the main accessor table includes `securityPolicy()`, the documented test layers match the real test layout, and a dedicated docs check compiles all 26 TypeScript README blocks against the public `@egose/n8n-client` entrypoint.

## Dependency And Parallelization Guidance

| Wave | Agent lane           | Tasks                     | Parallel constraints                                                                                                                 |
| ---- | -------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 1    | Data-table contracts | REQ-01                    | Can run with REQ-02 and HTTP-01; coordinate query typing with HTTP-02.                                                               |
| 1    | Path safety          | REQ-02                    | Own shared path helper and client path edits; avoid simultaneous broad client edits.                                                 |
| 1    | Transport            | HTTP-01, HTTP-02, HTTP-03 | Sequence these tasks because all own `http-client.ts`.                                                                               |
| 2    | Workflow modeling    | MODEL-01                  | Can start with Wave 1; owns workflow type/mapper/resource hotspots.                                                                  |
| 2    | General modeling     | MODEL-02, MODEL-03        | Sequence after MODEL-01 to establish mapper policy; split endpoint areas only if `types.ts` and mapper conflicts are coordinated.    |
| 2    | Resources            | RESOURCE-01               | Starts after response contracts establish omission semantics.                                                                        |
| 3    | Strictness           | TYPE-01                   | Starts after mapper/type redesign to avoid fixing obsolete errors twice.                                                             |
| 3    | Performance          | PERF-01, PERF-02          | Can run in parallel after RESOURCE-01 if file ownership is split; both touch resource classes, so coordinate workflow/project files. |
| 3    | Architecture         | ARCH-01, PAGE-01          | PAGE-01 can run after MODEL-03; ARCH-01 follows scoped performance decisions.                                                        |
| 4    | Capability/tests     | CAP-01, TEST-01           | CAP-01 precedes final sweep classification; fixture preparation may begin earlier.                                                   |
| 4    | Package/docs         | PACK-01, DOC-01           | PACK-01 follows strict types; DOC-01 follows finalized public contracts.                                                             |

Shared hotspots requiring serialized ownership:

- `src/http-client.ts`: HTTP-01 -> HTTP-02 -> HTTP-03.
- `src/types.ts` and `src/response-mappers.ts`: MODEL-01 -> MODEL-02 -> MODEL-03 -> TYPE-01.
- `src/resources/workflow.ts`: MODEL-01 -> RESOURCE-01 -> PERF-01/PERF-02.
- `src/resources/project.ts`: RESOURCE-01 -> PERF-02 -> ARCH-01.
- `package.json` and emitted `dist/`: TYPE-01 -> PACK-01; do not run conflicting builds concurrently.

## Resolved Contract Decisions

These questions blocked early contract work and were resolved during implementation:

1. `DeleteRowsParams.filter` now accepts structured `DataTableFilter`, serializes it once before transport, and the raw-string ambiguity was removed and documented as a breaking change in `CHANGELOG.md`.
2. Low-level callers cannot override `Authorization` or `X-N8N-API-KEY`; the transport rejects those headers locally and preserves origin-safe redirect behavior.
3. `requestTimeoutMs` and per-request `timeoutMs` now act as total deadlines across retries and backoff, with caller cancellation via `AbortSignal`.
4. Bound resources now prefer confirmed server state after void mutations by refreshing where practical; partial-update helpers no longer resend omitted stale fields.
5. Documented collection client classes are treated as public imports and are exported from the root entrypoint with tarball verification coverage.
6. The package now pins the reviewed n8n Public API `v1` / checked-in OpenAPI contract `v1.1.1`, distinguishes optional capability-dependent routes, and documents bearer limits for `/discover`.
7. Folder-client identity reuse is not a public guarantee; the previous unbounded caches were removed.

## Final Integration Task

### Task REVIEW-01: Independently Verify Remediation And Release Readiness

Status: completed

Priority: P0

Suggested agent: independent senior reviewer, not a primary implementer above

Dependencies: all accepted tasks above; deferred tasks must carry explicit rationale

Primary ownership:

- review only, plus minimal targeted fixes approved during integration
- task completion evidence

Finding:

The changes span security boundaries, public types, runtime mapping, resource state, generated declarations, and package artifacts. Independent validation is required because unit tests previously passed while known request and response-contract defects remained.

References:

- `packages/n8n-client/src/**`
- `packages/n8n-client/tests/**`
- `packages/n8n-client/package.json`
- `packages/n8n-client/README.md`
- `sandbox/api-sweep-results.json`
- completion evidence recorded under every preceding task

Implementation requirements:

1. Verify every acceptance criterion against code and runtime tests rather than task status alone.
2. Re-test auth header override, redirect origins, malformed responses, empty bodies, query/path encoding, deadlines, and cancellation through the real transport boundary.
3. Verify endpoint-specific omission versus explicit null/empty behavior in bound resources.
4. Verify request-controlled collections and pagination have explicit bounds/termination and no hidden O(n) work on ordinary direct gets.
5. Compare public types, README, supported-version statement, implementation, sweep fixtures, emitted declarations, and package exports.
6. Inspect the tarball for secrets, personal data, internal-only files, placeholder metadata, and unresolved chunks.
7. Confirm deferred work states rationale, owner, residual risk, and release impact.

Acceptance criteria:

- `pnpm --filter @egose/n8n-client test` passes.
- `pnpm --filter @egose/n8n-client typecheck` passes under the final strictness policy.
- `pnpm --filter @egose/n8n-client build` passes.
- ESM and CJS installed-tarball consumer checks pass on Node 20.
- Relevant sanitized integration/sweep checks pass or have environment-specific blockers recorded.
- `pnpm test`, `pnpm typecheck`, and `pnpm build` pass at repository level, run serially where generated output is shared.
- No unresolved P0/P1 finding remains without explicit maintainer deferral and residual-risk documentation.

Completion evidence:

- Changed: `packages/n8n-sync/tsconfig.tests.json`, `packages/n8n-sync/tests/mappers.spec.ts`, `packages/n8n-sync/tests/publisher.spec.ts`, `docs/tasks/20260811-211711-n8n-client-health-remediation.md`
- Verified: `pnpm --filter @egose/n8n-sync typecheck`
- Verified: `pnpm --filter @egose/n8n-client pack:verify`
- Verified: `npx -y node@20 packages/n8n-client/scripts/verify-package.mjs`
- Verified: `pnpm typecheck`
- Verified: `pnpm build`
- Verified: `pnpm test`
- Blocker recorded: live Docker-backed integration reruns could not be executed in this environment because `docker` is unavailable in the active WSL distro (`docker compose -f sandbox/docker-compose.yml ps --status running` failed before any stack inspection). Sanitized sweep-backed regression coverage remains included in `pnpm --filter @egose/n8n-client test`.
- Result: independent review confirmed the package-level release gates, installed-tarball verification, and repository-level `test`/`typecheck`/`build` all pass after fixing the remaining cross-package typecheck issue in `@egose/n8n-sync`, where tests now resolve `@egose/n8n-client` against built declarations instead of workspace source.

## Definition Of Done

- Confirmed request failures and resource-state corruption have regression tests and fixes.
- Credential headers cannot be overridden accidentally or forwarded cross-origin.
- Dynamic path segments and query values have explicit shared serialization rules.
- Response types reflect endpoint variants, and mappers no longer fabricate complete entities from arbitrary partial input.
- Bound-resource snapshot and patch behavior is consistent and documented.
- Strict null checking is enabled, with any remaining strict migration work explicitly tracked.
- Ordinary scoped direct gets avoid hidden full-history scans where the API permits verification.
- Public capability/version claims distinguish observed, specified, optional, and privilege-dependent behavior.
- Sweep-derived fixtures are sanitized, successful shapes are covered, and failed probes are classified.
- The publishable tarball works for strict ESM and CommonJS consumers and contains only intended files.
- README examples and commands are executable.
- Every completed task records changed files, exact verification commands, results, and independent follow-ups.
