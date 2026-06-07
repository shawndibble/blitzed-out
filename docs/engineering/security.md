# Security

Companion to [README.md](README.md). Security model, the actual rules in force, and a candid list of weaknesses. This is an adult (NSFW) app with mostly **anonymous users** and **user-generated content**, so the threat model centers on privacy, content abuse, and authorization — not classic account takeover.

> Rules in this doc were read directly from `firestore.rules`, `database.rules.json`, `storage.rules`, and `functions/src/index.ts`. No live credential values are reproduced here by design.

---

## Authentication

`src/services/firebase.ts`, `src/services/authBridge.ts`, `src/components/auth/*`, `src/context/auth.tsx`.

- **Anonymous** (`signInAnonymously`) is the default path; **email/password** and **Google** are available; anonymous → registered upgrade via `linkWithCredential` preserves UID.
- Auth state via `onAuthStateChanged`; logout clears auth, and a wipe path clears all local storage/IndexedDB/cookies.

**Weaknesses / hardening:**

- No client-side password policy (length/complexity/breach check) — relies on Firebase defaults.
- No recovery for anonymous identities; clearing browser data orphans the account and its un-synced local content.
- No session timeout / idle logout.
- `displayName` is set via `updateProfile` without sanitization and is rendered in messages → see [Input validation](#content--input-validation).

---

## Firestore rules (`firestore.rules`)

| Path                                | Read                   | Write                                                                                    | Notes                                                        |
| ----------------------------------- | ---------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `user-data/{uid}`                   | owner only             | owner only                                                                               | `request.auth.uid == uid`. Solid.                            |
| `custom-actions/{id}`               | public                 | auth create only; field-typed + size-capped; `hasOnly` field lock; **no update/delete**  | TTL-based cleanup.                                           |
| `game-boards/{id}`                  | public                 | auth create (field-typed + size-capped, `hasOnly`); update limited to `ttl`; no delete   | Good — restrictive update.                                   |
| `chat-rooms/{roomId}`               | **any auth**           | **any auth**                                                                             | ⚠ Room metadata is not membership-scoped.                    |
| `chat-rooms/{roomId}/messages/{id}` | any auth (read + list) | auth create with `uid == auth.uid`, `text ≤ 1000`, `type` enum; delete own only; no edit | Create validation is good; **read is not room-scoped**.      |
| `rate-limits/{uid}`                 | none                   | none                                                                                     | System-only.                                                 |
| `schedule/{id}`                     | public                 | creator-only create/update/delete; update limited to `dateTime`/`url`                    | `url` scheme/size validated (`^https?://`, ≤2048, empty ok). |

**Key weaknesses:**

1. **Room access isn't enforced in rules.** Any authenticated user (including any anonymous user) can read/write **any** room's metadata and read **any** room's messages (`chat-rooms` rules require only `request.auth != null`). The private-room "secret code" is **app-layer obscurity, not a rules-enforced boundary** — an attacker who knows or guesses a room ID can read its chat. For an NSFW app this is a real privacy gap. Hardening: store a members map and check membership in rules.
2. ~~**`schedule.url` and `custom-actions.customAction` have no size/format validation.**~~ **Resolved** — `firestore.rules` now caps sizes (`schedule.url` ≤2048, `customAction` ≤2000, `gameBoard` ≤600 K, `settings` ≤200 K) and anchors `schedule.url` to `^https?://` (or empty), with `hasOnly` field locks. Covered by `npm run test:rules` (emulator). Background **media** URLs are also constrained — only an allowlist of known providers reaches the `<iframe>`, and the shared `roomBackgroundURL` is scheme-validated on submit — see [Content & input validation](#content--input-validation).

---

## Realtime Database rules (`database.rules.json`)

Top-level defaults deny (`".read": false, ".write": false`) — good baseline. Then:

| Path                                                | Read                                              | Write                              | Notes                                                       |
| --------------------------------------------------- | ------------------------------------------------- | ---------------------------------- | ----------------------------------------------------------- |
| `users` / `users/{uid}`                             | **public (`true`)**                               | owner only (`auth.uid == $userId`) | ⚠ All presence records globally readable. Writes validated. |
| `rooms/{roomId}/uids/{uid}/{connId}`                | **public (`true`)**                               | owner only                         | Presence/connection list world-readable.                    |
| `video-calls/{roomId}`                              | `auth != null`                                    | —                                  |                                                             |
| `…/users/{uid}`                                     | `auth != null`                                    | owner only                         | Validated.                                                  |
| `…/offers \| answers \| ice-candidates/{targetUid}` | **only the target** (`auth.uid == $targetUserId`) | **any auth (`auth != null`)**      | Read is correctly scoped; write is open.                    |

**Key weaknesses:**

1. **Presence is world-readable** (`users/.read: true`, `rooms/.../uids` read `true`): anyone can enumerate display names, which room each user is in, and `lastSeen`. Privacy gap for an adult app. Hardening: scope reads to authenticated users / own record.
2. **Signaling writes aren't scoped to the target** (`offers/answers/ice-candidates` write = `auth != null`). A malicious authed user can spam bogus offers/answers/candidates into another user's signaling path. Impact is limited (reads _are_ target-scoped, so they can't intercept responses), but it enables signaling-channel griefing. Hardening: require `auth.uid == $targetUserId` or validate the `from` field.

---

## Storage rules (`storage.rules`)

Solid. `images/{id}`: public read; write requires auth **and** `size < 5 MB` **and** `contentType` matches `image/.*` **and** filename extension in `{jpg,jpeg,png,gif,webp}`. Everything else denied by default. Note SVG is **not** in the allowlist (good — avoids SVG-borne script). Uploaded images are re-encoded through a canvas client-side (`src/services/imageProcessing.ts`) before upload, which drops EXIF/metadata (incl. GPS); non-photo formats (gif) pass through untouched to avoid flattening animation.

---

## Cloud Functions (`functions/src/index.ts`)

7 exported functions: scheduled cleanups (stale users ~5 min, inactive anonymous accounts daily, video-call signaling ~5 min), RTDB presence triggers (`onUserDisconnect`, presence validation), and two **callable** admin helpers.

**Admin callables** — `manualCleanupStaleUsers` and `manualCleanupAnonymousAccounts`:

- Both gate on an `admin` **custom claim** (`context.auth.token.admin`), bypassed only in the Functions emulator. The anonymous-cleanup one additionally keys on `isProduction`.
- **This fails closed in production:** if no user has the `admin` claim set, nobody can invoke them. (The earlier worry that "any authenticated user could trigger cleanup" is **not** accurate for the production path.)

**Weaknesses / hardening:**

- The gating differs between the two functions (`!isEmulator` vs `isProduction`), so in a **non-emulator, non-production** environment (e.g. a dev/staging project) the check can be skipped. Make the gate consistent and explicit.
- No rate limiting on the callables; repeated calls could be abused if the claim ever leaks.
- Logs include UIDs being cleaned up → low-grade PII in function logs.

---

## Secrets & configuration

- Client Firebase config (`VITE_FIREBASE_*`) and the Sentry DSN are **public by design** — they're meant to ship in the bundle, and Firebase access is constrained by the rules above. This is expected, not a leak.
- **TURN relay credentials** (`VITE_METERED_*`) ship in the client bundle too. These are effectively shared secrets and can be harvested from the bundle to use the TURN server. Treat as low-privilege; **rotate periodically** and prefer short-lived/dynamic credentials if the provider supports it.
- **`.env` is git-ignored today** (verified: not tracked). **However, git history shows `.env` was committed in early 2024** (added in commit `22b444db`, removed in `98364f35`). Any credential present during that window should be considered **exposed in history** and rotated; scrubbing history is the stronger remedy.
- Sentry build token lives in `.env.sentry-build-plugin` (git-ignored). Keep it CI-only.

---

## Content & input validation

- **Chat markdown** — rendered via `react-markdown` (+ `remark-gfm`, `remark-gemoji`). Safe by default: AST-based, no raw HTML, no `dangerouslySetInnerHTML` in app code. Message text capped at 1000 chars by Firestore rules.
- **Custom tiles/groups** — `validationService.ts`: name length/charset, reserved-name blocklist, intensity bounds and uniqueness, group references checked. Public `custom-actions`/`game-boards`/`schedule` writes are additionally size-capped and field-locked (`hasOnly`) by `firestore.rules`; the custom-action input is `maxLength`-guarded client-side.
- **Media URLs** — user-supplied background URLs are normalized (`getBackgroundSource.ts`) then placed into an `<iframe src>` or a CSS `background-image: url(...)`. The `<iframe>` path is reached **only** for an allowlist of known providers (`isValidHost` switch — YouTube, Vimeo, Imgur, etc., each rewritten to that provider's embed domain); anything unrecognized falls to `background-image`, never the iframe. The iframe is sandboxed (`allow-same-origin allow-scripts allow-presentation`; no `allow-popups`/`allow-top-navigation`). The shared `roomBackgroundURL` is scheme/length/traversal-validated via `isValidURL` on submit (`gameSettingsOrchestrator.ts`). _Residual:_ the app-only `backgroundURL` (custom app background) is not run through `isValidURL` — lower risk since it's local/self-only and still subject to the provider allowlist.
- **Display names** — not sanitized before being rendered in messages → possible RTL/zero-width/homograph shenanigans. Low severity; add normalization.

---

## Privacy & data collection

- **Analytics** (`analytics.ts`, `analyticsTracking.ts`): event-level (setting changes, action/mode selection, engagement, perf). **Display names excluded**; room codes included. Session IDs via `crypto.randomUUID`.
- **Sentry** (`src/services/sentry.ts`): error capture + **session replay**. Replay currently does **not mask text** → it can capture chat and action content, which for NSFW use is sensitive. **Recommended:** enable `maskAllText: true` (or scope replay off for message surfaces).
- No in-app cookie/analytics consent banner or documented data-deletion/opt-out flow.

---

## Strengths (for balance)

- HTTPS everywhere (GitHub Pages + Firebase); data encrypted at rest by Firebase.
- Owner-scoped `user-data`; storage default-deny; RTDB top-level default-deny.
- Message create is field-validated and length-capped; boards/custom-actions are create-only with TTL cleanup, size-capped, and field-locked.
- Firestore rules are covered by emulator-backed tests (`npm run test:rules`).
- No `eval`/`Function` constructors, no `dangerouslySetInnerHTML` in app code, safe markdown.

---

## Prioritized hardening backlog

1. **Enforce room membership in `chat-rooms` rules** (read + write) — highest-value fix; today private rooms are obscurity-only.
2. **Scope RTDB presence reads** (`users`, `rooms/*/uids`) to auth/own record.
3. **Scope signaling writes** to the target user (or validate `from`).
4. **Make admin-callable gating consistent**, add rate limiting.
5. Sanitize/normalize display names; add a privacy notice + analytics opt-out.

## Known benign console warnings

- **`Cross-Origin-Opener-Policy policy would block the window.closed/window.close call`** — emitted by Chrome during Google sign-in. Firebase's `signInWithPopup` (`src/services/firebase.ts:loginWithGoogle`) polls `popup.closed` / calls `popup.close()` on the cross-origin `accounts.google.com` popup; Chrome warns about this as a heads-up. No COOP/COEP header is set in dev or prod (the site is served from GitHub Pages), so nothing is actually being blocked — auth completes normally. Removing the warning would require switching to `signInWithRedirect`, a UX/behavior change (redirect flow, `getRedirectResult`, Safari-ITP/mobile considerations) deliberately not made for a cosmetic console line.
- Note: the `headers` block in `firebase.json` (CSP, HSTS, etc.) is **not applied in production** — the app deploys via `gh-pages -b master` (GitHub Pages), not Firebase Hosting. Those headers only take effect if/when the app is served from Firebase Hosting.
