# Content Pack Rework — Implementation Plan

**Status: complete.** All phases implemented; `type-check`, `eslint src/`, `test:ci`, `test:rules`, and `build` green. Two intentional deviations: `singleGroupName` is **kept** on `ExportOptions` (the regular import/export UI still uses it) with `groupNames` added alongside; `analyzeImportConflicts` is **kept** as a service function (it is `ConflictAnalysis`'s only producer, re-exported via `enhancedImportExport`) — only its conflict _UI_ was removed from the import dialog per Phase 8.

Tracking doc for the group-scoped, public-directory, copy-only content-pack rework.
Design: `CONTEXT.md` (Content Pack section) + `docs/adr/0003-content-pack-directory-and-copy-only-model.md`.
Mockups: `.mockups/pack-preview.html` (full-dump preview), `.mockups/pack-browse-ia.html` (IA — Approach 2 chosen).

**Pre-commit gate (every phase):** `npm run type-check && npx eslint src/ && npm run test:failures`

---

## Phase 1 — Types & data model

- [x] `src/types/contentPacks.ts`: add `visibility: 'public' | 'private'` to `ContentPackDoc` + `ContentPackMeta`.
- [x] `src/types/contentPacks.ts`: add denormalized `tileCount: number`, `groupCount: number`, `groupLabels: string[]` to `ContentPackDoc`.
- [x] `src/types/contentPacks.ts`: **remove** `PackSubscription` and `PackUpdateStatus` (subscription teardown).
- [x] `src/types/customTiles.ts`: remove `packVersion` and `packDetached` from `CustomTileBase`; **keep** `packId` + `packName` (attribution + re-import dedupe).
- [x] `src/types/customGroups.ts`: remove `packVersion` from `CustomGroupBase`; keep `packId`.
- [x] `src/types/importExport.ts`: trim `PackProvenance` to `{ packId; packName }` (drop `packVersion`).

## Phase 2 — Subscription teardown (Replace, don't layer)

- [x] Delete `src/stores/packSubscriptions.ts`.
- [x] Delete `src/services/sync/packSubscriptionsSync.ts`.
- [x] `src/services/syncService.ts`: remove `syncPackSubscriptionsToFirebase` + all call sites (~L284–312) + `user-data/{uid}.packSubscriptions` read/merge.
- [x] `src/stores/store.ts`: add Dexie `version(4)` dropping the `packSubscriptions` table (`packSubscriptions: null`); remove `packSubscriptions` from the class fields and the `createSyncMiddleware` tables list. Keep `packId` indexes on `customTiles`/`customGroups`.
- [x] `src/stores/customTiles.ts`: remove `softRemoveTilesByPackId` (only used by unsubscribe).
- [x] `src/services/contentPacks.ts`: remove `unsubscribePack`.
- [x] No data migration needed (no existing subscription users) — verify no other importers of the deleted modules remain (`grep -rn "packSubscriptions\|softRemoveTilesByPackId\|unsubscribePack\|packDetached"`).

## Phase 3 — Publish: multi-group + visibility + summary

- [x] `src/services/importExport/exportService.ts`: extend `exportAllData` to accept `groupNames?: string[]` (multi-group) alongside/replacing `singleGroupName`; export only custom tiles + custom group defs for the selected groups (already locale+gameMode scoped, `includeDisabledDefaults: false`).
- [x] `src/services/contentPacks.ts` `BuildPackOptions`: replace `singleGroupName` with `groupNames: string[]`.
- [x] `src/services/contentPacks.ts` `publishPack`: accept `visibility`; compute + store `tileCount`/`groupCount`/`groupLabels` from the serialized contents.
- [x] `src/services/contentPacks.ts` `republishPack`: same `visibility` + summary update; keep `packVersion` as an author-only edit counter (no client-side update propagation).
- [x] `src/services/contentPacks.ts` `importPack`: stamp only `{ packId, packName }`; remove `packVersion` from provenance.

## Phase 4 — Firestore rules, indexes, security

- [x] `firestore.rules` `content-packs`: add `visibility` to create/update validation (`in ['public','private']`).
- [x] `firestore.rules`: gate **public** publish on a non-anonymous account — `request.resource.data.visibility == 'private' || request.auth.token.firebase.sign_in_provider != 'anonymous'`.
- [x] `firestore.rules`: add `allow list` for `content-packs` restricted to `where('visibility','==','public')` queries only (private packs never returned by list; still `get`-able by id).
- [x] `firestore.indexes.json`: composite index `visibility ASC, gameMode ASC, locale ASC, createdAt DESC` (+ `array-contains` tags variant if tag filtering is server-side).
- [x] `npm run test:rules` (emulator) — add cases: anonymous cannot publish public; public list excludes private; private still importable by id.
- [x] Capture the admin claim-setter snippet (`admin.auth().setCustomUserClaims(uid,{admin:true})`) in `docs/engineering/security.md`.

## Phase 5 — Directory service (list query)

- [x] `src/services/contentPacks.ts`: add `listPublicPacks({ gameMode, locale, cursor, limit })` using `query` + `where('visibility','==','public')` + `where(gameMode)` + `where(locale)` + `orderBy('createdAt','desc')` + `limit` + `startAfter(cursor)`. Return `{ packs, nextCursor }`.
- [x] Client-side name/tag substring filter over the loaded page (note in code: true full-text search is out of scope for v1).

## Phase 6 — UI: publish form (`src/views/CustomTileDialog/Packs/index.tsx`)

- [x] Replace whole-setup publish with a **MUI multi-select** of the current mode+locale custom groups (label + tile count). Require ≥1.
- [x] Add a visibility **`Select`** (Public default / Private).
- [x] Remove the consent checkbox; add conditional helper text under the select shown only when Public ("Public packs appear in the directory and can be reported and removed.").
- [x] Wire `handlePublish` to `groupNames` + `visibility`; keep name/description/tags.
- [x] Remove the "My subscriptions" section + `handleUpdate`/`handleUnsubscribe`.
- [x] Keep import-by-code field (private/link path).

## Phase 7 — UI: right-pane directory takeover (`src/views/CustomTileDialog/index.tsx`)

- [x] New component `src/views/CustomTileDialog/PackDirectory/index.tsx`: search field + gameMode/locale/tag filter chips + responsive pack-card grid + "Load more" (cursor). Cards: name, author, gameMode/locale chips, "N groups · N actions", tag pills. Render from `listPublicPacks`. Default filters to current settings gameMode+locale.
- [x] In `renderContent`, when `expanded === 'ctPacks'`, render `<PackDirectory/>` as `rightColumnContent` instead of `<ViewCustomTiles/>`; restore the editor when another panel is active.
- [x] Clicking a card opens the full-dump preview modal.

## Phase 8 — UI: full-dump preview modal (`src/views/CustomTileDialog/Packs/PackImportDialog.tsx`)

- [x] Rebuild as Option 1 dense grid (per `.mockups/pack-preview.html`): sticky header (name/author/desc/chips/counts) + X close (no Cancel); per-group sections with each group's intensity legend; action cards (action text, intensity left-border + badge, tag pills).
- [x] Footer: **Report** (left) + single **Import** (primary). Remove "Subscribe & import" + "Import a copy".
- [x] `handleImport` calls `importPack` (copy-only); drop the subscribe branch + `upsertSubscription`.
- [x] Drop the `analyzeImportConflicts`/`packDetached` conflict UI (no auto-update model).

## Phase 9 — i18n

- [x] Add/adjust `packs.*` keys (visibility labels, multi-select, directory, search, helper text; remove subscription keys) in **all** of `src/locales/{en,es,fr,zh,hi,de}/translation.json`.

## Phase 10 — Tests

- [x] Unit: `exportAllData` multi-group selection (literal fixtures).
- [x] Unit: `publishPack` writes `visibility` + summary fields.
- [x] Unit: `listPublicPacks` query shape + cursor.
- [x] Boundary: publish form (multi-select required, visibility default Public, no consent checkbox).
- [x] Boundary: preview modal renders grid + single Import (copy), Report.
- [x] Delete now-obsolete subscription/unsubscribe tests.
- [x] Firestore rules tests (Phase 4).

## Phase 11 — Cleanup & docs

- [x] `grep` for dead references (`subscription`, `packVersion`, `packDetached`, `softRemove`) across `src/`.
- [x] `npm run cleanup:debug` (no stray `console.*`).
- [x] Confirm `CONTEXT.md` + ADR-0003 match shipped behavior; update `docs/engineering/data-and-sync.md` (drop subscription/sync, add directory/visibility).
- [x] Final gate: `npm run build` + `npm run test:ci`.
