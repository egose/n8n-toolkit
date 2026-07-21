import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@egose/n8n-client': new URL('../n8n-client/dist/index.js', import.meta.url).pathname,
    },
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/integration-*.spec.ts'],
    exclude: ['node_modules/**', 'dist/**', 'build/**'],
    testTimeout: 120_000,
    hookTimeout: 120_000,
    fileParallelism: false,
  },
});
