# CLAUDE.md

## Branches

- All changes → `develop`. **NEVER commit to `master`.**
- `master` is deploy-only — managed by `npm run deploy` and its GitHub Action.

## Commands

- `npm start` — dev server (Vite). **DO NOT restart** during sessions. Assume running.
- `npm run test:failures` — **USE THIS for tests**: memory-safe, failing only, stops at 10
- `npm run test:ci` — all tests once (dot reporter, stops at 3 failures)
- `npm run type-check` — tsc no-emit
- `npm run build` — prod build (includes tsc)
- `npm run lint` / `npm run format` — ESLint (whole project) / Prettier
- `npm run cleanup:debug` — fail on `console.*` in production sources (tests, `scripts/`, configs exempt). `no-console` is an error in `eslint.config.js` too, so `npm run lint` catches it as well
- `npm run deploy` — GitHub Pages (→ master)

**Pre-commit check**: `npm run type-check && npx eslint src/ && npm run test:failures`

## Stack & Gotchas

React 19.x + TypeScript + Vite · MUI v9 · Zustand (`src/stores/`) + Dexie (IndexedDB) + Firebase sync · i18next (en/es/fr/zh/hi/de)

- **Dark mode**: never hardcode light colors (`grey.50`, `white`, …).
- **MUI v9 APIs**: layout props (`display`, `flexDirection`, …) go in `sx`. Use `slotProps={{ htmlInput }}` (TextField native input), `slotProps={{ input }}` (TextField MUI input / Switch), `slotProps={{ paper }}` (Dialog), `slotProps={{ list }}` (Menu), `slots={{ transition }}` (Snackbar). Never `inputProps`, `InputProps`, `PaperProps`, `MenuListProps`, `BackdropProps`, `TransitionComponent`, or `componentsProps`.

## i18n

- Adding/changing UI strings → update **all six** files: `src/locales/{en,es,fr,zh,hi,de}/translation.json`.
- Reading the current locale → `currentLocale()` from `src/services/locale.ts`; changing it → `changeLocale()`. That module is the single seam: it owns the `resolvedLanguage`-vs-`language` normalisation and updates the persisted `settings.locale` mirror, which is why every language switch must go through it.
- Adding a language → **three** places, or gates keyed on the wrong one silently exclude it: `i18n.ts`'s `supportedLngs`, `SUPPORTED_LANGUAGES` in `services/migration/constants.ts`, and `src/locales/languages.json`. `services/__tests__/locale.test.ts` holds the last two to the locale directories on disk.
- Editing game content (`src/locales/{lang}/{local,online}/*.json`) → run `node scripts/bundle-translations.js` after; the app loads the generated `{local,online}-bundle.json` files, not the per-group files.
- Anatomy placeholders: `{genital}` (dick/pussy), `{tip}` (tip/clit), `{hole}` (pussy/ass), `{chest}` (breasts/pecs). The token list lives once in `ANATOMY_PLACEHOLDERS` (`src/types/localPlayers.ts`) — every pattern and the `AnatomyPlaceholder` type derive from it, so a new token is that array plus a term in each `anatomy.json`.
- Touching custom-tile placeholders/aliases? Read `docs/engineering/features.md` § "Localized placeholder aliases" first — tokens are stored canonical English; the customTiles store normalizes at intake.

## Code Layout

- Components: own dir + `index.tsx`. Path alias: `@/*` → `src/*`.
- Types: `src/types/index.ts` (main), feature-specific files.
- Firebase: `src/services/firebase/` — one module per concern (`app` owns init + SDK handles, then `auth`, `chat`, `boards`, `schedule`, `customActions`). Import the concern; there is no barrel.
- Content readiness (seeding gate): `src/services/migration/contentReadiness.ts`.

## Testing

- Vitest + React Testing Library; mocks in `src/__mocks__/`. Write the test first (red → green → refactor).
- `@/services/migration/contentReadiness` is mocked globally in `setupTests.ts` (waitForContentReady resolved, phase `'ready'`) — no per-file migration mock needed.
- **Replace, don't layer**: when deepening a module, delete old shallow unit tests once boundary tests exist — tests assert observable behavior at the public interface.

## Architecture

- Adding a cross-boundary dependency (i18next singleton, localStorage, Firebase)? Use a port interface wired via seam or factory; tests pass literal implementations. See `docs/engineering/architecture.md` § "Ports & adapters" before wiring it another way.
- Service logic worth testing? Pure core fn + data bundle; impure wrapper (hook/factory) at the edge (same doc section).
- Components never import raw services — hooks own external deps and return stable resolvers (`useCallback`); `useSyncExternalStore` for non-provider external state.

## Coding Standards

- Remove unused code entirely — no commenting out, no comments about removed/replaced code.
- Comments explain WHY, not what. Let names document what.
- Log through `logger` (`@/utils/logger`), never `console.*` — it is the app's only console writer and is silent in production. Direct console calls are a lint error outside tests and build scripts. `logger` deliberately does **not** forward to Sentry: these calls pass the payload that failed (tiles, chat messages, display names), which is user-authored intimate content; crash reporting happens at the boundary instead.

## Engineering Docs

`docs/` is tracked in git — **keep it in sync when you change a subsystem**. Read before deep work; faster than re-deriving from source:

- `docs/engineering/README.md` — start here: capability Q&A + doc map.
- `docs/engineering/architecture.md` — stack, layers, stores, ports/adapters, build/deploy, PWA.
- `docs/engineering/features.md` — feature catalog with key files.
- `docs/engineering/data-and-sync.md` — Dexie schema, Firebase paths, sync, migration, import/export, offline, accounts.
- `docs/engineering/security.md` — auth, Firestore/RTDB/Storage rules, functions, secrets, validation.
- `CONTEXT.md` (repo root) — authoritative domain glossary (topology, room, game mode, anatomy, role, soloPlay).
- `docs/adr/` — Architecture Decision Records.

## MCP Servers

- **Context7** (`use context7` in prompt): current versioned docs for React/MUI/Firebase/Vite/Zustand.
- **Claude Context**: semantic codebase search (natural language queries).
