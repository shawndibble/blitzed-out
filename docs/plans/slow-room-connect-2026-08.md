# "Connecting to the room is very slow" — diagnosis (2026-08)

Report: the participant-count badge (#1157) made room connect very slow; suspicion was the
guards that hold the call at 6 users.

> **Status.** The badge and the cap guards are **ruled out by measurement**. The cause is a
> presence-subscription cost that predates them and was fixed earlier the same day — that part
> is a leading hypothesis with one test outstanding, not a confirmed attribution. See § Open.

## Ruled out — measured

**The cap guards add no latency.**

- `callIsFull()` (`src/stores/videoCallStore.ts`) reads `useCallPresenceStore.getState()`
  synchronously. It awaits nothing, so it puts no round trip between the tap and the camera.
- It fails **open** before the first snapshot (`loaded && capacityCount >= MAX`), so it cannot
  stall a join while a read is in flight.
- `MAX_PEERS` went **up**, 4 → 5. The mesh is more permissive after #1157, not less.
- The only blocking behaviour is a refusal at 6 participants — a refusal, not a delay.

**#1157 moved the join path earlier, not later.** `CallPresenceWatcher` holds
`video-calls/{roomId}/users` open from room entry, so `initialize`'s own `onValue` on that node
gets RTDB's synchronous cached replay instead of waiting for a read. Covered by
`callRosterSharing.test.ts` against `src/__mocks__/realtimeDatabase.ts`, which models that
replay. The fake has no clock, so this shows ordering, not wall-clock:

|                             | `rosterLoaded` after `initialize` | `firebaseSignaling.listen()` bound |
| --------------------------- | --------------------------------- | ---------------------------------- |
| with watcher (post-#1157)   | `true`, synchronously             | yes, synchronously                 |
| without watcher (pre-#1157) | `false`                           | no — nothing until the read lands  |

Signalling binds sooner and the first dial happens sooner.

A theory that the change closed an offer-acceptance grace window at `handleSignal` was
**tested and disproved**: an offer from a peer absent from the roster is dropped identically
before and after #1157, because `listen()` is bound from _inside_ the first snapshot callback
in both versions, after `rosterLoaded` is set. That flag is therefore always true at
`handleSignal`, so its fail-open branch is unreachable. The guard itself is right and stays —
keying on an _empty_ roster instead would genuinely reopen the gate. Only the comment's
rationale was wrong, and it was corrected in place.

## Leading hypothesis — presence subscription cost

`getUserList` (`src/services/roomPresence.ts`) holds `onValue` on the **whole** `users` node
and filters by room in the browser. It is unconditional for every client in a room
(`UserListProvider`, mounted per route in `RouterSetup`) — no `roomRealtime` gate.

The cost that fits the report is **not** the initial download: 1156 rows is ~171 KB over an
already-open socket, a few hundred ms. It is the steady state. `onValue` on the parent node
re-fires with the entire node on **any** presence write by **any** user platform-wide, and the
handler re-scans every row and publishes unconditionally (its docblock: "no de-dup baseline").
At 1156 rows with clients heartbeating every 60s that is continuous full-node rescan, store
update and re-render on the main thread — and it scales with the backlog.

`b1eec9c68` found the node at 1156 rows because the 5-minute sweep had been failing silently
(see `docs/plans/gen2-functions-cutover.md` for the fan-out cap that caused it). It deployed as
master `7d589b440` at **11:15:06 CDT** on 2026-08-22. The badge deployed as `a8f173942` at
**13:31:04 CDT** — after the fix, which is why it caught the blame.

Observed 2026-08-22 ~13:45 CDT: `/users` down to single digits; `cleanupStaleUsers` logging
"No stale users found" every 5 minutes; `/video-calls/PUBLIC/users` null.

## Ruled out — other suspects

- **Cloud Functions.** Only one callable sits on any client path (`getTurnCredentials`), it is
  fired without `await` in `initialize`, and its logs show successful mints. Gen 2 cold start
  (~2.5-4s) is real but never blocks the UI.
- **TURN misconfiguration.** The deployed chunk `js/index.tsx-BfsJG3Ss.js` carries the Metered
  relay host and credentials, so the bundled fallback is intact. Intact, not safe: static relay
  credentials in a public Pages bundle are a standing exposure, which is why
  `getTurnCredentials` mints short-lived ones over the top. Mask the values if you reproduce
  this check.
- **RTDB instance split.** `getRealtimeDb()` is `getDatabase(app)`, and bare `getDatabase()`
  resolves to the same default app — one instance, one socket, one cache.
- **The 20 → 10 minute prune change** (`b76b39bf0`). It prunes _more_, and only touches
  `users/`, not `video-calls/`.

## Bounded #1157 note

`ICE_SERVERS` is 5 entries (1 STUN + 4 relay) in both versions, so at full capacity a
participant gathers against 25 rather than 20 — +25% per participant, and 10 → 15 connections
mesh-wide. A 5-6-person call-quality concern, not a room-entry one.

#1157 also added one RTDB listener at room entry for every user (`CallPresenceWatcher`).
Room-scoped and tiny, but it is the only thing the change put on the room-entry path, so it
belongs in the ledger.

## Open

1. Does the slowness reproduce after a hard reload **now**? If yes, the backlog is not the
   cause and the next suspect is `037260777` (#1151), the native `RTCPeerConnection` rewrite.
2. Should `getUserList` become room-scoped? `room` is uppercased on both write and read, so
   `orderByChild('room').equalTo(...)` returns server-side exactly the set the browser filter
   builds. The rules need `.indexOn: ["lastSeen", "room"]` — dropping `lastSeen` re-breaks the
   sweep. It would decouple room entry from platform-wide user count instead of leaving the
   sweep as the only thing holding that cost down. ADR material if adopted.
