import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    testTimeout: 30000,
    fileParallelism: false,
    exclude: ['node_modules/**', 'dist/**', 'build/**', 'tests/integration-*.spec.ts'],
  },
});
