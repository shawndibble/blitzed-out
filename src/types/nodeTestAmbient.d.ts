// Node's ambient types for test files and build scripts only — `process`,
// `node:fs`/`node:path`, `global`. `tsconfig.build.json` excludes this file, so the
// production program has no Node globals and browser code that reaches for one
// fails `npm run build` rather than a user's tab.
/// <reference types="node" />
