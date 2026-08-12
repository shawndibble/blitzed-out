# Webcam "I only see myself" — diagnosis & options (2026-08)

Reports: users open the cam panel, see their own preview, never see anyone else.

## Verified state

- Transport: `simple-peer` mesh, `MAX_PEERS = 4`, RTDB signaling (`src/services/firebaseSignaling.ts`).
- `simple-peer@9.11.1`, last published **2023-01-26**. Unmaintained.
- Deployed bundle (`origin/master`, Jul 28 2026) **does** contain TURN creds — TURN is not silently missing.
- Live ICE config: `stun:stun.l.google.com:19302` + `turn:global.relay.metered.ca:443` (UDP only).
- `cleanupVideoCallSignaling` (Functions v1 pubsub) prunes offers/answers/ICE >2min. It never prunes `users`.
- **Relay usage: 23 MB of 0.5 GB.** Quota intact, credentials valid — and near-zero relayed media,
  which is what a room full of connections that never establish looks like. See cause 1.

## Root causes, ranked

### 1. ~~Relay quota exhausted~~ — REFUTED, and the refutation is itself the strongest evidence

The dashboard reads **23 MB of 0.5 GB**. Quota is not the problem, and credentials work.

But 23 MB is _nothing_ — roughly a minute or two of relayed video, ever. Relayed 720p24 runs
≈0.9 GB/hour per direction. Two readings, and they point the same way:

- Almost no call ever needs relay (implausible: ~10–20% of connections cannot go P2P), **or**
- Calls that need relay never get far enough to move bytes.

A connection that fails ICE relays zero bytes. So near-zero relay usage is the fingerprint of
**connections not establishing at all** — not of media being throttled or cut off. That promotes
causes 3 and 4 (no retry, ghost presence) from contributing factors to the primary explanation,
and demotes the whole provider question from "the fix" to "worth doing anyway."

Cause 2 still contributes and is consistent with this: on a UDP-blocking network the single UDP
relay URL is unreachable, allocate never succeeds, and the byte counter never moves.

### 2. TURN is UDP-only — `src/config/webrtc.ts:20`

`turn:global.relay.metered.ca:443` with no `?transport=tcp` and no `turns:` entry. Networks that
block outbound UDP (corporate, university, hotel, some carriers) can reach neither STUN nor TURN.
Both sides see only themselves, deterministically, on that network.

### 3. No retry — `src/stores/videoCallStore.ts:428`

```ts
if (!userIdsChanged) return;
```

Peers get destroyed and deleted from the map on: 30s connect timeout (:239), `iceStateChange ===
'failed'` (:259), `error` (:201), `close` (:219). The RTDB `users` node did not change, so this
gate returns early and **the peer is never recreated**. One transient ICE failure = permanently
broken until page reload or a third person joins.

This is why the symptom is sticky instead of self-healing. Fixing it downgrades every other cause
from "permanently broken" to "reconnects in a few seconds."

### 4. Ghost presence — `videoCallStore.ts:478`, `firebaseSignaling.ts:182`

Neither `cleanup()` removes `video-calls/{roomId}/users/{userId}`. `onDisconnect().remove()` only
fires when the RTDB socket drops — closing the desktop video sidebar keeps the socket alive, so
the user stays listed as online. Others then open peer connections to a phantom that will never
answer, burning `MAX_PEERS = 4` slots and 30s timeouts each. Combined with cause 3, real joiners
get no peer at all.

The scheduled cleanup function does not prune `users`, so this does not self-heal server-side.

### 5. Mobile reconnect is broken by construction — `videoCallStore.ts:581`

`disconnectCall()` stops the local stream's tracks but leaves `peers` untouched — remote users now
receive ended tracks. `reconnectCall()` acquires a _new_ `MediaStream` and puts it in state, but
never calls `replaceTrack()` on any existing peer. Worse, `createPeerConnection` (:140) closes over
the original `stream` from :118, so peers created _after_ a reconnect attach the stopped tracks.

Reachable path: mobile only, `VideoControls` hang-up → call. Narrow, but real and unambiguous.

### 6. Zero telemetry

`peer.on('error', () => {})` (:201), bare `catch {}` at :305, :364, :396, empty `.catch()` in
`VideoCall/index.tsx:21`. We are blind on the one subsystem generating complaints.

## Fixes

**Immediate (independent of any transport decision):**

1. Full ICE URL list including TCP + TLS transports (see provider options below).
2. Replace the `userIdsChanged` gate with peers-vs-users divergence detection + bounded retry
   with backoff on `failed`.
3. Remove the presence node in `cleanup()`; prune stale `users` (by `joinedAt`) in
   `cleanupVideoCallSignaling`.
4. `replaceTrack()` on reconnect; hold the local stream in store state, not a closure.
5. Log through `logger`: ICE state transitions, and after connect `pc.getStats()` →
   selected candidate pair `local/remoteCandidateType`. `relay` vs `srflx`/`host` is the
   measurement that settles root cause #1. Connection metadata, not user content — safe under
   the CLAUDE.md `logger` constraint.

   **Open decision — this is dev-only today.** `logger` returns early unless `MODE` is
   `development`/`test`, so these lines reach a developer's console and nobody else. Answering
   the TURN question _for real users_ needs the candidate types reported at the Sentry boundary
   (`src/services/sentry.ts`), which is a deliberate privacy call, not a `logger` change: it
   sends new data to a third party. Connection metadata carries no user-authored content, so
   it is defensible — but it needs an explicit yes, and it is not wired up.

**Manual checks (5 min, browser):**

