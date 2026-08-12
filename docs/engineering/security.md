# Security

Companion to [README.md](README.md). Security model, the actual rules in force, and a candid list of weaknesses. This is an adult (NSFW) app with mostly **anonymous users** and **user-generated content**, so the threat model centers on privacy, content abuse, and authorization — not classic account takeover.

> Rules in this doc were read directly from `firestore.rules`, `database.rules.json`, `storage.rules`, and `functions/src/index.ts`. No live credential values are reproduced here by design.

---

## Authentication

`src/services/firebase/auth.ts`, `src/services/authBridge.ts`, `src/components/auth/*`, `src/context/auth.tsx`.

- **Anonymous** (`signInAnonymously`) is the default path; **email/password** and **Google** are available; anonymous → registered upgrade via `linkWithCredential` preserves UID.
- **The upgrade re-signs in on purpose.** Linking alone leaves the session's `firebase.sign_in_provider` claim as `'anonymous'`, and that claim is what `publicVisibilityGated()` reads — so `convertAnonymousAccount` / `linkGoogleAccount` immediately sign in again with the credential they just linked (`signInWithEmailAndPassword`, or `signInWithCredential` reusing the popup's OAuth credential, so no second popup). Same UID, provider claim now `password`/`google.com`, and **no `signOut`** — a null `user` would unmount route-gated screens mid-flow (`RouterSetup` gates `/packs/create` on `auth.user`).
- Linking against an email or Google account that already exists cannot succeed; those Firebase codes are normalized to the `ACCOUNT_EXISTS` code (`isAccountExistsError`) so the UI can offer a plain sign-in instead, which **changes UID** and leaves guest-published packs behind.
- **A link whose re-auth fails is its own error code**, `ACCOUNT_LINKED_NEEDS_SIGNIN`. That half-upgraded state is the dangerous one: Firebase has already flipped `user.isAnonymous` to `false` while the session's provider claim is still `'anonymous'`, so anything keyed on `isAnonymous` reads "permanent" and any gated write is still rejected — and it survives a reload. The dialogs steer to a sign-in (which keeps the UID, since the credential is linked); never retry the link, which hits `provider-already-linked` (mapped to the same "finish signing in" recovery, since that code means _this_ user already holds the provider and the UID would not change).
- **Never gate a rules-backed capability on `isAnonymous`.** It is the flag that lies in the state above. `AuthContext` exposes **`hasPermanentProvider`**, read from the ID token's `signInProvider` (`context/auth.tsx`) and therefore the same fact `publicVisibilityGated()` sees. `PackCreator` keys the Public option, the helper text, the review line, and submit-time enforcement on it; `MenuDrawer` shows the account item when `isAnonymous || !hasPermanentProvider`, so a half-linked session keeps a durable route back to finishing the sign-in instead of losing the affordance the moment `isAnonymous` flips. The token is re-read on every `user` change, so a reload recovers the truth rather than inheriting the lie.
- Auth state via `onAuthStateChanged`; logout clears auth, and a wipe path clears all local storage/IndexedDB/cookies.

**Weaknesses / hardening:**

