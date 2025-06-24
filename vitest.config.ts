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
      testTimeout: 15000,
      hookTimeout: 15000,
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
