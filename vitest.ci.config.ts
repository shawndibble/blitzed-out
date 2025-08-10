/// <reference types="vitest" />
import { defineConfig } from 'vite';
import path from 'path';

// CI configuration with proper path resolution
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

    // Aggressive timeouts to prevent hanging
    testTimeout: 5000,
    hookTimeout: 5000,

    // Simple, fast execution
    reporter: 'dot',
    bail: 3,

    // Standard exclusions only
    exclude: [
      'node_modules/**',
      'dist/**',
      'build/**',
      // Exclude functions folder tests (not part of our codebase)
      'functions/**',
    ],

    // Aggressive memory management
    clearMocks: true,
    restoreMocks: true,
    mockReset: true,
    isolate: false, // Disable isolation to reduce memory overhead

    // Minimal concurrency for memory conservation
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },

    // Reduce memory footprint
    coverage: {
      enabled: false, // Disable coverage in CI to save memory
    },

    // Ensure deterministic test execution order
    sequence: {
      shuffle: false, // Deterministic order for debugging and reproducible results
    },
  },
});
