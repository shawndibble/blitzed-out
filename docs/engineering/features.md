# Feature Catalog

Companion to [README.md](README.md). What the app does, how each feature works, and where the code lives. Use this to answer "what can it do?" and "where do I change X?".

> Line numbers are given only for files verified directly. Elsewhere the file path is the citation.

---

## Game core

### The board & tiles

Built by `src/services/buildGame.ts` (pure transform) from tiles fetched out of Dexie; the active board is held in the `gameBoard` store.

A board is an ordered list of tiles with three kinds:

- **Start tile** — the beginning marker.
- **Content tiles** — the body of the board; each carries a `title` (group label), a `description` (action text with placeholders), a `role`, and a `standalone` flag.
- **Finish tile** — an outcome randomizer whose odds come from `Settings.finishRange` (a `[low, high]` split across outcomes, defaulting to roughly even thirds).

**Board size is configurable** (`boardSize` on the game-settings/message types); there is no hard-coded count — start and finish tiles are added around the configured content length.

**Fair distribution ("shuffle bag"):** tiles are grouped by `group_id + intensity` and drawn without replacement until a bag empties, then it refills and reshuffles. This avoids the same action repeating before others are used.

**Intensity progression:** intensity scales roughly linearly along the board (early tiles low intensity, later tiles high), bounded by the intensities the user selected for each group. If a selected group has no tiles at a needed intensity, the builder falls back to other selected intensities.

### Dice & turns

- **DiceRoller** (`src/components/DiceRoller`) renders 3D physics dice (`@3d-dice/dice-box-threejs`) in a full-screen portal, takes a notation like `1d6`, and fires `onComplete(total)`. `diceAnimationStore` debounces the roll sound so it doesn't double-fire.
- **Turn order** (`useTurnIndicator`, `TurnIndicator`, `TurnTransition`): active (non-finished) players are sorted by display name into a stable order; the next player is `(currentIndex + 1) % activeCount`. `TurnTransition` shows a brief whose-turn overlay; `TurnIndicator` shows a toast.
- **Wake lock:** `wakeLockEnabled` setting holds the Screen Wake Lock so the device doesn't sleep mid-game.
- **Hands-Free** (`src/views/Room/HandsFreeDialog`, `src/helpers/handsFree.ts`, `src/hooks/useHandsFree.ts`): named packaging of `readRoll` TTS + the auto-roll timer. Roll menu → quick-config (enable, cadence presets Quick 30–60s / Standard 1–2m / Extended 2–5m, voice); enabled turns the roll button into a play/pause transport with countdown. Solo + Shared Device only (consent hazard auto-rolling at AFK players online). Countdown holds while TTS speaks; wake lock held while playing. `useHandsFree` is the single mediator for every enable/disable path (quick-config, roll menu, auto-roll dialog); it holds the enable/disable + `readRoll` save/restore invariant in the durable `readRollBeforeHandsFree` settings field so it survives a remount. See CONTEXT.md "Hands-Free".

### Action display & game over

- **PopupMessage** shows the rolled action card with a timeout.
- **GameOverDialog** offers: restart same board, rebuild a fresh board, or change settings.

---

## Content & the placeholder system

This is the heart of the personalization.

### Tiles and groups (data model)

- **Custom tile** (`src/types/customTiles.ts`, store `customTiles.ts`, Dexie table `customTiles`): `{ id, group_id, intensity, action, tags[], isCustom (0|1), isEnabled (0|1) }`. `isCustom:0` = bundled default; `isEnabled:0` = soft-disabled.
- **Custom group** (`src/types/customGroups.ts`, store `customGroups.ts`, Dexie table `customGroups`): `{ id (nanoid), name, label, type, intensities[], anatomyRequirement?, gameMode, locale, isDefault }`.
  - `type ∈ {solo, foreplay, sex, consumption}`.
  - `anatomyRequirement ∈ {any, penis, pussy, anus, breasts}` — gates the group by player anatomy.
  - Intensity ladders ship as templates: 1–3 (Beginner/Intermediate/Advanced), 1–4 (Light→Extreme), 1–5 (VeryLight→VeryIntense).

### Placeholders

Action text contains tokens replaced at gameplay time:

