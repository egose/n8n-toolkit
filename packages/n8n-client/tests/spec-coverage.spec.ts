import { describe, expect, test } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

const REPO_ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const REVIEWED_DRIFT_PATH = join(REPO_ROOT, '.public-api/reviewed-drift.json');
const DIFF_PATH = join(REPO_ROOT, '.public-api/DIFF-v1.1.1.md');
const CLIENTS_DIR = join(REPO_ROOT, 'src/clients');
const METHOD_KEYS = ['get', 'post', 'put', 'patch', 'delete'] as const;

interface ReviewedDriftDocument {
  supportedSpecVersion: string;
  reviewedUpstreamOperationsMissingFromCheckedInSpec: string[];
}

interface OpenApiDocument {
  paths?: Record<string, OpenApiPathDocument>;
}

interface OpenApiPathDocument {
  get?: unknown;
  post?: unknown;
  put?: unknown;
  patch?: unknown;
  delete?: unknown;
}

function loadYaml<T>(filePath: string): T {
  return parseYaml(readFileSync(filePath, 'utf8')) as T;
}

function loadJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, 'utf8')) as T;
}

const REVIEWED_DRIFT = loadJson<ReviewedDriftDocument>(REVIEWED_DRIFT_PATH);
const OPENAPI_PATH = join(REPO_ROOT, `.public-api/v${REVIEWED_DRIFT.supportedSpecVersion}.yml`);

function normalizePath(path: string): string {
  return path.replace(/\$\{[^}]+\}/g, '{}').replace(/\{[^}]+\}/g, '{}');
}

function readSpecOperations(): Set<string> {
  const openapi = loadYaml<OpenApiDocument>(OPENAPI_PATH);
  const operations = new Set<string>();

  for (const [path, pathDoc] of Object.entries(openapi.paths ?? {})) {
    for (const method of METHOD_KEYS) {
      if (pathDoc[method] === undefined) {
        continue;
      }

      operations.add(`${method.toUpperCase()} ${normalizePath(path)}`);
    }
  }

  return operations;
}

function readClientOperations(): Set<string> {
  const operations = new Set<string>();

  for (const fileName of readdirSync(CLIENTS_DIR)) {
    if (!fileName.endsWith('.ts')) {
      continue;
    }

    const source = readFileSync(join(CLIENTS_DIR, fileName), 'utf8');

    const directCallRegex = /this\.http\.(get|post|put|patch|delete)(?:<[^\n]+?>)?\(\s*([`'"])(.*?)\2/gs;
    for (const match of source.matchAll(directCallRegex)) {
      const method = match[1].toUpperCase();
      const path = normalizePath(match[3]);
      operations.add(`${method} ${path}`);
    }

    const requestCallRegex = /this\.http\.request(?:<[^\n]+?>)?\(\s*\{([\s\S]*?)\}\s*\)/g;
    for (const match of source.matchAll(requestCallRegex)) {
      const body = match[1];
      const methodMatch = body.match(/method:\s*['"](GET|POST|PUT|PATCH|DELETE)['"]/i);
      const pathMatch = body.match(/path:\s*([`'"])(.*?)\1/s);
      if (!methodMatch || !pathMatch) {
        continue;
      }

      operations.add(`${methodMatch[1].toUpperCase()} ${normalizePath(pathMatch[2])}`);
    }
  }

  return operations;
}

function readDiffMissingSpecOperations(): Set<string> {
  const diff = readFileSync(DIFF_PATH, 'utf8');
  const sectionMatch = diff.match(/### 1\.1 Paths missing from the client spec([\s\S]*?)### 1\.2 GET \/tags/m);

  if (!sectionMatch) {
    throw new Error(`Could not find missing-spec section in ${DIFF_PATH}`);
  }

  const operations = new Set<string>();

  for (const line of sectionMatch[1].split('\n')) {
    const match = line.match(/^\|\s+([^|]+?)\s+\|\s+([^|]+?)\s+\|/);
    if (!match || match[1] === 'Missing path' || /^-+$/.test(match[1].replace(/\s+/g, ''))) {
      continue;
    }

    const path = match[1].trim().replace(/`/g, '');
    const methods = match[2]
      .split(',')
      .map((method) => method.trim())
      .filter(Boolean);

    for (const method of methods) {
      operations.add(`${method.toUpperCase()} ${path}`);
    }
  }

  return operations;
}

describe('Spec coverage', () => {
  test('client operations cover the documented public API paths', () => {
    const specOperations = readSpecOperations();
    const clientOperations = readClientOperations();

    const missing = [...specOperations].filter((operation) => !clientOperations.has(operation));
    const extra = [...clientOperations].filter((operation) => !specOperations.has(operation));

    expect(missing).toEqual([]);
    expect(extra).toEqual([]);
  });

  test('spec coverage test discovers documented operations', () => {
    const specOperations = readSpecOperations();

    const verbs = new Set([...specOperations].map((operation) => operation.split(' ')[0].toLowerCase()));

    expect(specOperations.size).toBeGreaterThan(0);
    expect([...verbs].sort()).toEqual([...METHOD_KEYS].sort());
  });

  test('reviewed upstream/spec drift stays synchronized with the allowlist', () => {
    const diffOperations = [...readDiffMissingSpecOperations()].sort();
    const allowlistedOperations = [...REVIEWED_DRIFT.reviewedUpstreamOperationsMissingFromCheckedInSpec].sort();
    const specOperations = readSpecOperations();

    expect(allowlistedOperations).toEqual(diffOperations);
    expect(allowlistedOperations.every((operation) => !specOperations.has(operation))).toBe(true);
  });
});
