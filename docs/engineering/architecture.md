# Architecture — Technical Summary

Companion to [README.md](README.md). This is the "how the system is built" view.

---

## Stack

| Layer              | Technology                                                                                                   |
| ------------------ | ------------------------------------------------------------------------------------------------------------ |
| UI                 | React 19, TypeScript, MUI v9 (dark mode), Emotion, framer-motion                                             |
| Build/dev          | Vite 8, `@vitejs/plugin-react-swc`, Terser, `vite-plugin-pwa`, `vite-plugin-compression2`                    |
| Client state       | Zustand 5 (`src/stores/`)                                                                                    |
| Local persistence  | Dexie 4 over IndexedDB (`src/stores/store.ts`) + `dexie-react-hooks`                                         |
| Cloud              | Firebase 12: Auth, Firestore, Realtime Database, Storage, Cloud Functions                                    |
| Realtime media     | `simple-peer` (WebRTC) signalled over Firebase RTDB                                                          |
| i18n               | i18next + `react-i18next`, lazy-loaded resources, 6 locales                                                  |
| Routing            | `react-router-dom` 7                                                                                         |
| Errors/telemetry   | Sentry (`@sentry/react`), custom analytics wrapper                                                           |
| Native shell hooks | Capacitor (`@capacitor/camera`, `@capacitor/core`), `@ionic/pwa-elements`                                    |
| Misc               | `qrcode.react` (room QR), `@3d-dice/dice-box-threejs` (3D dice), `use-sound`, `dayjs`, `nanoid`, `js-sha256` |

Deployed as a static SPA to GitHub Pages at `blitzedout.com`.

---

## Big picture

```
┌──────────────────────────────────────────────────────────────┐
│ React UI (views/, components/)                                 │
│  - Game board, setup wizard, dialogs, room, cast view          │
└───────────────┬───────────────────────────────┬───────────────┘
                │ reads/writes                   │ subscribes
        ┌───────▼────────┐              ┌────────▼─────────┐
        │ Zustand stores │              │  React context   │
        │ (src/stores/)  │              │ (auth, migration,│
        └───────┬────────┘              │  messages)       │
                │                       └────────┬─────────┘
   ┌────────────▼─────────────┐                  │
   │ Services (src/services/) │                  │
   │  buildGame, sync,        │                  │
   │  importExport, migration,│                  │
   │  presence, firebase, ... │                  │
   └──────┬──────────────┬────┘                  │
          │              │                        │
   ┌──────▼─────┐   ┌────▼──────────────────────▼──┐
   │ Dexie /    │   │ Firebase                       │
   │ IndexedDB  │   │  Auth · Firestore · RTDB ·     │
   │ (local,    │◀─▶│  Storage · Functions           │
   │  offline-  │sync│ (cloud, multi-device, rooms)   │
   │  first)    │   └────────────────────────────────┘
   └────────────┘
```

**Offline-first principle:** all _gameplay content_ (action tiles, groups, boards, settings) lives in Dexie/IndexedDB. Firebase is the **cloud backup + multiplayer transport**, not the gameplay datastore. A one-time per-language migration seeds Dexie from bundled JSON; from then on solo/local play needs no network. See [data-and-sync.md](data-and-sync.md).

---

## Source layout

```
src/
├── components/      Reusable UI (each: own dir + index.tsx)
├── views/           Route-level / dialog-level screens (Room, Cast, GameSettings,
│                    GameSettingsWizard, CustomTileDialog, CustomGroupDialog,
│                    ManageGameBoards, GameStatistics, Schedule, GameGuide, Navigation, ...)
├── stores/          Zustand stores + Dexie DB definition (store.ts)
├── services/        Business logic & I/O (Firebase, sync, buildGame, importExport,
│                    migration, presence, TTS, analytics, ...)
│   ├── ports/       Interfaces (dependency-inversion boundaries)
│   ├── adapters/    Concrete implementations of ports
│   ├── sync/        Per-entity cloud sync engine
│   ├── migration/   Bundled-JSON → Dexie migration
│   └── importExport/ Streaming/batched import & export
├── context/         React providers (auth, migration, messages) + hooks
├── hooks/           Reusable hooks (useTurnIndicator, useTTS, useFullscreenStatus, ...)
├── helpers/         Pure helpers (strings, messages, getPrivateRoomBackground, ...)
├── config/          App config
├── constants/       Constants
├── types/           TypeScript types (index.ts main + feature files)
├── locales/         i18n resources per language (en/es/fr/zh/hi/de):
│                    translation/errors/anatomy/placeholders JSON
├── images/, sounds/ Bundled assets
└── utils/           Utilities (e.g. gameSounds.ts)
```

Path alias: `@/*` → `src/*`.

---

## State management

Two persistence tiers:

1. **Zustand + `localStorage`** — small, non-sensitive UI/game settings and ephemeral runtime state.
2. **Dexie / IndexedDB** — large datasets (tiles, groups, boards, stats, local sessions).

### Zustand stores (`src/stores/`)

