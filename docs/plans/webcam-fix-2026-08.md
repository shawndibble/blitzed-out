# Webcam "I only see myself" — diagnosis & options (2026-08)

Reports: users open the cam panel, see their own preview, never see anyone else.

## Verified state

- Transport: `simple-peer` mesh, `MAX_PEERS = 4`, RTDB signaling (`src/services/firebaseSignaling.ts`).
- `simple-peer@9.11.1`, last published **2023-01-26**. Unmaintained.
- Deployed bundle (`origin/master`, Jul 28 2026) **does** contain TURN creds — TURN is not silently missing.
- Live ICE config: `stun:stun.l.google.com:19302` + `turn:global.relay.metered.ca:443` (UDP only).
- `cleanupVideoCallSignaling` (Functions v1 pubsub) prunes offers/answers/ICE >2min. It never prunes `users`.

## Root causes, ranked

### 1. Metered free tier is 20 GB/month — almost certainly exhausted

720p24 relayed ≈ 2 Mbps ≈ 0.9 GB/hour **per direction, per relayed peer**. 20 GB is roughly
20 hours of relayed video _across the entire user base, per month_. Once the quota trips, TURN
allocate fails and every user behind symmetric NAT / CGNAT / corporate firewall sees only
themselves. Symptom is persistent, hits some users and not others, and worsens over the month —
which matches "getting messages" (plural, growing).

Discriminator: metered dashboard GB remaining; or trickle-ICE test returns no `relay` candidates.

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
   selected candidate pair `local/remoteCandidateType`. `relay` vs `srflx`/`host` answers the
   TURN question for every real user, permanently. Connection metadata, not user content —
   safe under the CLAUDE.md `logger` constraint.

**Manual checks (5 min, browser):**

- <https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/> — paste the TURN URL
  and creds from the bundle. `relay` candidates appear → creds/quota fine. Error → cause 1 confirmed.
- Metered dashboard → GB remaining.
- `firebase functions:list` → confirm `cleanupVideoCallSignaling` is actually deployed (v1 API).

## Provider options (TURN relay)

TURN is part of ICE. It is not replaceable — some connections physically cannot go P2P. The only
question is who supplies relay bandwidth.

| Provider                     | Free tier                      | Transports                     | Creds                   | Notes                                                                                     |
| ---------------------------- | ------------------------------ | ------------------------------ | ----------------------- | ----------------------------------------------------------------------------------------- |
| **Metered** (current)        | **20 GB/mo**                   | UDP/TCP/TLS on 80/443          | static, baked in bundle | Quota is the suspected failure.                                                           |
| **Cloudflare Realtime TURN** | **1,000 GB/mo**, then $0.05/GB | UDP, TCP, TLS (`turns:…:5349`) | API-generated, ≤48h TTL | 50× the free bandwidth. Shared with their SFU tier. `stun.cloudflare.com` free/unlimited. |
| Self-host coturn             | server cost only               | all                            | any                     | Full control, ops burden, needs a static IP + TLS cert.                                   |

**Recommendation: Cloudflare Realtime TURN.** 50× the headroom, and short-lived credentials fix
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
