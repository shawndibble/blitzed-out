/// <reference types="vitest" />
import rulesConfig from './vitest.rules.config';

// Realtime Database security-rules tests, reusing the Firestore rules config's Node
// environment and alias setup.
//
// `include` is replaced, not merged: `mergeConfig` concatenates arrays, which would
// make this run collect the Firestore suite too. The globs are deliberately distinct
// (`*.rules.spec.ts` vs `*.rules.test.ts`) because the suites need different
// emulators, so a shared pattern means talking to one that is not running.
export default {
  ...rulesConfig,
  test: {
    ...rulesConfig.test,
    include: ['tests/**/*.rules.spec.ts'],
  },
};
