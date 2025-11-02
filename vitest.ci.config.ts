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

    // Aggressive timeouts for CI to prevent hanging
    testTimeout: 5000, // Reduced from 10000 to catch hanging tests faster
    hookTimeout: 5000, // Reduced from 10000

    // Simple, fast execution with early bail
    reporter: 'dot',
    bail: 3, // Allow a few failures but stop early

    // Focus on performance optimization rather than test exclusion

    // Aggressive memory and performance management
    clearMocks: true,
    restoreMocks: true,
    mockReset: true,
    isolate: true, // Enable isolation to prevent context sharing issues
    css: false, // Skip CSS processing for faster tests

    // Optimized concurrency for CI
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
        maxForks: 1, // Only one fork at a time
      },
    },
    fileParallelism: false, // Process files sequentially to reduce memory overhead
    maxConcurrency: 1, // Run tests one at a time to prevent memory issues

    // Reduce memory footprint
    coverage: {
      enabled: false, // Disable coverage in CI to save memory
    },

    // Ensure deterministic test execution order
    sequence: {
      shuffle: false, // Deterministic order for debugging and reproducible results
    },

    // Include all tests but run them efficiently
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],

    exclude: ['node_modules/**', 'dist/**', 'build/**', 'functions/**'],
  },
});