- No client-side password policy (length/complexity/breach check) — relies on Firebase defaults.
- No recovery for anonymous identities; clearing browser data orphans the account and its un-synced local content.
- No session timeout / idle logout.
- `displayName` is set via `updateProfile` without sanitization and is rendered in messages → see [Input validation](#content--input-validation).

---

## Firestore rules (`firestore.rules`)

| Path                                | Read                              | Write                                                                                                                                | Notes                                                                                            |
| ----------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `user-data/{uid}`                   | owner only                        | owner only                                                                                                                           | `request.auth.uid == uid`. Solid.                                                                |
| `custom-actions/{id}`               | public                            | auth create only; field-typed + size-capped; `hasOnly` field lock; **no update/delete**                                              | TTL-based cleanup.                                                                               |
| `game-boards/{id}`                  | public                            | auth create (field-typed + size-capped, `hasOnly`); update limited to `ttl`; no delete                                               | Good — restrictive update.                                                                       |
| `chat-rooms/{roomId}`               | **any auth**                      | **any auth**                                                                                                                         | ⚠ Room metadata is not membership-scoped.                                                        |
| `chat-rooms/{roomId}/messages/{id}` | any auth (read + list)            | auth create with `uid == auth.uid`, `text ≤ 1000`, `type` enum; delete own only; no edit                                             | Create validation is good; **read is not room-scoped**.                                          |
| `rate-limits/{uid}`                 | none                              | none                                                                                                                                 | System-only.                                                                                     |
| `schedule/{id}`                     | public                            | creator-only create/update/delete; update limited to `dateTime`/`url`                                                                | `url` scheme/size validated (`^https?://`, ≤2048, empty ok).                                     |
| `content-packs/{id}`                | `get` any; `list` **public only** | auth create (field-typed, `hasOnly` lock, `visibility` gated); author-only update (`packVersion` must increase); author/admin delete | `get`-by-id works for any visibility (link import); `list` requires `where(visibility==public)`. |
| `reports/{id}`                      | none (admin via console)          | auth create only (`reporterUid == auth.uid`, `reason ≤ 500`)                                                                         | Post-moderation: report → console takedown.                                                      |

**Content-pack visibility + public-publish gate:** `list` is restricted to `resource.data.visibility == 'public'`, so directory queries **must** carry `where('visibility','==','public')` or Firestore rejects them — that rejection is what keeps private packs out of the directory (they remain `get`-able by id). Publishing **public** additionally requires a permanent account: `publicVisibilityGated()` allows `visibility == 'private'` for anyone but demands `request.auth.token.firebase.sign_in_provider != 'anonymous'` for public. The four directory/summary fields (`visibility`, `tileCount`, `groupCount`, `groupLabels`) are in the create `hasOnly`/`hasAll` and update `affectedKeys` lists so create, republish, and visibility-flip all pass. Covered by `npm run test:rules`.

**Setting the `admin` claim** (out-of-band; no app code grants it) — run once against the project, e.g. in a Functions shell or a privileged script:

```js
await admin.auth().setCustomUserClaims(uid, { admin: true });
```

The holder can then delete reported packs (`content-packs` delete rule) and invoke the admin Cloud Functions; everyone else fails closed.

**Key weaknesses:**

1. **Room access isn't enforced in rules.** Any authenticated user (including any anonymous user) can read/write **any** room's metadata and read **any** room's messages (`chat-rooms` rules require only `request.auth != null`). The private-room "secret code" is **app-layer obscurity, not a rules-enforced boundary** — an attacker who knows or guesses a room ID can read its chat. For an NSFW app this is a real privacy gap. Hardening: store a members map and check membership in rules.
2. ~~**`schedule.url` and `custom-actions.customAction` have no size/format validation.**~~ **Resolved** — `firestore.rules` now caps sizes (`schedule.url` ≤2048, `customAction` ≤2000, `gameBoard` ≤600 K, `settings` ≤200 K) and anchors `schedule.url` to `^https?://` (or empty), with `hasOnly` field locks. Covered by `npm run test:rules` (emulator). Background **media** URLs are also constrained — only an allowlist of known providers reaches the `<iframe>`, and the shared `roomBackgroundURL` is scheme-validated on submit — see [Content & input validation](#content--input-validation).

---

## Realtime Database rules (`database.rules.json`)

Top-level defaults deny (`".read": false, ".write": false`) — good baseline. Then:

| Path                                                | Read                                              | Write                              | Notes                                                                     |
| --------------------------------------------------- | ------------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------- |
| `users` / `users/{uid}`                             | **public (`true`)**                               | owner only (`auth.uid == $userId`) | ⚠ All presence records globally readable. Writes validated.               |
| `video-calls/{roomId}`                              | denied                                            | —                                  | No ancestor grant — RTDB read grants cascade and cannot be revoked below. |
| `…/users` / `…/users/{uid}`                         | `auth != null`                                    | owner only                         | Roster must be readable by everyone in the room. Validated.               |
| `…/offers \| answers \| ice-candidates/{targetUid}` | **only the target** (`auth.uid == $targetUserId`) | **any auth (`auth != null`)**      | Read is correctly scoped; write is open.                                  |

**Key weaknesses:**

1. **Presence is world-readable** (`users/.read: true`): anyone can enumerate display names, which room each user is in, and `lastSeen`. Privacy gap for an adult app. Hardening: scope reads to authenticated users / own record.
2. **Signaling writes aren't scoped to the target** (`offers/answers/ice-candidates` write = `auth != null`). A malicious authed user can spam bogus offers/answers/candidates into another user's signaling path. Impact is limited (reads _are_ target-scoped, so they can't intercept responses), but it enables signaling-channel griefing. Hardening: require `auth.uid == $targetUserId` or validate the `from` field.

**Fixed 2026-08:** `video-calls/$roomId` previously carried `".read": "auth != null"`. RTDB read grants cascade downward and **cannot be revoked by a stricter rule on a child**, so the per-target reads on `offers`/`answers`/`ice-candidates` were dead code and any authenticated user could read every room's signaling traffic. The ancestor grant is gone; reads are now granted only on `users` (the roster, which every participant needs) and per-target under the three signaling nodes. There is no RTDB rules test harness — `npm run test:rules` covers Firestore only — so **changes here must be checked by grepping every `video-calls/` read path in `src/`**.

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
2. **Scope RTDB presence reads** (`users`) to auth/own record.
3. **Scope signaling writes** to the target user (or validate `from`).
4. **Make admin-callable gating consistent**, add rate limiting.
5. Sanitize/normalize display names; add a privacy notice + analytics opt-out.

## Known benign console warnings

- **`Cross-Origin-Opener-Policy policy would block the window.closed/window.close call`** — emitted by Chrome during Google sign-in. Firebase's `signInWithPopup` (`src/services/firebase/auth.ts:loginWithGoogle`) polls `popup.closed` / calls `popup.close()` on the cross-origin `accounts.google.com` popup; Chrome warns about this as a heads-up. No COOP/COEP header is set in dev or prod (the site is served from GitHub Pages), so nothing is actually being blocked — auth completes normally. Removing the warning would require switching to `signInWithRedirect`, a UX/behavior change (redirect flow, `getRedirectResult`, Safari-ITP/mobile considerations) deliberately not made for a cosmetic console line.
- Note: the `headers` block in `firebase.json` (CSP, HSTS, etc.) is **not applied in production** — the app deploys via `gh-pages -b master` (GitHub Pages), not Firebase Hosting. Those headers only take effect if/when the app is served from Firebase Hosting.
