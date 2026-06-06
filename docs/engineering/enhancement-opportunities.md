# Enhancement Opportunities

Companion to [README.md](README.md). A candid, engineering-honest list of current limitations and where the app could be improved or extended. Grouped by area. This is the doc to read before answering "what can we make better?".

> These are observations, not committed work. Validate against current source before acting — some may already be in progress on `develop`.

---

## Customization & data portability

- **Import/export is JSON files only** — no cloud "share link" for custom content, and no selective re-import UI beyond conflict preview. A share-by-code flow (reusing the existing `custom-actions`/`game-boards` public collections) could let users publish/subscribe to content packs.
- **No content-pack/versioning concept** — users can't track which pack a tile came from or update it.
- **Disabled-defaults sync is capped** to guard corruption; a cleaner model would track disables as first-class records.

## Tooling & docs

- **No automated dependency audit** in the documented workflow — add `npm audit` to CI.
