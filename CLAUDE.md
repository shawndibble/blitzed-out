# CLAUDE.md

## Commands

- `npm start` — dev server (Vite). **DO NOT restart** during sessions. Assume running.
- `npm run build` — prod build (includes tsc)
- `npm run type-check` — tsc no-emit
- `npm run test:failures` — **USE THIS**: memory-safe, failing only, stops at 10
- `npm run test:focused` — failing + detail (more memory)
- `npm run test:memory` — low-memory run
- `npm run test:run` — all tests once, exit
- `npm run lint` / `npm run format` — ESLint / Prettier
- `npm run cleanup:debug` — fail on console.log/debugger
- `npm run deploy` — GitHub Pages (→ master)

**Pre-commit quality**: `npm run type-check && npx eslint src/ && npm run test:failures`

## Stack

React 19.1.0 + TypeScript + Vite · MUI v7 (dark mode; avoid hardcoded light colors like `grey.50`) · Zustand (`src/stores/`) + Dexie (IndexedDB) + Firebase sync · i18next (en/es/fr/zh/hi)

## Patterns

- Components: own dir + `index.tsx`
- Types: `src/types/index.ts` (main), feature-specific files
- Firebase: `src/services/firebase.ts`
- Migration: `src/context/migration.tsx`
- Path alias: `@/*` → `src/*`

## Testing

Framework: Vitest + React Testing Library. Mocks in `src/__mocks__/`.

**MigrationProvider mock** (add when test errors with `useMigration must be used within MigrationProvider`):

```typescript
vi.mock('@/context/migration', () => ({
  useMigration: () => ({
    currentLanguageMigrated: true,
    isMigrationInProgress: false,
    isMigrationCompleted: true,
    error: null,
    triggerMigration: vi.fn(),
    ensureLanguageMigrated: vi.fn(),
  }),
}));
```

## MCP Servers

- **Context7** (`use context7` in prompt): current versioned docs for React/MUI/Firebase/Vite/Zustand
- **Claude Context**: semantic codebase search (natural language queries)

## TDD

Red → Green → Refactor. Write test first.

## i18n

**ALWAYS update all 5 language files**: `src/locales/{en,es,fr,zh,hi}/translation.json`

Anatomy placeholders: `{genital}` (dick/pussy), `{hole}` (pussy/ass), `{chest}` (breasts/pecs)

## Coding Standards

- Remove unused vars/code entirely. No commenting out.
- No comments on removed/replaced code.
- No logging in prod code. Console only for troubleshooting.
- Comments explain WHY not what. Let function/variable names document what.
