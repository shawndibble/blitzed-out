# Blitzed Out — Engineering Documentation

> **Audience:** engineers and AI agents working on this codebase.
> **What this is:** a durable, accurate description of what Blitzed Out _is_, what it _can do today_, and how it _works_. Start here, then drill into the topic files.

---

## What Blitzed Out is

Blitzed Out is an **adult (NSFW) party board game** that runs in the browser as a PWA. Players move around a virtual board; each tile they land on shows an **action** (a sexual/foreplay/social prompt) personalized to the player's anatomy, role, and chosen intensity. It supports solo play, multiple people sharing one device, and groups of people each on their own device in a shared online room.

- **Live site:** https://blitzedout.com (custom domain on GitHub Pages)
- **Stack:** React 19 + TypeScript + Vite · MUI v9 (dark mode) · Zustand + Dexie (IndexedDB) · Firebase (Auth, Firestore, Realtime Database, Storage, Functions) · i18next (en/es/fr/zh/hi/de)
- **Deploy:** `npm run deploy` → builds and pushes `dist/` to the `master` branch (GitHub Pages). All development happens on `develop`; **never commit to `master`.**

---

## The main highlights (the elevator pitch)

If someone asks "what are the main highlights of this tool?", these are the answers:

1. **Personalized adult board game.** Action text adapts to each player's anatomy (`male`/`female`/`non-binary`), role (`dom`/`sub`/`vers`), and selected intensity via a placeholder system (`{genital}`, `{hole}`, `{chest}`, `{dom}`, `{sub}`, `{player}`).
2. **Three ways to play:** **Solo** (one player/one device), **Shared Device** (2–4 people, one device, pass-and-play), and **Individual Devices** (everyone on their own device in the same online room). See [`CONTEXT.md`](../../CONTEXT.md) for the topology/room/game-mode glossary.
3. **Deep customization.** Users create their own **custom tiles** and **custom groups**, build and manage **game boards**, pick intensities, and tune a long list of settings.
4. **Rich media room backgrounds.** Set a room/app background to an image or video from a huge range of sources (direct files, YouTube/Vimeo, Reddit slideshows, many adult tube sites, Giphy/Imgur, Google Drive/Dropbox, etc.).
5. **Cast to a TV via Chromecast.** A dedicated cast receiver view shows the current action and background on the big screen.
6. **In-room video calling.** WebRTC peer-to-peer video/audio between players in a room (up to 4 peers), with Firebase used only for signaling.
7. **Audio:** ambient soundscapes, per-turn notification sounds, and browser text-to-speech that reads actions aloud.
8. **Works offline.** Installable PWA; solo and shared-device play work with no network after first load.
9. **Your data is portable.** Import/export custom content as JSON; account sync (anonymous or registered) backs content up to the cloud per user.
10. **Localized** into 6 languages, including localized anatomy terms and placeholder aliases.

---

## Capability quick-reference (direct answers)

These are the questions a user is likely to grill you on. Short answers here; details in the linked docs.

### Can I play videos?

