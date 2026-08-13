# Video presence indicators + mobile layout

Status: **phases 0–3 and 5 shipped 2026-08-12.** Phase 4 (the stall watchdog) is deliberately
not built — see the note at the end of that phase. Design settled 2026-08-12 via a grilling
session; the decision table below is the record of what was chosen and why.

Two problems, one plan. They share files, so they ship together.

1. **A peer with camera and mic off renders as a black rectangle with no indicator.** The overlay to show one already exists and is unreachable.
2. **The mobile video panel gives 47% of the viewport to actual video.** The rest is padding, a count header, and double-counted bottom gutters.

---

## Problem 1: why the black box happens

`VideoTile/index.tsx:104-120` already renders a `VideocamOff` overlay, gated at `:53-54`:

```ts
const videoTrack = stream?.getVideoTracks()[0];
const isVideoOff = !videoTrack || !videoTrack.enabled;
```

`enabled` is a **sender-local** flag. Per [webrtc-pc](https://www.w3.org/TR/webrtc/#dom-rtcrtpsender-track), a disabled video track means the sender _"MUST send black frames … SHOULD send one black frame per second"_ — the SSRC stays alive, so the receiver's copy of the track keeps `enabled === true` and `muted === false` forever. The overlay's condition is permanently false for remote peers. This is mandated behaviour, not a browser bug.

`track.muted` is not the fix either: per [webrtc-pc §9.3](https://www.w3.org/TR/webrtc/#mediastreamtrack) it only flips when RTP _stops arriving_ (BYE or SSRC timeout) — a transport fact, not an intent fact. Cross-browser it is worse: Firefox's implementation is marked partial in BCD, and on iOS Safari `mute` fires for tab backgrounding and incoming cellular calls, which have nothing to do with user intent.

A second, independent bug: `VideoCallPanel.tsx:26-42` hardcodes `isMuted: false` and `isSpeaking: false` for **every** participant including local, so the mute badge at `VideoTile:85-102` is unreachable even for yourself.

**Every production SDK signals mute out-of-band.** LiveKit has a dedicated `MuteTrackRequest` proto message and reads `TrackPublication.isMuted` from `info.muted`, never from the track. Twilio sets it from its Room Signaling Protocol payload. Jitsi carries `audiomuted`/`videomuted` in XMPP MUC presence. None infer it from `MediaStreamTrack`.

## Problem 2: where the mobile pixels go

Closed ledger, 640px viewport, Video tab:

```text
  64   BottomTabs paddingTop '4rem'        BottomTabs/index.tsx:44   (nav is ~50px → 14px dead)
+  8   TabPanel p:1 top
+  8   VideoCallPanel p:{xs:1} top          VideoCallPanel.tsx:53
+ 20   VideoGrid count header text          VideoGrid/index.tsx:60
+ 16   header mb:2                          VideoGrid/index.tsx:47
+302   >>> ACTUAL VIDEO <<<                                          47% of screen
+ 16   grid wrapper mb:2                    VideoCallPanel.tsx:57
+ 80   VideoControls (p:2 + 40px icons)     VideoControls/index.tsx:78
+ 70   VideoCallPanel pb:{xs:'70px'}        VideoCallPanel.tsx:54
+  8   TabPanel p:1 bottom
+ 48   bottom tab bar
────
 640
```

Compounding this, tiles force 4:3 (`VideoTile:62`, `paddingTop: '75%'`) while the camera is requested at 16:9 (`videoCallStore.ts:46-52`). Two stacked tiles come to 1.5 × panel width of content, which overflows and forces the scroll that clips the second tile — and the ratio mismatch crops ~25% off the left and right of every frame.

The `pb: '70px'` reserves clearance for the ROLL button _outside_ the scroll container, so it is dead height on every tile permanently. ROLL is `position: fixed`, `z-index: 1100` (`RollButton/styles.css:1-10`), mounted at `Room/index.tsx:294` as a sibling of the tabs — one instance floating over all three tabs.

---

## Settled decisions

| #      | Decision                                                                                                                                                                       |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Q1/Q26 | Camera-off peers **collapse in place** to a compact row (avatar + name + state label). No reordering, ever.                                                                    |
| Q2     | Four surfaced states: `connecting`, `no video`, `reconnecting`, `failed`. A fifth, transport-stalled, was to come from the watchdog — **deferred with it, see Phase 4**.       |
| Q3     | Muted badge only. No speaking indicator (deferred).                                                                                                                            |
| Q4/Q27 | Mobile call controls move to a row directly under the nav bar, smaller icons. Desktop unchanged.                                                                               |
| Q5     | Controls stay Video-tab-only.                                                                                                                                                  |
| Q6/Q9  | Scrolling column retained. Bottom spacer inside the scroll content clears the ROLL button.                                                                                     |
| Q7     | Indicators both platforms; top-control-row layout mobile-only.                                                                                                                 |
| Q8     | Media state signalled on the RTDB roster node; heartbeat payload carries the flags.                                                                                            |
| Q13    | New `PeerTransportPort` connection-state surface. Per-tile Retry on `failed`.                                                                                                  |
| Q14    | Participant count header desktop-only.                                                                                                                                         |
| Q15    | Order: remote peers in stable roster order, local last. Never reorders on toggle.                                                                                              |
| Q17    | Compact rows come from the **video-call roster only**, not room presence.                                                                                                      |
| Q18    | Name + state icon + terse label.                                                                                                                                               |
| Q19    | ROLL stays on the Video tab. Its options popper flips to `bottom-end` on mobile.                                                                                               |
| Q23    | Peers on old clients (no flags) → unknown: tile if a track flows, name-only row if not, no reason label.                                                                       |
| Q24    | Snap, don't animate.                                                                                                                                                           |
| Q25    | Fixed tile aspect via CSS `aspect-ratio`; a binary `data-orientation` flag switches `object-fit` between `cover` and `contain`. Tile size never derives from track dimensions. |
| Q28    | Camera off → `stop()` the track (kills the LED) + signal. Mic off → `enabled = false` + signal.                                                                                |
| Q29    | Build the stall watchdog. **Not built — deferred, see Phase 4.**                                                                                                               |
| Q30    | Wire format: `cam: 'on' \| 'off' \| 'none' \| 'hidden'`, `mic: 'on' \| 'off'`.                                                                                                 |

### Deliberate divergences from industry practice

Recorded so these read as chosen bets, not oversights.

- **Collapsing camera-off tiles.** Meet, Zoom, Teams, Discord and Jitsi all render a camera-off participant as a full, equal-size tile. Teams states it explicitly: _"Gallery view will show participants equally in the meeting window, whether their cameras are turned on or off."_ The only camera-state feature any of them ships is an opt-in, per-viewer toggle that hides such participants **entirely** — never a demotion. Jitsi issue [#7210](https://github.com/jitsi/jitsi-meet/issues/7210), which proposed exactly "videos first, shrink rest", was closed `wontfix`. The justification for diverging: those products optimise a 49-tile desktop grid, and this app is at most 4 peers inside a 320px drawer, where a full tile for someone showing nothing is unaffordable. Collapsing in place (rather than reordering) keeps the part they are right about — Microsoft's published rationale that a varying arrangement carries real cognitive cost, since _"a whole area of the brain is devoted to spatial memory"_.
- **Top-anchored mobile controls.** Bottom-anchored is universal in this category; thumb-reach research puts the comfortable arc in the lower two-thirds. Justification: the ROLL button already owns the bottom thumb zone, so a third stacked bottom bar is worse than an unusual anchor — and a top-anchored hangup is harder to mis-tap, which matters here.

---

## Design

### Wire format

Two new children on the existing per-user roster node:

```text
video-calls/{roomId}/users/{uid} = {
  joinedAt, lastSeen, status: 'online',
  cam: 'on' | 'off' | 'none' | 'hidden',
  mic: 'on' | 'off',
}
```

- `none` — `getUserMedia` returned no video track (no camera, or permission denied). Distinct from `off` so the UI can say "No camera" rather than implying a deliberate choice.
- `hidden` — page backgrounded. Today `handleVisibilityChange` (`videoCallStore.ts:603-615`) sets `track.enabled` and nothing else, so a backgrounded tab, a camera-off tap and a broken transport are all the same black rectangle.

`database.rules.json:21` currently validates only `hasChildren(['joinedAt','status'])`, so extra children read as permitted — **verify with a real write before relying on it.**

`firebaseSignaling.ts:247` does a full `set()` on the node every 30s (`startHeartbeat`, `videoCallStore.ts:722-726`), which would clobber siblings. The heartbeat payload carries the flags; it does not become an `update()`.

### Tile state machine

Resolved per peer, in precedence order:

| Condition                                                                | UI                                                                   |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| No `RTCPeerConnection` yet, or `connectionState` ∈ {`new`, `connecting`} | Spinner, label **Connecting**                                        |
| `connectionState === 'failed'` after ICE restart                         | Collapsed row, red, label **Disconnected**, **Retry** button         |
| `connectionState === 'disconnected'` held past debounce                  | Collapsed row, amber, label **Reconnecting**                         |
| roster `cam: 'on'` but watchdog reports no bytes                         | Collapsed row, amber, label **Reconnecting**                         |
| roster `cam: 'none'`                                                     | Collapsed row, label **No camera**                                   |
| roster `cam: 'hidden'`                                                   | Collapsed row, label **Away**                                        |
| roster `cam: 'off'`, `mic: 'on'`                                         | Collapsed row, label **Audio only**                                  |
| roster `cam: 'off'`, `mic: 'off'`                                        | Collapsed row, label **Viewing only**, both icons                    |
| roster `cam: 'off'`, mic unpublished                                     | Collapsed row, label **Camera off**                                  |
| roster flags absent (old client)                                         | Video tile if a track flows, else collapsed row, name only, no label |
| otherwise                                                                | Video tile; muted badge overlaid if `mic: 'off'`                     |

Key rule: **the same component and the same DOM node render both forms.** Only the box height changes. No `key` change, no tree-position change, so the `<video>` element is never destroyed and `srcObject` is never lost.

### Connection state

Key on `RTCPeerConnection.connectionState`, not `iceConnectionState` — it folds in DTLS, and a DTLS failure with ICE connected looks exactly like "I only see myself". The "Safari lags on `connectionState`" caveat is stale: Safari 11, Chrome 72, Firefox 113.

`disconnected` is explicitly transient — per spec, _"a transient state that may trigger intermittently (and resolve itself without action) on a flaky network"_ — so it is debounced before surfacing. Reuse `ICE_RESTART_GRACE_MS = 2500` from `NativePeerTransportAdapter.ts` so the banner and the ICE restart timer cannot disagree.

`failed` arrives ~30s late (ICE consent expiry, [RFC 7675](https://www.rfc-editor.org/rfc/rfc7675)), which is why the watchdog exists.

### Stall watchdog

Poll `RTCRtpReceiver.getStats()` every 2s per peer. Two consecutive polls with zero `bytesReceived` delta, while the roster says `cam: 'on'`, → transport stalled. Surfaces a break in ~4s instead of ~30s.

**The watchdog must be armed, or it false-fires on every camera-on.** The roster flips to `cam: 'on'` immediately, but the sender still has to re-acquire via `getUserMedia`, `replaceTrack`, and deliver a first keyframe — seconds later. An unarmed watchdog sees two zero deltas in that window and paints **Reconnecting** on a peer who is fine. The same happens at join, where `connectionState` reaches `connected` before frames flow. So: do not evaluate a peer until both (a) a grace period has elapsed since that peer's `cam` last transitioned to `'on'`, and (b) at least one non-zero `bytesReceived` has been observed. `ICE_RESTART_GRACE_MS` (2500) is the obvious constant to reuse, but a camera re-acquire may need longer — measure rather than guess. Getting this wrong produces a symptom indistinguishable from the #1150/#1151 bug this is meant to disambiguate.

**Do not key on `framesDecoded`.** Chrome does not decode without a sink, so a hidden or detached `<video>` freezes the counter while packets arrive fine. It is usable only as a secondary signal to separate "packets arriving but not rendering" from "no packets". `freezeCount`/`pauseCount` are useless here — both only increment when a frame is _finally_ rendered, so during an ongoing outage they never move.

### Aspect ratio

Fixed tile geometry, `object-fit` switched on a binary orientation flag — LiveKit's pattern:

```scss
object-fit: cover; // landscape
&[data-orientation='portrait'] {
  object-fit: contain;
} // never crop a portrait sender
```

Orientation comes from the video element's `videoWidth > videoHeight`, read on `loadedmetadata` and updated on `resize`. **Not** from `track.getSettings()` — remote receiver tracks start with no width/height/aspectRatio, and Firefox returns an empty object for non-`getUserMedia` tracks.

Tile height must never derive from track dimensions: simulcast and bandwidth adaptation change them mid-call, which would reflow the whole column every time a connection dips.

---

## Implementation

### Phase 0 — prerequisites

These are bugs that would make the rest look broken. No new behaviour.

1. `VideoCallPanel.tsx:14-15` — narrow selectors mean `toggleVideo`/`toggleMute` do not re-render the panel on mobile. Desktop works only by accident (`VideoSidebar:22` subscribes to the whole store). Widen to include media state.
2. `VideoCallPanel.tsx:26-42` — stop hardcoding `isMuted`/`isSpeaking`.
3. `VideoCallPanel.tsx:20-25` — the participants list must be driven by the **union of `liveRoster()` uids and `state.peers`**, with roster-only entries rendering as `Connecting`. Relaxing the trackless filter alone is not enough: a peer in the roster who has not been dialled yet is absent from `state.peers` entirely (`videoCallStore.ts:101-105` holds only dialled peers), so the `Connecting` state would be unreachable. This changes what `VideoCallPanel` subscribes to, and therefore what Phase 2's tile receives.
4. `TabPanel/index.tsx:16,35` — the `style` prop is merged into the inner `Box` `sx`, not the outer div, so `BottomTabs:58`'s `flex: 1` lands on a child of a plain block div (inert) and its `overflow: 'hidden'` overrides the default `overflow: 'auto'`.
5. `index.html:20` — add `viewport-fit=cover`. Without it the two existing `env(safe-area-inset-bottom)` uses (`PackCreator/index.tsx:623`, `GameSettingsWizard/ActionsStep/LevelSheet.tsx:61`) resolve to 0 on iOS.
6. `100vh` → `100svh` at `BottomTabs/index.tsx:46` and `VideoSidebar.tsx:124`. `svh` is the smallest stable viewport, so no resize thrash while scrolling; plain `vh` maps to the _large_ viewport by spec, which is why it overflows on iOS Safari.

### Phase 1 — signal media state

- `videoCallStore.ts` — `mediaState: Record<uid, { cam, mic }>` populated from the roster subscription (`:442-457`). **Remote tiles read this; the local tile reads local store state directly** — otherwise your own camera-off tap does not render until the RTDB write echoes back.
- `firebaseSignaling.ts` — heartbeat payload (`:247`) carries `cam`/`mic`. It must read the **current** flags at fire time, not values captured when `startHeartbeat` was called (`videoCallStore.ts:722-726`) — a closed-over snapshot silently reverts a toggle 30 seconds later, which presents as "the mute badge un-mutes itself" and is miserable to diagnose.
- `toggleMute` (`:579`) — keep `enabled = false`, publish `mic`.
- `toggleVideo` (`:590`) — `stop()` the track and `replaceTrack(null)` on the sender; publish `cam: 'off'`. Un-toggling re-acquires via `getUserMedia` and reuses the existing `replaceLocalTracks` path. **The re-acquire must be video-only.** Q28 chose `stop()` for the camera precisely to keep the mic warm; a `getUserMedia({ audio, video })` re-acquire would take the mic down too and reintroduce the Bluetooth profile switch and clipped first words. Check whether `replaceLocalTracks` currently re-acquires both — if it does, splice a video-only acquire into the existing stream and leave the audio track untouched.
- `handleVisibilityChange` (`:603`) — publish `cam: 'hidden'`. Note this handler is currently declared and never called from any component; wiring it is part of this phase.
- Initial publish on join: `cam: 'none'` when `getUserMedia` yields no video track.
- `database.rules.json` — confirm the new children validate; extend `.validate` if not.

### Phase 2 — tile presentation

- `VideoTile/index.tsx` — replace `paddingTop: '75%'` (`:62`) with CSS `aspect-ratio`; add the `data-orientation` flag; add the collapsed variant; render `TextAvatar` + name + state label; keep the existing muted badge (`:85-102`) and drive it from real state. The collapsed variant drops `aspect-ratio` entirely, or it fights the fixed row height.
- `TextAvatar/index.tsx` — `stringAvatar` hardcodes 18/24px (`:38-39`). Add a numeric size prop, following `PlayerGenderAvatar`'s precedent. Also remove the vestigial `player-online` class at `:58` — no CSS rule for it exists anywhere in the repo.
- Display names: `VideoTile` currently receives only `participantId`. Bridge via `useUser(uid)?.displayName` (`userListStore.ts:196`).
- i18n: new keys in all six `translation.json` files. `videoCall.muted` and `videoCall.cameraOff` already exist and are unused.

Label set:

| State                    | Label                  |
| ------------------------ | ---------------------- |
| cam off, mic on          | Audio only             |
| cam off, mic off         | Viewing only           |
| cam off, mic unpublished | Camera off             |
| no camera                | No camera              |
| backgrounded             | Away                   |
| connecting               | Connecting             |
| reconnecting             | Reconnecting           |
| failed                   | Disconnected (+ Retry) |

### Phase 3 — connection state

- `PeerTransportPort.ts` — add a connection-state callback to the port interface.
- `NativePeerTransportAdapter.ts` — wire `pc.onconnectionstatechange` (`:108-118` is the existing track handler for reference).
- `videoCallStore.ts` — store per-peer connection state; `PeerConnection` is currently `{ peer, stream }` only (`:101-105`).
- Per-tile Retry on `failed`, routed to the existing per-peer reconnect rather than the global one.
- Store tests pass a literal fake through `setPeerTransportFactory`.

### Phase 4 — stall watchdog (NOT BUILT)

Deferred deliberately. Phases 1–2 already remove the black box; this phase only disambiguates the last case, and it is the one most likely to produce false positives — the roster flips to `cam: 'on'` seconds before frames flow, so without the arming grace below it paints "Reconnecting" on healthy peers. Worth adding once real calls have been watched with the states that did ship.

- Expose receiver stats through the port.
- 2s interval per peer; two zero-deltas on `bytesReceived` while roster says `cam: 'on'` → stalled.
- Cheaper optional companion: `HTMLVideoElement.requestVideoFrameCallback` as an always-on presentation watchdog when the tile is visible (Baseline since Firefox 132, Oct 2024), with the stats poll disambiguating when it goes quiet. Shares the same sink-gating blind spot, so it does not replace the poll.

### Phase 5 — mobile layout

- `VideoControls/index.tsx` — mobile branch renders above the grid; smaller icons. MUI's default `IconButton` is 40×40, which clears WCAG 2.2 AA (24px) but misses Material's 48dp; do not shrink below 32.
- `VideoCallPanel.tsx` — drop `pb: {xs:'70px'}` (`:54`) and the grid wrapper `mb: 2` (`:57`).
- `VideoGrid/index.tsx` — count header desktop-only (`:45-69`); fixed-height spacer as the last child of the scroll content for ROLL clearance. A spacer, not `padding-bottom` on the scroll container — padding-bottom is unreliably included in the scrollable overflow area. Verify against current browsers rather than trusting that as folklore.
- `BottomTabs/index.tsx:44` — `paddingTop: '4rem'` against a ~50px nav; reclaim the difference.
- `RollOptionsMenu/index.tsx:57` — `placement="bottom-end"` on mobile. It currently opens _upward_ at `zIndex 1501`, 160-208px tall, covering a third of the video.

Expected result: tiles go from 302px to roughly 470px on a 640px viewport — 47% → ~73%.

---

## Testing

TDD, red → green → refactor. Existing constraints: `VideoCall.test.tsx`, `VideoCallPanel.test.tsx` (mocks `../VideoGrid` at `:19`), `videoCallStore.test.ts`, fixtures at `src/__tests__/fixtures/videoCall.fixtures.ts`, media mocks at `src/__mocks__/mediaDevices.ts`.

Boundary tests worth having:

- Store: roster snapshot with `cam: 'off'` produces the collapsed state for that peer; heartbeat round-trip preserves flags; absent flags produce the unknown state.
- Store: `toggleVideo` stops the track and publishes; re-toggle re-acquires.
- Store: `connectionState` transitions produce the right UI state, and `disconnected` inside the debounce window produces none.
- Watchdog: two zero-delta polls with `cam: 'on'` → stalled; a non-zero delta resets.
- Tile: the same DOM node survives a camera toggle (guards the remount regression).

Per CLAUDE.md, delete shallow unit tests superseded by these boundary tests rather than layering.

---

## Risks

- **Wire-format rollout.** Mixed clients during PWA rollout. Handled by the unknown state (Q23), but worth confirming the RTDB rules accept the new children before shipping the writer.
- **Camera re-acquire latency.** `stop()` means unmute costs a `getUserMedia` round-trip (~200-500ms), where `enabled = true` was instant. Accepted for the LED. If it reads badly, `replaceTrack(null)` is the fallback — negotiation-free, zero media, but the LED stays lit.
- **Collapse-in-place still changes scroll height.** Not a reorder, but the column does get shorter. At 2-4 peers this should be unremarkable; watch for scroll-position jumps if a tile above the viewport collapses.
- **`prefers-reduced-motion`.** Any motion added later gets gated — a reflow is panning/scaling of large objects, which MDN names as a vestibular trigger ([WCAG 2.3.3](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html), AAA). Q24's snap decision means there is nothing to gate today.

## Deferred

- Speaking indicator (Q3) — needs per-peer audio-level metering.
- Persistent mini control bar reachable from the Game/Messages tabs (Q5) — "mute me now" is a panic action and two taps is two too many, but it is not this change.
- A per-viewer "hide tiles without video" toggle, the industry pattern for this problem.

## Before starting

This touches ~12 files and holds `videoCallStore.ts`, `VideoCallPanel`, `VideoTile`, `BottomTabs` and `index.html` for a while. Claim them in root `COMMS.md` first — other agents work in this repo.

## Docs to update on landing

- `docs/engineering/features.md` § "In-room video calling (WebRTC)" — the six bullets at :172-178, particularly the controls/limits bullet.
- `docs/engineering/data-and-sync.md` — the RTDB roster node shape.
- `docs/engineering/security.md` — if `database.rules.json` validation changes.
