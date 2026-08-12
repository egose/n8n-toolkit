import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const packageDir = resolve(scriptDir, '..');
const repoRoot = resolve(packageDir, '..', '..');
const fixturesDir = resolve(packageDir, 'tests', 'fixtures');
const tempDir = mkdtempSync(join(tmpdir(), 'n8n-client-pack-verify-'));
const packedDir = join(tempDir, 'packed');

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
    throw new Error([
      `Command failed: ${command} ${args.join(' ')}`,
      result.stdout.trim(),
      result.stderr.trim(),
    ].filter(Boolean).join('\n\n'));
  }

  return result.stdout;
}

function writeConsumerPackageJson(consumerDir, type) {
  writeFileSync(
    join(consumerDir, 'package.json'),
    `${JSON.stringify(
      {
        name: `n8n-client-${type}-consumer`,
        private: true,
        type,
      },
      null,
      2,
    )}\n`,
  );
}

function parseTrailingJsonArray(output) {
  const match = output.match(/(\[\s*\{[\s\S]*\}\s*\])\s*$/);

  assert.ok(match?.[1], 'Unable to locate npm pack JSON output');

  return JSON.parse(match[1]);
}

function verifyTarballContents(tarballPath) {
  const entries = run('tar', ['-tzf', tarballPath]).trim().split('\n').filter(Boolean);
  const normalizedEntries = entries.map((entry) => entry.replace(/^[^/]+\//, ''));
  const unexpectedEntries = normalizedEntries.filter((entry) => {
    if (entry === 'package.json' || entry === 'README.md' || entry === 'LICENSE') {
      return false;
    }

    if (!entry.startsWith('dist/')) {
      return true;
    }

    return ![
      '.js',
      '.cjs',
      '.js.map',
      '.cjs.map',
      '.d.ts',
      '.d.cts',
    ].some((suffix) => entry.endsWith(suffix));
  });

  assert.deepEqual(unexpectedEntries, [], `Unexpected packed files:\n${unexpectedEntries.join('\n')}`);

  for (const expectedEntry of [
    'dist/index.js',
    'dist/index.cjs',
    'dist/index.d.ts',
    'dist/index.d.cts',
    'dist/index.js.map',
    'dist/index.cjs.map',
  ]) {
    assert.ok(normalizedEntries.includes(expectedEntry), `Missing packed artifact: ${expectedEntry}`);
  }

  const packedManifest = JSON.parse(run('tar', ['-xOf', tarballPath, 'package/package.json']));
  const packedManifestJson = JSON.stringify(packedManifest);

  assert.ok(!packedManifestJson.includes('PLACEHOLDER'), 'Packed manifest still contains placeholder metadata');
  assert.equal(packedManifest.version, readFileSync(resolve(repoRoot, 'VERSION'), 'utf8').trim());
  assert.equal(packedManifest.license, 'Apache-2.0');
  assert.equal(packedManifest.author, 'Junmin Ahn');
  assert.deepEqual(packedManifest.files, ['dist', 'README.md', 'LICENSE']);
  assert.deepEqual(packedManifest.exports['.'].import, {
    types: './dist/index.d.ts',
    default: './dist/index.js',
  });
  assert.deepEqual(packedManifest.exports['.'].require, {
    types: './dist/index.d.cts',
    default: './dist/index.cjs',
  });
}

function installAndVerifyConsumer(consumerName, runtimeEntry) {
  const templateDir = resolve(fixturesDir, consumerName);
  const consumerDir = resolve(tempDir, consumerName);

  cpSync(templateDir, consumerDir, { recursive: true });
  writeConsumerPackageJson(consumerDir, consumerName === 'consumer-esm' ? 'module' : 'commonjs');

  run('npm', ['install', '--no-package-lock', resolve(packedDir, tarballFileName)], consumerDir);
  run(process.execPath, [runtimeEntry], consumerDir);
  run(process.execPath, [resolve(repoRoot, 'node_modules', 'typescript', 'bin', 'tsc'), '--noEmit', '-p', 'tsconfig.json'], consumerDir);
}

function runPackageAnalyzers() {
  run(process.execPath, [resolve(packageDir, 'node_modules', 'publint', 'src', 'cli.js'), 'run', '--strict', tarballPath]);
  run(process.execPath, [resolve(packageDir, 'node_modules', '@arethetypeswrong', 'cli', 'dist', 'index.js'), tarballPath, '--profile', 'strict']);
}

const packResult = parseTrailingJsonArray(run('npm', ['pack', '--json', '--pack-destination', packedDir]));
const tarballFileName = packResult[0]?.filename;

assert.ok(tarballFileName, 'npm pack did not return a tarball filename');

const tarballPath = resolve(packedDir, tarballFileName);

run('tar', ['-xzf', tarballPath, '-C', tempDir]);
verifyTarballContents(tarballPath);
runPackageAnalyzers();
installAndVerifyConsumer('consumer-esm', 'runtime.mjs');
installAndVerifyConsumer('consumer-cjs', 'runtime.cjs');