- **Anatomy:** `{genital}` (dick/pussy, strap-on for a female dom in penetrative context), `{tip}` (tip/clit, strap-on tip under the same rule), `{hole}` (ass/pussy), `{chest}` (breasts/pecs), plus pronoun tokens.
- **Role/target:** `{dom}`, `{sub}`, `{player}`, with piped variants like `{genital|dom}` and possessives like `{dom}'s {genital}`.

The token list is declared once as `ANATOMY_PLACEHOLDERS` in `src/types/localPlayers.ts`; the `AnatomyPlaceholder` type, `getSupportedPlaceholders()`, all three token regexes (bare, piped, possessive), and the authoring UI's chip list derive from it. **No pattern edits** are ever needed. A new token is that array plus locale data in three files, per locale:

1. `locales/*/anatomy.json` — the term under `genericAnatomyTerms` and all three `anatomyMappings` genders. Add a `straponTerms` entry too if the token should follow `{genital}` onto a strap-on (see `STRAPON_TERM_KEYS`).
2. `locales/*/placeholders.json` — the localized token _name_, so authors can type it in their own language (`placeholderAliasService` normalizes it to canonical English on save).
3. `locales/*/translation.json` — a `customTiles.placeholderHelp.<camelCaseKey>` string, plus the matching entry in `ANATOMY_HELP_KEYS` (`AddCustomTile/index.tsx`). That map is a `Record<AnatomyPlaceholder, string>`, so a missing entry is a type error rather than a chip that silently never renders.

Pipeline: `actionStringReplacement.ts` orchestrates replacement; `anatomyPlaceholderService.ts` resolves anatomy terms by gender/role/locale; `anatomyFilterService.ts` decides which actions are compatible with a player's anatomy.

**Role is the slot, not the setting.** The strap-on swap keys off the role a player fills in _this_ action (`{dom}`/`{sub}`), not their configured role — otherwise a `vers` player cast as the dom keeps real anatomy on a penetrative tile. Local mode reads the slot from the piped/possessive token; online and solo infer it from which token name substitution consumed (`inferSlotRole`).

**Tap-to-insert:** the "Available Placeholders" panel in `AddCustomTile` renders each bare token (the 11 keys in `locales/*/placeholders.json` — not piped `{genital|dom}` or possessive forms, which are still typed by hand) as a clickable chip. Clicking one splices the token into the action field at the last known caret (end of text if the field was never touched) via the pure `AddCustomTile/insertPlaceholderToken.ts` — spacing-aware, selection-replacing, capped at `MAX_ACTION_LENGTH`. Chips label and insert via `localizePlaceholders(token, settings.locale)`, i.e. the same locale the save path normalizes from, so a chip can never author an alias that `normalizePlaceholders` would leave uncanonicalized.

**Localized placeholder aliases:** custom-tile placeholders are **stored canonical-English**. Authors may type localized aliases (`src/locales/*/placeholders.json`); `placeholderAliasService.ts` normalizes them to English and localizes them back on edit. The customTiles store enforces this at intake (`addCustomTile`/`updateCustomTile` normalize idempotently), so every write path inherits the invariant; dialogs additionally normalize early for validation/dedup. The gameplay replacement pipeline (`actionStringReplacement`, `anatomyPlaceholderService`) never sees aliases — only canonical English.

### Content filtering by mode/role

`usesSoloActions(gameMode, soloPlay)` and `shouldPurgeAction(...)` decide which group types a player sees:

| Game mode | Default content        | `soloPlay` toggle          |
| --------- | ---------------------- | -------------------------- |
| `solo`    | solo actions only      | n/a                        |
| `online`  | foreplay + sex (group) | `true` → solo-only content |
| `local`   | foreplay + sex (group) | n/a                        |

Roles (`dom`/`sub`/`vers`) further filter and personalize. For `vers`, role-ambiguous actions resolve randomly per roll. Non-binary anatomy filters conservatively unless a group is marked `anatomyRequirement: any`. See [`CONTEXT.md`](../../CONTEXT.md) for the authoritative definitions of `soloPlay`, role, and anatomy.

---

## Customization

### Custom tiles — `src/views/CustomTileDialog`

Accordion dialog to **add**, **view/filter**, **import/export**, and manage **content packs** tiles. Add form = group selector + intensity + action text + tags. View list filters by gameMode/group/intensity/tag and supports inline edit; pack-imported tiles show a "From {pack} v{n}" provenance chip. Validation requires a non-empty action and a valid `group_id`. Disabling a default tile records a first-class `disabledDefaults` entry (not just a row flag) so the choice survives re-seeds and syncs with a tombstone.

