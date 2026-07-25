# ADR-0004: Presentation-only group content is read from the locale bundle, not Dexie

## Status

Accepted — 2026-07-25

## Context

Nine default action groups define their own wording for the two sides of a partnered action:
Butt Play `Top`/`Bottom`, Ball Busting `Buster`/`Bustee`, Throat Training `Receive Oral`/`Give Oral`,
Clit Training `Receiver`/`Giver`, plus spanking, tickling, electric and pissPlay. They live as
`dom`/`sub` keys on the group in `src/locales/{locale}/{online,local}-bundle.json`.

The Advanced Settings role selector already asked for them (`group?.dom || t('dom')`), but they never
arrived, so every group displayed the generic `Dominant` / `Switch` / `Submissive`.

The cause is the seeder: `importActionFile` (`src/services/migration/importOperations.ts`) builds each
group row from an **explicit field list** — `id, name, label, intensities, type, isDefault, locale,
gameMode`. Any other key present in the bundle, `dom`/`sub` among them, is silently dropped and has
never existed in Dexie.

The obvious fix — add `dom`/`sub` to `CustomGroupBase`, persist them in the seeder — is defeated by
how seeding is gated. `isCurrentLanguageMigrationCompleted`
(`src/services/migration/statusManager.ts`) returns true as soon as
`completedLanguages.includes(locale)`, and **never compares the stored version against
`MIGRATION_VERSION`**. A version bump is documentation only (already noted in
`docs/engineering/data-and-sync.md`). So a seed-time fix reaches **fresh installs only**: it type-checks,
it passes tests, and every existing player keeps the generic wording indefinitely with nothing on
screen to explain why.

## Decision

Read `dom`/`sub` from the locale bundle **at display time**, via
`src/services/groupRoleLabels.ts`. Do not persist them.

The service memoizes per `locale` + `ContentGameMode` behind an injectable loader, and returns `{}`
on a missing or malformed bundle — generic role wording is an acceptable outcome, a broken settings
page is not. Groups absent from the map (custom groups, imported packs, and defaults with no bespoke
wording) fall back to the generic labels at the call site.

The general rule this sets: **content that is presentation-only, locale-specific, and not
user-editable belongs in the bundle, and may be read from the bundle directly.** It does not need to
survive a sync, be overridable per player, or occupy a Dexie column.

## Considered alternatives

- **Persist `dom`/`sub` on the group row.** Rejected: unreachable for existing installs, per the gate
  above. Would also require either a schema field plus a re-seed strategy, or reworking the migration
  gate to compare versions — a far larger change, with a data-migration blast radius, for wording that
  no one syncs or edits.
- **Rework the migration gate to honour `MIGRATION_VERSION`, then persist.** Rejected _for this
  problem_: it forces every existing device to re-run seeding to fix two display strings. It remains
  the right move if a future change genuinely needs new data on existing devices — this ADR is not an
  argument against ever fixing the gate.
- **Derive the wording from group `type`.** Rejected: type says nothing about wording, and is not even
  a reliable proxy for _having_ roles — `confessions` and `wouldYouRather` are `foreplay` with zero
  role tokens (2 of 19 partnered groups).

## Consequences

- Existing players see the correct wording on the next page load. No re-seed, no schema change, no
  migration.
- The settings UI reads groups from Dexie and this one presentation concern from the bundle. That
  split is deliberate and scoped: anything gameplay reads, syncs, or lets a user edit must still go
  through Dexie.
- Custom groups and imported content packs cannot supply bespoke role wording. Acceptable — they have
  no bundle entry, and the generic labels are correct for them.
- A user-editable version of this wording later would supersede this ADR, since the "not
  user-editable" premise is what makes the bundle a valid source.
- The bundles are already dynamically imported by the seeder, so the extra read is usually a module
  cache hit and never larger than one locale's bundle (~48–79 KB for `en`).
