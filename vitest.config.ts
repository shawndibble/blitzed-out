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
      reporters: ['verbose'],
      testTimeout: 10000,
      hookTimeout: 10000,
      // Add specific settings for CI environment
      pool: 'forks',
      poolOptions: {
        forks: {
          singleFork: process.env.CI === 'true',
        },
      },
      // Prevent tests from hanging by setting a maximum time
      bail: process.env.CI === 'true' ? 1 : 0,
      // Use less verbose output in CI
      ...(process.env.CI === 'true' && {
        reporters: ['basic'],
        outputFile: undefined,
      }),
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
