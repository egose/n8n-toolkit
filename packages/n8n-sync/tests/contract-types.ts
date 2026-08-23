import { createPublisherHooks } from '../src/publisher/hooks';
import type { Logger } from '../src/shared/logger';
import type { IWorkflowBase, SyncEvent } from '../src/shared/types';

const log: Logger = {
  debug: () => undefined,
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
  child: () => log,
};

const hooks = createPublisherHooks({
  emit: async () => undefined,
  log,
  sourceId: 'src-1',
  entities: { executions: true },
});

const workflow: IWorkflowBase = {
  id: 'wf-1',
  name: 'Workflow',
  active: true,
  isArchived: false,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  nodes: [],
  connections: {},
};

const workflowHooks = hooks.workflow;
if (!workflowHooks?.postExecute) throw new Error('fixture requires execution hooks');

void workflowHooks.postExecute[0](
  {
    status: 'success',
    mode: 'manual',
    finished: true,
    startedAt: new Date('2026-01-01T00:00:00.000Z'),
  },
  workflow,
  'exec-1',
);

// @ts-expect-error pinned n8n workflow.postExecute argument order is run, workflow, execution id.
void workflowHooks.postExecute[0](
  workflow,
  {
    status: 'success',
    mode: 'manual',
    finished: true,
    startedAt: new Date('2026-01-01T00:00:00.000Z'),
  },
  'exec-1',
);

const validExecutionEvent: SyncEvent = {
  at: '2026-01-01T00:00:00.000Z',
  sourceId: 'src-1',
  eventId: 'src-1:1',
  entityRevision: '1',
  type: 'execution.upsert',
  execution: {
    id: 'exec-1',
    workflowId: 'wf-1',
    status: 'success',
    mode: 'manual',
    finished: true,
    startedAt: '2026-01-01T00:00:00.000Z',
  },
};

void validExecutionEvent;

const missingWorkflowIdEvent: SyncEvent = {
  at: '2026-01-01T00:00:00.000Z',
  sourceId: 'src-1',
  eventId: 'src-1:2',
  entityRevision: '2',
  type: 'execution.upsert',
  // @ts-expect-error execution.workflowId is required by the wire contract.
  execution: {
    id: 'exec-2',
    status: 'success',
    mode: 'manual',
    finished: true,
    startedAt: '2026-01-01T00:00:00.000Z',
  },
};

void missingWorkflowIdEvent;

const invalidExecutionStatusEvent: SyncEvent = {
  at: '2026-01-01T00:00:00.000Z',
  sourceId: 'src-1',
  eventId: 'src-1:3',
  entityRevision: '3',
  type: 'execution.upsert',
  execution: {
    id: 'exec-3',
    workflowId: 'wf-1',
    // @ts-expect-error execution.status is a closed union.
    status: 'done',
    mode: 'manual',
    finished: true,
    startedAt: '2026-01-01T00:00:00.000Z',
  },
};

void invalidExecutionStatusEvent;

const invalidExecutionModeEvent: SyncEvent = {
  at: '2026-01-01T00:00:00.000Z',
  sourceId: 'src-1',
  eventId: 'src-1:4',
  entityRevision: '4',
  type: 'execution.upsert',
  execution: {
    id: 'exec-4',
    workflowId: 'wf-1',
    status: 'success',
    // @ts-expect-error execution.mode is a closed union.
    mode: 'batch',
    finished: true,
    startedAt: '2026-01-01T00:00:00.000Z',
  },
};

void invalidExecutionModeEvent;
