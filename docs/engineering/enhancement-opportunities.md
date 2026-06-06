# Enhancement Opportunities

Companion to [README.md](README.md). A candid, engineering-honest list of current limitations and where the app could be improved or extended. Grouped by area. This is the doc to read before answering "what can we make better?".

> These are observations, not committed work. Validate against current source before acting — some may already be in progress on `develop`.

---

## Content & gameplay

- **Penetrative-context / strap-on detection is keyword-based per locale** — `isPenetrativeContext` does substring matching against per-language keyword lists (`anatomy.json` per locale); brittle (no morphology/synonyms, must be maintained in 6 languages). Tiles already carry a `tags[]` field that goes unused here — a structured `penetrative` tag would be more robust. _(Planned as a dedicated follow-up; note there are **two** strapon code paths — the keyword-gated piped path in `actionStringReplacement.ts` and an **ungated** one in `anatomyPlaceholderService.ts` that straps every female dom on bare `{genital}` — so the structured tag must decide whether to gate both.)_

## Customization & data portability

- **Import/export is JSON files only** — no cloud "share link" for custom content, and no selective re-import UI beyond conflict preview. A share-by-code flow (reusing the existing `custom-actions`/`game-boards` public collections) could let users publish/subscribe to content packs.
- **No content-pack/versioning concept** — users can't track which pack a tile came from or update it.
- **Disabled-defaults sync is capped** to guard corruption; a cleaner model would track disables as first-class records.

## Sync, accounts & offline

- **Anonymous accounts are single-device and unrecoverable.** Losing browser storage loses content unless exported. A lightweight "backup code"/email-link recovery for anonymous users would help.
- **Cross-device sync is real-time + LWW for content, but partial.** A per-user `onSnapshot` listener now pulls changes live, and custom tiles + game boards resolve last-writer-wins via `updatedAt` (see [data-and-sync.md](data-and-sync.md#sync-engine)). Still open: settings and custom groups are excluded from LWW; deletes don't propagate incrementally (no tombstones — `forceSync` only); LWW is client-clock based. A tombstone model and field-level settings merge would close the gaps.
- **Online mode still needs network for presence/video.** Graceful offline messaging + queued-chat feedback are now in place (offline banner, optimistic pending messages); rooms/presence/video remain inherently network-dependent.

## Tooling & docs

- **No automated dependency audit** in the documented workflow — add `npm audit` to CI.
