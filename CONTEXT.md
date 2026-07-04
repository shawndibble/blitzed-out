# CONTEXT.md — Blitzed Out Domain Glossary

This file defines shared domain terminology for setup, rooms, player topology, and game mode.
Architectural decisions live in `docs/adr/`.

---

## Player Topology

How players are physically distributed across devices. Determined at setup before any other configuration.

### Solo

One player, one device. Topology label for solo play. By default, solo uses the PUBLIC room;
a private solo option may auto-generate a private room code.

### Shared Device

Two to four players sharing one physical device. Uses a client-generated private room code
online and offline. Does not use a reserved `LOCAL` room.

### Individual Devices

Two or more players, each on their own device. Always requires a room (public or private).
Unavailable when offline.

---

## Room

An identifier that scopes Firebase messages, presence, and sync. Users navigate to `/:id`.

### PUBLIC Room

The shared room for solo and individual-devices players who want to play alongside strangers. Room ID: `"PUBLIC"`.

### Private Room

An invite-only room identified by a 5-character auto-generated code. Used for individual-devices
sessions with friends, private solo sessions, and shared-device sessions.

---

## Game Mode

`GameMode = 'solo' | 'online' | 'local'`

`gameMode` determines the action/content set shown to the player. It also maps directly to
player topology in the new wizard flow.

| Value      | Player Topology    | Room                                       |
| ---------- | ------------------ | ------------------------------------------ |
| `'solo'`   | Solo (one player)  | PUBLIC (default) or auto-generated private |
| `'online'` | Individual Devices | PUBLIC or private (user selects)           |
| `'local'`  | Shared Device      | Always auto-generated private              |

### Three topologies, two content sets

The **wizard/topology** surface has **three** values (`solo` / `online` / `local`) — they pick the room and player layout.

The **content** surface has only **two** game modes: `online` and `local`. Canonical list:
`GAME_MODES = ['local', 'online']` in `src/services/migration/constants.ts`. These are the only
modes for which action groups, translation bundles (`{lang}/{online,local}-bundle.json`), custom
action groups, and content packs exist.

