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
