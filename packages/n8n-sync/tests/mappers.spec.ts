import { describe, expect, it } from 'vitest';

import { mapCredential, mapExecution, mapWorkflow } from '../src/shared/mappers';
import type { ICredentialsDb, IRunPayload, IWorkflowBase } from '../src/shared/types';

describe('mapWorkflow', () => {
  it('maps all fields and serializes dates to ISO strings', () => {
    const workflow: IWorkflowBase = {
      id: 'wf-1',
      name: 'My Workflow',
      description: 'desc',
      active: true,
      isArchived: false,
      createdAt: new Date('2026-01-02T03:04:05.000Z'),
      updatedAt: new Date('2026-02-03T04:05:06.000Z'),
      nodes: [{ id: 'n1' }],
      connections: { n1: {} },
      settings: { saveExecutionProgress: true },
      staticData: { key: 'value' },
      pinData: { n1: [{ json: {} }] },
      meta: { templateId: 't' },
      versionId: 'v-9',
      activeVersionId: 'v-9',
    };

    expect(mapWorkflow(workflow)).toEqual({
      id: 'wf-1',
      name: 'My Workflow',
      description: 'desc',
      active: true,
      isArchived: false,
      nodes: [{ id: 'n1' }],
      connections: { n1: {} },
      settings: { saveExecutionProgress: true },
      staticData: { key: 'value' },
      pinData: { n1: [{ json: {} }] },
      meta: { templateId: 't' },
      versionId: 'v-9',
      activeVersionId: 'v-9',
      createdAt: '2026-01-02T03:04:05.000Z',
      updatedAt: '2026-02-03T04:05:06.000Z',
    });
  });

  it('omits absent optional fields and defaults nodes/connections', () => {
    const workflow = {
      id: 'wf-2',
      name: 'Bare',
      active: false,
      isArchived: true,
      createdAt: undefined,
      updatedAt: undefined,
      nodes: undefined,
      connections: undefined,
    } as unknown as IWorkflowBase;

    const dto = mapWorkflow(workflow);
    expect(dto).toEqual({ id: 'wf-2', name: 'Bare', active: false, isArchived: true, nodes: [], connections: {} });
    expect(dto).not.toHaveProperty('createdAt');
    expect(dto).not.toHaveProperty('settings');
  });
});

describe('mapCredential', () => {
  it('maps all fields and serializes dates to ISO strings', () => {
    const credential: ICredentialsDb = {
      id: 'cred-1',
      name: 'My Credential',
      type: 'httpBasicAuth',
      data: 'U2FsdGVkX1+encrypted',
      isGlobal: true,
      isManaged: false,
      createdAt: new Date('2026-01-02T03:04:05.000Z'),
      updatedAt: new Date('2026-02-03T04:05:06.000Z'),
    };

    expect(mapCredential(credential)).toEqual({
      id: 'cred-1',
      name: 'My Credential',
      type: 'httpBasicAuth',
      data: 'U2FsdGVkX1+encrypted',
      isGlobal: true,
      isManaged: false,
      createdAt: '2026-01-02T03:04:05.000Z',
      updatedAt: '2026-02-03T04:05:06.000Z',
    });
  });

  it('omits absent optional fields', () => {
    const dto = mapCredential({ id: 'c', name: 'n', type: 't', data: 'd' });
    expect(dto).toEqual({ id: 'c', name: 'n', type: 't', data: 'd' });
  });
});

describe('mapExecution', () => {
  const workflow: IWorkflowBase = {
    id: 'wf-1',
    name: 'W',
    active: false,
    isArchived: false,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    nodes: [{ id: 'n1' }],
    connections: { n1: {} },
  };

  it('maps an IRun + IWorkflowBase to the execution DTO with ISO timestamps and the workflow snapshot', () => {
    const run: IRunPayload = {
      finished: true,
      mode: 'manual',
      status: 'success',
      startedAt: new Date('2026-05-01T10:00:00.000Z'),
      stoppedAt: new Date('2026-05-01T10:00:05.000Z'),
    };

    const dto = mapExecution('exec-1', run, workflow);

    expect(dto).toEqual({
      id: 'exec-1',
      workflowId: 'wf-1',
      status: 'success',
      mode: 'manual',
      finished: true,
      startedAt: '2026-05-01T10:00:00.000Z',
      stoppedAt: '2026-05-01T10:00:05.000Z',
      createdAt: '2026-05-01T10:00:00.000Z',
      workflowSnapshot: { id: 'wf-1', name: 'W', nodes: [{ id: 'n1' }], connections: { n1: {} } },
    });
  });

  it('derives finished=true from status=success when finished is undefined', () => {
    const dto = mapExecution(
      'exec-2',
      { mode: 'trigger', status: 'success', startedAt: new Date('2026-05-01T10:00:00.000Z') },
      workflow,
    );
    expect(dto.finished).toBe(true);
  });

  it('derives finished=false for non-success terminal/in-flight statuses', () => {
    for (const status of ['error', 'crashed', 'canceled', 'running', 'waiting', 'new', 'unknown']) {
      const dto = mapExecution(
        `exec-${status}`,
        { mode: 'trigger', status, startedAt: new Date('2026-05-01T10:00:00.000Z') },
        workflow,
      );
      expect(dto.finished).toBe(false);
    }
  });

  it('marks status=unknown and omits timestamp fields when fullRunData is undefined', () => {
    const dto = mapExecution('exec-3', undefined, workflow);
    expect(dto.status).toBe('unknown');
    expect(dto.mode).toBe('unknown');
    expect(dto.finished).toBe(false);
    expect(dto.startedAt).toBeUndefined();
    expect(dto.stoppedAt).toBeUndefined();
    expect(dto.createdAt).toBeUndefined();
  });

  it('omits workflowId when the workflow snapshot carries no id', () => {
    const dto = mapExecution('exec-4', undefined, undefined);
    expect(dto.workflowId).toBeUndefined();
    expect(dto.workflowSnapshot).toBeUndefined();
  });
});
