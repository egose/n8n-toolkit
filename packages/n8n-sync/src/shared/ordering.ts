import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

import type { SyncEvent, SyncEventType } from './types';

type SyncEventLike =
  | { type: 'credentials.upsert'; credential: { id: string } }
  | { type: 'credentials.delete'; credentialId: string }
  | { type: 'workflow.upsert'; workflow: { id: string } }
  | { type: 'workflow.activate'; workflow: { id: string } }
  | { type: 'workflow.delete'; workflowId: string }
  | { type: 'workflow.archive'; workflowId: string }
  | { type: 'execution.upsert'; execution: { id: string } };

export type SyncEntityKind = 'workflow' | 'credential' | 'execution';

export interface SyncEventEntityRef {
  kind: SyncEntityKind;
  id: string;
  key: string;
}

export interface AppliedEventState {
  entityRevision: string;
  eventId: string;
  type: SyncEventType;
  at: string;
}

export type OrderedEventDecision = 'apply' | 'duplicate' | 'stale' | 'conflict';

export function compareDecimalStrings(left: string, right: string): number {
  const leftValue = BigInt(left);
  const rightValue = BigInt(right);
  if (leftValue === rightValue) return 0;
  return leftValue < rightValue ? -1 : 1;
}

export function incrementDecimalString(value: string | undefined): string {
  return (BigInt(value ?? '0') + 1n).toString();
}

export function isDecimalString(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9]+$/.test(value);
}

export function getSyncEventEntityRef(event: SyncEventLike): SyncEventEntityRef {
  switch (event.type) {
    case 'workflow.upsert':
    case 'workflow.activate':
      return { kind: 'workflow', id: event.workflow.id, key: `workflow:${event.workflow.id}` };
    case 'workflow.delete':
    case 'workflow.archive':
      return { kind: 'workflow', id: event.workflowId, key: `workflow:${event.workflowId}` };
    case 'credentials.upsert':
      return { kind: 'credential', id: event.credential.id, key: `credential:${event.credential.id}` };
    case 'credentials.delete':
      return { kind: 'credential', id: event.credentialId, key: `credential:${event.credentialId}` };
    case 'execution.upsert':
      return { kind: 'execution', id: event.execution.id, key: `execution:${event.execution.id}` };
  }
}

export function getSourceEntityStateKey(event: SyncEvent): string {
  const entity = getSyncEventEntityRef(event);
  return `${event.sourceId}:${entity.key}`;
}

export function classifyOrderedEvent(existing: AppliedEventState | undefined, event: SyncEvent): OrderedEventDecision {
  if (!existing) return 'apply';

  const revisionOrder = compareDecimalStrings(event.entityRevision, existing.entityRevision);
  if (revisionOrder > 0) return 'apply';
  if (revisionOrder < 0) return 'stale';
  if (existing.eventId === event.eventId) return 'duplicate';
  return 'conflict';
}

export function appliedEventStateFromEvent(event: SyncEvent): AppliedEventState {
  return {
    entityRevision: event.entityRevision,
    eventId: event.eventId,
    type: event.type,
    at: event.at,
  };
}

export async function readJsonFile<T>(filePath: string): Promise<T | undefined> {
  try {
    const raw = await readFile(filePath, 'utf8');
    return JSON.parse(raw) as T;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException | undefined)?.code;
    if (code === 'ENOENT') return undefined;
    throw error;
  }
}

export async function writeJsonFileAtomic(filePath: string, value: unknown): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tempPath, JSON.stringify(value, null, 2));
  await rename(tempPath, filePath);
}
