import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import ts from 'typescript';

const PACKAGE_ROOT = resolve(new URL('..', import.meta.url).pathname);
const README_PATH = join(PACKAGE_ROOT, 'README.md');
const TSCONFIG_PATH = join(PACKAGE_ROOT, 'tsconfig.json');

function extractTypeScriptBlocks(markdown) {
  const blocks = [];
  const lines = markdown.split(/\r?\n/);
  let inBlock = false;
  let blockStartLine = 0;
  let blockLines = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    if (!inBlock && /^```ts\s*$/.test(line)) {
      inBlock = true;
      blockStartLine = index + 2;
      blockLines = [];
      continue;
    }

    if (inBlock && /^```\s*$/.test(line)) {
      blocks.push({
        code: blockLines.join('\n'),
        startLine: blockStartLine,
      });
      inBlock = false;
      blockLines = [];
      continue;
    }

    if (inBlock) {
      blockLines.push(line);
    }
  }

  return blocks;
}

function escapesForRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function declaresIdentifier(code, identifier) {
  const name = escapesForRegExp(identifier);
  return (
    new RegExp(`\\b(?:const|let|var|function|class|interface|type|enum)\\s+${name}\\b`).test(code)
    || new RegExp(`\\bimport\\s+${name}\\b(?:\\s*,|\\s+from)`).test(code)
    || new RegExp(`\\bimport\\s+\\*\\s+as\\s+${name}\\b`).test(code)
    || new RegExp(`\\bimport\\s+type\\s+{[^}]*\\b${name}\\b[^}]*}\\s+from\\b`).test(code)
    || new RegExp(`\\bimport\\s+{[^}]*\\b${name}\\b[^}]*}\\s+from\\b`).test(code)
    || new RegExp(`\\bcatch\\s*\\(\\s*${name}\\b`).test(code)
    || new RegExp(`\\bfor\\s*\\(\\s*(?:const|let|var)?\\s*${name}\\b`).test(code)
  );
}

function referencesIdentifier(code, identifier) {
  return new RegExp(`\\b${escapesForRegExp(identifier)}\\b`).test(code);
}

function indent(code, spaces) {
  const prefix = ' '.repeat(spaces);
  return code
    .split('\n')
    .map((line) => (line.length > 0 ? `${prefix}${line}` : ''))
    .join('\n');
}

function buildExampleModule(code) {
  const imports = [];
  const bodyLines = [];

  for (const line of code.split('\n')) {
    if (/^\s*import\s.+;\s*$/.test(line)) {
      imports.push(line);
      continue;
    }

    bodyLines.push(line);
  }

  const bodyCode = bodyLines.join('\n');
  const setup = [];

  if (referencesIdentifier(bodyCode, 'N8nClient') && !declaresIdentifier(bodyCode, 'N8nClient')) {
    setup.push('  const N8nClient = __N8nClient;');
  }

  if (referencesIdentifier(bodyCode, 'HttpError') && !declaresIdentifier(bodyCode, 'HttpError')) {
    setup.push('  const HttpError = __HttpError;');
  }

  if (referencesIdentifier(bodyCode, 'client') && !declaresIdentifier(bodyCode, 'client')) {
    setup.push('  const client = __client;');
  }

  if (referencesIdentifier(bodyCode, 'project') && !declaresIdentifier(bodyCode, 'project')) {
    setup.push('  const project = __project;');
  }

  const body = bodyCode.trim().length > 0 ? indent(bodyCode, 2) : '';

  return [
    "import __N8nClient, { HttpError as __HttpError } from '@egose/n8n-client';",
    ...imports,
    '',
    'async function __readmeExample(',
    '  __client: __N8nClient,',
    "  __project: Awaited<ReturnType<ReturnType<__N8nClient['projects']>['getResource']>>,",
    ') {',
    ...setup,
    ...(setup.length > 0 && body ? [''] : []),
    ...(body ? [body] : []),
    '}',
    '',
    'export default __readmeExample;',
    '',
  ].join('\n');
}

function formatDiagnostics(diagnostics) {
  return ts.formatDiagnosticsWithColorAndContext(diagnostics, {
    getCanonicalFileName: (fileName) => fileName,
    getCurrentDirectory: () => PACKAGE_ROOT,
    getNewLine: () => '\n',
  });
}

const markdown = await readFile(README_PATH, 'utf8');
const blocks = extractTypeScriptBlocks(markdown);

if (blocks.length === 0) {
  throw new Error(`No TypeScript code blocks found in ${basename(README_PATH)}`);
}

const configFile = ts.readConfigFile(TSCONFIG_PATH, ts.sys.readFile);

if (configFile.error) {
  throw new Error(formatDiagnostics([configFile.error]));
}

const parsedConfig = ts.parseJsonConfigFileContent(configFile.config, ts.sys, PACKAGE_ROOT);
const tempDir = await mkdtemp(join(tmpdir(), 'n8n-client-readme-'));

try {
  const sourceFiles = [];

  for (const [index, block] of blocks.entries()) {
    const filePath = join(tempDir, `readme-example-${String(index + 1).padStart(2, '0')}.ts`);
    const banner = `// README.md lines ${block.startLine}-${block.startLine + block.code.split(/\r?\n/).length - 1}\n`;
    await writeFile(filePath, `${banner}${buildExampleModule(block.code)}`, 'utf8');
    sourceFiles.push(filePath);
  }

  const program = ts.createProgram({
    rootNames: sourceFiles,
    options: {
      ...parsedConfig.options,
      noEmit: true,
      declaration: false,
      declarationMap: false,
      sourceMap: false,
    },
  });

  const diagnostics = ts.getPreEmitDiagnostics(program);

  if (diagnostics.length > 0) {
    throw new Error(`README TypeScript examples failed to compile.\n\n${formatDiagnostics(diagnostics)}`);
  }

  console.log(`Compiled ${blocks.length} README TypeScript example blocks successfully.`);
} finally {
  await rm(tempDir, { recursive: true, force: true });
}