| Store                   | Responsibility                                                                                                                                            |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `settingsStore.ts`      | Game/app settings: gameMode, role, gender, room, selectedActions, finishRange, background, locale, theme, audio, haptics, etc. Persisted to localStorage. |
| `gameBoard.ts`          | Saved game boards in Dexie (CRUD, activate/deactivate).                                                                                                   |
| `customTiles.ts`        | Custom + default action tiles in Dexie (query, import, count, delete).                                                                                    |
| `customGroups.ts`       | Custom + default groups in Dexie (CRUD, cascade-delete protection).                                                                                       |
| `localPlayerStore.ts`   | Active Shared-Device session (players, current turn index).                                                                                               |
| `messagesStore.ts`      | Chat + action + settings messages (mirrors Firestore; dedupes; 24h TTL).                                                                                  |
| `userListStore.ts`      | Online users / presence in the current room.                                                                                                              |
| `videoCallStore.ts`     | WebRTC peer connections, local/remote streams, mute/camera toggles.                                                                                       |
| `diceAnimationStore.ts` | Debounce flag so dice-roll sound doesn't double-play.                                                                                                     |
| `scheduleStore.ts`      | Scheduled game sessions (batched updates, cached).                                                                                                        |
| `store.ts`              | Dexie database definition + sync middleware wiring (not a Zustand store).                                                                                 |

Full Dexie schema is documented in [data-and-sync.md](data-and-sync.md#local-database-dexieindexeddb).

---

## Ports & adapters (dependency inversion)

The codebase is mid-refactor toward a **ports & adapters** style to make core logic testable in isolation (see recent commits and `docs/adr/`). Pattern:

- **Ports** (`src/services/ports/`) define interfaces for I/O (e.g. data fetch).
- **Adapters** (`src/services/adapters/`) implement them against Dexie/Firebase.
- **Pure core functions** take already-fetched data and produce results with no I/O.

Concrete examples:

- **`buildGame.ts`** separates the Dexie fetch from a pure board transform — the board-building algorithm is a pure function over fetched tiles, so it's unit-testable without a database.
- **`gameSettingsOrchestrator.ts`** exposes a pure `planSubmit` that decides what to do on settings submit, with the side-effecting parts pushed to the edges.

When adding logic, prefer: **fetch at the edge → pure transform in the middle → write at the edge.** It keeps the testable surface large.

---

## Routing & key screens

- `/` — unauthenticated/landing or app shell depending on auth.
- `/:id` — a room (uppercased; `PUBLIC` or a 5-char private code). The main play surface.
- `/:id/cast` — the **Chromecast receiver view** (`src/views/Cast`): full-screen background + current action card + next-player indicator. Auto-logs in anonymously.

Routing config: `src/components/RouterSetup`.

---

## Build, bundle & deploy

- `npm start` — Vite dev server (assume already running; don't restart).
- `npm run build` — `tsc --project tsconfig.build.json && vite build` (type-check then bundle).
- `npm run type-check` — `tsc --noEmit`.
- **PWA:** `vite-plugin-pwa` (`generateSW`, `registerType: 'prompt'`). Precaches JS/CSS/HTML and small static assets via glob `**/*.{js,css,html,png,svg,ico,webmanifest}` with a 3 MB per-file cap. **Sounds (~12 MB) and videos (~1.9 MB) are deliberately not precached.** Manifest is managed in `public/site.webmanifest` (`manifest: false` in the plugin to avoid duplication). See [ADR-0001](../adr/0001-pwa-offline-support.md).
- **Compression:** `vite-plugin-compression2` produces precompressed assets.
- **Deploy:** `npm run deploy` runs `predeploy` (build) then `gh-pages -b master -d dist`. **`master` is deploy-only.** Day-to-day work lands on `develop`.
- **Source maps / telemetry:** `@sentry/vite-plugin` uploads source maps at build time (token via `.env.sentry-build-plugin`, git-ignored).

---

## Quality gates

- Pre-commit (Husky + lint-staged): ESLint `--fix` + Prettier on staged files.
- Suggested pre-push: `npm run type-check && npx eslint src/ && npm run test:failures`.
- `npm run cleanup:debug` fails on stray `console.log`/`debugger`.
- Tests: Vitest + React Testing Library; mocks in `src/__mocks__/`. Use `npm run test:failures` (memory-safe, bails at 10).

---

## Cloud Functions (`functions/`)

Node Firebase Functions, 7 exported. Mix of scheduled (Pub/Sub) cleanup jobs and RTDB triggers:

- Scheduled: stale-user cleanup (~5 min), inactive-anonymous-account cleanup (daily), video-call signaling cleanup (~5 min).
- Triggers: on user disconnect, presence validation (stamps `lastSeen`).
- Two **callable** admin helpers (`manualCleanupStaleUsers`, `manualCleanupAnonymousAccounts`) gated on an `admin` custom claim. Details and the security caveats in [security.md](security.md#cloud-functions).

(The Reddit slideshow does **not** use a function — the browser calls Reddit's OAuth API directly; see [features.md](features.md).)
