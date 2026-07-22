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
  /**
   * Credential payload as exposed by n8n's hook runtime.
   *
   * Depending on the hook/version this can arrive either as the encrypted DB
   * blob or as the plain JSON object that n8n will encrypt on save.
   */
  data: string | Record<string, unknown>;
  isGlobal?: boolean;
  isManaged?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Minimal copy of the most relevant fields from n8n's `IRun`
 * (n8n-workflow) passed to the `workflow.postExecute` external hook. We only
 * rely on the scalar lifecycle columns here — the per-step `data` blob is
 * intentionally excluded to keep sync payloads small.
 */
export interface IRunPayload {
  /** @deprecated on n8n's side; mirrored for parity. Use `status` instead. */
  finished?: boolean;
  mode: string;
  status: string;
  startedAt: Date;
  stoppedAt?: Date;
  waitTill?: Date | null;
}

/** Minimal `IWorkflowBase`-shaped snapshot that the postExecute hook carries. */
export type WorkflowSnapshot = Pick<IWorkflowBase, 'id' | 'name' | 'nodes' | 'connections' | 'active' | 'isArchived'>;

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
  /**
   * Credential payload, passed through verbatim from n8n's hook runtime.
   * This may already be encrypted, or it may be the plain JSON object n8n
   * encrypts when persisting the row.
   */
  data: string | Record<string, unknown>;
  isGlobal?: boolean;
  isManaged?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * JSON-serializable execution summary. Mirrors the minimal column set of
 * n8n's `execution_entity` table (plus the source `workflowId`) needed to
 * upsert an execution row on a target instance. Large per-step run data is
 * deliberately not included.
 */
export interface SyncExecutionDto {
  id: string;
  workflowId: string | null;
  status: string;
  mode: string;
  /** @deprecated on n8n's side; mirrored for parity with `status`. */
  finished: boolean;
  startedAt?: string;
  stoppedAt?: string;
  createdAt?: string;
  retryOf?: string | null;
  retrySuccessId?: string | null;
  workflowVersionId?: string | null;
  /** ID of the workflow version this execution ran, defaulted from the snapshot. */
  workflowSnapshot?: Pick<SyncWorkflowDto, 'id' | 'name' | 'nodes' | 'connections'>;
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
  | (SyncEventBase & { type: 'workflow.archive'; workflowId: string; archived: boolean })
  | (SyncEventBase & { type: 'execution.upsert'; execution: SyncExecutionDto });

export type SyncEventType = SyncEvent['type'];
