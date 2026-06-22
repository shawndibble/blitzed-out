# Content pack directory + copy-only model

## Context

The original content-pack feature was deliberately **by-code/link only with no public directory** (recorded in `CONTEXT.md`), and imports created a **subscription** so authors could republish new versions and downloaders could pull updates (with a `packDetached` flag to protect local edits). This rework changes both, plus how a pack is scoped.

## Decision

1. **Group-scoped packs.** A pack bundles one or more author-selected **custom groups** (multi-select, ≥1) within a single `gameMode` + `locale`, carrying those groups' custom tiles and custom group definitions only — not default-group tiles and not disabled-default markers.

2. **Visibility + public directory.** Each pack is `private` (unlisted, importable by code — the original behavior) or `public` (additionally listed in a browsable directory, queried by `gameMode` + `locale`, newest-first, cursor-paginated). **Public is the default on publish.** All packs remain importable by code regardless of visibility. This **reverses the prior by-code-only stance**.

3. **Permanent-account gate + post-moderation.** Publishing _public_ requires a non-anonymous account; anonymous users keep private link-sharing. Moderation is report + manual Firebase-Console takedown (admin = the `admin` custom claim); no in-app admin UI in v1.

4. **Copy-only imports (replaces subscriptions).** Importing clones a pack into the user's own custom content as a one-time copy. The subscription subsystem is removed: `packSubscriptions` table + cross-device sync, `unsubscribePack` soft-remove, the "My subscriptions" UI, update-checking, version propagation, and the `packDetached` flag. Imported tiles keep only a lightweight `packId` + `packName` stamp for attribution and re-import dedupe. Authors may republish to update the _listing_, but existing importers are never notified.

## Considered alternatives

- **Pre-moderation queue / curated allowlist** — rejected: unsustainable for a solo maintainer with no moderation team.
- **Keeping the subscribe/update model** — rejected: the version-propagation machinery solves a rare event (author ships v2) at the cost of a permanent conflict class against downloaders' local edits, which `packDetached` only band-aids. Copy-only deletes the whole class.

## Consequences

- New users must upgrade to a permanent account to publish publicly (existing anonymous→permanent flow is reused).
- No data migration is required: the subscription feature has no real users yet, so its table, sync, and provenance fields are simply deleted.
- Public-directory queries need a Firestore composite index on `visibility` + `gameMode` + `locale` + `createdAt`, and the `allow list` rule must restrict listing to public packs only.
- True full-text search is out of scope for v1 (Firestore `where` covers equality/array filters via denormalized fields; substring search would need an external index later).
