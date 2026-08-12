import { describe, expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';
import SecurityPolicyClient from '../src/clients/security-policy';
import WorkflowClient from '../src/clients/workflow';
import type {
  SecurityPolicy,
  TestCaseExecutionListResponse,
  TestRunListResponse,
  TestRunSummary,
  WorkflowDetail,
  WorkflowMutationResult,
} from '../src/types';
import { createMockHttpClient } from './test-utils';

const TESTS_DIR = fileURLToPath(new URL('.', import.meta.url));
const REPO_ROOT = resolve(TESTS_DIR, '..', '..', '..');
const FIXTURE_DIR = join(TESTS_DIR, 'fixtures', 'api-sweep');
const REVIEWED_DRIFT_PATH = join(REPO_ROOT, 'packages/n8n-client/.public-api/reviewed-drift.json');

interface ReviewedDriftDocument {
  supportedSpecVersion: string;
}

interface OpenApiDocument {
  paths?: Record<string, Record<string, unknown>>;
}

interface SweepClassificationDocument {
  entries: Record<string, { classification: string; rationale: string }>;
}

interface SweepPrivilegeMatrixDocument {
  profiles: Array<{
    name: string;
    authMode: string;
    role: string;
    probeStrategy: string;
    probeOps: string[];
  }>;
}

function readJsonFixture<T>(fileName: string): T {
  return JSON.parse(readFileSync(join(FIXTURE_DIR, fileName), 'utf8')) as T;
}

function readJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, 'utf8')) as T;
}

function normalizePath(path: string): string {
  return path.replace(/\{[^}]+\}/g, '{}');
}

function readSpecOperations(): Set<string> {
  const reviewedDrift = readJson<ReviewedDriftDocument>(REVIEWED_DRIFT_PATH);
  const openApiPath = join(REPO_ROOT, `packages/n8n-client/.public-api/v${reviewedDrift.supportedSpecVersion}.yml`);
  const document = parseYaml(readFileSync(openApiPath, 'utf8')) as OpenApiDocument;
  const operations = new Set<string>();

  for (const [path, pathDocument] of Object.entries(document.paths ?? {})) {
    for (const method of ['get', 'post', 'put', 'patch', 'delete']) {
      if (pathDocument[method] !== undefined) {
        operations.add(`${method.toUpperCase()} ${normalizePath(path)}`);
      }
    }
  }

  return operations;
}

