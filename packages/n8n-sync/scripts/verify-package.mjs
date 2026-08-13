import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const packageDir = resolve(scriptDir, '..');
const repoRoot = resolve(packageDir, '..', '..');
const tempDir = mkdtempSync(join(tmpdir(), 'n8n-sync-pack-verify-'));
const packedDir = join(tempDir, 'packed');
const distDir = resolve(packageDir, 'dist');
const npmExamplePath = resolve(packageDir, 'examples', 'Dockerfile.npm');
const cdnExamplePath = resolve(packageDir, 'examples', 'Dockerfile.cdn');

mkdirSync(packedDir, { recursive: true });

function cleanup() {
  rmSync(tempDir, { recursive: true, force: true });
}

process.on('exit', cleanup);
process.on('SIGINT', () => {
  cleanup();
  process.exit(130);
});

function run(command, args, cwd = packageDir) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    stdio: 'pipe',
  });

  if (result.status !== 0) {
    throw new Error(
      [
        `Command failed: ${command} ${args.join(' ')}`,
        result.stdout.trim(),
        result.stderr.trim(),
      ]
        .filter(Boolean)
        .join('\n\n'),
    );
  }

  return result.stdout;
}

function parseTrailingJsonArray(output) {
  const match = output.match(/(\[\s*\{[\s\S]*\}\s*\])\s*$/);

  assert.ok(match?.[1], 'Unable to locate npm pack JSON output');

  return JSON.parse(match[1]);
}

function normalizePackedEntries(entries) {
  return entries.map((entry) => entry.replace(/^[^/]+\//, ''));
}

function verifyTarballContents(tarballPath) {
  const entries = run('tar', ['-tzf', tarballPath]).trim().split('\n').filter(Boolean);
  const normalizedEntries = normalizePackedEntries(entries);
  const unexpectedEntries = normalizedEntries.filter((entry) => {
    if (entry === 'package.json' || entry === 'README.md' || entry === 'LICENSE') {
      return false;
    }

    if (!entry.startsWith('dist/')) {
      return true;
    }

    return !['publisher.cjs', 'subscriber.cjs', 'publisher.cjs.map', 'subscriber.cjs.map'].some(
      (expected) => entry === `dist/${expected}`,
    );
  });

  assert.deepEqual(unexpectedEntries, [], `Unexpected packed files:\n${unexpectedEntries.join('\n')}`);

  for (const expectedEntry of ['dist/publisher.cjs', 'dist/subscriber.cjs']) {
    assert.ok(normalizedEntries.includes(expectedEntry), `Missing packed artifact: ${expectedEntry}`);
  }

  for (const expectedMap of ['dist/publisher.cjs.map', 'dist/subscriber.cjs.map']) {
    assert.ok(normalizedEntries.includes(expectedMap), `Missing packed source map: ${expectedMap}`);
    const sourceMap = JSON.parse(run('tar', ['-xOf', tarballPath, `package/${expectedMap}`]));
    assert.ok(!('sourcesContent' in sourceMap), `${expectedMap} should omit sourcesContent to keep the tarball smaller`);
  }

  const packedManifest = JSON.parse(run('tar', ['-xOf', tarballPath, 'package/package.json']));
  const packedManifestJson = JSON.stringify(packedManifest);

  assert.ok(!packedManifestJson.includes('PLACEHOLDER'), 'Packed manifest still contains placeholder metadata');
  assert.equal(packedManifest.version, readFileSync(resolve(repoRoot, 'VERSION'), 'utf8').trim());
  assert.equal(packedManifest.license, 'Apache-2.0');
  assert.equal(packedManifest.author, 'Junmin Ahn');
  assert.deepEqual(packedManifest.files, ['dist', 'README.md', 'LICENSE']);
  assert.deepEqual(packedManifest.repository, {
    type: 'git',
    url: 'https://github.com/egose/n8n-toolkit.git',
    directory: 'packages/n8n-sync',
  });
  assert.deepEqual(packedManifest.exports, {
    './publisher': { require: './dist/publisher.cjs' },
    './subscriber': { require: './dist/subscriber.cjs' },
  });
}

function verifyExamplePaths() {
  const npmExample = readFileSync(npmExamplePath, 'utf8');
  const cdnExample = readFileSync(cdnExamplePath, 'utf8');

  assert.match(
    npmExample,
    /cp package\/dist\/publisher\.cjs package\/dist\/subscriber\.cjs \/bundles\//,
    'Dockerfile.npm must copy the packed dist bundle paths',
  );
  assert.match(
    cdnExample,
    /@\$\{N8N_SYNC_VERSION\}\/dist\/publisher\.cjs/,
    'Dockerfile.cdn must fetch the publisher bundle from /dist',
  );
  assert.match(
    cdnExample,
    /@\$\{N8N_SYNC_VERSION\}\/dist\/subscriber\.cjs/,
    'Dockerfile.cdn must fetch the subscriber bundle from /dist',
  );
}

function installAndVerifyConsumer(tarballPath) {
  const consumerDir = resolve(tempDir, 'consumer');

  mkdirSync(consumerDir, { recursive: true });
  writeFileSync(
    resolve(consumerDir, 'package.json'),
    `${JSON.stringify({ name: 'n8n-sync-consumer', private: true, type: 'commonjs' }, null, 2)}\n`,
  );
  writeFileSync(
    resolve(consumerDir, 'check.cjs'),
    [
      "const assert = require('node:assert/strict');",
      "const publisher = require('@egose/n8n-sync/publisher');",
      "const subscriber = require('@egose/n8n-sync/subscriber');",
      "assert.equal(typeof publisher, 'object');",
      "assert.equal(typeof subscriber, 'object');",
      "assert.equal(typeof publisher.workflow, 'object');",
      "assert.equal(typeof subscriber.n8n, 'object');",
    ].join('\n'),
  );

  run('npm', ['install', '--no-package-lock', tarballPath], consumerDir);
  run(process.execPath, ['check.cjs'], consumerDir);
}

rmSync(distDir, { recursive: true, force: true });
assert.ok(!existsSync(distDir), 'Expected dist/ to be absent before packing');

const packResult = parseTrailingJsonArray(run('npm', ['pack', '--json', '--pack-destination', packedDir]));
const tarballFileName = packResult[0]?.filename;

assert.ok(tarballFileName, 'npm pack did not return a tarball filename');

const tarballPath = resolve(packedDir, tarballFileName);

verifyTarballContents(tarballPath);
verifyExamplePaths();
installAndVerifyConsumer(tarballPath);
