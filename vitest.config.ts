/// <reference types="vitest" />
import { defineConfig, mergeConfig } from 'vite';
import viteConfig from './vite.config';

// Determine if running in CI environment
const isCI = process.env.CI === 'true';

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
      // CI-specific settings for better performance and stability
      pool: 'forks',
      poolOptions: {
        forks: {
          singleFork: isCI,
        },
      },
      // Prevent tests from hanging by setting a maximum time
      bail: isCI ? 1 : 0,
      // Use less verbose output in CI
      ...(isCI && {
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
