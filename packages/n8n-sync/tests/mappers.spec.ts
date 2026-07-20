import { describe, expect, it } from 'vitest';

import { mapCredential, mapWorkflow } from '../src/shared/mappers';
import type { ICredentialsDb, IWorkflowBase } from '../src/shared/types';

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
