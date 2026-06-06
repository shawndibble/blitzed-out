# Enhancement Opportunities

Companion to [README.md](README.md). A candid, engineering-honest list of current limitations and where the app could be improved or extended. Grouped by area. This is the doc to read before answering "what can we make better?".

> These are observations, not committed work. Validate against current source before acting — some may already be in progress on `develop`.

---

## Media

- **Reddit slideshow depends on third-party CORS proxies** (`r.jina.ai`, `allorigins`, `corsproxy.io`). These are availability and privacy risks; a small first-party proxy/Cloud Function would be more reliable.
- **No scheme/host validation on background media URLs** before iframe embedding (see [security.md](security.md#content--input-validation)). Both a security and UX issue (broken embeds). _(Schedule/custom-action/board URLs + string sizes are now validated in rules.)_
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

## Tooling & docs

- **No automated dependency audit** in the documented workflow — add `npm audit` to CI.
