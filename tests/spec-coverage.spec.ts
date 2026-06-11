import { describe, expect, test } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const OPENAPI_PATH = join(REPO_ROOT, '.public-api/v1/openapi.yml');
const HANDLES_DIR = join(REPO_ROOT, 'src/handles');
const PATH_REF_PREFIX = '  /';
const METHOD_KEYS = new Set(['get', 'post', 'put', 'patch', 'delete']);

function normalizePath(path: string): string {
  return path.replace(/\$\{[^}]+\}/g, '{}').replace(/\{[^}]+\}/g, '{}');
}

function readSpecOperations(): Set<string> {
  const openapi = readFileSync(OPENAPI_PATH, 'utf8');
  const operations = new Set<string>();
  const lines = openapi.split('\n');

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    if (!line.startsWith(PATH_REF_PREFIX)) {
      continue;
    }

    const pathMatch = line.match(/^\s{2}(\/[^:]+):\s*$/);
    if (!pathMatch) {
      continue;
    }

    const path = pathMatch[1];
    const refLine = lines[index + 1]?.trim();
    const refMatch = refLine?.match(/^\$ref:\s*['"]?(.+?)['"]?$/);
    if (!refMatch) {
      continue;
    }

    const ref = refMatch[1];
    const refPath = join(REPO_ROOT, '.public-api/v1', ref.replace(/^\.\//, ''));
    const refContent = readFileSync(refPath, 'utf8');

    for (const refLine of refContent.split('\n')) {
      const match = refLine.match(/^(get|post|put|patch|delete):\s*$/);
      if (!match) {
        continue;
      }

      operations.add(`${match[1].toUpperCase()} ${normalizePath(path)}`);
    }
  }

  return operations;
}

function readHandleOperations(): Set<string> {
  const operations = new Set<string>();

  for (const fileName of readdirSync(HANDLES_DIR)) {
    if (!fileName.endsWith('.ts')) {
      continue;
    }

    const source = readFileSync(join(HANDLES_DIR, fileName), 'utf8');

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
  test('handle operations cover the documented public API paths', () => {
    const specOperations = readSpecOperations();
    const handleOperations = readHandleOperations();

    const missing = [...specOperations].filter((operation) => !handleOperations.has(operation));
    const extra = [...handleOperations].filter((operation) => !specOperations.has(operation));

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
