export type SweepFailureClassification =
  | 'validation'
  | 'missing fixture/resource'
  | 'authorization'
  | 'feature/license state'
  | 'disconnected integration'
  | 'unknown';

export type SweepAuthProfile = 'owner' | 'restricted';

export interface SweepProbeDefinition {
  preconditions: string[];
}

export interface SweepFailureDefinition {
  classification: SweepFailureClassification;
  rationale: string;
}

export interface SweepPrivilegeProfile {
  name: SweepAuthProfile;
  authMode: 'apiKey';
  role: string;
  description: string;
  probeStrategy: 'all' | 'read-only';
  probeOps: string[];
}

export const RESTRICTED_SWEEP_OPS = [
  'discover.get',
  'workflows.list',
  'workflows.get',
  'workflows.getTags',
  'workflows.listTestRuns',
  'executions.list',
  'tags.list',
  'users.list',
  'variables.list',
  'projects.list',
  'dataTables.list',
  'communityPackages.list',
] as const;

export const PRIVILEGE_MATRIX: readonly SweepPrivilegeProfile[] = [
  {
    name: 'owner',
    authMode: 'apiKey',
    role: 'global owner API key',
    description: 'Full owner-scoped key used for setup, mutation, and singleton probes.',
    probeStrategy: 'all',
    probeOps: ['*'],
  },
  {
    name: 'restricted',
    authMode: 'apiKey',
    role: 'owner user with reduced API scopes',
    description: 'Read-biased key used to separate authorization failures from fixture or feature failures.',
    probeStrategy: 'read-only',
    probeOps: [...RESTRICTED_SWEEP_OPS],
  },
] as const;

export const SWEEP_PROBE_DEFINITIONS: Readonly<Record<string, SweepProbeDefinition>> = {
  'workflows.activate': {
    preconditions: ['A trigger-capable workflow fixture must exist and be activatable in the target n8n version.'],
  },
  'workflows.deactivate': {
    preconditions: ['A workflow fixture must exist before deactivation is attempted.'],
  },
  'workflows.archive': {
    preconditions: ['A workflow fixture must exist before archiving is attempted.'],
  },
  'workflows.unarchive': {
    preconditions: ['A workflow fixture must exist and have been archived before unarchive is attempted.'],
  },
  'workflows.getVersion': {
    preconditions: [
      'A workflow fixture must exist.',
      'A concrete observed workflow version id is required for a success-path probe.',
    ],
  },
  'workflows.listTestRuns': {
    preconditions: [
      'A workflow fixture must exist.',
      'Evaluations/test-runs must be enabled to observe non-empty responses.',
    ],
  },
  'executions.get': {
    preconditions: ['A real execution id from the current instance is required.'],
  },
  'executions.getTags': {
    preconditions: ['A real execution id from the current instance is required.'],
  },
  'executions.updateTags': {
    preconditions: [
      'A real execution id from the current instance is required.',
      'Execution tags must be enabled for the target deployment.',
    ],
  },
  'executions.retry': {
    preconditions: ['A retryable execution id from the current instance is required.'],
  },
  'executions.stop': {
    preconditions: ['A currently running execution id from the current instance is required.'],
  },
  'executions.delete': {
    preconditions: ['A deletable execution id from the current instance is required.'],
  },
  'credentials.test': {
    preconditions: [
      'A credential fixture must exist.',
      'The referenced integration or node type must be installed and connected.',
    ],
  },
  'credentials.transfer': {
    preconditions: [
      'A credential fixture must exist.',
      'A destination project id with credential-create access is required.',
    ],
  },
  'users.changeRole': {
    preconditions: ['A second user fixture is required to observe an authorized role-change success path.'],
  },
  'dataTables.deleteRows': {
    preconditions: [
      'A data table fixture must exist.',
      'Structured filters must be JSON-serialized into the query string.',
    ],
  },
  'dataTables.updateColumn': {
    preconditions: [
      'A data table fixture and column fixture must exist.',
      'Replacement column names must satisfy the server pattern.',
    ],
  },
  'sourceControl.pull': {
    preconditions: ['Source Control must be configured against a repository.'],
  },
  'securityPolicy.get': {
    preconditions: [
      'The personal-space policy route must be registered.',
      'The deployment must expose the feature for the current license and caller.',
    ],
  },
  'securityPolicy.update': {
    preconditions: [
      'The personal-space policy route must be registered.',
      'The deployment must expose the feature for the current license and caller.',
    ],
  },
  'n8nPackage.exportWorkflows': {
    preconditions: ['At least one workflow id, folder id, or project id must be supplied.'],
  },
};

