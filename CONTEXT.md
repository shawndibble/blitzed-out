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
