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

- **Anatomy:** `{genital}` (dick/pussy, strap-on for a female dom in penetrative context), `{hole}` (ass/pussy), `{chest}` (breasts/pecs), plus pronoun tokens.
- **Role/target:** `{dom}`, `{sub}`, `{player}`, with piped variants like `{genital|dom}` and possessives like `{dom}'s {genital}`.

Pipeline: `actionStringReplacement.ts` orchestrates replacement; `anatomyPlaceholderService.ts` resolves anatomy terms by gender/role/locale; `anatomyFilterService.ts` decides which actions are compatible with a player's anatomy.

**Localized placeholder aliases:** custom-tile placeholders are **stored canonical-English**. Authors may type localized aliases (`src/locales/*/placeholders.json`); `placeholderAliasService.ts` normalizes them to English on save and localizes them back on edit. The gameplay replacement pipeline never sees aliases — only canonical English. (Per `CLAUDE.md`.)

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

Tabbed dialog to **add**, **view/filter**, and **import/export** tiles. Add form = group selector + intensity + action text + tags. View list filters by gameMode/group/intensity/tag and supports inline edit. Validation requires a non-empty action and a valid `group_id`.

### Custom groups — `src/views/CustomGroupDialog`

Create/edit/delete groups, choose an intensity template, set `type` and `anatomyRequirement`. **Cascade-delete protection:** a group with tiles can't be deleted unless `cascadeDelete` is set (which also removes its tiles). Names are unique per `(name, locale, gameMode)`. Validation in `validationService.ts` (name length/charset, reserved names blocked, unique intensity values, etc.).

### Game boards — `src/views/ManageGameBoards`

Maintain multiple saved boards (`gameBoard` store / Dexie). List in accordions, toggle the active board (activating one deactivates the rest), delete with confirmation, create new. Boards can be shared into a room as a Firebase game message.

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

A user-supplied URL is normalized to something embeddable. Supported families include: direct image/video files; YouTube & Vimeo; Reddit (subreddit slideshows); Giphy/Tenor/Imgur; Google Drive & Dropbox; Twitter/X (via `twitframe` proxy); Discord CDN media; and a range of adult tube sites. Generic URLs fall through with format detection.

### Rendering — `src/components/DirectMediaHandler`, `src/components/RoomBackground`

- **Direct video** (`.mp4`, `.webm`, `.ogg`, `.mov`): native `<video autoplay loop muted playsInline preload="auto" crossOrigin="anonymous">`. On error it retries common image extensions as a fallback.
- **Everything else:** sandboxed `<iframe>` (`allow="autoplay; fullscreen; encrypted-media; picture-in-picture"`, `sandbox="allow-same-origin allow-scripts allow-presentation"`).
- **Autoplay** is forced muted to satisfy browser policy; a user-interaction overlay appears if autoplay is still blocked (notably on the cast view).
- **Supported image formats** (DirectMediaHandler): jpg/jpeg, png, webp, gif, bmp, svg, avif, tiff, heic/heif, jfif.

### Reddit slideshow — `src/services/redditService.ts`, `RedditSlideshow`

Fetches a subreddit's listing, extracts image/gallery URLs, decodes HTML entities, filters to image extensions, and cycles them. Fetching is **direct from the browser** against Reddit's CORS-enabled OAuth API (`oauth.reddit.com`), authenticated with an app-only ("installed app") token (`redditAuth.ts`, `VITE_REDDIT_CLIENT_ID`). Calling from the user's own IP avoids the datacenter-IP 403/429s a server-side relay would hit; both Reddit's token and data endpoints send `Access-Control-Allow-Origin: *`, so no proxy is needed. ~5-minute cache.

### Room vs app backgrounds — `src/helpers/getPrivateRoomBackground.ts`, `BackgroundSelect`

- **App background:** a per-user setting (`background: 'custom' + backgroundURL`).
- **Room background:** stored in the room's `room`-type message; applied for users who opt into "use room background." **Private rooms** can carry a room background; **public rooms** fall back to default color tiles.

### Uploaded images — `src/components/MessageInput`, `uploadImage` (`firebase.ts:1016`)

Attach a photo to a chat message. On mobile, `@capacitor/camera` (`Camera.getPhoto`, base64, ~90% quality) captures it; a **5 MB** client cap is enforced. Images upload to **Firebase Storage** at `/images/{id}.{ext}` (rules: auth required, ≤5 MB, `image/*`, extension allowlist). Shared as `type: 'media'` messages.

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
- **No AirPlay / Roku / Fire TV integration** — see [enhancement-opportunities.md](enhancement-opportunities.md#casting--tv). OS-level screen mirroring is the workaround.

---

## Messaging / chat — `src/stores/messagesStore`, `MessageList`, `MessageInput`

Real-time messages backed by Firestore, mirrored into `messagesStore` (dedupes optimistic/duplicate IDs, sorts, clears entries >24h on rehydrate). Message `type ∈ {chat, actions, settings, room, media}`. List supports tab filtering (All/Settings/Chat/Actions) and jump-to-latest. Chat text is rendered with `react-markdown` (+ GFM + gemoji) — safe by default, no raw HTML. Photo attachments via the Storage flow above.

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
