# ADR-0001: PWA with App-Shell-Only Precaching + Firestore Offline Persistence

## Status

Accepted — 2026-05-23. Amended 2026-08-22 (single-tab) and 2026-09-27 (Firestore persistence removed — see the amendments at the end).

## Context

Blitzed Out is a Vite 7 + React + TypeScript SPA deployed to GitHub Pages (custom domain
`blitzedout.com`). It has three game modes: `solo`, `local`, and `online`. Solo and local modes
require no Firebase connection during gameplay — all action data lives in Dexie/IndexedDB after
the one-time migration from bundled JSON files. Online mode requires Firebase for rooms, chat,
and player presence.

**Problem:** The app has no service worker. A user who visits `blitzedout.com` then goes offline
cannot reload the app at all — the browser fetches fresh JS/CSS on every load and gets nothing.
Solo and local modes are entirely unusable without an internet connection despite needing no
network data during play.

**Additional context from investigation:**

- Total action/locale bundle files: ~2MB source, ~55KB gzipped per language (lazy-loaded,
  one-time migration only). These are NOT the cause of any load performance issue.
- Sounds: 12MB in `public/sounds/`. Videos: 1.9MB in `public/videos/`. Too large to precache.
- Largest JS chunk: 537KB uncompressed (~159KB gzipped). All JS chunks fit within a reasonable
  precache size limit.
- Firebase Firestore is initialized with `getFirestore(app)` — no offline persistence. Sync
  operations go through Firestore but gameplay data lives in local IndexedDB, so Firestore
  offline persistence adds robustness without being critical to core functionality.

## Decision

### 1. Add `vite-plugin-pwa` (v1.3.0) with `generateSW` strategy

Precache all JS/CSS/HTML output from the build. Exclude sounds and videos by relying on the
glob pattern `**/*.{js,css,html,png,svg,ico,webmanifest}` combined with a
`maximumFileSizeToCacheInBytes` limit of 3MB. All current JS chunks are under 600KB so every
chunk gets cached. The 12MB sounds directory is never matched by the glob.

Use `registerType: 'prompt'` (plugin default) with no custom update UI. This means:

- New service worker installs silently in the background.
- It waits (standard SW lifecycle) until all clients (tabs/windows) of the old SW are closed.
- Once all old clients are gone, the new SW activates on the next navigation.
- No banner, no forced reload, no disruption to active game sessions.

### 2. Enable Firestore offline persistence via `persistentLocalCache` (superseded 2026-09-27)

Replace `getFirestore(app)` with `initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentSingleTabManager({ forceOwnership: false }) }) })`. Firestore reads are served from local cache when offline; writes queue and replay automatically on reconnection. This makes sync operations more resilient on flaky connections.

**Superseded 2026-09-27:** Firestore now uses the default in-memory cache (`initializeFirestore(app, { localCache: memoryLocalCache() })`). Both tab managers brick the client — see the two amendments below.

### 3. Keep existing `site.webmanifest` — configure plugin with `manifest: false`

The manifest already exists at `public/site.webmanifest` and `index.html` already has
`<link rel="manifest" href="/site.webmanifest" />`. The plugin is configured with
`manifest: false` to avoid duplicate injection and leave manifest management in one place.

The manifest must include installability fields (`start_url`, `scope`, `display`, and suitable
icons). If an icon is marked as `maskable`, verify it in browser DevTools before shipping; if the
asset was not designed with a maskable safe area, use separate `any` and `maskable` icon entries
instead of marking a normal icon as `any maskable`.

### 4. Add build-output verification for generated PWA assets

The service worker is generated during `npm run build`, so unit tests alone cannot prove that PWA
output exists or that the precache contents match this ADR. Add a post-build smoke check that
asserts:

- `dist/sw.js` exists.
- A generated `workbox-*.js` runtime chunk exists.
- `dist/index.html` contains the service-worker registration injection.
- Audio and video assets are not referenced by the generated service worker precache.

## Rejected Alternatives

### Precache everything including sounds/videos

