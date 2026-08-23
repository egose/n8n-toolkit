import { isDecimalString } from './ordering';
import type {
  ExecutionMode,
  ExecutionStatus,
  SyncCredentialDto,
  SyncExecutionDto,
  SyncEvent,
  SyncWorkflowDto,
} from './types';

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

function isValidWorkflowDto(value: unknown): value is SyncWorkflowDto {
  return (
    isPlainRecord(value) &&
    hasOnlyKeys(value, [
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
    ]) &&
    isBoundedString(value.id, MAX_ID_LENGTH) &&
    isBoundedString(value.name, MAX_NAME_LENGTH) &&
    typeof value.active === 'boolean' &&
    typeof value.isArchived === 'boolean' &&
    isJsonArray(value.nodes) &&
    isJsonRecord(value.connections) &&
    isOptionalPropertyValid(value, 'description', (candidate) => isOptionalString(candidate, MAX_DESCRIPTION_LENGTH)) &&
    isOptionalPropertyValid(value, 'settings', isJsonRecord) &&
    isOptionalPropertyValid(value, 'staticData', isSerializedJsonRecordOrNull) &&
    isOptionalPropertyValid(value, 'pinData', isJsonRecordOrNull) &&
    isOptionalPropertyValid(value, 'meta', isJsonRecordOrNull) &&
    isOptionalPropertyValid(value, 'versionId', (candidate) => isBoundedString(candidate, MAX_ID_LENGTH)) &&
    isOptionalPropertyValid(
      value,
      'activeVersionId',
      (candidate) => candidate === null || isBoundedString(candidate, MAX_ID_LENGTH),
    ) &&
    isOptionalPropertyValid(
      value,
      'tags',
      (candidate) => Array.isArray(candidate) && candidate.length <= MAX_ARRAY_LENGTH && candidate.every(isValidTag),
    ) &&
    isOptionalPropertyValid(value, 'createdAt', isValidIsoDateString) &&
    isOptionalPropertyValid(value, 'updatedAt', isValidIsoDateString)
  );
}

function isValidCredentialDto(value: unknown): value is SyncCredentialDto {
  return (
    isPlainRecord(value) &&
    hasOnlyKeys(value, ['id', 'name', 'type', 'data', 'isGlobal', 'isManaged', 'createdAt', 'updatedAt']) &&
    isBoundedString(value.id, MAX_ID_LENGTH) &&
    isBoundedString(value.name, MAX_NAME_LENGTH) &&
    isBoundedString(value.type, MAX_NAME_LENGTH) &&
    typeof value.data === 'string' &&
    value.data.length > 0 &&
    isOptionalPropertyValid(value, 'isGlobal', (candidate) => typeof candidate === 'boolean') &&
    isOptionalPropertyValid(value, 'isManaged', (candidate) => typeof candidate === 'boolean') &&
    isOptionalPropertyValid(value, 'createdAt', isValidIsoDateString) &&
    isOptionalPropertyValid(value, 'updatedAt', isValidIsoDateString)
  );
}

function isValidExecutionDto(value: unknown): value is SyncExecutionDto {
  if (!isPlainRecord(value)) return false;
  if (
    !hasOnlyKeys(value, [
      'id',
      'workflowId',
      'status',
      'mode',
      'finished',
      'startedAt',
      'stoppedAt',
      'createdAt',
      'workflowSnapshot',
    ])
  ) {
    return false;
  }
  const startedAt = value.startedAt;
  const stoppedAt = value.stoppedAt;
  const createdAt = value.createdAt;
  const hasLifecycleTimestamp = hasOwn(value, 'startedAt') || hasOwn(value, 'stoppedAt') || hasOwn(value, 'createdAt');

  return (
    isBoundedString(value.id, MAX_ID_LENGTH) &&
    isBoundedString(value.workflowId, MAX_ID_LENGTH) &&
    isExecutionStatus(value.status) &&
    isExecutionMode(value.mode) &&
    typeof value.finished === 'boolean' &&
    hasLifecycleTimestamp &&
    (!hasOwn(value, 'startedAt') || isValidIsoDateString(startedAt)) &&
    (!hasOwn(value, 'stoppedAt') || isValidIsoDateString(stoppedAt)) &&
    (!hasOwn(value, 'createdAt') || isValidIsoDateString(createdAt)) &&
    isOptionalPropertyValid(value, 'workflowSnapshot', isValidWorkflowSnapshot)
  );
}

/**
 * Validate an untrusted request payload as a SyncEvent.
 * Returns the typed event, or null when the payload is malformed.
 */
export function parseSyncEvent(payload: unknown): SyncEvent | null {
  if (!isPlainRecord(payload)) return null;
  if (!isJsonValue(payload, { seen: new WeakSet(), nodes: 0 }, 0)) return null;
  if (
    !isValidIsoDateString(payload.at) ||
    !isBoundedString(payload.sourceId, MAX_ID_LENGTH) ||
    !isBoundedString(payload.eventId, MAX_EVENT_ID_LENGTH) ||
    !isBoundedDecimalString(payload.entityRevision)
  ) {
    return null;
  }

  switch (payload.type) {
    case 'credentials.upsert':
      return hasOnlyKeys(payload, ['at', 'sourceId', 'eventId', 'entityRevision', 'type', 'credential']) &&
        isValidCredentialDto(payload.credential)
        ? (payload as unknown as SyncEvent)
        : null;
    case 'credentials.delete':
      return hasOnlyKeys(payload, ['at', 'sourceId', 'eventId', 'entityRevision', 'type', 'credentialId']) &&
        isBoundedString(payload.credentialId, MAX_ID_LENGTH)
        ? (payload as unknown as SyncEvent)
        : null;
    case 'workflow.upsert':
    case 'workflow.activate':
      return hasOnlyKeys(payload, ['at', 'sourceId', 'eventId', 'entityRevision', 'type', 'workflow']) &&
        isValidWorkflowDto(payload.workflow)
        ? (payload as unknown as SyncEvent)
        : null;
    case 'workflow.delete':
      return hasOnlyKeys(payload, ['at', 'sourceId', 'eventId', 'entityRevision', 'type', 'workflowId']) &&
        isBoundedString(payload.workflowId, MAX_ID_LENGTH)
        ? (payload as unknown as SyncEvent)
        : null;
    case 'workflow.archive':
      return hasOnlyKeys(payload, ['at', 'sourceId', 'eventId', 'entityRevision', 'type', 'workflowId', 'archived']) &&
        isBoundedString(payload.workflowId, MAX_ID_LENGTH) &&
        typeof payload.archived === 'boolean'
        ? (payload as unknown as SyncEvent)
        : null;
    case 'execution.upsert':
      return hasOnlyKeys(payload, ['at', 'sourceId', 'eventId', 'entityRevision', 'type', 'execution']) &&
        isValidExecutionDto(payload.execution)
        ? (payload as unknown as SyncEvent)
        : null;
    default:
      return null;
  }
}
