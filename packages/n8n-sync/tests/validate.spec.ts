import { describe, expect, it } from 'vitest';

import { assertValidSyncEntitySelection } from '../src/shared/config';
import { mapCredential, mapExecution, mapWorkflow } from '../src/shared/mappers';
import type { ICredentialsDb, IWorkflowBase } from '../src/shared/types';
import { parseSyncEvent } from '../src/shared/validate';

const base = {
  at: '2026-01-01T00:00:00.000Z',
  sourceId: 'src-1',
  eventId: 'src-1:1',
  entityRevision: '1',
};
const workflow = { id: 'wf-1', name: 'W', nodes: [], connections: {}, active: false, isArchived: false };
const credential = { id: 'c-1', name: 'C', type: 'httpBasicAuth', data: 'encrypted' };
const execution = {
  id: 'exec-1',
  workflowId: 'wf-1',
  status: 'success',
  mode: 'manual',
  finished: true,
  startedAt: '2026-01-01T00:00:00.000Z',
};

function nestedObject(depth: number): Record<string, unknown> {
  let value: Record<string, unknown> = { leaf: true };
  for (let index = 0; index < depth; index += 1) {
    value = { nested: value };
  }
  return value;
}

function objectWithKeys(count: number): Record<string, unknown> {
  return Object.fromEntries(Array.from({ length: count }, (_value, index) => [`key-${index}`, true]));
}

