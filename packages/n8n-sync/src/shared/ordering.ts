import { randomUUID } from 'node:crypto';
import { mkdir, open, readFile, rename } from 'node:fs/promises';
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

export type StateStoreStatusReason = 'not_initialized' | 'invalid_state' | 'unwritable' | 'storage_error';

export type StateStoreStatus =
  | { ready: true }
  | { ready: false; reason: StateStoreStatusReason; degradedSince?: string };

export interface StatefulStore {
  initialize(): Promise<void>;
  getStatus(): StateStoreStatus;
}

const SYNC_EVENT_TYPES = new Set<SyncEventType>([
  'credentials.upsert',
  'credentials.delete',
  'workflow.upsert',
  'workflow.activate',
  'workflow.delete',
  'workflow.archive',
  'execution.upsert',
]);

export function isSyncEventType(value: unknown): value is SyncEventType {
  return typeof value === 'string' && SYNC_EVENT_TYPES.has(value as SyncEventType);
}

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

export function isValidIsoTimestamp(value: unknown): value is string {
  if (typeof value !== 'string' || value.length === 0) return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed);
}

export function decodeOrderingTupleKey(key: string, length: 2): readonly [SyncEntityKind, string] | undefined;
export function decodeOrderingTupleKey(key: string, length: 3): readonly [string, SyncEntityKind, string] | undefined;
export function decodeOrderingTupleKey(key: string, length: 2 | 3): readonly string[] | undefined {
  let parsed: unknown;
  try {
    parsed = JSON.parse(key);
  } catch {
    return undefined;
  }

  if (!Array.isArray(parsed) || parsed.length !== length || !parsed.every((part) => typeof part === 'string')) {
    return undefined;
  }

  const kind = length === 2 ? parsed[0] : parsed[1];
  return kind === 'workflow' || kind === 'credential' || kind === 'execution' ? parsed : undefined;
}

export function encodeOrderingTupleKey(parts: readonly string[]): string {
  return JSON.stringify(parts);
}

export function getEntityOrderingKey(entity: { kind: SyncEntityKind; id: string }): string {
  return encodeOrderingTupleKey([entity.kind, entity.id]);
}

export function getSourceEntityOrderingKey(sourceId: string, entity: { kind: SyncEntityKind; id: string }): string {
  return encodeOrderingTupleKey([sourceId, entity.kind, entity.id]);
}

export function getSyncEventEntityRef(event: SyncEventLike): SyncEventEntityRef {
  switch (event.type) {
    case 'workflow.upsert':
    case 'workflow.activate':
      return {
        kind: 'workflow',
        id: event.workflow.id,
        key: getEntityOrderingKey({ kind: 'workflow', id: event.workflow.id }),
      };
    case 'workflow.delete':
    case 'workflow.archive':
      return {
        kind: 'workflow',
        id: event.workflowId,
        key: getEntityOrderingKey({ kind: 'workflow', id: event.workflowId }),
      };
    case 'credentials.upsert':
      return {
        kind: 'credential',
        id: event.credential.id,
        key: getEntityOrderingKey({ kind: 'credential', id: event.credential.id }),
      };
    case 'credentials.delete':
      return {
        kind: 'credential',
        id: event.credentialId,
        key: getEntityOrderingKey({ kind: 'credential', id: event.credentialId }),
      };
    case 'execution.upsert':
      return {
        kind: 'execution',
        id: event.execution.id,
        key: getEntityOrderingKey({ kind: 'execution', id: event.execution.id }),
      };
  }
}

export function getSourceEntityStateKey(event: SyncEvent): string {
  const entity = getSyncEventEntityRef(event);
  return getSourceEntityOrderingKey(event.sourceId, entity);
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
  // randomUUID guards against tmp-name collisions across container PID namespaces
  // sharing one RWX volume (pid + timestamp alone can repeat across namespaces).
  const tempPath = `${filePath}.${process.pid}.${Date.now()}.${randomUUID()}.tmp`;
  const handle = await open(tempPath, 'w');
  try {
    await handle.writeFile(JSON.stringify(value, null, 2));
    // Best-effort durability for NFS/Ceph-backed RWX volumes where rename
    // persistence across hard kills differs from local FS. This module is
    // dependency-free (no logger), so fsync failures are deliberately swallowed:
    // a filesystem without fsync support must never break state writes — the
    // existing staleness/quarantine logic covers the residual crash window.
    try {
      await handle.sync();
    } catch {
      // Swallowed deliberately (see above).
    }
  } finally {
    await handle.close();
  }
  await rename(tempPath, filePath);
  // Fsync the containing directory so the rename itself is durable. Best-effort
  // for the same reason as above: never fail the write when the FS rejects it.
  try {
    const dirHandle = await open(dirname(filePath), 'r');
    try {
      await dirHandle.sync();
    } catch {
      // Swallowed deliberately (see above).
    } finally {
      await dirHandle.close();
    }
  } catch {
    // Swallowed deliberately (see above).
  }
}