### Content packs — `src/views/CustomTileDialog/Packs`, `src/services/contentPacks.ts`

Publish a bundle of your custom tiles + groups to the durable public `content-packs` collection, and share it **by code/link** (`?importPack=<id>`). Recipients preview contents + conflicts, then **Subscribe** (tracks the pack for updates via `packSubscriptions`) or **Import a copy**. Authors republish with an incremented `packVersion`; subscribers poll on open and apply updates (local edits to pack tiles are kept by default — `packDetached`). Unsubscribe soft-removes the pack's tiles. Publishing requires a content-policy consent step; an abuse **report** affordance writes to `reports/{id}`. See [data-and-sync.md](data-and-sync.md#sharing-by-code--link).

Authoring lives in the **pack creator** (`src/views/PackCreator`, route `/packs/create`): content → details → publish, with quick group/tile authoring inline so a blank start never needs another dialog. Guests can publish private packs only (`firestore.rules` gates public on a non-anonymous `sign_in_provider`, surfaced to the client as `hasPermanentProvider` — see [security.md](security.md#authentication)), so the visibility and publish steps carry a **sign-in prompt that opens `AuthDialog` in place** — rendered inside the creator, so the draft stays mounted, and visibility flips to public without leaving the step. The request is recorded when the prompt is opened, not when the dialog reports back, so dismissing it mid-flight cannot swallow a completed upgrade. Signing into a _different_ account drops republish mode (the loaded pack belongs to the old UID) and carries the draft on as a new pack.

### Custom groups — `src/views/CustomGroupDialog`

Create/edit/delete groups, choose an intensity template, set `type` and `anatomyRequirement`. **Cascade-delete protection:** a group with tiles can't be deleted unless `cascadeDelete` is set (which also removes its tiles). Names are unique per `(name, locale, gameMode)`. Validation in `validationService.ts` (name length/charset, reserved names blocked, unique intensity values, etc.).

### Game boards — `src/views/ManageGameBoards`

Maintain multiple saved boards (`gameBoard` store / Dexie). List in accordions, toggle the active board (activating one deactivates the rest), delete with confirmation, create new. Boards can be shared into a room as a Firebase game message, and **shared by link** via `?importBoard=<id>` (stored in `game-boards`, imported by `useUrlImport`). See [data-and-sync.md](data-and-sync.md#sharing-by-code--link).

### Settings — `settingsStore` / `src/types/Settings.ts`

Configurable: `gameMode`, `role`, `gender`, `room`, `selectedActions` (per-group `{type, levels, variation}`), `finishRange`, `background`/`backgroundURL`, `locale`, `themeMode`, `soloPlay`, `roomRealtime`, ambient music on/off + soundscape + volume, TTS voice + pitch, per-turn `turnSoundId`, `hapticFeedback`, `showDiceAnimation`, `wakeLockEnabled`, and dialog visibility toggles.

---

## Setup flow & player topology

The **Game Settings Wizard** (`src/views/GameSettingsWizard`) walks the user through setup. Steps include advanced/room settings, **player topology**, per-player details, game mode, action/intensity selection, and a finish/review step.

**Three topologies** (see [`CONTEXT.md`](../../CONTEXT.md) for the canonical glossary):

- **Solo** — one player, one device. Defaults to the `PUBLIC` room; can auto-generate a private room.
- **Shared Device** — 2–4 players on one device (pass-and-play). Each player gets a name, gender, and role (`LocalPlayerSetup`, `GenderSelector`, role selector). Uses a client-generated private room code; works offline.
- **Individual Devices** — everyone on their own device in a shared room (`PUBLIC` or a 5-char private code). Requires network; unavailable fully offline.

**Joining a room at a party:** host shares `https://blitzedout.com/<ROOMCODE>` or the generated **QR code** (`RoomQRCode`). Others scan/open and land in the same room.

---

## Media: backgrounds, images, video

### Sources & normalization — `src/services/getBackgroundSource.ts`

A user-supplied URL is normalized to something embeddable. Supported families include: direct image/video files; YouTube & Vimeo; Giphy/Tenor/Imgur; Google Drive & Dropbox; Twitter/X (via `twitframe` proxy); Discord CDN media; and a range of adult tube sites. Generic URLs fall through with format detection.

### Rendering — `src/components/DirectMediaHandler`, `src/components/RoomBackground`

- **Direct video** (`.mp4`, `.webm`, `.ogg`, `.mov`): native `<video autoplay loop muted playsInline preload="auto" crossOrigin="anonymous">`. On error it retries common image extensions as a fallback.
- **Everything else:** sandboxed `<iframe>` (`allow="autoplay; fullscreen; encrypted-media; picture-in-picture"`, `sandbox="allow-same-origin allow-scripts allow-presentation"`).
- **Autoplay** is forced muted to satisfy browser policy; a user-interaction overlay appears if autoplay is still blocked (notably on the cast view).
- **Supported image formats** (DirectMediaHandler): jpg/jpeg, png, webp, gif, bmp, svg, avif, tiff, heic/heif, jfif.
- **Imgur** URLs resolve to a final URL with a normalized extension (`.gifv` → `.mp4`, etc.); `isVideo` is always `true` (inherited from the routing switch's default), so an imgur URL — image or video — always routes as if it were a video. This is a preexisting quirk, unchanged by this feature.
- **Giphy** URLs always resolve to a real `.gif`; `isVideo` is hardcoded `true` as a **routing** flag, not a media-type claim, purely so `RoomBackground` sends it to `DirectMediaHandler` (which correctly renders `.gif` as an image) instead of a generic `<iframe>` — see `GIF_ROUTES_TO_DIRECT_MEDIA_REGEX` in `DirectMediaHandler`, which `RoomBackground`'s own routing check is derived from so the two can't silently diverge.
- All CSS `background-image: url(...)` in this feature (`RoomBackground`, `DirectMediaHandler`) go through `src/helpers/cssUrl.ts`, which strips control characters and escapes quotes.

### Reddit slideshow — removed (June 2026)

Reddit subreddit slideshows were removed. They had relied on third-party CORS proxies (`r.jina.ai`, `api.allorigins.win`, `corsproxy.io`) because Reddit's public `.json` endpoints send no `Access-Control-Allow-Origin`. As of June 2026 those proxies all return `403`, and the leak-free alternatives are both closed off by Reddit's Nov-2025 [Responsible Builder Policy](https://support.reddithelp.com/hc/en-us/articles/42728983564564-Responsible-Builder-Policy): the OAuth API requires a manually-approved app (self-service is disabled, rarely granted for personal/NSFW use), and a first-party Cloud Function relay egresses from a datacenter IP that Reddit `403`s. Verified `403` from `www.reddit.com` **and** `old.reddit.com`, every UA, residential IP included. With no viable browser path, the feature (`redditService`, `RedditSlideshow`, `useRedditFeed`, `ImageSlideshow`) was deleted. Revisit only if Reddit ships browser-readable CORS or grants API access.

### Room vs app backgrounds — `src/helpers/getPrivateRoomBackground.ts`, `BackgroundSelect`

- **App background:** a per-user setting (`background: 'custom' + backgroundURL`).
- **Room background:** stored in the room's `room`-type message; applied for users who opt into "use room background." **Private rooms** can carry a room background; **public rooms** fall back to default color tiles.
- **Built-in theme contract:** `'color'` and `'gray'` are sentinels, not URLs — they select the app's built-in tile theme rather than any media. Both public entry points (`getBackgroundSource`, `getPrivateRoomBackground`) short-circuit these two literal values to their final result (`{url: '', isVideo: false}` for the Cast/private-room path; `{url: 'color' | 'gray', isVideo: false}` for the Room path) **before** the value is ever passed to `processBackground`. Do not let a sentinel reach `processBackground` — its `default:` branch runs unrecognized strings through `getURLPath`, which would turn `'color'` into the real-looking (and 404-ing) path `/images/color`. Consumers should match these sentinels with an exact string comparison (`url === 'color'`), never a substring test (`url.includes('color')`) — a substring test also matches real media URLs whose text happens to contain the word "color" or "gray" (e.g. `.../graysky.jpg`), which is a bug this contract exists to prevent from recurring.

### Attached images — `src/components/MessageInput`

Attach a photo to a chat message. On mobile, `@capacitor/camera` (`Camera.getPhoto`, base64, ~90% quality) captures it; a **5 MB** client cap is enforced. The photo travels **inside the message** as `{ base64String, format }` (`type: 'media'`) and `MessageList/Message` renders it from that object — there is no Firebase Storage upload on this path. The Storage helper that used to do one (`uploadImage`) had no callers and was deleted; the Storage rules (auth required, ≤5 MB, `image/*`, extension allowlist) remain in place but nothing writes there.

⚠️ **Known mismatch:** the client cap is 5 MB while a Firestore document is capped at ~1 MiB, so a large photo fails the write. Either re-wire this path to Storage or lower the cap — it is a product call, not yet made.

---

## Audio & voice

- **Ambient music** — `src/services/ambientMusic.ts`: three soundscapes (lounge / intimate / party) as looping MP3s via the Web Audio API, with gain-based volume. Controlled by `ambientMusicEnabled`, `ambientSoundscape`, `ambientVolume` (default ~0.3). MP3s live in `public/sounds/ambient/` (not precached).
- **Per-turn / notification sounds** — `src/utils/gameSounds.ts`: a library of ~40 synthesized sounds (oscillator-generated, grouped into alerts/notes/notifications/game categories), chosen in `SoundSelector` and stored as `turnSoundId`.
- **Text-to-speech** — `src/services/tts.ts` + `useTTS` + `VoiceSelect`: browser `speechSynthesis` (no third-party service). Reads actions aloud; lists system voices (prefers "Google" voices when present), with a pitch slider (0.5–2.0) and a sample button.

---

## In-room video calling (WebRTC)

- **Transport:** native `RTCPeerConnection`, one per peer, behind the `PeerTransport` port (`src/services/ports/PeerTransportPort.ts`; adapter `adapters/NativePeerTransportAdapter.ts`). The port owns SDP, ICE and track plumbing; `videoCallStore` keeps all policy (who to dial, retries, `MAX_PEERS`, timeouts), so tests mock the factory rather than a WebRTC stack. Negotiation follows the W3C **perfect negotiation** pattern: `isPolite(local, remote) = local > remote`, so the higher uid rolls back on a collision and no offer lock, dedup map or send delay is needed. **Firebase Realtime Database is used only for signaling** (`src/services/firebaseSignaling.ts`), under `video-calls/{roomId}/{users,offers,answers,ice-candidates}`; both sides may write offers, which the symmetric RTDB rules already allow.
- **ICE:** the call **opens on the bundled relay** (`src/config/webrtc.ts` — Google STUN plus one entry **per port/transport** the provider publishes, 80/443 × UDP/TCP; a UDP-only relay strands every user on a UDP-blocking network, so the list is deliberately not deduplicated). `src/services/iceServers.ts` then mints short-lived Cloudflare credentials **in the background** via the `getTurnCredentials` callable and swaps them in — awaiting a Cloud Function cold start before showing anything cost seconds of startup. Peers already dialled keep the bundled relay; later reconciliations use the minted set. Minted sets are cached until 10 min before expiry; every failure path falls back to the bundle.
- **Store/UI:** `videoCallStore.ts` + `src/components/VideoCall`. Requests camera/mic (720p ideal, echo-cancel/noise-suppress/auto-gain), creates a peer per other user, and handles offer/answer/ICE with timeouts.
- **Safe-area insets:** `viewport-fit=cover` in `index.html` puts the page under the status bar, so the fixed nav pads itself by `env(safe-area-inset-top)` and **every reserve for it carries the same inset** — `BottomTabs`' `NAV_HEIGHT`, `VideoSidebar`'s drawer offset, and `.desktop-container` / `.video-adjust` in `views/Room/styles.css`. The sidebar and the desktop container sit in the same render path; updating one without the others slides content under the nav by the inset.
- **Published media state:** what each participant is publishing rides on the roster node as `cam` (`on`/`off`/`none`/`hidden`) and `mic` (`on`/`off`), written by `publishMediaState()` and carried by every full presence write. It has to be signalled: `MediaStreamTrack.enabled` is sender-local, and per the WebRTC spec a disabled _video_ track keeps its SSRC alive and emits black frames, so the receiver's copy still reports `enabled === true` and never fires `mute`. Reading it off the track — which `VideoTile` used to do — meant a camera-off peer, a backgrounded tab and a broken transport were all the same black rectangle. `firebaseSignaling` caches the last published flags so the 30s heartbeat's full node rewrite cannot silently revert a toggle. Absent fields mean **unknown**, not off, so a peer on an older build degrades to a name with no claim about their state.
- **Tile states:** the participant list is the **union** of the live roster and the dialled peers — roster alone drops a connected peer whose heartbeat has been throttled by a background tab, peers alone hides anyone still connecting. `components/VideoCall/tileState.ts` resolves one state per participant (`video`, `connecting`, `reconnecting`, `failed`, `audioOnly`, `viewingOnly`, `cameraOff`, `noCamera`, `away`, `unknown`); transport trouble outranks whatever the roster last said. Anything but `video` collapses the tile **in place** to a compact row (avatar, name, terse label) — same component, same DOM node, only the height changes. Moving a participant between components would change their position in the React tree, and React discards state on a position change, destroying the `<video>` and its `srcObject`. Retry on a `failed` tile clears just that peer's retry budget via `retryPeer()`.
- **Camera off releases the device.** `toggleVideo` stops the track (so the camera light goes out) and detaches it from each sender with `setVideoTrack(null)`; resuming re-acquires **video only**, leaving the mic track untouched. The mic is the opposite — disabled, never stopped, because releasing it makes Bluetooth headsets renegotiate their profile and clips the first word back. Tile geometry is fixed (16:9) and only `object-fit` switches on a portrait/landscape flag read from the video element's `videoWidth`/`videoHeight`; sizing tiles to the track would reflow the whole column every time simulcast drops a layer.
- **Roster reconciliation:** `reconcilePeers()` re-derives the peer map from the RTDB roster on every roster update _and_ on a 3s timer. The roster is not taken at face value: `liveRoster()` (`src/services/callRoster.ts`) drops entries whose `lastSeen` is older than `ROSTER_STALE_MS` (10 min, matching the server sweep) or that carry no timestamp at all, and orders the rest freshest-first so that when more participants are present than `MAX_PEERS` allows, the slots go to whoever is most likely still there. Ghosts accumulate whenever a client dies without closing its socket, and four of them consume every mesh slot — `/PUBLIC` was found holding nine. A peer dying does not change the roster, so a timer-independent "did the user list change?" gate would leave one ICE failure permanently unrecoverable. Failed peers retry with exponential backoff (4s → 15s, 5 attempts); exhausted participants hold no `MAX_PEERS` slot. A successful connect clears the retry budget.
- **Roster listener teardown:** `cleanup()` calls the unsubscribe `onValue` returned, never `off(ref)`. A bare `off` with no event type or callback is a **blanket detach of every listener at that location**, and the badge keeps its own read-only listener on the same node — so leaving a call silently killed the badge for the rest of the session, and with it the count the join gate reads. Per-file `vi.mock('firebase/database')` factories are why that shipped green once; a shared fake modelling registrations per path would catch the next one.
- **Presence:** signaling splits into `claim()` (write presence; must precede minting TURN credentials, which requires a roster slot) and `listen()` (bind offer/answer/ICE listeners). **`listen()` is deferred until the first roster snapshot arrives** — `onChildAdded` replays queued offers the instant it binds, and answering one attaches the local camera and mic, so an offer accepted before the roster is known is accepted from anyone. Timestamps use `serverTimestamp()`, not the device clock: staleness is judged by other clients and by the server sweep, so a skewed device would be read as a ghost by everyone. `firebaseSignaling` writes `users/{uid}` with `joinedAt`/`lastSeen`/`status`, refreshes `lastSeen` every 30s, and **removes the node on cleanup** — `onDisconnect` only fires when the socket drops, which leaving a call does not do. `cleanupVideoCallSignaling` prunes roster entries idle for 10 minutes as a backstop for crashed tabs.
- **Diagnostics:** peer errors, ICE transitions, and the selected candidate pair's `local`/`remote` candidate types go through `logger`. `relay` on either end means TURN carried the call. `logger` is silent in production **unless the user opts in** with `?debug=1` or `localStorage.debug = 'true'`, which is how a live broken call can be diagnosed at all; the output stays on their machine. Reporting it automatically would send a new category of fact about a user to a third party — the options, field by field, are in `docs/plans/telemetry-decision-2026-08.md`, which recommends **not** doing so yet and reading the Cloudflare TURN dashboard instead. Still the owner's open decision; no automatic reporting exists.
- **Limits & UX:** up to **`MAX_CALL_PARTICIPANTS` (6) people**, i.e. `MAX_PEERS` (5) connections each — `MAX_PEERS` is derived from the participant cap because the two were maintained independently before, so a cap of "4 peers" quietly meant a 5-person call. Six is the top of the band a serverless mesh sustains: every participant uploads a separately encoded stream to every other one, so beyond it uplink and encoder count degrade the call for everybody rather than just the weakest client. **Every join requires an explicit tap** — the desktop sidebar toggle or the mobile call button; nothing auto-joins. Controls: mute, camera toggle, manual reconnect — reconnect calls `replaceLocalTracks(stream)` on each surviving peer, and the adapter swaps each track onto the existing `RTCRtpSender` of that kind (no renegotiation). Video auto-disables when the page is hidden, and that is published as `cam: 'hidden'` rather than left to look like a camera someone switched off; the `visibilitychange` listener is owned by the store, since both the mobile tab and the desktop sidebar host the call. **On mobile the call controls sit above the tiles**, directly under the nav — the roll button is `position: fixed` over every tab and already owns the bottom thumb zone, so a third stacked bottom bar was worse than an unusual anchor. Its clearance is a spacer inside the scrolling tile column rather than panel padding, which would otherwise shrink every tile for the whole call. The tiles carry no count or warning of their own — both now live outside the grid, see **Participant badge** below.
- **Participant badge (`callPresenceStore` + `CallPresenceWatcher`):** a badge on the desktop camera icon and the mobile video tab shows how many people are on the call, so someone who has not joined can see there is one to join. It cannot come from `videoCallStore` — desktop subscribes to nothing until the sidebar opens, mobile not until the Call button is tapped, and on desktop _opening the panel is joining_. So `CallPresenceWatcher` (the old `VideoCallProvider`, which used to auto-join and was inert only because of where it was mounted) hosts a **read-only** listener: `services/callPresence.ts` owns the RTDB call on `video-calls/{roomId}/users` and returns the unsubscribe, the store holds only state — same split as `roomPresence.getUserList`, and the reason the store's guard can key on a generation counter rather than on the SDK's return value. No slot claimed, no camera opened. `.read` on that node was already `auth != null`, so no rules change. The room id is a raw URL segment off a catch-all route and RTDB `ref()` **throws synchronously** on `.`, `#`, `$`, `[`, `]`, so the seam guards it — unguarded, `/robots.txt` would take out the whole room for every user, not just the badge. The count is **total live participants including yourself** — a lone caller showing "1" is what advertises the call to the room — hidden at 0, and identical whether you are in the call or out of it.
- **Two counts, two windows, on purpose:** `count` (the badge) uses `PRESENCE_STALE_MS` (2 min); `capacityCount` (the join gate) uses the 10-minute `ROSTER_STALE_MS` that governs dialling. A ghost only costs a mesh slot, but a badge is a number people act on, so ten minutes of being wrong after a crash would send them into an empty call — hence the tight window for display. The gate cannot use it: a backgrounded tab drops off the badge at two minutes while still holding a `MAX_PEERS` slot in everyone's mesh, so gating on the badge's number would admit a seventh person into a graph too sparse to complete, with no error surfaced. `liveRoster(users, now, staleMs)` takes the window as a parameter — one rule, two tolerances. Because `onValue` does not fire when nothing changes and staleness is judged against the clock, the store re-derives both on a 30s tick; it skips the write when neither moved (heartbeats rewrite `lastSeen` every 30s while the counts sit still) and skips the tick entirely before the first snapshot, so `loaded` cannot become true off a fabricated zero.
- **Capacity alert & the full-call gate:** one `Alert` at the top of `VideoCallPanel` (`components/VideoCall/CallCapacityAlert`) warns at `CALL_QUALITY_WARNING_PARTICIPANTS` (4) and escalates to "call full" at the cap — one component with two states, so the thresholds cannot drift into both rendering at once. It reads the **passive presence store, never `videoCallStore`**: a refused joiner early-returns from `initialize()`, so store state is empty for exactly the person who needs to be told. The over-cap check sits at the **top of `initialize()`, before `getUserMedia`** — by the time `claim()` runs the stream already exists, so a check at the claim site would still have prompted for the camera and lit the device up for someone who can never be dialled. Top-of-initialize also covers both call sites at once. Both **joining and reconnecting** clear it: hanging up releases the roster slot, so resuming is a fresh claim, and without the same check anyone who hung up in a busy call could reclaim past the cap — after opening their camera to find out. It reads `capacityCount`, so it cannot admit past a slot the mesh is still holding — and so does `CallCapacityAlert`, because a message that disagrees with the refusal is worse than none: a call held up by backgrounded participants would be refused while the panel said nothing. The mobile Call button is **disabled** at the cap for the same reason — the gate refuses the join before the camera is touched, which would otherwise make it a button that does nothing — and `VideoGrid` drops its "waiting for others" line for a refused joiner, who would otherwise be told the call is full and empty at once. Deliberately not guarded: two people passing the check at the same instant can land the roster at 7, and an unloaded count fails open rather than putting an RTDB round trip between the tap and the camera on every join.

---

## Casting to TV (Chromecast)

- **Sender** — `src/components/CastButton`: dynamically loads the Google Cast SDK, initializes with **receiver app ID `1227B8DE`** and namespace **`urn:x-cast:com.blitzedout.app`**, then on connect sends `{ type: 'LOAD', url: <origin>/<room>/cast }`.
- **Receiver view** — `src/views/Cast` (`/:id/cast`): auto-logs in anonymously, renders the room background (image/video) full-screen, the current action card (player name, type, activity), and the next-player indicator. Detects the cast environment via `CastReceiverContext`, `CrKey`/`TV` in the user agent, or `?chromecast`/`?receiver` query overrides, and applies enhanced muted-autoplay retries.
- **Fullscreen** — `useFullscreenStatus` (cross-browser prefixes) powers a fullscreen toggle for casting the regular tab to any external display.
- **No AirPlay / Roku / Fire TV integration.** OS-level screen mirroring is the workaround.

---

## Messaging / chat — `src/stores/messagesStore`, `MessageList`, `MessageInput`

Real-time messages backed by Firestore, mirrored into `messagesStore` (dedupes optimistic/duplicate IDs, sorts, clears entries >24h on rehydrate). Message `type ∈ {chat, actions, settings, room, media}`. List supports tab filtering (All/Settings/Chat/Actions) and jump-to-latest. Chat text is rendered with `react-markdown` (+ GFM + gemoji) — safe by default, no raw HTML. Photo attachments travel in the message (see above). `sendMessage` drops a message identical to the previous one **within 3 s**, which absorbs a double submit; it used to compare against an uncleared module global with no timestamp, so the second identical message in a room was dropped for the rest of the session.

---

## Statistics & schedule

- **Statistics** — `src/views/GameStatistics` + `playerStatsService.ts` (Dexie `globalPlayerStats`): dice-roll count/sum/distribution, games started/completed, total play time, current/best streak, categories landed on, intensities played. Recorded via `recordDiceRoll`, `recordGameStart/Complete`, `recordTileLanding`, `recordBoardCategories`.
- **Schedule** — `src/views/Schedule` + `scheduleStore` (Firestore `schedule` collection): scheduled game sessions (`dateTime`, `url`, `room`). `AddToCalendarButton` exports to a calendar. Batched/debounced writes with short-TTL caching.

---

## Internationalization

- **6 locales:** en, es, fr, zh, hi, de. i18next with lazy-loaded resources; detection order querystring → cookie → localStorage → navigator → htmlTag; common languages preloaded on idle.
- **Namespaces:** `translation`, `errors`, `anatomy`, `placeholders`.
- **Localized anatomy & placeholders** per language (gender-specific terms, strap-on terms, penetrative keywords used for context detection, and placeholder aliases). **When adding strings, update all six `translation.json` files** (per `CLAUDE.md`).

---

## Other notable pieces

- **Game guide** — `src/views/GameGuide`: short visual walkthrough (setup → action card → custom tiles).
- **Migration health & recovery** — `migrationHealthChecker.ts`, `syncRecoveryService.ts`: detect corrupted/missing default content (e.g. a sync bug deleting defaults) and force a fresh migration. See [data-and-sync.md](data-and-sync.md#migration).
- **Analytics** — `analytics.ts` / `analyticsTracking.ts`: event tracking (setting changes, action selection, game-mode selection, engagement). Display names are excluded; room codes are included. See [security.md](security.md#privacy--data-collection).
