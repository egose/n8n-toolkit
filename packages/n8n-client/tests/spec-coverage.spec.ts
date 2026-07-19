import { describe, expect, test } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const OPENAPI_PATH = join(REPO_ROOT, '.public-api/v1.1.1.json');
const CLIENTS_DIR = join(REPO_ROOT, 'src/clients');
const METHOD_KEYS = ['get', 'post', 'put', 'patch', 'delete'] as const;

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

function loadJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, 'utf8')) as T;
}

function normalizePath(path: string): string {
  return path.replace(/\$\{[^}]+\}/g, '{}').replace(/\{[^}]+\}/g, '{}');
}

function readSpecOperations(): Set<string> {
  const openapi = loadJson<OpenApiDocument>(OPENAPI_PATH);
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
});