- ~~Metered dashboard → GB remaining.~~ Done: 23 MB of 0.5 GB. See cause 1.
- <https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/> — paste the TURN URL
  and creds from the bundle. Still worth running for the **TCP** entries specifically, since the
  deployed build only ever offered UDP and no user has exercised the others.
- `firebase functions:list` → confirm `cleanupVideoCallSignaling` is actually deployed (v1 API).
  If it never ran, stale offers accumulate and `onChildAdded` replays every historical offer to
  each joiner — which burns MAX_PEERS slots on ghosts and fits the near-zero relay usage too.

## Provider options (TURN relay)

TURN is part of ICE. It is not replaceable — some connections physically cannot go P2P. The only
question is who supplies relay bandwidth.

| Provider                     | Free tier                      | Transports                     | Creds                   | Notes                                                                                                                                                                                                                                  |
| ---------------------------- | ------------------------------ | ------------------------------ | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Metered** (current)        | **0.5 GB/mo on this account**  | UDP + TCP on 80/443, no TLS    | static, baked in bundle | Usage 23 MB — nowhere near the cap, so quota is not the failure. Their credential API returns exactly five entries for `global.relay.metered.ca` and none is `turns:`; the TLS host is the separate `staticauth.openrelay.metered.ca`. |
| **Cloudflare Realtime TURN** | **1,000 GB/mo**, then $0.05/GB | UDP, TCP, TLS (`turns:…:5349`) | API-generated, ≤48h TTL | 50× the free bandwidth. Shared with their SFU tier. `stun.cloudflare.com` free/unlimited.                                                                                                                                              |
| Self-host coturn             | server cost only               | all                            | any                     | Full control, ops burden, needs a static IP + TLS cert.                                                                                                                                                                                |

**Recommendation: Cloudflare Realtime TURN — but for security and transport coverage, not
capacity.** With usage at 23 MB, headroom was never the constraint. What still earns the switch is
short-lived credentials (the bundled ones are harvestable) and TLS transport, which the current
relay host does not serve. Treat it as hardening, not as the fix for this bug.

Original reasoning, still true on its own terms: 50× the headroom, and short-lived credentials fix
the harvestable-static-creds issue already flagged in `docs/engineering/security.md`. Cloudflare's
generated list covers UDP, TCP and TLS (`turns:…:5349?transport=tcp`), so it needs no help on
transport coverage; the "no TCP" line in their FAQ refers to RFC 6062 TURN-TCP **relaying to the
peer**, not to the client↔server transport. Metered stays as the bundled fallback for when the
minting call fails.

### Setting up Cloudflare TURN

Credentials are minted server-side because the API token that generates them must never ship in
the bundle. `functions/src/turnCredentials.ts` (callable `getTurnCredentials`) does that; the
client resolves through `src/services/iceServers.ts`, which caches until 10 minutes before expiry
and falls back to the bundled relay on any failure.

1. **Cloudflare dashboard → Realtime → TURN → Create.** Note the **TURN Key ID** and the **API
   token** it shows once. Key ID for this account: `9412188e6651449f97f28621fe04bac9`.
2. **Store the token as a Firebase secret** (Secret Manager — never a plain env var):

   ```bash
   firebase functions:secrets:set CLOUDFLARE_TURN_TOKEN
   # paste the API token at the prompt
   ```

3. **Set the key ID** as a normal env var in `functions/.env` (it is an identifier, not a secret):

   ```
   CLOUDFLARE_TURN_KEY_ID=9412188e6651449f97f28621fe04bac9
   ```

4. **Deploy:**

   ```bash
   firebase deploy --only functions:getTurnCredentials
   ```

5. **Verify** — the function should return an `iceServers` array. In the browser console on a
   signed-in session:

   ```js
   const { getFunctions, httpsCallable } = await import('firebase/functions');
   await httpsCallable(getFunctions(), 'getTurnCredentials')();
   ```

   Then paste one of the returned `turn:`/`turns:` URLs with its username/credential into the
   [trickle-ICE test page](https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/)
   and confirm `relay` candidates appear.

If either variable is missing the function fails closed and logs an error; the client keeps
working on the bundled Metered relay, so a misconfiguration degrades rather than breaks. That also
means a silent misconfiguration looks like "everything is fine" — check the function's logs after
deploying, and check the candidate-pair lines the client now logs.

## Transport options (should we drop simple-peer?)

`simple-peer` has been dead since Jan 2023. The negotiation code around it —
`lastProcessedOffer`, `lastProcessedAnswer`, `processingOffer` locks, `setTimeout(…, 100)`,
`setTimeout(…, 50)`, the 1-second release timer — is hand-rolled glare avoidance.

| Option                                                                          | Cost                        | Gets us                                                                                                                               |
| ------------------------------------------------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Native `RTCPeerConnection` + W3C perfect negotiation** (polite/impolite peer) | ~1-2 days, **zero deps**    | Deletes the entire lock/timeout apparatus. Standard, browser-maintained, `-13 KB` bundle. Recommended.                                |
| SFU (LiveKit / Daily / Jitsi)                                                   | ~1 week + vendor dependency | Lifts `MAX_PEERS = 4`, cuts client CPU/upload for large rooms. **Not indicated by this bug** — user base is solo/small-room dominant. |

Perfect negotiation is the honest answer to "is there something newer": it is the W3C-standard
replacement for exactly the glare problem this code hand-rolls, and it costs one dependency
_removal_ rather than a migration.

## Sources

- <https://developers.cloudflare.com/realtime/turn/faq/>
- <https://developers.cloudflare.com/realtime/sfu/pricing>
- <https://www.metered.ca/tools/openrelay/>