describe('Observed API contract fixtures', () => {
  test('workflow detail fixture maps through GET /workflows/:id and remains publicly documented', async () => {
    const fixture = readJsonFixture<WorkflowDetail>('workflow-detail.json');
    const http = createMockHttpClient([{ body: fixture }]);
    const handle = new WorkflowClient(http);
    const specOperations = readSpecOperations();

    const result = await handle.get('wf_observed_redacted');

    expect(http.get).toHaveBeenCalledWith('/workflows/wf_observed_redacted', undefined);
    expect(specOperations.has('GET /workflows/{}')).toBe(true);
    expect(result).toEqual(fixture);
    expect(result.shared?.[0]?.project?.name).toBe('Owner User <redacted-email>');
  });

  test('workflow unarchive preserves request placement and compact mutation mapping', async () => {
    const fixture = readJsonFixture<WorkflowMutationResult>('workflow-mutation-unarchive.json');
    const http = createMockHttpClient([{ body: fixture }]);
    const handle = new WorkflowClient(http);
    const specOperations = readSpecOperations();

    const result = await handle.unarchive('wf_observed_redacted');

    expect(http.post).toHaveBeenCalledWith('/workflows/wf_observed_redacted/unarchive');
    expect(specOperations.has('POST /workflows/{}/unarchive')).toBe(true);
    expect(result).toEqual(fixture);
  });

  test('workflow test-run endpoints preserve query placement and map non-empty fixtures', async () => {
    const listFixture = readJsonFixture<TestRunListResponse>('workflow-test-runs.json');
    const detailFixture = readJsonFixture<TestRunSummary>('workflow-test-run.json');
    const testCasesFixture = readJsonFixture<TestCaseExecutionListResponse>('workflow-test-cases.json');
    const http = createMockHttpClient([{ body: listFixture }, { body: detailFixture }, { body: testCasesFixture }]);
    const handle = new WorkflowClient(http);
    const specOperations = readSpecOperations();

    const listed = await handle.listTestRuns('wf_observed_redacted', {
      status: 'completed',
      limit: 1,
      cursor: 'cursor_1',
    });
    const detail = await handle.getTestRun('wf_observed_redacted', 'testrun_observed_01');
    const cases = await handle.listTestCases('wf_observed_redacted', 'testrun_observed_01', {
      limit: 10,
      cursor: 'case_cursor_1',
    });

    expect(http.get).toHaveBeenNthCalledWith(1, '/workflows/wf_observed_redacted/test-runs', {
      status: 'completed',
      limit: 1,
      cursor: 'cursor_1',
    });
    expect(http.get).toHaveBeenNthCalledWith(2, '/workflows/wf_observed_redacted/test-runs/testrun_observed_01');
    expect(http.get).toHaveBeenNthCalledWith(
      3,
      '/workflows/wf_observed_redacted/test-runs/testrun_observed_01/test-cases',
      { limit: 10, cursor: 'case_cursor_1' },
    );
    expect(specOperations.has('GET /workflows/{}/test-runs')).toBe(true);
    expect(specOperations.has('GET /workflows/{}/test-runs/{}')).toBe(true);
    expect(specOperations.has('GET /workflows/{}/test-runs/{}/test-cases')).toBe(true);
    expect(listed.data).toHaveLength(1);
    expect(listed.nextCursor).toBe('testrun_cursor_02');
    expect(detail).toEqual(detailFixture);
    expect(cases.data[0]?.status).toBe('success');
    expect(cases.data[0]?.outputs).toEqual({ ok: true });
  });

  test('security-policy uses the observed full response shape and documented request placement', async () => {
    const fixture = readJsonFixture<SecurityPolicy>('security-policy.json');
    const http = createMockHttpClient([{ body: fixture }, { body: fixture }]);
    const handle = new SecurityPolicyClient(http);
    const specOperations = readSpecOperations();

    const current = await handle.get();
    const updated = await handle.update({
      personalSpacePublishing: fixture.personalSpacePublishing,
      personalSpaceSharing: fixture.personalSpaceSharing,
      redactionEnforcement: fixture.redactionEnforcement,
    });

    expect(http.get).toHaveBeenCalledWith('/settings/security-policy');
    expect(http.put).toHaveBeenCalledWith('/settings/security-policy', {
      personalSpacePublishing: true,
      personalSpaceSharing: false,
      redactionEnforcement: { floor: 'production' },
    });
    expect(specOperations.has('GET /settings/security-policy')).toBe(true);
    expect(specOperations.has('PUT /settings/security-policy')).toBe(true);
    expect(current).toEqual(fixture);
    expect(updated.sharedPersonalCredentialsCount).toBe(3);
  });
});

describe('Sweep artifacts', () => {
  test('every failed sweep probe in the committed sweep report has an explicit classification', () => {
    const report = readJson<{
      entries: Array<{ op: string; status: number | null }>;
    }>(join(REPO_ROOT, 'sandbox/api-sweep-results.json'));
    const classifications = readJson<SweepClassificationDocument>(
      join(REPO_ROOT, 'sandbox/api-sweep-failure-classification.json'),
    );
    const failedOps = report.entries
      .filter((entry) => entry.status === null || entry.status >= 400)
      .map((entry) => entry.op)
      .sort();
    const classifiedOps = failedOps.filter((op) => classifications.entries[op] !== undefined);

    expect(classifiedOps).toEqual(failedOps);
  });

  test('the privilege matrix includes the restricted read-only probe set', () => {
    const matrix = readJson<SweepPrivilegeMatrixDocument>(join(REPO_ROOT, 'sandbox/api-sweep-privilege-matrix.json'));
    const restricted = matrix.profiles.find((profile) => profile.name === 'restricted');

    expect(restricted).toBeDefined();
    expect(restricted?.probeStrategy).toBe('read-only');
    expect(restricted?.probeOps).toEqual([
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
    ]);
  });

  test('committed fixtures are redacted', () => {
    const fixtureContents = [
      'workflow-detail.json',
      'workflow-mutation-unarchive.json',
      'security-policy.json',
      'workflow-test-runs.json',
      'workflow-test-run.json',
      'workflow-test-cases.json',
    ].map((fileName) => readFileSync(join(FIXTURE_DIR, fileName), 'utf8'));

    for (const contents of fixtureContents) {
      expect(contents).not.toMatch(/localhost/i);
      expect(contents).not.toMatch(/https?:\/\//i);
      expect(contents).not.toMatch(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
      expect(contents).not.toMatch(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/);
    }
  });
});
