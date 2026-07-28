# Content packs

Importable content in the app's own export format (`ExportData`, see
`src/types/importExport.ts`). These are **not** default content — nothing here is
seeded, and none of it reaches a player who doesn't import it.

## How to use one

1. Custom Tiles dialog → import/export tab → import the `.json`.
2. To share it: PackCreator publishes the imported group to
   `content-packs/{id}` in Firestore, which hands you a code others open with
   `?importPack=<id>`.

Step 2 needs an authenticated account, so it can't be scripted from here.

## Format notes

- `formatVersion` is `2.1.0`. It describes the document's **shape**, not the
  meaning of its intensity values — a pack references tiles by `groupName` +
  `intensity`, and intensity is positional, so a pack written against one
  version of a group's ladder lands on whatever occupies those positions later.
  See the reorder warning in `docs/engineering/data-and-sync.md`.
- `contentHash` decides identical-vs-changed on re-import. `generateTileContentHash`
  hardcodes `gameMode: 'online'` in its hash input regardless of the tile's real
  mode, so a generator has to reproduce that quirk or every re-import looks
  changed.
- Placeholders are stored **canonical English**; `placeholderAliasService`
  localizes on edit. Anatomy tokens come from `ANATOMY_PLACEHOLDERS`
  (`src/types/localPlayers.ts`).

## `oral-any-anatomy.json`

Gender-neutral oral play for Shared Device (`gameMode: local`, `type: sex`,
`anatomyRequirement: any`). 57 tiles over four rungs — Warm Up, Tongue Work,
Focused, Relentless.

Anatomy is addressed only through **piped** tokens — `{genital|dom}`,
`{tip|dom}`, `{chest|dom}` — which resolve against the player filling that slot
rather than whoever is holding the phone. So one tile reads correctly for any
pairing:

| Receiver   | `…except {dom}'s {tip\|dom}` renders |
| ---------- | ------------------------------------ |
| male       | `…except Mac's tip`                  |
| female     | `…except Mac's clit`                 |
| non-binary | `…except Mac's tip`                  |

Two rules the content sticks to, both learned the hard way:

- **No depth or thrusting language.** "Take it deep" has no vulva equivalent.
  Motion is expressed as travel along a length ("base to {tip|dom}"),
  receiver-driven movement ("sets the rhythm against {sub}'s mouth"), or
  unattributed depth ("{dom} decides how deep") — never as something the giver
  takes in.
- **Never follow `{pronoun_subject|…}` with a present-tense verb.** It resolves
  to singular _they_ for a non-binary player, so "they wants" / "they has".
  Use the player's name there. `{pronoun_possessive|…}` is safe anywhere.

Tiles are untagged, so the female-dom strap-on substitution stays off and a
female dom reads as her own anatomy.

**Known gap:** local only. Solo/online play is the majority of sessions, and
solo oral is a different content design (toy-based, self-directed) that this
pack does not attempt.
