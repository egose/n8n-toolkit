import type { SyncCredentialDto, SyncEvent, SyncWorkflowDto } from './types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isValidWorkflowDto(value: unknown): value is SyncWorkflowDto {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    Array.isArray(value.nodes) &&
    isRecord(value.connections)
  );
}

function isValidCredentialDto(value: unknown): value is SyncCredentialDto {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.type === 'string' &&
    typeof value.data === 'string'
  );
}

/**
 * Validate an untrusted request payload as a SyncEvent.
 * Returns the typed event, or null when the payload is malformed.
 */
export function parseSyncEvent(payload: unknown): SyncEvent | null {
  if (!isRecord(payload)) return null;
  if (typeof payload.at !== 'string' || typeof payload.sourceId !== 'string') return null;

  switch (payload.type) {
    case 'credentials.upsert':
      return isValidCredentialDto(payload.credential) ? (payload as unknown as SyncEvent) : null;
    case 'credentials.delete':
      return typeof payload.credentialId === 'string' ? (payload as unknown as SyncEvent) : null;
    case 'workflow.upsert':
    case 'workflow.activate':
      return isValidWorkflowDto(payload.workflow) ? (payload as unknown as SyncEvent) : null;
    case 'workflow.delete':
      return typeof payload.workflowId === 'string' ? (payload as unknown as SyncEvent) : null;
    case 'workflow.archive':
      return typeof payload.workflowId === 'string' && typeof payload.archived === 'boolean'
        ? (payload as unknown as SyncEvent)
        : null;
    default:
      return null;
  }
}
