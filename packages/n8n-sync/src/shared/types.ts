// ---------------------------------------------------------------------------
// Type definitions
//
// The n8n hook payloads (IWorkflowBase, ICredentialsDb) are local minimal
// copies of the shapes used by n8n's ExternalHooksMap
// (packages/cli/src/external-hooks.ts), so this package stays free of n8n
// dependencies while remaining structurally compatible with the entities n8n
// passes to external hooks at runtime.
// ---------------------------------------------------------------------------

import type { Express } from 'express';

// ---------------------------------------------------------------------------
// n8n hook payload types (local copies)
// ---------------------------------------------------------------------------

/** Minimal copy of `IWorkflowBase` from n8n-workflow. */
export interface IWorkflowBase {
  id: string;
  name: string;
  description?: string | null;
  active: boolean;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  nodes: unknown[];
  connections: unknown;
  settings?: unknown;
  staticData?: unknown;
  pinData?: unknown;
  versionId?: string;
  activeVersionId?: string | null;
  meta?: unknown;
}

/** Minimal copy of `ICredentialsDb` from @n8n/db. */
export interface ICredentialsDb {
  id: string;
  name: string;
  type: string;
  /** Credential payload encrypted with the instance's N8N_ENCRYPTION_KEY. */
  data: string;
  isGlobal?: boolean;
  isManaged?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/** Minimal shape of n8n's AbstractServer as passed to the `n8n.ready` hook. */
export interface N8nServer {
  app: Express;
}

/** Shape n8n's external-hook loader expects from a required hook file. */
export type HookHandler = (...args: never[]) => Promise<void>;

export interface IExternalHooksFileData {
  [resource: string]: {
    [operation: string]: HookHandler[];
  };
}

// ---------------------------------------------------------------------------
// Sync event envelope
// ---------------------------------------------------------------------------

/** JSON-serializable workflow payload sent from publisher to subscriber. */
export interface SyncWorkflowDto {
  id: string;
  name: string;
  description?: string | null;
  active: boolean;
  isArchived: boolean;
  nodes: unknown[];
  connections: unknown;
  settings?: unknown;
  staticData?: unknown;
  pinData?: unknown;
  meta?: unknown;
  versionId?: string;
  activeVersionId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

/** JSON-serializable credential payload (data stays encrypted at rest). */
export interface SyncCredentialDto {
  id: string;
  name: string;
  type: string;
  /** Encrypted credential payload, verbatim from the source instance. */
  data: string;
  isGlobal?: boolean;
  isManaged?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface SyncEventBase {
  /** ISO timestamp of when the publisher emitted the event. */
  at: string;
  /** Identifier of the publishing instance (SYNC_SOURCE_ID or hostname). */
  sourceId: string;
}

export type SyncEvent =
  | (SyncEventBase & { type: 'credentials.upsert'; credential: SyncCredentialDto })
  | (SyncEventBase & { type: 'credentials.delete'; credentialId: string })
  | (SyncEventBase & { type: 'workflow.upsert'; workflow: SyncWorkflowDto })
  | (SyncEventBase & { type: 'workflow.activate'; workflow: SyncWorkflowDto })
  | (SyncEventBase & { type: 'workflow.delete'; workflowId: string })
  | (SyncEventBase & { type: 'workflow.archive'; workflowId: string; archived: boolean });

export type SyncEventType = SyncEvent['type'];