`solo` is **not** a content set. Solo topology reuses `online` content, narrowed by
`usesSoloActions(gameMode, soloPlay)` (see [Participation Style](#participation-style-soloplay)).
Anything that builds, seeds, bundles, migrates, or lists **content** must iterate `GAME_MODES`
(2 modes), never the 3-value topology list — a `solo` content filter is always empty.

The content surface has its own type, `ContentGameMode` (`'online' | 'local'`, in
`src/types/Settings.ts`). The topology→content mapping lives at **one seam**:
`deriveContentMode` / `useContentMode` in `src/stores/settingsStore.ts`. Content consumers
(stores, `buildGameBoard`, `importActions`, pack queries) take `ContentGameMode` parameters and
never re-derive it; the compiler rejects a raw topology value.

**Topology-room invariant** (ADR-0002): Shared Device (`local`) always plays in a private room,
so `local` + PUBLIC is invalid. `enforceTopologyRoomInvariant` (settingsStore) repairs it by
promoting to `online` — applied on every settings write and to staged wizard/board form data.

> ⚠️ Naming collision: `solo` is also a group **type** (`solo` / `consumption` / `foreplay` /
> `sex`), unrelated to the `solo` topology. Group type ≠ game mode.

---

## Room Realtime (`roomRealtime`)

Controls presence update behavior for Individual Devices sessions. `true` = real-time (auto-disconnect on page leave). `false` = delayed (20-min server-side cleanup). User-facing option surfaced in Advanced Settings within the Individual Devices room selection step. Not relevant for Solo or Shared Device.

---

## Anatomy

A player's gender selection (`male` / `female` / `non-binary`) used to personalize action tile text. Collected per-player in Shared Device setup. Collected as a single setting in Solo and Individual Devices setup.

## Role

A player's role (`dom` / `sub` / `vers`) used to filter and personalize actions. Collected per-player in Shared Device setup. Collected in Individual Devices setup **only when `soloPlay === false`** (group play). Not collected for Solo mode.

A `vers` player takes dom or sub per the action's needs; when an action requires **both** roles, the assignment is a random coin flip per roll **by design** (versatile = either, each time) — see `actionStringReplacement.ts`.

## Participation Style (`soloPlay`)

Applies to Individual Devices (`online`) mode only. Determines whether the player receives solo-only content or partner-interaction content.

| Value            | Meaning                                        | Sections shown in GameModeStep |
| ---------------- | ---------------------------------------------- | ------------------------------ |
| `true` (default) | Solo-sexual — actions are for the player alone | Anatomy only                   |
| `false`          | Group play — actions involve partners          | Anatomy + Role + Naked/Clothed |

Defaults to `true` (solo-sexual) to preserve backward compatibility with existing settings. Not applicable to Solo or Shared Device topology.

Action type filtering (`shouldPurgeAction`) and preset selection both use `usesSoloActions(gameMode, soloPlay)` to determine whether to show solo vs. foreplay/sex content.

---

## Offline vs Temporarily Offline

### Offline (fully offline)

`navigator.onLine === false` at setup time. Individual Devices option is disabled. Solo and
Shared Device generate room codes client-side when needed and play from cached data. Firestore
writes queue via `persistentLocalCache` and sync on reconnect. Realtime Database features such
as presence are separate from Firestore persistence and must degrade gracefully when offline.

### Temporarily Offline

Network lost mid-session. Firestore `persistentLocalCache` queues Firestore writes locally and
syncs on reconnect. Realtime Database features such as presence may be unavailable until network
returns.

---

## Casting & TV

How a Room's game state is mirrored onto a television. Three distinct pieces, often loosely
called "the receiver" — they are not the same thing.

### Cast Sender

The control surface in the player's own browser that owns the cast session and tells the TV what
to show. Today this is Chromecast-specific. A Sender starts/stops a session and pushes the target
Room to the receiving display. It does not render the game itself.

### Receiver shell

The thin HTML application registered to a casting platform under a vendor-issued application ID,
hosted outside this repository. Its only job is to receive the Sender's instruction and render the
in-repo Cast view for the target Room. Platform-specific (a Chromecast receiver is not a Roku channel).

### Cast view

The read-only display of a Room's current state intended for a television: whose turn is next,
the current action, and the Room background/video. It is the same regardless of which platform
delivered it, and can also be reached directly by opening the Room's cast URL in a TV browser.
"Read-only" means it shows state but cannot drive the game (no remote roll).

---

## Content Pack

A durable, shareable bundle scoped to **one or more selected custom groups** (multi-select; ≥1)
within a single `gameMode` + `locale`, published to the `content-packs` Firestore collection. The
payload carries the selected groups' **custom tiles** plus the **custom group definitions** for
those groups — it does **not** carry default-group tiles (the importer already has them) or
disabled-default markers. Distinct from a shared **game board** (a `?importBoard=<id>` snapshot of
a generated board + settings): a pack is reusable source content copied into your library, a
board is one assembled game. **A pack is imported as a one-time copy** into the importer's own
custom content — there is no subscription, no version propagation, and no auto-update. Imported
tiles carry a lightweight `packId` + `packName` stamp purely for attribution ("from _X_ by author")
and to dedupe re-imports; once copied, they are ordinary custom tiles the importer fully owns. An
author may edit and **republish** a pack (updating the directory listing), but existing importers
are never notified and keep their copy unchanged.

### Pack Visibility

Every pack has a `visibility` of `private` or `public`. **All packs are importable by code/link**
(`?importPack=<id>`) regardless of visibility — visibility only governs _discovery_:

- **Private**: unlisted. Importable only by someone who has the code/link. This is the original
  by-code-only behavior.
- **Public** (default on publish): additionally appears in the browsable public **directory**.
  Visibility is flippable after publish (public→private removes from the directory).

### Public Directory

The browsable list of `public` packs. Reverses the original by-code-only model (see ADR). Queried
by `gameMode` + `locale` (Firestore `where` on indexed fields), sorted newest-first, paginated by
cursor. Publishing **to the directory** (i.e. publishing public) requires a **permanent
(non-anonymous) account**; anonymous users may still publish private packs and share by code.
Moderation is **report + console takedown** (`reportPack` → `reports/` collection → admin deletes
via Firebase Console); there is no in-app admin UI in v1. Admin = the Firebase Auth `admin` custom
claim, granted out-of-band.

### Pack Summary

Denormalized fields stored on the pack doc at publish time (`tileCount`, `groupCount`,
`groupLabels`) so directory cards render without parsing the full `contents` blob, and so the list
is filterable/searchable server-side. The full per-tile preview (a grid of action cards) parses
the already-loaded `contents`.
