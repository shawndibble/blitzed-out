# Enhancement Opportunities

Companion to [README.md](README.md). A candid, engineering-honest list of current limitations and where the app could be improved or extended. Grouped by area. This is the doc to read before answering "what can we make better?".

> These are observations, not committed work. Validate against current source before acting — some may already be in progress on `develop`.

---

## Casting & TV

Today only **Chromecast** is integrated (custom receiver `1227B8DE`). Gaps:

- **No AirPlay support.** Apple users can only OS-mirror. Could add `x-webkit-airplay` attributes to `<video>` elements and an AirPlay route picker for Safari, at least for direct-video backgrounds.
- **No Roku / Fire TV / smart-TV apps.** Options to consider, in rough effort order: (a) document the "open `/<room>/cast` in the TV browser" path in-app; (b) a lightweight Roku/Fire TV channel that just loads the cast URL; (c) DIAL-based launch.
- **Cast receiver app ID is hardcoded** (`1227B8DE`) and the **receiver HTML is hosted externally** (not in this repo). Document where it lives and how it's registered/updated, or bring it into the repo.
- **Cast view is read-only.** It shows state but can't drive the game (no remote roll). A richer receiver could show more (chat, video tiles, scores).

## Media

- **Reddit slideshow depends on third-party CORS proxies** (`r.jina.ai`, `allorigins`, `corsproxy.io`). These are availability and privacy risks; a small first-party proxy/Cloud Function would be more reliable.
- **No format/host validation on user URLs** before embedding (see [security.md](security.md#content--input-validation)). Both a security and UX issue (broken embeds).
- **Direct-video error handling retries image extensions** — works but is heuristic; a proper content-type probe would be cleaner.
- **EXIF not stripped** from uploaded images (potential location metadata leak).

## Content & gameplay

- **`vers` role and non-binary anatomy resolve heuristically/randomly per roll** — non-deterministic and occasionally surprising. Worth surfacing the resolution to the player or making it configurable.
- **Empty-tile fallbacks:** if a selected group lacks tiles at a needed intensity, slots can end up sparse. Better authoring-time warnings (the builder already computes "missing groups" metadata — surface it).
- **Penetrative-context / strap-on detection is keyword-based per locale** — brittle across languages; candidate for a more structured tag on tiles.
- **Board size assumptions in tests** vs configurable `boardSize` — keep an eye on tests that hardcode sizes.

## Customization & data portability

- **Import/export is JSON files only** — no cloud "share link" for custom content, and no selective re-import UI beyond conflict preview. A share-by-code flow (reusing the existing `custom-actions`/`game-boards` public collections) could let users publish/subscribe to content packs.
- **No content-pack/versioning concept** — users can't track which pack a tile came from or update it.
- **Disabled-defaults sync is capped** to guard corruption; a cleaner model would track disables as first-class records.

## Sync, accounts & offline

- **Anonymous accounts are single-device and unrecoverable.** Losing browser storage loses content unless exported. A lightweight "backup code"/email-link recovery for anonymous users would help.
- **Local Dexie isn't pushed cross-device in real time** — reconciliation is debounce/manual/periodic. Conflict resolution is per-entity merge; concurrent edits on two devices can surprise. Consider last-writer-wins timestamps or CRDT-ish merge for boards/settings.
- **Online mode degrades hard offline** (rooms/chat/presence/video all need network). Some of this is inherent, but graceful messaging and queued chat could improve UX.
- **Firestore `persistentLocalCache` is slower** than the deprecated API (noted in ADR-0001); acceptable because Dexie is primary, but watch perf on large message histories.

## Realtime / video

- **4-peer cap** on WebRTC — fine for the use case, but a mesh topology won't scale beyond that; an SFU would be needed for larger rooms.
- **TURN credentials are static in the bundle** (see security). Dynamic per-session credentials would reduce abuse risk.
- **Signaling cleanup relies on a scheduled function** — if it fails, stale signaling data accumulates (no TTL on RTDB paths).

## Performance

- **Largest JS chunk** is ~159 KB gzipped (per ADR-0001) — fine, but worth periodic bundle audits as features grow.
- **Sounds (~12 MB) aren't precached** — first play needs network; consider precaching the few most-used short sounds.
- **Message store keeps 24h of messages** in localStorage + Zustand — large rooms could bloat; consider windowing.

## Security (cross-reference)

The full list and priorities are in [security.md](security.md#prioritized-hardening-backlog). Headlines:

1. Enforce **room membership** in Firestore rules (private rooms are obscurity-only today).
2. Scope **RTDB presence reads** and **signaling writes**.
3. **Mask Sentry replay text** (NSFW content currently capturable).
4. **Rotate TURN creds** and any credential exposed in the 2024 `.env` git history.
5. Validate user-supplied URLs and string sizes.

## Tooling & docs

- **`docs/` is git-ignored** — this documentation and the ADRs don't travel with the repo. Decide whether to track them (`git add -f`) or relocate.
- **`understand-anything` graph is stale** (commit `3f688ee`). Re-run the analysis to keep the navigation aid current, or stop relying on it.
- **No automated dependency audit** in the documented workflow — add `npm audit` to CI.
