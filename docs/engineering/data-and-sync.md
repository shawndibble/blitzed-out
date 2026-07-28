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

Initialized in `src/services/firebase/app.ts`, the only module that touches the SDK's app/handle APIs; every other module takes `db` from it.

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
  - `users/{uid}` — presence (`displayName`, `room`, `isAnonymous`, `lastSeen`). Owned end-to-end (write + read) by `src/services/roomPresence.ts`.
  - `video-calls/{roomId}/{users,offers,answers,ice-candidates}` — WebRTC signaling.
- **Storage** — `/images/{id}.{ext}` for chat photos (auth, ≤5 MB, `image/*`, extension allowlist).
- **Functions** — cleanup jobs + presence triggers (see [architecture.md](architecture.md#cloud-functions-functions) and [security.md](security.md#cloud-functions)).

Security rules for each are documented in [security.md](security.md).

---

## Sync engine

**The `user-data/{uid}` document has one owner: `src/services/sync/remoteUserData.ts`.** It is the only module that knows the document's field names, its dual legacy/V2 disabled-defaults encoding, and its size caps; it exposes `readRemoteUserData` (one `getDoc`, decoded into the app's own vocabulary), `collectLocalUserData` (this device's whole snapshot), and `writeRemoteUserData` (one `setDoc` merge). A section decoded as `undefined` means the document does not carry it, which the merges must not confuse with "present but emptied".

One cycle = **one read, then one write if anything changed** (`syncOrchestrator.ts`). Entity merges report `changed` rather than pushing themselves — a push per entity used to race the other merges, publish a half-merged document, and echo back through the real-time listener. `gameBoards` is omitted from a write when this device has none, so a board-less device cannot blank another's.

Per-entity merge policy lives under `src/services/sync/`, and the orchestrator runs the merges in parallel:

- `CustomTilesSync` — merges local and cloud tiles using `TileMatcher` (key = `group_id|intensity|action`). `forceSync` replaces local with cloud.
- `CustomGroupsSync` — merges new groups by `(name, locale, gameMode)`.
- `DisabledDefaultsSync` — merges the `disabledDefaults` table **per-record** with last-writer-wins (keyed by the content tuple). Re-enables propagate as `active: false` **tombstones**, so a re-enable on one device reaches the others (the old whole-list-replace could not). Row `isEnabled` flags are reconciled from the table (`reconcileDisabledRows`). The wire encoding is the owner's business: it writes a legacy active-only `disabledDefaults` array (capped 100) alongside the `disabledDefaultsV2` records for pre-V2 clients, bounds the record set at 1000 with a loud warning, and on read prefers V2 — up-converting a legacy-only document so the merge only ever sees records.
- `GameBoardsSync` — upserts boards (keyed by title).
- `SettingsSync` — merges settings into the store.

- `CustomGroupExtensionsSync` — user-appended intensity levels on **default** groups travel as name/locale/gameMode-keyed deltas in a `customGroupExtensions` field (default groups never sync as whole records; each device seeds its own). Pull applies them with the append-only `appendIntensities` merge (`src/services/intensityMerge.ts`) — the same semantics the importer (`groupExtensions` in ExportData 2.1.0) and the locale re-seeder (`mergeSeedIntensities`, which preserves appended levels across `MIGRATION_VERSION` bumps) use. Append-only: removals don't propagate.

Before merging, the orchestrator runs a duplicate-tile cleanup (`sync/localCleanup.ts`) to undo a historical sync bug. `syncService.ts` above all this decides only _when_ a cycle runs (login push, pull, periodic, real-time listener).

**What triggers sync:**

1. **Automatic** — Dexie write → middleware → debounced `requestSync()`.
2. **Manual** — `syncData()` from the auth context (a full push). There is no conflict-preview flow: `intelligentSync`, which refused to sync whenever both sides were merely non-empty, had no UI consumer and was deleted — the LWW merges it bypassed are strictly better behaved.
3. **Periodic** — optional ~5-minute interval.

**Conditions:** sync only runs for authenticated, **non-anonymous** users. All cloud data is scoped to `user-data/{uid}` — no cross-user visibility there.

**Multi-device:** logging in with the same account on another device returns the same UID; a sync pulls `user-data/{uid}` into that device's Dexie.

**Real-time pull + last-writer-wins.** Non-anonymous sessions attach an `onSnapshot` listener to `user-data/{uid}` (`subscribeToUserData` in `syncService.ts`, wired in `useAuthSync`), so a change pushed from one device reflects on the others within seconds rather than waiting for the periodic/debounced cycle. Push stays debounced (~2 s). Conflicts resolve last-writer-wins via a per-record `updatedAt` (Unix ms) on custom tiles and game boards (`SyncBase.remoteWins`, strict `>`). The push remains debounced; the listener only pulls.

Loop prevention (push→pull→apply→push) relies on three guards: the snapshot handler skips events with `metadata.hasPendingWrites` (our own writes); an apply-phase suppression flag in `syncMiddleware` (`beginSyncApply`/`endSyncApply`) stops sync-engine Dexie writes from scheduling an echo push; and a cycle publishes only when a merge reported a change.

**Stated limitations of the LWW/real-time model:**

- **No incremental delete propagation.** The `user-data/{uid}` doc stores arrays with no tombstones, so a tile/board deleted on one device is re-added when another device merges. Deletes only propagate via `forceSync`/full-replace.
- **Client-clock based.** `updatedAt` is stamped with `Date.now()` at write time; with cross-device clock skew the faster-clock device wins regardless of true edit order.
- **Settings and custom groups are excluded from LWW.** Settings keep last-sync-wins (whole-object LWW would drop a field on concurrent edits); custom groups remain adds-only on merge (their identity is `name+locale+gameMode` and field edits are rare). Both still reconcile on `forceSync`.
- **No Dexie schema bump.** `updatedAt` is a non-indexed field; pre-existing rows adopt a timestamp on their next local edit and fall back to legacy (apply-remote) reconciliation until then.
- **The active board is device-local.** `activateBoard` doesn't bump `updatedAt`, and `GameBoardsSync.syncFromFirebase` preserves the local `isActive` flag when it applies a remote board (board _content_ still wins via LWW; the active flag does not). This avoids a switch on one device deactivating another's board, and avoids an active-flip re-stamping `updatedAt` and clobbering a newer remote tile edit. A cold-start device with nothing active adopts the remote-active board once so the user isn't left with no active board.

---

## Migration

Purpose: seed Dexie from bundled JSON action files, **once per language**, so gameplay content is available offline forever after.

- Gate: `src/services/migration/contentReadiness.ts` — `waitForContentReady(locale)` guards the UI-facing store entry points (`getTiles`, `getAllAvailableGroups`, `getGroupsWithTiles`, `getTileCountsByGroup`); `initContentReadiness()` (called from `AllProviders`, after auth) seeds on startup and on debounced language change; `useMigrationStatus()` exposes `phase: 'seeding' | 'ready' | 'degraded'` plus `retry()`.
- Services: `src/services/migration/*`.
- Flow: on language select, check a localStorage flag; if not yet migrated, load that language's bundled actions → insert into `customTiles` + `customGroups` → mark complete. Guarded callers self-trigger seeding once per locale per session; failures resolve degraded (never reject). Only the current locale is ever seeded — there is no background pre-seed of other languages.
- **Deterministic group IDs** (`src/services/deterministicGroupId.ts`) so the same group maps to the same ID across imports/migrations. It's a Dexie primary key that also syncs to Firebase, so its output format is pinned by a literal-value test — do not change the algorithm without a data migration plan.
- **`MIGRATION_VERSION` (`src/services/migration/constants.ts`) forces a re-seed on bump.** `isCurrentLanguageMigrationCompleted` (`statusManager.ts`) treats a completion recorded against an older version as void, and `markLanguageMigrated` drops the carried-forward `completedLanguages` when the stored version differs — so every locale a device uses re-seeds once per bump. That is what makes changed bundle content (reworded actions, renamed intensity labels, dropped defaults) reach players who already seeded; **bump the version in the same change as any content edit, or it ships to fresh installs only.**
  > Re-seeding is idempotent, not a reset: `getNewTiles` skips tiles whose text is unchanged (so their `isEnabled` choice survives), `mergeSeedIntensities` keeps user-appended levels, and only seeded defaults the bundle no longer carries are deleted (see below). Player-authored tiles are never touched.
  > ⚠️ A **reworded** default is the exception: the stale row is pruned and the new text inserted at `isEnabled: 1`, so a player who had disabled that action gets the reworded version back enabled. There is no way to carry the choice across — the two rows are only relatable by the edit that produced them. Reword deliberately.
- **⚠️ Reordering a default group's intensity tiers silently rewrites consent.** A player's chosen levels live in `settings.selectedActions[group].levels` as **positional integers** (`ActionEntry`, `src/types/index.ts`), and nothing remaps them — `carrySelectedActions` (`views/GameSettings/setupQuestions.ts`) only clamps to the target's max. So inserting, removing, or reordering a tier makes every stored selection point at different content, and a re-seed makes the new labels canonical so the UI shows the change as though the player chose it. Renaming a tier in place is safe; changing what sits at a position is not. If a reorder introduces a **new kind of act** at a position someone may already have selected, either append the new tier at the end (existing selections can't reach it) or ship a settings migration that remaps `levels` — never rely on the positional carry.
  > **Known exception, accepted deliberately (2.8.0):** the Clit Training rework inserted `Penetration` at position 3 with no `levels` remap, so a player who had selected level 3 receives it. Recorded rather than fixed, at the maintainer's call. A second effect of the same reorder: online's old top tier (4, Endurance Challenge) is now Intense Focus, so players who had picked the maximum sit one rung below the new top. Don't treat this as precedent — it is the case the rule above exists to prevent.
  > **Disabled choices do survive a reorder**, as of 2.8.0: `rekeyMovedDisabledRecords` (`stores/disabledDefaults.ts`) runs before `reconcileDisabledRows` on the seed path and follows any record whose action changed rung, matching on `group_id + action`. Without it, reconcile re-enables every stranded record. A _reworded_ action is still unrecoverable — see the warning above — because nothing relates the old text to the new.
  > Two lesser effects of growing a ladder, neither mitigated: a user-appended intensity at a value the bundle now claims loses its own label (`mergeSeedIntensities` keeps only non-default values the bundle doesn't define), and an exported pack predating the change still targets tiles by `groupName` + `intensity`, so its tiles land on whatever now occupies that position.
- **Reworded defaults replace, not duplicate.** Seeding is append-only and dedupes on exact action text, so a changed string would otherwise ship alongside its predecessor. `getStaleDefaultTileIds` (`importOperations.ts`) deletes this group's `isCustom: 0` + `default`-tagged tiles whose `intensity::action` the current bundle no longer contains; a failed prune is logged and swallowed rather than aborting the seed.
- **The seeder drops bundle keys it does not name.** `importActionFile` (`importOperations.ts`) builds each group row from an explicit field list — `id, name, label, intensities, type, isDefault, locale, gameMode` — and `updateCustomGroup` on re-seed writes a similarly explicit subset. Anything else in the bundle is silently discarded. Known cases: `dom`/`sub`, nine groups' bespoke role wording, which is why it is read from the bundle instead ([ADR-0004](../adr/0004-presentation-only-content-read-from-bundle.md)); and `anatomyRequirement`, which is a real `CustomGroupBase` field honoured on the user import/export path (`services/importExport.ts`) but never populated for seeded default groups — harmless today only because `anatomyFilterService` has no callers outside its own tests. Adding a bundle-backed field to the schema is therefore not sufficient on its own: it must be named here too, and see the reachability warning above.
- **Corruption recovery:** on init, `verifyMigrationIntegrity` detects "localStorage says complete but Dexie is empty" and resets status so seeding re-runs.

> `@/services/migration/contentReadiness` is mocked globally in `setupTests.ts`; tests need no per-file migration mock.

---

## Import/Export

Code: `src/services/importExport.ts` (export/import pipeline) and `src/services/importExport/` (export-selection stats for the UI).

**The payload has one reader: `src/services/packPayload.ts`.** `ExportData` is the wire format for
both file import/export and content packs, and every consumer goes through `readPackPayload()` rather
than reaching into the record: it validates the shape once (no second validator anywhere), defaults
the sections a 2.0.0 payload omits, buckets tiles by group, names every group the payload touches
(including default groups a pre-2.1.0 payload reveals only through its tiles), recovers the locale a
`disabledDefaultTiles` entry lacks, and derives tile identity. Identity is the load-bearing one:
stored actions are canonical, so a payload's action is canonicalized (`placeholderAliasService`)
before it is keyed — the import preview and the import itself call the same function, so they cannot
disagree about what a tile is.

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

Includes user-created groups and tiles, and optionally your disabled-default list. Each item carries a content hash. Filters: locale, gameMode, a single group (`singleGroupName`) or a multi-select (`groupNames`, used by content packs), plus `scope` — `all` / `custom` / `single` / `disabled` — which decides the sections the document carries and is read inside `exportAllData` (a caller that passes no `scope` keeps driving sections through `includeDisabledDefaults`). Export streams tiles in batches (~100) so memory stays roughly constant regardless of dataset size.

**Default-group extensions (2.1.0).** Custom tiles may target default groups (resolved by deterministic id), and `groupExtensions[]` appends new intensity levels to them ({groupName, groupLabel, locale, gameMode, addedIntensities, contentHash}). Imports never replace a default group's record (a default-named `customGroups` entry warn-skips), and the extension merge is append-only and idempotent by value. Compat: a 2.0.0 payload imports unchanged; an old client importing a 2.1.0 payload ignores `groupExtensions` and warn-skips tiles at the unknown levels.

**Import** — builds a mapping context once, then for each item compares content hashes: identical → skip, changed → update, new → add. Tiles batch-insert. Returns counts of imported/skipped groups/tiles + warnings/errors. `analyzeImportConflicts()` previews collisions before committing.

**User-facing:** this is the **backup / restore / share** mechanism — export to a JSON file, hand it to someone (or another device), import it. Reachable from the Custom Tiles dialog's import/export tab.

`analyzeImportConflicts()` reports per-group/per-tile collisions, flagging a tile as `contentMatch` when the local copy differs from the imported one — i.e. a local edit an import would overwrite. **It currently has no production caller** — the conflict UI was removed from the import dialog when packs became copy-only, and `PackImportDialog` shows a full-dump preview instead. It keys tiles through `packPayload`, exactly as the importer does, so anything that wires a preview back up agrees with what the import will do; until then it is a service function with tests and no users.

---

## Sharing (by code / link)

Two share-by-link flows exist, both consumed from the Room view via URL query params:

- **Game boards** (`?importBoard=<id>`) — when a board is activated/published, it is stored in `game-boards/{id}` (`getOrCreateBoard` in `firebase/boards.ts`, SHA-256 dedup, 30-day TTL; returns `{ id }` — the only thing callers use, and previously two different Firestore classes under one declared type) and a chat message carries the id. Opening a link with `?importBoard=<id>` is handled by `src/hooks/useUrlImport.ts`: it fetches the board, parses its `gameBoard`/`settings`, and upserts it locally as the active board. Share URLs are built in `MessageList/Message` and `gameSettingsMessage.ts`.
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
