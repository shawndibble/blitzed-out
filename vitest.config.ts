/// <reference types="vitest" />
import { defineConfig, mergeConfig } from 'vite';
import { configDefaults } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/setupTests.ts'],
      // Rules tests run under their own Node config + emulator, never here.
      exclude: [...configDefaults.exclude, 'tests/**'],
      css: true,
      reporters: [
        ['default', { summary: false }], // Replaces deprecated 'basic' reporter
      ],
      slowTestThreshold: 1000, // Flag tests over 1 second as slow
      testTimeout: 10000,
      hookTimeout: 10000,
      // Prevent memory leaks between test runs
      clearMocks: true,
      restoreMocks: true,
      resetMocks: true,
      coverage: {
        reporter: ['text', 'json', 'html'],
        exclude: [
          'node_modules/',
          'src/setupTests.ts',
          'src/__mocks__/',
          'src/test-utils.tsx',
          '**/*.d.ts',
          'dist/',
          'build/',
        ],
      },
      // Mock Firebase and other external services.
      // MUI 9.1's Transition.mjs imports react-transition-group via a legacy directory subpath
      // that native Node ESM can't resolve (ERR_UNSUPPORTED_DIR_IMPORT). Inline all @mui/*
      // packages so Vite transforms the importer and resolves the directory import itself.
      server: {
        deps: {
          inline: ['@testing-library/user-event', /@mui\//],
        },
      },
    },
  })
);
