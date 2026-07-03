# Data, Sync, Offline & Accounts

Companion to [README.md](README.md). How data is stored locally, how it syncs to the cloud, what works offline, and how accounts/import-export behave.

---

## Local database (Dexie / IndexedDB)

Defined in `src/stores/store.ts` (database name `blitzedOut`). This is the **primary gameplay datastore** — Firebase is backup/transport, not the source of truth for content.

Tables (with notable indexes):

| Table                 | Stores                                                                       | Key indexes                                                                                                         |
| --------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `customTiles`         | custom + default action tiles (disabled state lives in `disabledDefaults`)   | `++id`, `group_id`, `[group_id+intensity+action]`, `intensity`, `action`, `isEnabled`, `tags`, `isCustom`, `packId` |
| `customGroups`        | custom + default groups                                                      | `++id`, `name`, `label`, `locale`, `gameMode`, `isDefault`, `createdAt`, `[name+locale+gameMode]`, `packId`         |
| `disabledDefaults`    | first-class disabled-default records (per content tuple, `active` tombstone) | `&key` (`group_id\|intensity\|action`), `group_id`, `intensity`, `action`, `updatedAt`                              |
| `gameBoard`           | saved board configs                                                          | `++id`, `title`, `tiles`, `tags`, `gameMode`, `isActive`                                                            |
| `localPlayerSessions` | Shared-Device / local session metadata                                       | `++id`, `sessionId`, `roomId`, `isActive`, `createdAt`, `updatedAt`                                                 |
| `localPlayerMoves`    | per-move log (stats mode)                                                    | `++id`, `sessionId`, `playerId`, `timestamp`, `sequence`                                                            |
| `localPlayerStats`    | per-session player stats                                                     | `++id`, `sessionId`, `playerId`, `lastActive`                                                                       |
| `globalPlayerStats`   | aggregated cross-session stats                                               | `++id`, `ownerId`, `lastActive`                                                                                     |

The compound indexes (`[group_id+intensity+action]`, `[name+locale+gameMode]`) power fast duplicate detection during import and sync.

A **sync middleware** (`src/services/syncMiddleware.ts`) wraps Dexie writes: after put/add/delete/update it debounces ~2 s and calls `requestSync()` (only when an authenticated, non-anonymous user is present).

---

## Firebase products & paths

Initialized in `src/services/firebase.ts`.

- **Auth** — anonymous, email/password, and Google. Anonymous accounts can be upgraded in place (`linkWithCredential`) keeping the same UID.
- **Firestore** — with **offline persistence** (`persistentLocalCache` + `persistentMultipleTabManager`), falling back to in-memory cache if IndexedDB is unavailable (e.g. private browsing). Collections:
  - `user-data/{uid}` — per-user cloud copy of custom tiles, groups, disabled defaults, boards, settings. **Owner-only** access.
  - `custom-actions/{id}` — crowdsourced shared actions (public read, auth create, TTL cleanup, no update/delete).
  - `game-boards/{id}` — shareable boards (public read, auth create, TTL; updates limited to the `ttl` field).
  - `content-packs/{id}` — **durable** shareable bundles of custom tiles + groups (public read; author-only create/update/delete; author republish must increase `packVersion`; admin takedown via the `admin` claim). Unlike `custom-actions`/`game-boards`, these have **no TTL** — lifecycle is author-delete + admin-takedown. Shared by code via `?importPack=<id>`.
  - `reports/{id}` — abuse reports against packs (signed-in create only; admin-only read via console).
  - `chat-rooms/{roomId}` + `/messages/{id}` — room metadata and chat (auth required; message create validated, ≤1000 chars; delete own only; no edits).
  - `schedule/{id}` — scheduled sessions (public read, creator-only create/update/delete).
  - `rate-limits/{uid}` — system-only.
- **Realtime Database** — presence and WebRTC signaling:
  - `users/{uid}` — presence (`displayName`, `room`, `isAnonymous`, `lastSeen`).
  - `rooms/{roomId}/uids/{uid}/{connectionId}` — per-room connection list.
  - `video-calls/{roomId}/{users,offers,answers,ice-candidates}` — WebRTC signaling.
