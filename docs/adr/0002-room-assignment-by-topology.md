# ADR-0002: Room Assignment Strategy by Player Topology

## Status

Accepted — 2026-05-23

## Context

The wizard redesign introduces an explicit player topology choice (Solo / Shared Device /
Individual Devices) as the first setup step. Each topology needs a room assignment strategy
for the Room view (`/:id`).

Three alternatives were considered for Solo and Shared Device:

1. **Reserved room words** (`SOLO`, `LOCAL`) — skip Firebase entirely for these paths
2. **Auto-generated private room codes** — same client-side nanoid generation used for
   all rooms; Firebase offline persistence handles offline transparently
3. **Dedicated routes** (`/solo`, `/local`) — bypass the room system entirely

## Decision

### Solo

Default to PUBLIC room. Optional "play privately" toggle auto-generates a private room code.
Solo players in PUBLIC can share a session with other online solo players.

Solo topology maps to `gameMode: 'solo'`, which selects solo-specific action content and
drives anatomy/role collection in the Game Mode step.

### Shared Device

Always auto-generate a private room code (client-side nanoid, no Firebase call required).
Firebase `persistentLocalCache` queues any writes when offline and syncs on reconnect.

### Individual Devices

Always requires explicit room selection (PUBLIC or private). Disabled when offline.

## Rationale

Auto-generated rooms (option 2) eliminate special-case handling in every hook and the Room
view. Room code generation is client-side — no Firebase call needed — so it works offline.
Shared device gameplay is almost entirely IndexedDB-backed anyway; Firebase writes for that
path are minimal and can queue transparently.

Reserved words (option 1) would require `isLocalRoom()` / `isSoloRoom()` guards throughout
`usePresence`, `usePrivateRoomMonitor`, and the Room view. That coupling grows over time.

Dedicated routes (option 3) require routing surgery and a parallel render path for the Room
view.

## Consequences

- No `LOCAL` or `SOLO` reserved room IDs needed.
- Firestore offline persistence from ADR-0001 covers Firestore reads/writes for generated rooms.
  It does not cover Realtime Database features such as presence or `onDisconnect`; those features
  must no-op or degrade gracefully when the browser is offline.
- Individual Devices remains the only topology that requires network at setup time.
- A shared-device session started offline will sync its room to Firebase once connection
  returns — the room code is real and durable.
