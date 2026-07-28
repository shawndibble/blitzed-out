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

Authoring lives in the **pack creator** (`src/views/PackCreator`, route `/packs/create`): content → details → publish, with quick group/tile authoring inline so a blank start never needs another dialog. Guests can publish private packs only (`firestore.rules` gates public on a non-anonymous `sign_in_provider`), so the visibility and publish steps carry a **sign-in prompt that opens `AuthDialog` in place** — rendered inside the creator, so the draft stays mounted, and on success visibility flips to public without leaving the step. Signing into a _different_ account drops republish mode (the loaded pack belongs to the old UID) and carries the draft on as a new pack.

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

- **Transport:** `simple-peer` peer-to-peer connections; **Firebase Realtime Database is used only for signaling** (`src/services/firebaseSignaling.ts`), under `video-calls/{roomId}/{users,offers,answers,ice-candidates}`. TURN relay credentials come from env (`VITE_METERED_*`).
- **Store/UI:** `videoCallStore.ts` + `src/components/VideoCall`. Requests camera/mic (720p ideal, echo-cancel/noise-suppress/auto-gain), creates a peer per other user, and handles offer/answer/ICE with dedup and timeouts.
- **Limits & UX:** up to **4 peers**. Auto-initializes on desktop; **mobile requires an explicit tap** (battery). Controls: mute, camera toggle, manual reconnect. Video auto-disables when the page is hidden.

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
