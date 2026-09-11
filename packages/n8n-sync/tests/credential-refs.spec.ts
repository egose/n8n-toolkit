import { describe, expect, it } from 'vitest';

import { extractWorkflowCredentialIds, MAX_WORKFLOW_CREDENTIAL_REFS } from '../src/shared/credential-refs';
import { explainSyncEventFailure, parseSyncEvent } from '../src/shared/validate';

describe('extractWorkflowCredentialIds', () => {
  it('collects ids from id-object references', () => {
    const nodes = [
      { id: 'n1', credentials: { postgres: { id: 'cred-a', name: 'PG' } } },
      { id: 'n2', credentials: { httpHeaderAuth: { id: 'cred-b', name: 'H' } } },
    ];
    expect(extractWorkflowCredentialIds(nodes)).toEqual(['cred-a', 'cred-b']);
  });

  it('accepts plain string references and dedupes in first-seen order', () => {
    const nodes = [
      { id: 'n1', credentials: { a: 'cred-a', b: { id: 'cred-b' } } },
      { id: 'n2', credentials: { c: 'cred-a', d: { id: 'cred-b' }, e: { id: 'cred-c' } } },
    ];
    expect(extractWorkflowCredentialIds(nodes)).toEqual(['cred-a', 'cred-b', 'cred-c']);
  });

  it('skips unshaped nodes, blank ids, and non-id references', () => {
    const nodes = [
      null,
      'nope',
      42,
      { id: 'n1' },
      { id: 'n2', credentials: null },
      { id: 'n3', credentials: ['cred-x'] },
      { id: 'n4', credentials: { a: { name: 'no-id' }, b: '', c: '   ', d: { id: 7 } } },
    ];
    expect(extractWorkflowCredentialIds(nodes)).toEqual([]);
  });

  it('returns [] for non-array input', () => {
    expect(extractWorkflowCredentialIds(undefined)).toEqual([]);
    expect(extractWorkflowCredentialIds({})).toEqual([]);
  });

  it('caps the collected ids', () => {
    const nodes = Array.from({ length: MAX_WORKFLOW_CREDENTIAL_REFS + 50 }, (_, index) => ({
      id: `n${index}`,
      credentials: { t: { id: `cred-${index}` } },
    }));
    const ids = extractWorkflowCredentialIds(nodes);
    expect(ids).toHaveLength(MAX_WORKFLOW_CREDENTIAL_REFS);
    expect(ids[0]).toBe('cred-0');
  });
});

describe('workflow credentialIds wire contract', () => {
  const base = {
    at: '2026-01-01T00:00:00.000Z',
    sourceId: 's',
    eventId: 's:1',
    entityRevision: '1',
    type: 'workflow.upsert',
    workflow: {
      id: 'wf-1',
      name: 'W',
      active: false,
      isArchived: false,
      nodes: [],
      connections: {},
    },
  };

  it('accepts an id-only reference list on workflow.upsert and workflow.activate', () => {
    for (const type of ['workflow.upsert', 'workflow.activate'] as const) {
      const event = { ...base, type, credentialIds: ['cred-a', 'cred-b'] };
      expect(parseSyncEvent(event)).toEqual(event);
      expect(explainSyncEventFailure(event)).toBeNull();
    }
  });

  it('accepts events without credentialIds (legacy publishers)', () => {
    const legacy = {
      at: base.at,
      sourceId: base.sourceId,
      eventId: base.eventId,
      entityRevision: base.entityRevision,
      type: 'workflow.upsert',
      workflow: base.workflow,
    };
    expect(parseSyncEvent(legacy)).toEqual(legacy);
    expect(explainSyncEventFailure(legacy)).toBeNull();
  });

  it('rejects malformed reference lists', () => {
    expect(explainSyncEventFailure({ ...base, credentialIds: 'cred-a' })).toBe('workflow.upsert.credentialIds');
    expect(explainSyncEventFailure({ ...base, credentialIds: [''] })).toBe('workflow.upsert.credentialIds');
    expect(explainSyncEventFailure({ ...base, credentialIds: ['   '] })).toBe('workflow.upsert.credentialIds');
    expect(explainSyncEventFailure({ ...base, credentialIds: ['x'.repeat(513)] })).toBe(
      'workflow.upsert.credentialIds',
    );
    expect(
      explainSyncEventFailure({
        ...base,
        credentialIds: Array.from({ length: MAX_WORKFLOW_CREDENTIAL_REFS + 1 }, (_, i) => `c${i}`),
      }),
    ).toBe('workflow.upsert.credentialIds');
  });
});
