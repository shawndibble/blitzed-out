/// <reference types="vitest" />
import { defineConfig } from 'vite';
import path from 'path';

// Realtime Database security-rules tests. These run against the RTDB emulator
// (via `firebase emulators:exec --only database`) in a Node environment — NOT
// jsdom — and must NOT load the global Firebase mock in src/setupTests.ts, which
// would shadow the real @firebase/rules-unit-testing client.
//
// The include pattern is `*.rules.spec.ts`, deliberately distinct from the
// Firestore config's `*.rules.test.ts`: the two suites need different emulators,
// so a shared glob would make each run try to talk to an emulator that is not
// running.
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
    include: ['tests/**/*.rules.spec.ts'],
    testTimeout: 20000,
    hookTimeout: 30000,
  },
});
