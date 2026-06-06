/// <reference types="vitest" />
import { defineConfig } from 'vite';
import path from 'path';

// Firestore security-rules tests. These run against the Firestore emulator
// (via `firebase emulators:exec`) in a Node environment — NOT jsdom — and must
// NOT load the global Firebase mock in src/setupTests.ts, which would shadow the
// real @firebase/rules-unit-testing client.
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.rules.test.ts'],
    testTimeout: 20000,
    hookTimeout: 30000,
  },
});
