/// <reference types="vitest" />
import { defineConfig, mergeConfig } from 'vite';
import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/setupTests.ts'],
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
      mockReset: true,
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
      // Mock Firebase and other external services
      server: {
        deps: {
          inline: ['@testing-library/user-event'],
        },
      },
    },
  })
);