describe('parseSyncEvent', () => {
  it.each([
    [{ ...base, type: 'workflow.upsert', workflow }],
    [{ ...base, type: 'workflow.activate', workflow }],
    [{ ...base, type: 'workflow.delete', workflowId: 'wf-1' }],
    [{ ...base, type: 'workflow.archive', workflowId: 'wf-1', archived: true }],
    [{ ...base, type: 'credentials.upsert', credential }],
    [{ ...base, type: 'credentials.delete', credentialId: 'c-1' }],
    [{ ...base, type: 'execution.upsert', execution }],
    [
      {
        ...base,
        type: 'workflow.upsert',
        workflow: {
          ...workflow,
          tags: [{ id: 't1', name: 'sync' }],
          meta: { active_real: true },
        },
      },
    ],
    [
      {
        ...base,
        type: 'workflow.upsert',
        workflow: {
          ...workflow,
          staticData: null,
          pinData: null,
          meta: null,
        },
      },
    ],
    [
      {
        ...base,
        type: 'workflow.upsert',
        workflow: {
          ...workflow,
          staticData: '{"serialized":true}',
        },
      },
    ],
    [
      {
        ...base,
        type: 'workflow.upsert',
        workflow: {
          ...workflow,
          description: 'desc',
          settings: { saveManualExecutions: true },
          staticData: { global: { counter: 1 } },
          pinData: { nodeA: [{ json: { ok: true } }] },
          meta: { active_real: true },
          versionId: 'version-1',
          activeVersionId: null,
          tags: [{ id: 't1', name: 'sync' }],
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-02T00:00:00.000Z',
        },
      },
    ],
    [
      {
        ...base,
        type: 'credentials.upsert',
        credential: {
          ...credential,
          data: 'U2FsdGVkX1+encrypted',
          isGlobal: false,
          isManaged: true,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-02T00:00:00.000Z',
        },
      },
    ],
    [
      {
        ...base,
        type: 'execution.upsert',
        execution: {
          ...execution,
          stoppedAt: '2026-01-01T00:01:00.000Z',
          createdAt: '2026-01-01T00:00:00.000Z',
          workflowSnapshot: {
            id: 'wf-1',
            name: 'Workflow',
            nodes: [{ id: 'node-1' }],
            connections: { 'node-1': {} },
          },
        },
      },
    ],
  ])('accepts valid event %j', (event) => {
    expect(parseSyncEvent(event)).toEqual(event);
  });

  it('accepts DTOs emitted by the publisher mappers', () => {
    const mappedWorkflow = mapWorkflow({
      id: 'wf-1',
      name: 'Mapped workflow',
      description: 'desc',
      active: true,
      isArchived: false,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      nodes: [{ id: 'node-1', type: 'n8n-nodes-base.noOp', parameters: {} }],
      connections: { 'node-1': {} },
      settings: { timezone: 'UTC' },
      staticData: null,
      pinData: null,
      meta: null,
      versionId: 'version-1',
      activeVersionId: 'version-1',
    } as IWorkflowBase);
    const mappedCredential = mapCredential({
      id: 'cred-1',
      name: 'Mapped credential',
      type: 'httpBasicAuth',
      data: 'U2FsdGVkX1+encrypted',
      isGlobal: true,
      isManaged: false,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    } as ICredentialsDb);
    const mappedExecution = mapExecution(
      'exec-1',
      {
        status: 'running',
        mode: 'trigger',
        finished: false,
        startedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
      {
        id: 'wf-1',
        name: 'Mapped workflow',
        nodes: [],
        connections: {},
        active: true,
        isArchived: false,
      } as IWorkflowBase,
    );

    expect(parseSyncEvent({ ...base, type: 'workflow.upsert', workflow: mappedWorkflow })).toEqual({
      ...base,
      type: 'workflow.upsert',
      workflow: mappedWorkflow,
    });
    expect(parseSyncEvent({ ...base, type: 'credentials.upsert', credential: mappedCredential })).toEqual({
      ...base,
      type: 'credentials.upsert',
      credential: mappedCredential,
    });
    expect(parseSyncEvent({ ...base, type: 'execution.upsert', execution: mappedExecution })).toEqual({
      ...base,
      type: 'execution.upsert',
      execution: mappedExecution,
    });
  });

  it.each([
    ['null', null],
    ['a string', 'workflow.upsert'],
    ['missing envelope fields', { type: 'workflow.delete', workflowId: 'wf-1' }],
    ['missing event id', { ...base, eventId: undefined, type: 'workflow.delete', workflowId: 'wf-1' }],
    ['non-decimal entity revision', { ...base, entityRevision: 'rev-1', type: 'workflow.delete', workflowId: 'wf-1' }],
    ['unknown type', { ...base, type: 'workflow.explode', workflowId: 'wf-1' }],
    ['workflow without nodes', { ...base, type: 'workflow.upsert', workflow: { id: 'w', name: 'n', connections: {} } }],
    ['credential without data', { ...base, type: 'credentials.upsert', credential: { id: 'c', name: 'n', type: 't' } }],
    ['archive without flag', { ...base, type: 'workflow.archive', workflowId: 'wf-1' }],
    ['delete without id', { ...base, type: 'workflow.delete' }],
    [
      'execution without status',
      { ...base, type: 'execution.upsert', execution: { id: 'e', mode: 'm', finished: true } },
    ],
    [
      'execution without finished',
      { ...base, type: 'execution.upsert', execution: { id: 'e', status: 'success', mode: 'm' } },
    ],
    [
      'execution with non-boolean finished',
      { ...base, type: 'execution.upsert', execution: { id: 'e', status: 'success', mode: 'm', finished: 'yes' } },
    ],
  ])('rejects %s', (_label, payload) => {
    expect(parseSyncEvent(payload)).toBeNull();
  });

  it.each([
    ['blank source id', { ...base, sourceId: '', type: 'workflow.delete', workflowId: 'wf-1' }],
    ['blank event id', { ...base, eventId: '', type: 'workflow.delete', workflowId: 'wf-1' }],
    ['invalid envelope timestamp', { ...base, at: 'not-a-date', type: 'workflow.delete', workflowId: 'wf-1' }],
    ['blank workflow delete id', { ...base, type: 'workflow.delete', workflowId: '' }],
    ['blank credential delete id', { ...base, type: 'credentials.delete', credentialId: '' }],
    ['too-long source id', { ...base, sourceId: 's'.repeat(513), type: 'workflow.delete', workflowId: 'wf-1' }],
    ['too-long event id', { ...base, eventId: 'e'.repeat(1025), type: 'workflow.delete', workflowId: 'wf-1' }],
    [
      'too-long entity revision',
      { ...base, entityRevision: '1'.repeat(129), type: 'workflow.delete', workflowId: 'wf-1' },
    ],
    [
      'envelope timestamp without zulu suffix',
      { ...base, at: '2026-01-01T00:00:00.000+01:00', type: 'workflow.delete', workflowId: 'wf-1' },
    ],
  ])('rejects additional invalid payload: %s', (_label, payload) => {
    expect(parseSyncEvent(payload)).toBeNull();
  });

  it.each([
    ['blank workflow id', { ...base, type: 'workflow.upsert', workflow: { ...workflow, id: '' } }],
    ['blank workflow name', { ...base, type: 'workflow.upsert', workflow: { ...workflow, name: '   ' } }],
    [
      'workflow missing active',
      {
        ...base,
        type: 'workflow.upsert',
        workflow: { id: 'wf-1', name: 'W', nodes: [], connections: {}, isArchived: false },
      },
    ],
    ['workflow invalid active', { ...base, type: 'workflow.upsert', workflow: { ...workflow, active: 'yes' } }],
    [
      'workflow missing isArchived',
      {
        ...base,
        type: 'workflow.upsert',
        workflow: { id: 'wf-1', name: 'W', nodes: [], connections: {}, active: false },
      },
    ],
    ['workflow nodes not array', { ...base, type: 'workflow.upsert', workflow: { ...workflow, nodes: {} } }],
    [
      'workflow connections not object',
      { ...base, type: 'workflow.upsert', workflow: { ...workflow, connections: [] } },
    ],
    [
      'workflow description wrong type',
      { ...base, type: 'workflow.upsert', workflow: { ...workflow, description: 5 } },
    ],
    ['workflow settings wrong shape', { ...base, type: 'workflow.upsert', workflow: { ...workflow, settings: [] } }],
    [
      'workflow staticData wrong shape',
      { ...base, type: 'workflow.upsert', workflow: { ...workflow, staticData: 'nope' } },
    ],
    ['workflow pinData wrong shape', { ...base, type: 'workflow.upsert', workflow: { ...workflow, pinData: 'nope' } }],
    ['workflow meta wrong shape', { ...base, type: 'workflow.upsert', workflow: { ...workflow, meta: [] } }],
    ['workflow versionId blank', { ...base, type: 'workflow.upsert', workflow: { ...workflow, versionId: '' } }],
    [
      'workflow activeVersionId wrong type',
      { ...base, type: 'workflow.upsert', workflow: { ...workflow, activeVersionId: 1 } },
    ],
    ['workflow tags not array', { ...base, type: 'workflow.upsert', workflow: { ...workflow, tags: {} } }],
    [
      'workflow tag blank id',
      { ...base, type: 'workflow.upsert', workflow: { ...workflow, tags: [{ id: '', name: 'sync' }] } },
    ],
    [
      'workflow tag blank name',
      { ...base, type: 'workflow.upsert', workflow: { ...workflow, tags: [{ id: 'tag-1', name: '' }] } },
    ],
    ['workflow invalid createdAt', { ...base, type: 'workflow.upsert', workflow: { ...workflow, createdAt: 'nope' } }],
    ['workflow invalid updatedAt', { ...base, type: 'workflow.upsert', workflow: { ...workflow, updatedAt: 'nope' } }],
    [
      'workflow deep nesting',
      { ...base, type: 'workflow.upsert', workflow: { ...workflow, nodes: [nestedObject(40)] } },
    ],
    [
      'workflow oversized nodes',
      {
        ...base,
        type: 'workflow.upsert',
        workflow: { ...workflow, nodes: Array.from({ length: 1001 }, () => ({ id: 'n' })) },
      },
    ],
    [
      'workflow oversized connections',
      { ...base, type: 'workflow.upsert', workflow: { ...workflow, connections: objectWithKeys(1001) } },
    ],
    [
      'workflow oversized tags',
      {
        ...base,
        type: 'workflow.upsert',
        workflow: {
          ...workflow,
          tags: Array.from({ length: 1001 }, (_value, index) => ({ id: `tag-${index}`, name: 'sync' })),
        },
      },
    ],
  ])('rejects malformed workflow payload: %s', (_label, payload) => {
    expect(parseSyncEvent(payload)).toBeNull();
  });

  it.each([
    ['blank credential id', { ...base, type: 'credentials.upsert', credential: { ...credential, id: '' } }],
    ['blank credential name', { ...base, type: 'credentials.upsert', credential: { ...credential, name: '' } }],
    ['blank credential type', { ...base, type: 'credentials.upsert', credential: { ...credential, type: '' } }],
    ['credential data empty string', { ...base, type: 'credentials.upsert', credential: { ...credential, data: '' } }],
    [
      'credential data object form',
      { ...base, type: 'credentials.upsert', credential: { ...credential, data: { user: 'alice' } } },
    ],
    ['credential data wrong shape', { ...base, type: 'credentials.upsert', credential: { ...credential, data: [] } }],
    [
      'credential isGlobal wrong type',
      { ...base, type: 'credentials.upsert', credential: { ...credential, isGlobal: 'yes' } },
    ],
    [
      'credential isManaged wrong type',
      { ...base, type: 'credentials.upsert', credential: { ...credential, isManaged: 'yes' } },
    ],
    [
      'credential invalid createdAt',
      { ...base, type: 'credentials.upsert', credential: { ...credential, createdAt: 'nope' } },
    ],
    [
      'credential invalid updatedAt',
      { ...base, type: 'credentials.upsert', credential: { ...credential, updatedAt: 'nope' } },
    ],
  ])('rejects malformed credential payload: %s', (_label, payload) => {
    expect(parseSyncEvent(payload)).toBeNull();
  });

  it.each([
    ['blank execution id', { ...base, type: 'execution.upsert', execution: { ...execution, id: '' } }],
    ['blank execution workflow id', { ...base, type: 'execution.upsert', execution: { ...execution, workflowId: '' } }],
    [
      'execution without workflow id',
      {
        ...base,
        type: 'execution.upsert',
        execution: {
          id: 'e',
          status: 'success',
          mode: 'manual',
          finished: true,
          startedAt: '2026-01-01T00:00:00.000Z',
        },
      },
    ],
    ['execution invalid status', { ...base, type: 'execution.upsert', execution: { ...execution, status: 'done' } }],
    ['execution invalid mode', { ...base, type: 'execution.upsert', execution: { ...execution, mode: 'batch' } }],
    [
      'execution without lifecycle timestamps',
      {
        ...base,
        type: 'execution.upsert',
        execution: { ...execution, startedAt: undefined, stoppedAt: undefined, createdAt: undefined },
      },
    ],
    [
      'execution with invalid startedAt',
      { ...base, type: 'execution.upsert', execution: { ...execution, startedAt: 'nope' } },
    ],
    [
      'execution with invalid stoppedAt',
      { ...base, type: 'execution.upsert', execution: { ...execution, stoppedAt: 'nope' } },
    ],
    [
      'execution with invalid createdAt',
      { ...base, type: 'execution.upsert', execution: { ...execution, createdAt: 'nope' } },
    ],
    [
      'execution snapshot missing id',
      {
        ...base,
        type: 'execution.upsert',
        execution: { ...execution, workflowSnapshot: { name: 'W', nodes: [], connections: {} } },
      },
    ],
    [
      'execution snapshot bad connections',
      {
        ...base,
        type: 'execution.upsert',
        execution: { ...execution, workflowSnapshot: { id: 'wf-1', name: 'W', nodes: [], connections: [] } },
      },
    ],
    [
      'execution snapshot deep nesting',
      {
        ...base,
        type: 'execution.upsert',
        execution: {
          ...execution,
          workflowSnapshot: { id: 'wf-1', name: 'W', nodes: [nestedObject(40)], connections: {} },
        },
      },
    ],
  ])('rejects malformed execution payload: %s', (_label, payload) => {
    expect(parseSyncEvent(payload)).toBeNull();
  });
});

describe('assertValidSyncEntitySelection', () => {
  it('accepts legacy and execution-enabled combinations that include workflows', () => {
    expect(() => assertValidSyncEntitySelection(new Set(['workflows', 'credentials']))).not.toThrow();
    expect(() => assertValidSyncEntitySelection(new Set(['workflows', 'executions']))).not.toThrow();
  });

  it('rejects executions without workflows', () => {
    expect(() => assertValidSyncEntitySelection(new Set(['executions']))).toThrow(
      'SYNC_ENTITIES=executions requires workflows to also be enabled',
    );
  });
});
