// Node's ambient types, for test files and build scripts only — `process`,
// `node:fs`/`node:path` imports, and `global`. `tsconfig.build.json` excludes this
// file, so the production program has no Node globals: browser code that reaches
// for one fails `npm run build` instead of failing at runtime in a user's tab.
// Before this existed the whole program picked Node types up by accident, through
// `@types/simple-peer`'s own reference directive.
/// <reference types="node" />
