# CLAUDE.md

## Commands

- `npm start` — dev server (Vite). **DO NOT restart** during sessions. Assume running.
- `npm run build` — prod build (includes tsc)
- `npm run type-check` — tsc no-emit
- `npm run test:failures` — **USE THIS**: memory-safe, failing only, stops at 10
- `npm run test:ci` — all tests once (dot reporter, stops at 3 failures)
- `npm test` — Vitest watch mode
- `npm run lint` / `npm run format` — ESLint (whole project) / Prettier
- `npm run cleanup:debug` — fail on `console.*` (no-console rule)
- `npm run deploy` — GitHub Pages (→ master)

**Pre-commit quality**: `npm run type-check && npx eslint src/ && npm run test:failures`

## Branches

- All changes → `develop`. **NEVER commit to `master`.**
- `master` is deploy-only — managed by `npm run deploy` and its GitHub Action.

## Stack

React 19.x + TypeScript + Vite · MUI v9 (dark mode; avoid hardcoded light colors like `grey.50`) · Zustand (`src/stores/`) + Dexie (IndexedDB) + Firebase sync · i18next (en/es/fr/zh/hi/de)

**MUI v9 API notes**: layout props (`display`, `flexDirection`, etc.) go in `sx`. Use `slotProps={{ htmlInput }}` (TextField native input), `slotProps={{ input }}` (TextField MUI input / Switch), `slotProps={{ paper }}` (Dialog), `slotProps={{ list }}` (Menu), `slots={{ transition }}` (Snackbar). No `inputProps`, `InputProps`, `PaperProps`, `MenuListProps`, `BackdropProps`, `TransitionComponent`, or `componentsProps`.

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

**ALWAYS update all language files**: `src/locales/{en,es,fr,zh,hi,de}/translation.json`

Anatomy placeholders: `{genital}` (dick/pussy), `{hole}` (pussy/ass), `{chest}` (breasts/pecs)

Game content lives in `src/locales/{lang}/{local,online}/*.json` (per-group files, with `dom`/`sub` role labels). After editing these, run `node scripts/bundle-translations.js` to regenerate the `{local,online}-bundle.json` files the app actually loads.

Custom-tile placeholder tokens are stored canonical English; localized aliases (`src/locales/*/placeholders.json`) are normalized to English on save via `placeholderAliasService` and localized back on edit. The gameplay replacement pipeline (`actionStringReplacement`, `anatomyPlaceholderService`) never sees aliases.

## Coding Standards

- Remove unused vars/code entirely. No commenting out.
- Avoid adding comments for removed or replaced code.
- For production, disable logging; reserve console output for troubleshooting.
- Comments explain WHY not what. Let function/variable names document what.
