import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const PUBLISH_DIR = 'dist';
const PACKAGE_JSON_KEYS = [
  'version',
  'description',
  'keywords',
  'files',
  'homepage',
  'bugs',
  'license',
  'author',
  'sideEffects',
  'repository',
  'dependencies',
  'peerDependencies',
  'publishConfig',
  'release',
  'engines',
  'main',
  'module',
  'types',
  'exports',
];

const isPlainObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);

const pick = (object, keys) =>
  Object.fromEntries(Object.entries(object).filter(([key]) => keys.includes(key)));

const parseJson = (dir) => {
  const content = readFileSync(dir, 'utf8');
  return JSON.parse(content);
};

const writeJson = (dir, object) => {
  writeFileSync(dir, `${JSON.stringify(object, null, 2)}\n`, 'utf8');
};

const rewritePublishPath = (value) => {
  if (typeof value !== 'string') return value;
  if (value === 'dist' || value === './dist') return './';
  if (value.startsWith('./dist/')) return `./${value.slice('./dist/'.length)}`;
  if (value.startsWith('dist/')) return `./${value.slice('dist/'.length)}`;

  return value;
};

const rewritePublishValue = (value) => {
  if (typeof value === 'string') return rewritePublishPath(value);
  if (Array.isArray(value)) return value.map(rewritePublishValue);
  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [key, rewritePublishValue(nestedValue)]),
    );
  }

  return value;
};

async function main() {
  const originalPackageJSON = 'package.json';
  const targetPackageJSON = `${PUBLISH_DIR}/package.json`;
  let packageData = parseJson(originalPackageJSON);
  if (!packageData.name) return;

  const names = [packageData.name];
  if (Array.isArray(packageData.additionalNames)) names.push(...packageData.additionalNames);

  execSync('pnpm bundle');

  packageData = pick(packageData, PACKAGE_JSON_KEYS);

  ['LICENSE', 'README.md', 'CHANGELOG.md'].forEach((file) => {
    const src = file;
    const dest = `${PUBLISH_DIR}/${file}`;

    try {
      execSync(`test -f "${src}" && cp "${src}" "${dest}"`, { stdio: 'inherit' });
    } catch (error) {
      // Ignore errors if the file does not exist
    }
  });

  for (const name of names) {
    const packageJSON = {
      ...packageData,
      name,
      files: ['**/*', '!**/*.map'],
      main: rewritePublishPath(packageData.main) || './index.cjs',
      module: rewritePublishPath(packageData.module) || './index.js',
      types: rewritePublishPath(packageData.types) || './index.d.ts',
      exports: (isPlainObject(packageData.exports) ? rewritePublishValue(packageData.exports) : undefined) || {
        '.': {
          require: './index.cjs',
          import: './index.js',
          types: './index.d.ts',
        },
      },
    };

    console.log(packageJSON);

    writeJson(targetPackageJSON, packageJSON);
    execSync(`cd ${PUBLISH_DIR} && npm publish --access public`);
  }
}

main().catch(console.error);