Rejected. 12MB + 1.9MB would make the SW install payload ~14MB. Browser storage quotas on
mobile (often 50–100MB shared across all sites) make this risky. Audio degrading to network
fallback is an acceptable tradeoff for a ~14x reduction in cache size.

### `registerType: 'autoUpdate'` (skipWaiting + clientsClaim)

Rejected. Forces an immediate page reload when an update is detected. Users mid-game would
lose their session. The default lifecycle is safe and sufficient — typical sessions are under
one hour and users return to the site fresh.

### `injectManifest` strategy

Rejected. Would require writing a custom service worker file. `generateSW` handles all
required functionality (precaching + SPA navigation fallback) with zero custom SW code.

### `persistentSingleTabManager` instead of `persistentMultipleTabManager`

Originally rejected: users can have the app open in multiple tabs (one playing, one
configuring), and a single-tab manager does not share the cache across tabs, causing
redundant Firestore reads.

**Reversed 2026-08-22 — see "Amendment: multi-tab sync bricks the client" below.**

## Known Issues and Mitigations

**Historical (moot since 2026-09-27 — no `persistentLocalCache`).** **Firestore `persistentLocalCache` is ~20x slower than the deprecated `enableIndexedDbPersistence` API** (firebase-js-sdk issue #7347). Mitigation: Firestore is not the primary data store — Dexie/IndexedDB holds all gameplay data. Firestore is only used for sync operations, so the performance hit is for sync reads only, which happen in the background and are not on the critical path.

**Historical (moot since 2026-08-22 — no multi-tab).** **Secondary tab metadata bug** (firebase-js-sdk issue #8314): Secondary tabs do not correctly report `metadata.fromCache=false` when using `persistentMultipleTabManager`. Mitigation: the app does not use `metadata.fromCache` to drive UI logic, so this bug has no user-visible impact.

**Historical (pre-2026-08-22, while multi-tab was in use): `persistentMultipleTabManager` was the app's only unguarded `localStorage` dependency.** It brings in Firestore's `SharedClientState`, which coordinates tabs through `localStorage` and clears its keys from a `pagehide` handler. Firefox with storage blocked throws `NS_ERROR_FAILURE` there, inside the SDK, on a tab that is already closing — no app-side seam can catch it. Mitigation: suppressed in Sentry (see `docs/engineering/security.md` § Sentry). The single-tab move removes `SharedClientState` and with it this source; the Sentry pattern stays because Dexie's own cross-tab polling throws the same messageless nsresult.

**Maskable icon cropping risk:** Marking an existing square icon as `maskable` can produce poor
cropping on install surfaces if the artwork is too close to the edge. Mitigation: inspect the
manifest icons in Chrome DevTools and split normal and maskable icon entries if the current asset
does not meet maskable safe-area expectations.

## Consequences

**Positive:**

- Solo and local game modes work offline after first visit.
- App shell loads from cache instantly on repeat visits (no network round-trip).
- Firestore sync is resilient to flaky connections (within a page session since 2026-09-27).
- No user-visible complexity added.

**Negative:**

- Sound effects and video backgrounds require network on first play (same as before).
- Build output gains a `sw.js` and `workbox-*.js` file that must be served correctly.
- Build verification gains a small post-build smoke check for generated PWA assets.
- SW cache invalidation is handled automatically — Vite content-hashes all chunk filenames, so
  a new build produces new URLs which invalidate the old precache manifest. No manual versioning
  needed.
- Developers must be aware that `npm run dev` does not register the SW by default
  (`devOptions.enabled: false`). Test SW behavior against a production build with `vite preview`.

## Amendment: multi-tab sync bricks the client (2026-08-22)

`persistentMultipleTabManager()` is replaced by `persistentSingleTabManager({ forceOwnership: false })`.

**Why.** Multi-tab is the only thing that wires `syncEngineApplyActiveTargetsChange`, and that
function reads a target out of the local target cache and passes the result straight to
`localStoreAllocateTarget` with no guard. `localStoreGetCachedTarget` returns `null` on a cache
miss, `canonifyTargetOrPipeline(null)` then reads `null.isCorePipeline`, and the `TypeError`
escapes inside the async queue. Once the queue records a failure, every later `enqueue` rethrows
via `hardAssert` — `FIRESTORE INTERNAL ASSERTION FAILED: Unexpected state (ID: b815)` — so the
Firestore client is dead for the rest of the session: no chat, no board sync, no presence.

Seen in production on Android/Chrome (Sentry `JAVASCRIPT-REACT-31` / `JAVASCRIPT-REACT-34`,
2026-08-22). The `null` is manufactured inside the SDK, so no app-side seam can catch it, and
12.18.0 — the newest release — still ships the unguarded call site. Removing the tab manager
removes the code path; it is the only available lever.

**Cost, accepted.** A second tab's `IndexedDbPersistence.start()` rejects with
`FAILED_PRECONDITION` when it cannot take the primary lease. Firestore's
`canFallbackFromIndexedDbError` accepts that code, so the tab silently falls back to an in-memory
cache: it still works, it just re-reads from the server instead of sharing the first tab's cache.
`forceOwnership: false` keeps it that way — `true` would evict the tab that is actually playing.
Since Dexie, not Firestore, holds all gameplay data, the lost sharing is a background-read
optimization, and most sessions are a single mobile tab anyway.

**Superseded 2026-09-27** — single-tab bricks the client too; see the next amendment.

## Amendment: single-tab lease refresh bricks the client too (2026-09-27)

`persistentLocalCache` is removed. Firestore uses its default in-memory cache.

**Why.** The single-tab manager fails the same async queue from the other side. Tab A holds the
primary lease and goes to the background; Chrome throttles its timers, so it misses the lease
refresh (4 s interval, 5 s validity). Tab B opens — or the installed PWA opens beside a browser
tab — sees the stale lease and takes it with `allowTabSynchronization: false`. When A next runs
`updateClientMetadataAndTryBecomePrimary` (throttled timer or `visibilitychange`),
`canActAsPrimary` finds B's live lease and throws `FAILED_PRECONDITION` ("Failed to obtain
exclusive access to the persistence layer…"). With tab sync off, the refresh's catch rethrows it
inside the queue — the SDK comment calls this out: "If this fails during a lease refresh, we will
instead block the AsyncQueue". Every later enqueue (A's own `visibilitychange` and `pagehide`
handlers) then hits b815. Same result as the multi-tab bug: tab A is dead for the session.

Seen in production on Chrome/Windows (Sentry 7757678332 / 7757678526 / 7683393470, release
`59a41efeb`, 2026-09-27). The 2026-08-22 amendment only accounted for the second tab failing
`start()`, which the SDK does handle; it missed the first tab losing the lease on refresh.

**Options weighed.** `forceOwnership: true` makes the newest tab evict the older one, which is
the same brick aimed at the other tab. Multi-tab brings back the original b815. App-level tab
coordination (Web Locks) needs an async answer before `db` exists, but `db` is created
synchronously at module load, and top-level await is out under the `es2018` build target — a
large refactor for a cache this ADR already calls non-critical. Only a memory cache holds no
lease, so it removes the whole class of bug.

**Cost, accepted.** Firestore writes made while offline still queue and replay on reconnect, but
only for the life of the page — a reload drops them. Firestore reads are no longer served from
disk across reloads. Dexie holds all gameplay data, so Solo and Shared Device play are unaffected.
Old `firestore/[DEFAULT]/<projectId>/main` IndexedDB databases hold cached chat and user data
that nothing reads and the data wipe doesn't cover, so `app.ts` deletes them at startup with a raw
`indexedDB.deleteDatabase`. Not the SDK's `clearIndexedDbPersistence`: it runs on Firestore's async
queue with no `onblocked` handler, so an old-release tab holding the database open would stall
every Firestore call in the new one.

**Revisit when** firebase-js-sdk handles a lost lease during refresh without failing the queue
_and_ guards the multi-tab `localStoreGetCachedTarget` → `localStoreAllocateTarget` hand-off —
or when `db` initialization can become async and tabs can coordinate through Web Locks.
