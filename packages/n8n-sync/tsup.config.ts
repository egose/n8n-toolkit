import type { Options } from 'tsup';

export const tsup: Options = {
  entry: {
    publisher: 'src/publisher/index.ts',
    subscriber: 'src/subscriber/index.ts',
  },
  format: ['cjs'],
  target: 'es2022',
  dts: false,
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: false,
  external: [],
  esbuildPlugins: [],
};
