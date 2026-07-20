import { describe, expect, it } from 'vitest';

import { parseSyncEvent } from '../src/shared/validate';

const base = { at: '2026-01-01T00:00:00.000Z', sourceId: 'src-1' };
const workflow = { id: 'wf-1', name: 'W', nodes: [], connections: {}, active: false, isArchived: false };
const credential = { id: 'c-1', name: 'C', type: 'httpBasicAuth', data: 'encrypted' };

describe('parseSyncEvent', () => {
  it.each([
    [{ ...base, type: 'workflow.upsert', workflow }],
    [{ ...base, type: 'workflow.activate', workflow }],
    [{ ...base, type: 'workflow.delete', workflowId: 'wf-1' }],
    [{ ...base, type: 'workflow.archive', workflowId: 'wf-1', archived: true }],
    [{ ...base, type: 'credentials.upsert', credential }],
    [{ ...base, type: 'credentials.delete', credentialId: 'c-1' }],
  ])('accepts valid event %j', (event) => {
    expect(parseSyncEvent(event)).toEqual(event);
  });

  it.each([
    ['null', null],
    ['a string', 'workflow.upsert'],
    ['missing envelope fields', { type: 'workflow.delete', workflowId: 'wf-1' }],
    ['unknown type', { ...base, type: 'workflow.explode', workflowId: 'wf-1' }],
    ['workflow without nodes', { ...base, type: 'workflow.upsert', workflow: { id: 'w', name: 'n', connections: {} } }],
    ['credential without data', { ...base, type: 'credentials.upsert', credential: { id: 'c', name: 'n', type: 't' } }],
    ['archive without flag', { ...base, type: 'workflow.archive', workflowId: 'wf-1' }],
    ['delete without id', { ...base, type: 'workflow.delete' }],
  ])('rejects %s', (_label, payload) => {
    expect(parseSyncEvent(payload)).toBeNull();
  });
});
