import { isDecimalString } from './ordering';
import type { ExecutionMode, ExecutionStatus, SyncEvent } from './types';

const ISO_UTC_DATE_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
export const MAX_ID_LENGTH = 512;
const MAX_NAME_LENGTH = 1024;
export const MAX_EVENT_ID_LENGTH = 1024;
const MAX_REVISION_LENGTH = 128;
const MAX_DESCRIPTION_LENGTH = 16_384;
const MAX_ARRAY_LENGTH = 1_000;
const MAX_OBJECT_KEYS = 1_000;
const MAX_NESTING_DEPTH = 32;
const MAX_JSON_NODES = 20_000;

const EXECUTION_STATUSES = new Set<ExecutionStatus>([
  'canceled',
  'crashed',
  'error',
  'new',
  'running',
  'success',
  'unknown',
  'waiting',
]);
const EXECUTION_MODES = new Set<ExecutionMode>([
  'chat',
  'cli',
  'error',
  'evaluation',
  'integrated',
  'internal',
  'manual',
  'retry',
  'trigger',
  'unknown',
  'webhook',
]);

interface JsonValidationState {
  seen: WeakSet<object>;
  nodes: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (!isRecord(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function hasOwn(value: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function hasOnlyKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const allowed = new Set(keys);
  return Object.keys(value).every((key) => allowed.has(key));
}

function isBoundedString(value: unknown, maxLength: number): value is string {
  return typeof value === 'string' && value.length > 0 && value.trim().length > 0 && value.length <= maxLength;
}

function isOptionalString(value: unknown, maxLength: number): value is string | null {
  return value === null || isBoundedString(value, maxLength);
}

function isValidIsoDateString(value: unknown): value is string {
  if (typeof value !== 'string' || !ISO_UTC_DATE_REGEX.test(value)) return false;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return false;
  const canonical = value.includes('.') ? value : value.replace('Z', '.000Z');
  return parsed.toISOString() === canonical;
}

function isBoundedDecimalString(value: unknown): value is string {
  return isDecimalString(value) && value.length > 0 && value.length <= MAX_REVISION_LENGTH;
}

function isExecutionStatus(value: unknown): value is ExecutionStatus {
  return typeof value === 'string' && EXECUTION_STATUSES.has(value as ExecutionStatus);
}

function isExecutionMode(value: unknown): value is ExecutionMode {
  return typeof value === 'string' && EXECUTION_MODES.has(value as ExecutionMode);
}

function isJsonValue(value: unknown, state: JsonValidationState, depth: number): boolean {
  if (value === null) return true;

  switch (typeof value) {
    case 'string':
    case 'boolean':
      return true;
    case 'number':
      return Number.isFinite(value);
    case 'object': {
      if (depth >= MAX_NESTING_DEPTH) return false;
      if (state.nodes >= MAX_JSON_NODES) return false;
      if (state.seen.has(value)) return false;
      state.seen.add(value);
      state.nodes += 1;

      if (Array.isArray(value)) {
        if (value.length > MAX_ARRAY_LENGTH) return false;
        for (const item of value) {
          if (!isJsonValue(item, state, depth + 1)) return false;
        }
        return true;
      }

      if (!isPlainRecord(value)) return false;

      const entries = Object.entries(value);
      if (entries.length > MAX_OBJECT_KEYS) return false;
      for (const [, child] of entries) {
        if (!isJsonValue(child, state, depth + 1)) return false;
      }
      return true;
    }
    default:
      return false;
  }
}

function isJsonArray(value: unknown): boolean {
  return Array.isArray(value) && isJsonValue(value, { seen: new WeakSet(), nodes: 0 }, 0);
}

function isJsonRecord(value: unknown): value is Record<string, unknown> {
  return isPlainRecord(value) && isJsonValue(value, { seen: new WeakSet(), nodes: 0 }, 0);
}

function isJsonRecordOrNull(value: unknown): value is Record<string, unknown> | null {
  return value === null || isJsonRecord(value);
}

function isSerializedJsonRecordOrNull(value: unknown): boolean {
  if (value === null || isJsonRecord(value)) return true;
  if (typeof value !== 'string') return false;

  try {
    return isJsonRecordOrNull(JSON.parse(value));
  } catch {
    return false;
  }
}

function isOptionalPropertyValid(
  value: Record<string, unknown>,
  key: string,
  validator: (candidate: unknown) => boolean,
): boolean {
  return !hasOwn(value, key) || validator(value[key]);
}

function isValidTag(value: unknown): boolean {
  return (
    isPlainRecord(value) &&
    hasOnlyKeys(value, ['id', 'name']) &&
    isBoundedString(value.id, MAX_ID_LENGTH) &&
    isBoundedString(value.name, MAX_NAME_LENGTH)
  );
}

function isValidWorkflowSnapshot(value: unknown): boolean {
  return (
    isPlainRecord(value) &&
    hasOnlyKeys(value, ['id', 'name', 'nodes', 'connections']) &&
    isBoundedString(value.id, MAX_ID_LENGTH) &&
    isBoundedString(value.name, MAX_NAME_LENGTH) &&
    isJsonArray(value.nodes) &&
    isJsonRecord(value.connections)
  );
}

/**
 * Validate an untrusted request payload as a SyncEvent.
 * Returns the typed event, or null when the payload is malformed.
 */
export function parseSyncEvent(payload: unknown): SyncEvent | null {
  return explainSyncEventFailure(payload) === null ? (payload as SyncEvent) : null;
}

/**
 * Explain why {@link parseSyncEvent} rejects a payload.
 * Returns null when the payload is a valid SyncEvent, otherwise a short
 * reason code naming the failing field/guard (never payload values, so it is
 * safe to log — no secrets, no large blobs).
 */
export function explainSyncEventFailure(payload: unknown): string | null {
  if (!isPlainRecord(payload)) return 'envelope.not_object';
  const jsonReason = jsonFailureReason(payload);
  if (jsonReason) return `envelope.invalid_json:${jsonReason}`;
  if (!isValidIsoDateString(payload.at)) return 'envelope.at';
  if (!isBoundedString(payload.sourceId, MAX_ID_LENGTH)) return 'envelope.sourceId';
  if (!isBoundedString(payload.eventId, MAX_EVENT_ID_LENGTH)) return 'envelope.eventId';
  if (!isBoundedDecimalString(payload.entityRevision)) return 'envelope.entityRevision';

  switch (payload.type) {
    case 'credentials.upsert': {
      const extra = extraKeys(payload, ['at', 'sourceId', 'eventId', 'entityRevision', 'type', 'credential']);
      if (extra) return `credentials.upsert.extra_keys:${extra}`;
      const reason = credentialDtoFailureReason(payload.credential);
      return reason ? `credentials.upsert.credential:${reason}` : null;
    }
    case 'credentials.delete': {
      const extra = extraKeys(payload, ['at', 'sourceId', 'eventId', 'entityRevision', 'type', 'credentialId']);
      if (extra) return `credentials.delete.extra_keys:${extra}`;
      if (!isBoundedString(payload.credentialId, MAX_ID_LENGTH)) return 'credentials.delete.credentialId';
      return null;
    }
    case 'workflow.upsert':
    case 'workflow.activate': {
      const prefix = payload.type as string;
      const extra = extraKeys(payload, ['at', 'sourceId', 'eventId', 'entityRevision', 'type', 'workflow']);
      if (extra) return `${prefix}.extra_keys:${extra}`;
      const reason = workflowDtoFailureReason(payload.workflow);
      return reason ? `${prefix}.workflow:${reason}` : null;
    }
    case 'workflow.delete': {
      const extra = extraKeys(payload, ['at', 'sourceId', 'eventId', 'entityRevision', 'type', 'workflowId']);
      if (extra) return `workflow.delete.extra_keys:${extra}`;
      if (!isBoundedString(payload.workflowId, MAX_ID_LENGTH)) return 'workflow.delete.workflowId';
      return null;
    }
    case 'workflow.archive': {
      const extra = extraKeys(payload, [
        'at',
        'sourceId',
        'eventId',
        'entityRevision',
        'type',
        'workflowId',
        'archived',
      ]);
      if (extra) return `workflow.archive.extra_keys:${extra}`;
      if (!isBoundedString(payload.workflowId, MAX_ID_LENGTH)) return 'workflow.archive.workflowId';
      if (typeof payload.archived !== 'boolean') return 'workflow.archive.archived';
      return null;
    }
    case 'execution.upsert': {
      const extra = extraKeys(payload, ['at', 'sourceId', 'eventId', 'entityRevision', 'type', 'execution']);
      if (extra) return `execution.upsert.extra_keys:${extra}`;
      const reason = executionDtoFailureReason(payload.execution);
      return reason ? `execution.upsert.execution:${reason}` : null;
    }
    default:
      return 'envelope.unknown_type';
  }
}

function extraKeys(value: Record<string, unknown>, allowed: readonly string[]): string | null {
  const allowedSet = new Set(allowed);
  const extra = Object.keys(value).find((key) => !allowedSet.has(key));
  return extra ?? null;
}

function jsonFailureReason(value: unknown): string | null {
  return jsonFailureReasonInto(value, { seen: new WeakSet(), nodes: 0 }, 0);
}

function jsonFailureReasonInto(value: unknown, state: JsonValidationState, depth: number): string | null {
  if (value === null) return null;

  switch (typeof value) {
    case 'string':
    case 'boolean':
      return null;
    case 'number':
      return Number.isFinite(value) ? null : 'non_finite_number';
    case 'object': {
      if (depth >= MAX_NESTING_DEPTH) return 'max_nesting_depth';
      if (state.nodes >= MAX_JSON_NODES) return 'max_json_nodes';
      if (state.seen.has(value)) return 'circular_reference';
      state.seen.add(value);
      state.nodes += 1;

      if (Array.isArray(value)) {
        if (value.length > MAX_ARRAY_LENGTH) return 'max_array_length';
        for (const item of value) {
          const reason = jsonFailureReasonInto(item, state, depth + 1);
          if (reason) return reason;
        }
        return null;
      }

      if (!isPlainRecord(value)) return 'non_plain_object';

      const entries = Object.entries(value);
      if (entries.length > MAX_OBJECT_KEYS) return 'max_object_keys';
      for (const [, child] of entries) {
        const reason = jsonFailureReasonInto(child, state, depth + 1);
        if (reason) return reason;
      }
      return null;
    }
    default:
      return 'non_json_type';
  }
}

function workflowDtoFailureReason(value: unknown): string | null {
  if (!isPlainRecord(value)) return 'not_object';
  const extra = extraKeys(value, [
    'id',
    'name',
    'description',
    'active',
    'isArchived',
    'nodes',
    'connections',
    'settings',
    'staticData',
    'pinData',
    'meta',
    'versionId',
    'activeVersionId',
    'tags',
    'createdAt',
    'updatedAt',
  ]);
  if (extra) return `extra_keys:${extra}`;
  if (!isBoundedString(value.id, MAX_ID_LENGTH)) return 'id';
  if (!isBoundedString(value.name, MAX_NAME_LENGTH)) return 'name';
  if (typeof value.active !== 'boolean') return 'active';
  if (typeof value.isArchived !== 'boolean') return 'isArchived';
  if (!Array.isArray(value.nodes)) return 'nodes_not_array';
  const nodesReason = jsonFailureReason(value.nodes);
  if (nodesReason) return `nodes:${nodesReason}`;
  if (!isPlainRecord(value.connections)) return 'connections_not_object';
  const connectionsReason = jsonFailureReason(value.connections);
  if (connectionsReason) return `connections:${connectionsReason}`;
  if (
    !isOptionalPropertyValid(value, 'description', (candidate) => isOptionalString(candidate, MAX_DESCRIPTION_LENGTH))
  )
    return 'description';
  if (!isOptionalPropertyValid(value, 'settings', isJsonRecord)) return 'settings';
  if (!isOptionalPropertyValid(value, 'staticData', isSerializedJsonRecordOrNull)) return 'staticData';
  if (!isOptionalPropertyValid(value, 'pinData', isJsonRecordOrNull)) return 'pinData';
  if (!isOptionalPropertyValid(value, 'meta', isJsonRecordOrNull)) return 'meta';
  if (!isOptionalPropertyValid(value, 'versionId', (candidate) => isBoundedString(candidate, MAX_ID_LENGTH)))
    return 'versionId';
  if (
    !isOptionalPropertyValid(
      value,
      'activeVersionId',
      (candidate) => candidate === null || isBoundedString(candidate, MAX_ID_LENGTH),
    )
  )
    return 'activeVersionId';
  if (
    !isOptionalPropertyValid(
      value,
      'tags',
      (candidate) => Array.isArray(candidate) && candidate.length <= MAX_ARRAY_LENGTH && candidate.every(isValidTag),
    )
  )
    return 'tags';
  if (!isOptionalPropertyValid(value, 'createdAt', isValidIsoDateString)) return 'createdAt';
  if (!isOptionalPropertyValid(value, 'updatedAt', isValidIsoDateString)) return 'updatedAt';
  return null;
}

function credentialDtoFailureReason(value: unknown): string | null {
  if (!isPlainRecord(value)) return 'not_object';
  const extra = extraKeys(value, ['id', 'name', 'type', 'data', 'isGlobal', 'isManaged', 'createdAt', 'updatedAt']);
  if (extra) return `extra_keys:${extra}`;
  if (!isBoundedString(value.id, MAX_ID_LENGTH)) return 'id';
  if (!isBoundedString(value.name, MAX_NAME_LENGTH)) return 'name';
  if (!isBoundedString(value.type, MAX_NAME_LENGTH)) return 'type';
  if (typeof value.data !== 'string' || value.data.length === 0) return 'data';
  if (!isOptionalPropertyValid(value, 'isGlobal', (candidate) => typeof candidate === 'boolean')) return 'isGlobal';
  if (!isOptionalPropertyValid(value, 'isManaged', (candidate) => typeof candidate === 'boolean')) return 'isManaged';
  if (!isOptionalPropertyValid(value, 'createdAt', isValidIsoDateString)) return 'createdAt';
  if (!isOptionalPropertyValid(value, 'updatedAt', isValidIsoDateString)) return 'updatedAt';
  return null;
}

function executionDtoFailureReason(value: unknown): string | null {
  if (!isPlainRecord(value)) return 'not_object';
  const extra = extraKeys(value, [
    'id',
    'workflowId',
    'status',
    'mode',
    'finished',
    'startedAt',
    'stoppedAt',
    'createdAt',
    'workflowSnapshot',
  ]);
  if (extra) return `extra_keys:${extra}`;
  if (!isBoundedString(value.id, MAX_ID_LENGTH)) return 'id';
  if (!isBoundedString(value.workflowId, MAX_ID_LENGTH)) return 'workflowId';
  if (!isExecutionStatus(value.status)) return 'status';
  if (!isExecutionMode(value.mode)) return 'mode';
  if (typeof value.finished !== 'boolean') return 'finished';
  if (!hasOwn(value, 'startedAt') && !hasOwn(value, 'stoppedAt') && !hasOwn(value, 'createdAt'))
    return 'missing_lifecycle_timestamp';
  if (!isOptionalPropertyValid(value, 'startedAt', isValidIsoDateString)) return 'startedAt';
  if (!isOptionalPropertyValid(value, 'stoppedAt', isValidIsoDateString)) return 'stoppedAt';
  if (!isOptionalPropertyValid(value, 'createdAt', isValidIsoDateString)) return 'createdAt';
  if (!isOptionalPropertyValid(value, 'workflowSnapshot', isValidWorkflowSnapshot)) return 'workflowSnapshot';
  return null;
}
