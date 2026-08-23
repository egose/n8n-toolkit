import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const packageDir = resolve(scriptDir, '..');
const repoRoot = resolve(packageDir, '..', '..');
const packageJsonPath = resolve(packageDir, 'package.json');
const rootPackageJsonPath = resolve(repoRoot, 'package.json');
const versionPath = resolve(repoRoot, 'VERSION');

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

const manifest = readJson(packageJsonPath);
const rootManifest = readJson(rootPackageJsonPath);
const version = readFileSync(versionPath, 'utf8').trim();

assert.match(version, /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/, 'VERSION must contain a semver version');
assert.equal(rootManifest.license, 'Apache-2.0', 'Root package license must stay Apache-2.0');
assert.equal(rootManifest.author, 'Junmin Ahn', 'Root package author must stay Junmin Ahn');
assert.equal(
  rootManifest.repository?.url,
  'https://github.com/egose/n8n-toolkit.git',
  'Root package repository URL must stay canonical',
);

const materializedManifest = {
  ...manifest,
  version,
  license: rootManifest.license,
  author: rootManifest.author,
  repository: {
    type: 'git',
    url: rootManifest.repository.url,
    directory: 'packages/n8n-sync',
  },
};

writeFileSync(packageJsonPath, `${JSON.stringify(materializedManifest, null, 2)}\n`);