export const SWEEP_FAILURE_CLASSIFICATIONS: Readonly<Record<string, SweepFailureDefinition>> = {
  'workflows.activate': {
    classification: 'validation',
    rationale:
      'The current sweep workflow uses a manual trigger fixture, so activation fails server-side validation rather than indicating a missing route.',
  },
  'workflows.getVersion': {
    classification: 'missing fixture/resource',
    rationale:
      'The sweep does not currently capture a concrete workflow version id before probing the version endpoint.',
  },
  'executions.get': {
    classification: 'missing fixture/resource',
    rationale:
      'The sweep probes execution detail with a placeholder id because it does not yet generate a real execution.',
  },
  'executions.getTags': {
    classification: 'missing fixture/resource',
    rationale:
      'The sweep probes execution tag reads with a placeholder id because it does not yet generate a real execution.',
  },
  'executions.updateTags': {
    classification: 'missing fixture/resource',
    rationale:
      'The sweep probes execution tag writes with a placeholder id because it does not yet generate a real execution.',
  },
  'executions.retry': {
    classification: 'missing fixture/resource',
    rationale:
      'Retry uses a placeholder execution id instead of a real retryable execution from the sweep environment.',
  },
  'executions.stop': {
    classification: 'missing fixture/resource',
    rationale: 'Stop uses a placeholder execution id instead of a running execution from the sweep environment.',
  },
  'executions.delete': {
    classification: 'missing fixture/resource',
    rationale: 'Delete uses a placeholder execution id instead of a deletable execution from the sweep environment.',
  },
  'credentials.test': {
    classification: 'disconnected integration',
    rationale:
      'Credential testing requires the referenced node or integration to be installed and resolvable in the target instance.',
  },
  'credentials.transfer': {
    classification: 'missing fixture/resource',
    rationale: 'The sweep uses a destination project id that is not provisioned as a transfer target.',
  },
  'users.changeRole': {
    classification: 'authorization',
    rationale: "The current probe tries to change the caller's own global role, which n8n forbids.",
  },
  'dataTables.deleteRows': {
    classification: 'validation',
    rationale:
      'The query filter was sent in a format the server rejected, so the failure is request serialization validation.',
  },
  'dataTables.updateColumn': {
    classification: 'validation',
    rationale:
      'The sweep uses a hyphenated replacement column name that violates the documented server-side naming pattern.',
  },
  'sourceControl.pull': {
    classification: 'disconnected integration',
    rationale: 'The endpoint is reachable, but the deployment is not connected to a Source Control repository.',
  },
  'securityPolicy.get': {
    classification: 'feature/license state',
    rationale:
      'A 404 on this optional endpoint remains ambiguous across version, route registration, licensing, and deployment feature state.',
  },
  'securityPolicy.update': {
    classification: 'feature/license state',
    rationale:
      'A 404 on this optional endpoint remains ambiguous across version, route registration, licensing, and deployment feature state.',
  },
  'n8nPackage.exportWorkflows': {
    classification: 'validation',
    rationale:
      'The sweep currently submits an empty export request body, which the server rejects because at least one export target is required.',
  },
};

const RESTRICTED_SCOPE_ALLOWLIST = new Set([
  'workflow:read',
  'workflow:list',
  'workflowTags:list',
  'execution:read',
  'execution:list',
  'executionTags:list',
  'testRun:read',
  'testRun:list',
  'credential:list',
  'tag:read',
  'tag:list',
  'user:read',
  'user:list',
  'variable:list',
  'project:list',
  'dataTable:read',
  'dataTable:list',
  'dataTableColumn:read',
  'folder:read',
  'folder:list',
  'insights:read',
]);

export function getSweepProbeDefinition(op: string): SweepProbeDefinition {
  return SWEEP_PROBE_DEFINITIONS[op] ?? { preconditions: [] };
}

export function getSweepFailureDefinition(op: string): SweepFailureDefinition {
  return (
    SWEEP_FAILURE_CLASSIFICATIONS[op] ?? {
      classification: 'unknown',
      rationale: 'This failing probe has not yet been classified.',
    }
  );
}

export function selectRestrictedScopes(allowedScopes: string[]): string[] {
  const selected = allowedScopes.filter((scope) => RESTRICTED_SCOPE_ALLOWLIST.has(scope));

  return [...new Set(selected)];
}
