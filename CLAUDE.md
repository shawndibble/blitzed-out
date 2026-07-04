# CLAUDE.md

## Engineering Docs

Read these before deep work — they answer "what does the app do / how does it work" faster than re-deriving from source:

- `docs/engineering/README.md` — start here: highlights + capability Q&A (video, custom media, customization, import/export, offline, party sharing, Chromecast/AirPlay/Roku/Fire) + doc map.
- `docs/engineering/architecture.md` — stack, layers, stores, ports/adapters, build/deploy, PWA.
- `docs/engineering/features.md` — full feature catalog with key files.
- `docs/engineering/data-and-sync.md` — Dexie schema, Firebase paths, sync, migration, import/export, offline, accounts.
- `docs/engineering/security.md` — auth, Firestore/RTDB/Storage rules, functions, secrets, validation, privacy, weaknesses.
- `CONTEXT.md` (repo root) — authoritative domain glossary (topology, room, game mode, anatomy, role, soloPlay).
- `docs/adr/` — Architecture Decision Records.

Keep these in sync when you change a subsystem. `docs/` is tracked in git.

**`.understand-anything/knowledge-graph.json`** — generated codebase knowledge graph (query via `understand-chat`/`understand-explain` skills). ⚠️ Point-in-time snapshot (commit `3f688ee`); navigation aid only — verify load-bearing facts against live source.

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

Custom-tile placeholder tokens are stored canonical English; localized aliases (`src/locales/*/placeholders.json`) are normalized to English via `placeholderAliasService` and localized back on edit. The customTiles store enforces this at intake (`addCustomTile`/`updateCustomTile` normalize idempotently), so every write path inherits the invariant; dialogs additionally normalize early for validation/dedup. The gameplay replacement pipeline (`actionStringReplacement`, `anatomyPlaceholderService`) never sees aliases.

## Architecture Patterns

**Ports & Adapters** — for cross-boundary dependencies (i18next singleton, localStorage, Firebase):

- Define a port interface (e.g., `MigrationPort`, `AnatomyLexicon`)
- Wire via module-level seam (`setMigrationPort`) or factory (`buildLexicon(i18n, locale)`)
- Tests pass in-memory/literal implementations — no mocking needed

**Pure function + data bundle** — for testable service cores:

- Extract `pureCoreFn(input, context, data)` from impure orchestration; zero external imports
- Impure wrapper (hook or factory) builds the data bundle and calls the pure fn
- Test the pure fn with literal fixture objects; no i18next, no Dexie, no React

**Hook-as-DI** — React hooks own external dependencies:

- Hook fetches deps (`useTranslation`, store selectors), builds context, returns a stable resolver via `useCallback`
- Callers use the hook; raw services are not imported by components
- `useSyncExternalStore` for non-provider external state (no `Context.Provider` wrapper needed)

**Replace, don't layer** — when deepening a module:

- Delete old shallow unit tests once boundary tests exist; don't keep both
- Old tests on internals are waste — new tests assert observable behavior at the public interface

## Coding Standards

- Remove unused vars/code entirely. No commenting out.
- Avoid adding comments for removed or replaced code.
- For production, disable logging; reserve console output for troubleshooting.
- Comments explain WHY not what. Let function/variable names document what.
