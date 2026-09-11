// ---------------------------------------------------------------------------
// Workflow → credential reference extraction
//
// Workflow nodes reference credentials by id only (e.g.
// `node.credentials: { [credentialType]: { id, name } }`). The publisher
// collects those ids onto workflow events so the subscriber can report which
// ones are missing with a single query — without the publisher fetching every
// credential blob on every workflow update.
// ---------------------------------------------------------------------------

/** Maximum credential ids collected from a single workflow's nodes. */
export const MAX_WORKFLOW_CREDENTIAL_REFS = 200;

/** Maximum length of a collected credential id (mirrors wire MAX_ID_LENGTH). */
const MAX_CREDENTIAL_ID_LENGTH = 512;

function addCredentialId(collected: string[], seen: Set<string>, candidate: unknown): void {
  if (typeof candidate !== 'string') return;
  const id = candidate.trim();
  if (id.length === 0 || id.length > MAX_CREDENTIAL_ID_LENGTH) return;
  if (seen.has(id)) return;
  seen.add(id);
  collected.push(id);
}

/**
 * Collect the credential ids referenced by a workflow's nodes. Returns
 * deduplicated ids in first-seen order, capped at
 * {@link MAX_WORKFLOW_CREDENTIAL_REFS}. Never throws — unshaped nodes are
 * skipped.
 */
export function extractWorkflowCredentialIds(nodes: unknown): string[] {
  if (!Array.isArray(nodes)) return [];
  const collected: string[] = [];
  const seen = new Set<string>();

  for (const node of nodes) {
    if (collected.length >= MAX_WORKFLOW_CREDENTIAL_REFS) break;
    if (typeof node !== 'object' || node === null || Array.isArray(node)) continue;
    const credentials = (node as { credentials?: unknown }).credentials;
    if (typeof credentials !== 'object' || credentials === null || Array.isArray(credentials)) continue;

    for (const ref of Object.values(credentials as Record<string, unknown>)) {
      if (typeof ref === 'string') {
        addCredentialId(collected, seen, ref);
        continue;
      }
      if (typeof ref === 'object' && ref !== null && !Array.isArray(ref)) {
        addCredentialId(collected, seen, (ref as { id?: unknown }).id);
      }
      if (collected.length >= MAX_WORKFLOW_CREDENTIAL_REFS) break;
    }
  }

  return collected;
}
