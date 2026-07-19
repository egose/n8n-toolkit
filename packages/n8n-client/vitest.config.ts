import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    testTimeout: 30000,
    fileParallelism: false,
    exclude: ['.public-api/**', 'node_modules/**', 'dist/**', 'build/**'],
  },
});
