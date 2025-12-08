/// <reference types="vitest" />
import { defineConfig } from 'vite';
import path from 'path';

// CI configuration optimized for GitHub Actions (2 cores available)
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],

    // Balanced timeouts for CI
    testTimeout: 10000,
    hookTimeout: 10000,

    // Simple, fast execution with early bail
    reporter: 'dot',
    bail: 3, // Stop after 3 failures to save time

    // Memory management without sacrificing too much speed
    clearMocks: true,
    restoreMocks: true,
    mockReset: true,
    css: false, // Skip CSS processing for faster tests

    // Use forks pool for proper isolation
    pool: 'forks',
    poolOptions: {
      forks: {
        maxForks: 2,
        minForks: 1,
      },
    },

    // Enable file parallelism for faster execution
    fileParallelism: true,
    maxConcurrency: 5,

    // Enable isolation to prevent mock bleed between tests
    isolate: true,

    // Disable coverage in CI to save time and memory
    coverage: {
      enabled: false,
    },

    // Deterministic test execution order
    sequence: {
      shuffle: false,
    },

    // Include all tests
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules/**', 'dist/**', 'build/**', 'functions/**'],
  },
});
