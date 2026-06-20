/// <reference types="vitest" />
import { defineConfig } from 'vite';
import path from 'path';

// CI/local configuration optimized for speed while maintaining test isolation
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

    // MUI 9.1's Transition.mjs imports react-transition-group via a legacy directory subpath
    // that native Node ESM can't resolve (ERR_UNSUPPORTED_DIR_IMPORT). Inline all @mui/*
    // packages so Vite transforms the importer and resolves the directory import itself.
    server: {
      deps: {
        inline: [/@mui\//],
      },
    },

    // Reasonable timeouts
    testTimeout: 10000,
    hookTimeout: 10000,

    // Simple, fast execution with early bail
    reporter: 'dot',
    bail: 3,

    // Memory management
    clearMocks: true,
    restoreMocks: true,
    mockReset: true,
    css: false,

    // Use threads pool (faster than forks, fixed deprecated poolOptions)
    pool: 'threads',
    minWorkers: 1,
    maxWorkers: 2,

    // Keep isolation for CI safety
    isolate: true,
    fileParallelism: true,

    // Disable coverage
    coverage: {
      enabled: false,
    },

    // Deterministic test order
    sequence: {
      shuffle: false,
    },

    // Include all tests
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules/**', 'dist/**', 'build/**', 'functions/**'],
  },
});
