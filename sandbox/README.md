# API Sweep Notes

`run-api-sweep.ts` is the integration harness for `@egose/n8n-client`.

Current expectations:

- The sweep provisions two API-key profiles when possible: `owner` and `restricted`.
- Report output records n8n version metadata, auth profile metadata, provisioning and license context, and per-probe preconditions.
- Failed probes are classified using the categories from `TEST-01` so coverage numbers are not mistaken for successful endpoint behavior.
- Ordinary unit tests should use the redacted endpoint fixtures under `packages/n8n-client/tests/fixtures/api-sweep/`, not a live or machine-specific sweep output file.

Redaction rules for committed fixtures:

- No base URLs.
- No real email addresses.
- No API keys, bearer tokens, invite tokens, or tenant-specific ids.
- Use stable placeholders that preserve shape without preserving instance identity.
