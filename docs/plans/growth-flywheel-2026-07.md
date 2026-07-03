# Growth Plan: Activation Fast Lane + Content-Pack Flywheel

_Agreed 2026-07-03 after grilling session + UX specialist review. Status: planned, not started._

## Strategy

**Spine:** content-pack creation flywheel is the growth engine (NSFW app — paid ads and app stores mostly closed; organic growth comes from content + shareability). Activation funnel is the prerequisite: nobody creates packs before they play successfully. Pure acquisition work deferred.

**Context:** ~2K active users/period, 69% mobile (tablet negligible). Most users play Solo despite party (jackbox-style) framing. Known complaint: games too short. Pack directory shipped (#1103) but holds only 2 packs — creation workflow is scattered across accordion sections and requires self-assembly.

## Phase 0 — Measure + trivial wins

### Analytics rework (ships first — baseline for everything after)

Current `custom_group_action` GA4 event is **seeding noise**: it fires from `customGroups.ts` store CRUD when default groups are seeded per user/locale at migration. It is not preference data (ballBusting ≈ kissing because every user's DB seeds both).

New event set (GA4 only, existing privacy rules — no names, room codes, or content text):

- `wizard_screen_view` / `wizard_completed` / `wizard_abandoned` — per screen, per topology
- `game_started` (topology, group count, board size) + `groups_selected` — actual picks at game start
- `action_rolled` (count), `game_finished` (finish tile reached), `game_abandoned` (roll count + minutes)
- Flywheel: `pack_directory_viewed`, `pack_previewed`, `pack_imported`, `pack_published`, `pack_creation_started` / `_completed`
- `feature_usage` on major features (cast, video call, TTS, backgrounds, custom dialog)
- Kill/rename seeding-noise event; keep CRUD tracking for user-initiated creates only

Naming: `noun_verb`, shared param dictionary. Goal: answer "are they trying the game? rolling? reaching the end? what's used/unused?"

### Board default 60

Default board size 40 → 60 tiles (addresses too-short complaint, zero new UI). No size step in wizard.

## Phase 1 — Activation: wizard fast lane

Target: Solo path = topology tap → identity → actions → play.

- **Topology screen** (already three cards): move Solo card's private-room checkbox to More options; all three cards auto-advance on tap.
- **Verify first:** does role affect solo action text? Current solo flow deliberately omits role (`showRole = isOnline && !soloPlay` in GameModeStep). Determines identity-screen contents (anatomy ± role).
- **Actions screen rebuild** (`ActionsStep`):
  - "Starters" preset row (horizontal cards) replaces the Quick Start ⟷ Customize mutually-exclusive accordion — presets select groups + intensities, chips reflect it.
  - **Spice dial** = _non-destructive default-setter_: preselects intensity band per group by ladder percentile, but only for groups the user never hand-edited (edited groups show a "custom" dot, never overwritten). App vocabulary labels (Mild/Spicy/Filthy), not numbers. **Consent hazard note:** silent per-group preselection in an NSFW app must never surprise — dial sets defaults, bottom sheet is the editor of record.
  - Group chips by category (actions / consumptions), selected chips show level badge ("2/4", "1,3").
  - Badge tap → **bottom sheet** (`SwipeableDrawer anchor="bottom"`, fullscreen Dialog below `sm`) with that group's real level labels, checkbox per level (non-contiguous allowed), per-level tile counts, pinned confirm button. Not a popover — clips/misplaces on mobile.
  - Consumptions keep their own section + combine/standalone (`isAppend`) toggle — not folded into dial.
  - **Cap stays 4 actions + 2 consumptions** (locked decision): slot counter ("2 of 4 picked"), chips disabled at cap. Advanced settings remain the escape hatch for complex boards.
  - Preserve: migration-aware loading, `BrokenActionsState`, `hasValidSelections` gating, `isNaked`/`soloPlay` content-type gating.
- Advanced `GameSettings` unchanged as deep editor; both surfaces read/write identical `selectedActions` shape; chip screen re-reads on return.

## Phase 2 — Discovery (flywheel demand side)

- **Seed packs:** owner authors 4–6 packs (solo / couples / party group / warm-up spread) under app-brand author name. Directory surfacing gated on seeds being in.
- **Directory surfacing:** "Explore community packs" card at end of actions-screen group list + slim banner when user has zero custom content. Directory renders as **inline wizard sub-view** (pane swap + back button — no stacked dialog; `PackImportDialog` remains the only overlay). After import: reload `actionsList` and auto-select imported groups (wizard currently only reloads on migration toggle — needs `onImported` wiring).
- **Incentive v1:** import counter on pack cards (Firestore increment on import) + author display name. **No author profiles** — anonymity is a feature in NSFW context. No ratings/comments v1 (moderation surface stays small; report flow #1104 exists).
- Landing-page pack teaser = later phase (needs full shelf).

## Phase 3 — Creation (flywheel supply side)

**Guided "Create a Pack" flow** as a **route-level fullscreen view** (like ManageGameBoards) — NOT inside CustomTileDialog (modal stack already 3 deep with scroll/popper DOM hacks). `MobileStepper`/top Stepper, one step per screen, sticky bottom action bar.

1. **Start point:** blank · copy own groups · duplicate an imported pack · **duplicate a default group** (new capability — copies default tiles into a custom group, canonical-English placeholders intact; biggest hidden scope item).
2. **Pack identity:** name (100), description (1000), tags (≤20).
3. **Content:** create/edit groups + tiles inline — **reuse existing components/hooks** (`useCustomTileLifecycle`, `submitCustomTileCore`, `validationService`, group editor). Do not clone editors.
4. **Publish:** preview → visibility (public/private; anonymous users forced private) → share link.

Draft persists as local custom content (pack = selection over it). **Republish path required:** "Update pack" entry from my-packs for version bump — create-only flow strands authors.

**Replace, don't layer (deletions on ship):**

- Delete publish form from Packs accordion → becomes "Create a pack →" button + import-by-code field.
- P3 step 3 and AddCustomTile's "Manage Groups" open the same editor surface; retire CustomGroupDialog-as-stacked-modal.
- Import/Export JSON relabeled "Backup" (packs = sharing; JSON = backup).
- Longer term: retire accordion-as-navigation in CustomTileDialog on mobile (list→detail or tabs).

## Acceptance checklist — primitives that must survive every phase

- Non-contiguous intensity level selection with real per-group labels
- Consumption combine/standalone toggle
- Disabled-default tile tombstones (curation + sync semantics)
- Tile-level tags; placeholder help chips; live tile preview
- JSON import/export, all 4 scopes (rebranded Backup)
- Pack visibility control + anonymous-forced-private
- Report-abuse affordance in pack preview

## Backlog (explicitly out of scope)

- Lift the 4+2 group cap (needs board-builder dilution work)
- "Keep playing" end-of-game CTA / board size selector UI
- Landing-page pack teaser / SEO pack pages
- Ratings, comments, author profiles
