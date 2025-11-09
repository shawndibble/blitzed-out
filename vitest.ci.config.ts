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

    // Use threads pool for better performance (faster than forks)
    pool: 'threads',
    poolOptions: {
      threads: {
        // Conservative thread count for CI (GitHub Actions has 2 cores)
        minThreads: 1,
        maxThreads: 2,
        // Increase teardown timeout to prevent worker timeout issues
        teardownTimeout: 30000,
      },
    },

    // Enable file parallelism for faster execution
    fileParallelism: true,

    // Keep isolation enabled to prevent test contamination
    // Disabling can cause timeout issues if tests share state
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