**Yes.** Room/app backgrounds support video from a wide range of sources. Direct video files (`.mp4`, `.webm`, `.ogg`, `.mov`) play in a native muted, looping, autoplaying `<video>` element. Everything else (YouTube, Vimeo, Reddit, many adult tube sites, Giphy, Google Drive/Dropbox, Twitter via proxy, etc.) is normalized to an embeddable URL by `src/services/getBackgroundSource.ts` and shown in a sandboxed `<iframe>`. Autoplay is forced muted to satisfy browser autoplay policies; a tap-to-play fallback appears if the browser still blocks it. → [features.md → Media](features.md#media-backgrounds-images-video)

### Can I load my own images?

**Yes, two ways.**

1. **By URL** — paste any image/video URL as a room or app background (`RoomBackgroundInput`, `BackgroundSelect`).
2. **By upload** — attach a photo to a chat message. On mobile this uses the device camera/library via Capacitor Camera; the image is uploaded to **Firebase Storage** (`/images/{id}.{ext}`, 5 MB max, images only) and shared in the room. → [features.md → Media](features.md#media-backgrounds-images-video)

### How can I customize the app?

**Extensively.** Custom action tiles, custom groups (with custom intensity ladders and anatomy requirements), multiple saved game boards, finish-tile odds, theme, language, ambient music/soundscape and volume, TTS voice and pitch, per-turn sounds, haptics, wake-lock, dice animation, room realtime vs delayed presence, and the room/app background. → [features.md → Customization](features.md#customization)

### Can I import and export my data?

**Yes.** Custom groups, custom tiles, and (optionally) your disabled-default tiles export to a versioned JSON file (`formatVersion: "2.0.0"`). Import merges intelligently using content hashes — identical items are skipped, changed items updated, new items added. This is how you **back up**, **restore**, or **share custom content** with another person. Built to handle 10k+ tiles efficiently (streaming export, batched import). → [data-and-sync.md → Import/Export](data-and-sync.md#importexport)

### Does it work offline?

**Yes, with caveats.** It's an installable PWA with a service worker that precaches the app shell. **Solo** and **Shared Device** play work fully offline after the first visit, because all action content lives in local IndexedDB (Dexie) after a one-time migration. **Individual Devices (online)** mode degrades offline: the app loads, but rooms, chat, presence, and video require the network. Firestore writes queue locally and replay on reconnect. Sounds and videos are _not_ precached (too large) and need the network the first time. → [data-and-sync.md → Offline](data-and-sync.md#offline-support) and [ADR-0001](../adr/0001-pwa-offline-support.md)

### Can I share the game at a party? How?

**Yes — pick the topology that fits the room:**

- **One screen everyone watches / passes around:** use **Shared Device** mode (2–4 players on one device, each with their own name/anatomy/role). No network needed.
- **Everyone on their own phone:** use **Individual Devices** mode. The host creates a room (a 5-character private code or the shared `PUBLIC` room); others open `https://blitzedout.com/<ROOMCODE>` or scan the **QR code** the app generates (`RoomQRCode`). Requires internet. → [features.md → Setup & topology](features.md#setup-flow--player-topology)

### Can I put it on a TV? How? Chromecast?

**Yes, via Chromecast.** Blitzed Out ships a **custom Google Cast receiver** (receiver app ID `1227B8DE`, namespace `urn:x-cast:com.blitzedout.app`). Tap the **Cast button** in a room; it loads the cast SDK, finds your Chromecast, and tells the receiver to open `https://blitzedout.com/<ROOM>/cast`. That **cast view** (`src/views/Cast`) shows, on the TV: the room's background (image/video), the current player's action card, and whose turn is next. There is also a **fullscreen** button for casting the regular browser tab to any external display.

### What about Apple devices (AirPlay)?

**No first-class support.** There is no AirPlay-specific code. On an iPhone/iPad/Mac you can still **screen-mirror via AirPlay at the OS level** to an Apple TV / AirPlay receiver — the app runs normally in the mirrored view — but the app exposes no AirPlay button and doesn't optimize for it the way it does for Chromecast. → [enhancement-opportunities.md](enhancement-opportunities.md#casting--tv)

### Roku? Amazon Fire Stick? Others?

**No native support.** Only Chromecast has an integrated sender/receiver. For Roku, Fire TV/Fire Stick, smart-TV browsers, etc., the options are:

- Open `https://blitzedout.com/<ROOM>/cast` directly in the device's web browser if it has one, **or**
- Use device-level **screen mirroring / casting** (Miracast, AirPlay, etc.) from a phone/laptop.
  There is no Roku channel or Fire TV app. → [enhancement-opportunities.md](enhancement-opportunities.md#casting--tv)

### Can you tell me what the app can do and what we could improve?

**Yes.** [features.md](features.md) is the full feature catalog (what exists, how it works, key files). [enhancement-opportunities.md](enhancement-opportunities.md) is a candid list of current limitations and improvement/hardening opportunities across features, casting, performance, and security.

---

## Document map

| Doc                                                          | Covers                                                                                                                      |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| **README.md** (this file)                                    | Highlights, capability Q&A, doc map, how to keep docs current                                                               |
| [architecture.md](architecture.md)                           | Stack, layers, data flow, state management, ports/adapters, build & deploy, PWA                                             |
| [features.md](features.md)                                   | Full feature catalog: game core, content/placeholder system, customization, media, audio, video call, stats, schedule, i18n |
| [data-and-sync.md](data-and-sync.md)                         | Dexie schema, Firebase products & paths, sync engine, migration, import/export, offline, accounts                           |
| [security.md](security.md)                                   | Auth, Firestore/RTDB/Storage rules, cloud functions, secrets, input validation, privacy, known weaknesses                   |
| [enhancement-opportunities.md](enhancement-opportunities.md) | Candid limitations and improvement/hardening opportunities                                                                  |

Related existing docs:

- [`CONTEXT.md`](../../CONTEXT.md) — domain glossary (topology, room, game mode, anatomy, role, soloPlay). _This one is in the repo root and authoritative for terminology._
- [`docs/adr/`](../adr/) — Architecture Decision Records (ADR-0001 PWA/offline, ADR-0002 room assignment by topology).
- [`docs/pwa-implementation-plan.md`](../pwa-implementation-plan.md), [`docs/offline-local-multiplayer-plan.md`](../offline-local-multiplayer-plan.md) — implementation plans.

---

## Other resources

- **`understand-anything` knowledge graph** — there is a generated codebase knowledge graph at `.understand-anything/knowledge-graph.json` (679 files analyzed). ⚠️ It is a **point-in-time snapshot** taken at commit `3f688ee` (2026-05-23) and the branch has since moved on, so treat it as a navigation aid, not ground truth. Query it interactively with the `understand-chat` / `understand-explain` skills. For anything load-bearing, verify against the live source.
- **Source of truth is always the code.** Where these docs cite a file, line numbers are given only for files read directly; otherwise the file path alone is cited because subagent-reported line numbers drift.

---

## Doc maintenance

- These docs were written against branch `refactor/architecture-deepening-board-orchestrator`. Re-verify against `develop` if it has advanced.
- `docs/` is tracked in git (it was previously git-ignored; the `docs/` entry was removed from `.gitignore`).
- When you change a subsystem, update the matching topic doc. Keep capability answers in this README in sync with reality — they're the ones users quote back at you.