- **Storage** — `/images/{id}.{ext}` for chat photos (auth, ≤5 MB, `image/*`, extension allowlist).
- **Functions** — cleanup jobs + presence triggers (see [architecture.md](architecture.md#cloud-functions-functions) and [security.md](security.md#cloud-functions)).

Security rules for each are documented in [security.md](security.md).

---

## Sync engine

Per-entity sync under `src/services/sync/`, coordinated by `syncOrchestrator.ts`. The orchestrator reads/writes the per-user Firestore document `user-data/{uid}` and runs entity syncs in parallel:

- `CustomTilesSync` — merges local and cloud tiles using `TileMatcher` (key = `group_id|intensity|action`); writes the merged set back. `forceSync` replaces local with cloud.
- `CustomGroupsSync` — merges new groups by `(name, locale, gameMode)`.
- `DisabledDefaultsSync` — merges the `disabledDefaults` table **per-record** with last-writer-wins (keyed by the content tuple). Re-enables propagate as `active: false` **tombstones**, so a re-enable on one device reaches the others (the old whole-list-replace could not). The historical 100-record corruption cap is gone; instead the push **bounds** the synced set with a loud warning and writes a legacy active-only `disabledDefaults` array (capped 100) alongside the new `disabledDefaultsV2` records for pre-V2 clients. Row `isEnabled` flags are reconciled from the table (`reconcileDisabledRows`).
- `GameBoardsSync` — upserts boards (keyed by title).
- `SettingsSync` — merges settings into the store.

- `CustomGroupExtensionsSync` — user-appended intensity levels on **default** groups travel as name/locale/gameMode-keyed deltas in a `customGroupExtensions` field (default groups never sync as whole records; each device seeds its own). Pull applies them with the append-only `appendIntensities` merge (`src/services/intensityMerge.ts`) — the same semantics the importer (`groupExtensions` in ExportData 2.1.0) and the locale re-seeder (`mergeSeedIntensities`, which preserves appended levels across `MIGRATION_VERSION` bumps) use. Append-only: removals don't propagate.

Before merging, `syncService.ts` runs a duplicate-tile cleanup to undo a historical sync bug.

**What triggers sync:**

1. **Automatic** — Dexie write → middleware → debounced `requestSync()`.
2. **Manual** — user-initiated sync from the auth/account UI.
3. **Periodic** — optional ~5-minute interval.

**Conditions:** sync only runs for authenticated, **non-anonymous** users. All cloud data is scoped to `user-data/{uid}` — no cross-user visibility there.

**Multi-device:** logging in with the same account on another device returns the same UID; a sync pulls `user-data/{uid}` into that device's Dexie.

**Real-time pull + last-writer-wins.** Non-anonymous sessions attach an `onSnapshot` listener to `user-data/{uid}` (`subscribeToUserData` in `syncService.ts`, wired in `useAuthSync`), so a change pushed from one device reflects on the others within seconds rather than waiting for the periodic/debounced cycle. Push stays debounced (~2 s). Conflicts resolve last-writer-wins via a per-record `updatedAt` (Unix ms) on custom tiles and game boards (`SyncBase.remoteWins`, strict `>`). The push remains debounced; the listener only pulls.

Loop prevention (push→pull→apply→push) relies on three guards: the snapshot handler skips events with `metadata.hasPendingWrites` (our own writes); an apply-phase suppression flag in `syncMiddleware` (`beginSyncApply`/`endSyncApply`) stops sync-engine Dexie writes from scheduling an echo push; and the entity merges only push back when something actually changed.

**Stated limitations of the LWW/real-time model:**

- **No incremental delete propagation.** The `user-data/{uid}` doc stores arrays with no tombstones, so a tile/board deleted on one device is re-added when another device merges. Deletes only propagate via `forceSync`/full-replace.
- **Client-clock based.** `updatedAt` is stamped with `Date.now()` at write time; with cross-device clock skew the faster-clock device wins regardless of true edit order.
- **Settings and custom groups are excluded from LWW.** Settings keep last-sync-wins (whole-object LWW would drop a field on concurrent edits); custom groups remain adds-only on merge (their identity is `name+locale+gameMode` and field edits are rare). Both still reconcile on `forceSync`.
- **No Dexie schema bump.** `updatedAt` is a non-indexed field; pre-existing rows adopt a timestamp on their next local edit and fall back to legacy (apply-remote) reconciliation until then.
- **The active board is device-local.** `activateBoard` doesn't bump `updatedAt`, and `GameBoardsSync.syncFromFirebase` preserves the local `isActive` flag when it applies a remote board (board _content_ still wins via LWW; the active flag does not). This avoids a switch on one device deactivating another's board, and avoids an active-flip re-stamping `updatedAt` and clobbering a newer remote tile edit. A cold-start device with nothing active adopts the remote-active board once so the user isn't left with no active board.

---

## Migration

Purpose: seed Dexie from bundled JSON action files, **once per language**, so gameplay content is available offline forever after.

- Provider: `src/context/migration.tsx` (debounced on language change).
- Services: `src/services/migration/*`, `migrationService.ts`.
- Flow: on language select, check a localStorage flag; if not yet migrated, load that language's bundled actions → insert into `customTiles` + `customGroups` → mark complete.
- **Deterministic group IDs** so the same group maps to the same ID across imports/migrations.
- **Health & recovery:** `migrationHealthChecker.ts` / `syncRecoveryService.ts` detect corruption (e.g. defaults missing, too few tiles) on startup and force a fresh migration; recovery status tracked in localStorage.

> Tests that touch components needing migration must mock `@/context/migration` — see `CLAUDE.md` for the standard mock.

---

## Import/Export

Code: `src/services/importExport/` (streaming/batched) and `src/services/importExport.ts`. README with rationale and perf numbers: `src/services/importExport/README.md`.

**Export** — produces a versioned JSON document:

```json
{
  "formatVersion": "2.1.0",
  "exportedAt": "<ISO>",
  "data": {
    "customGroups": [...],
    "customTiles": [...],
    "disabledDefaultTiles": [...],  // optional
    "groupExtensions": [...]        // 2.1.0+: append-only intensity deltas for DEFAULT groups
  }
}
```

Includes user-created groups and tiles, and optionally your disabled-default list. Each item carries a content hash. Scope can be filtered by locale, gameMode, or a single group. Export streams tiles in batches (~100) so memory stays roughly constant regardless of dataset size.

**Default-group extensions (2.1.0).** Custom tiles may target default groups (resolved by deterministic id), and `groupExtensions[]` appends new intensity levels to them ({groupName, groupLabel, locale, gameMode, addedIntensities, contentHash}). Imports never replace a default group's record (a default-named `customGroups` entry warn-skips), and the extension merge is append-only and idempotent by value. Compat: a 2.0.0 payload imports unchanged; an old client importing a 2.1.0 payload ignores `groupExtensions` and warn-skips tiles at the unknown levels.

**Import** — builds a mapping context once, then for each item compares content hashes: identical → skip, changed → update, new → add. Tiles batch-insert. Returns counts of imported/skipped groups/tiles + warnings/errors. `analyzeImportConflicts()` previews collisions before committing.

**User-facing:** this is the **backup / restore / share** mechanism — export to a JSON file, hand it to someone (or another device), import it. Reachable from the Custom Tiles dialog's import/export tab.

`analyzeImportConflicts()` is implemented (it previously returned empty arrays): it reports per-group/per-tile collisions, flagging a tile as `contentMatch` when the local copy differs from the imported one — i.e. a local edit an import would overwrite. The pack import preview uses this to warn before applying a pack update.

---

## Sharing (by code / link)

Two share-by-link flows exist, both consumed from the Room view via URL query params:

- **Game boards** (`?importBoard=<id>`) — when a board is activated/published, it is stored in `game-boards/{id}` (`getOrCreateBoard` in `firebase.ts`, SHA-256 dedup, 30-day TTL) and a chat message carries the id. Opening a link with `?importBoard=<id>` is handled by `src/hooks/useUrlImport.ts`: it fetches the board, parses its `gameBoard`/`settings`, and upserts it locally as the active board. Share URLs are built in `MessageList/Message` and `gameSettingsMessage.ts`.
- **Content packs** (`?importPack=<id>`) — durable bundles scoped to one or more author-selected custom groups (their custom tiles + group defs), published to `content-packs/{id}` (`src/services/contentPacks.ts`, reusing the export/import serialization). `src/hooks/useUrlPackImport.ts` fetches the pack and opens a **full-dump preview dialog** (`CustomTileDialog/Packs/PackImportDialog`) listing every group + action card before the user confirms a single **Import**. Import is **copy-only**: `importData` clones the contents into the user's own custom content, stamping a lightweight `packId` + `packName` for attribution and re-import dedupe (`ViewCustomTiles` shows a "From {pack}" chip). There is no subscription, version propagation, or auto-update. Publishing (multi-group select + visibility) and import-by-code live in the **Packs** accordion (`ctPacks`); expanding it swaps the dialog's right pane to the public directory (`PackDirectory`).

**Visibility + directory:** each pack is `public` (directory-listed) or `private` (unlisted, importable by code). `listPublicPacks` queries `content-packs` by `where(visibility=public, gameMode, locale)` + `orderBy(createdAt desc)` with cursor pagination (composite index in `firestore.indexes.json`); name/tag filtering is client-side over the loaded page. Denormalized `tileCount`/`groupCount`/`groupLabels` on the doc let directory cards render without parsing `contents`. Publishing **public** requires a permanent (non-anonymous) account; anonymous users publish private only. Moderation is report → `reports/` → manual Firebase-Console takedown (`admin` custom claim); no in-app admin UI. An author may **republish** (bumps `packVersion`, refreshes the listing), but existing importers are never notified — their copy is unaffected.

---

## Offline support

Architecture decided in [ADR-0001](../adr/0001-pwa-offline-support.md).

- **Service worker:** `vite-plugin-pwa` (`generateSW`, `registerType: 'prompt'`) precaches the app shell (JS/CSS/HTML + small assets, 3 MB/file cap). New SW installs silently and activates once old tabs close — no forced reloads.
- **Not precached:** sounds (~12 MB) and videos (~1.9 MB) — they fetch from network on demand.
- **Firestore offline:** reads served from local cache; writes queue and replay on reconnect (multi-tab aware).

**By mode:**

| Mode                            | Offline behavior                                                                                                                          |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Solo**                        | Fully playable offline after first load (content in Dexie).                                                                               |
| **Shared Device (local)**       | Fully playable offline; client-generates room codes; no Firebase needed for play.                                                         |
| **Individual Devices (online)** | App shell loads, but rooms/chat/presence/video **require network**. Firestore writes queue; RTDB presence is unavailable until reconnect. |

**Offline vs temporarily offline** (per `CONTEXT.md`): "Offline" = `navigator.onLine === false` at setup (Individual Devices disabled). "Temporarily offline" = lost mid-session (writes queue, presence degrades, recovers on reconnect).

---

## Accounts & auth

- **Anonymous (default):** instant entry; full access to solo/local; can join online rooms. Data persists per browser via UID + Dexie. **Risk:** clearing browser storage loses an anonymous identity (no recovery) unless content was exported or the account was upgraded.
- **Email/password & Google:** permanent accounts; enable cloud sync of `user-data/{uid}`.
- **Upgrade:** anonymous → registered via `linkWithCredential` keeps the same UID, so synced + local data carries over.
- **Logout** clears auth but not Dexie. A full **wipe** path clears localStorage, sessionStorage, IndexedDB, and cookies.
- **Cross-device sync** only for non-anonymous accounts (sync gate). Anonymous users are single-device by nature.

There are **no role/admin tiers** in the app for normal users; the only privileged surface is the `admin` custom claim used by the manual cleanup cloud functions.
