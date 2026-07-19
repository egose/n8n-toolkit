import type { Options } from 'tsup';

export const tsup: Options = {
  entry: ['src'],
  format: ['cjs', 'esm'],
  target: 'es2022',
  dts: true,
  splitting: true,
  sourcemap: true,
  clean: true,
  minify: false,
  external: [],
  esbuildPlugins: [],
};
