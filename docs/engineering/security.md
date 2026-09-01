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

**Gen 2 notes.** Instances now serve up to 80 concurrent requests, where Gen 1 served one. The mint quota is unaffected because `consumeRateLimit` decides inside a Firestore transaction rather than read-then-write — that property is now load-bearing, so keep it if you touch `rateLimit.ts`. Gen 2 also runs as a different default service account than Gen 1's `<project>@appspot.gserviceaccount.com`, so the Secret Manager grants for `CLOUDFLARE_TURN_TOKEN` and `SENDGRID_API_KEY` have to follow it. Both failures are **silent**: a missing TURN secret degrades to the bundled relay via the client's catch-all fallback, and a missing SendGrid key logs an error and returns, so pack reports simply stop emailing.

**Verification.** `functions/src/__tests__/callables.test.ts` covers the `request`/`event` shapes with the SDK's `.run()` hook, and CI's `functions` job builds and runs it. The Functions emulator cannot invoke these handlers at all — `initializeApp({ credential: applicationDefault() })` fails there without real credentials, on v1 and v2 alike — so it verifies only that definitions load with the right trigger types and region.

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

| Path                                                | Read                                              | Write                              | Notes                                                                                                                                                                                                                        |
| --------------------------------------------------- | ------------------------------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `users` / `users/{uid}`                             | **public (`true`)**                               | owner only (`auth.uid == $userId`) | ⚠ All presence records globally readable. Writes validated.                                                                                                                                                                  |
| `video-calls/{roomId}`                              | denied                                            | —                                  | No ancestor grant — RTDB read grants cascade and cannot be revoked below.                                                                                                                                                    |
| `…/users` / `…/users/{uid}`                         | `auth != null`                                    | owner only                         | Roster must be readable by everyone in the room. Validated, including the `cam`/`mic` published-media flags, which are constrained to their vocabularies so a peer cannot write arbitrary strings other clients will render. |
| `…/offers \| answers \| ice-candidates/{targetUid}` | **only the target** (`auth.uid == $targetUserId`) | **any auth (`auth != null`)**      | Read is correctly scoped; write is open.                                                                                                                                                                                     |

**Key weaknesses:**

1. **Presence is world-readable** (`users/.read: true`): anyone can enumerate display names, which room each user is in, and `lastSeen`. Privacy gap for an adult app. Hardening: scope reads to authenticated users / own record.
2. **Signaling writes aren't scoped to the target** (`offers/answers/ice-candidates` write = `auth != null`). A malicious authed user can spam bogus offers/answers/candidates into another user's signaling path. Impact on _confidentiality_ is limited (reads _are_ target-scoped, so they can't intercept responses), but it enables signaling-channel griefing. Note the write cannot simply be narrowed to `auth.uid == $targetUserId`: signaling requires writing **into the other party's** inbox, and under perfect negotiation both sides may write offers. Hardening is a `from`-field validation on push plus an owner-only delete.
3. **Any authed user can wipe another room's signaling queues** — the same `auth != null` write, exercised as a delete. `.validate` only runs against `newData`, and a delete has no `newData`, so the `from == auth.uid` check cannot reject it. Any signed-in stranger who knows a room ID can therefore clear `offers/answers/ice-candidates` for its participants: a trivial call-breaking DoS, distinct from the spam-in case above. Asserted as current behaviour (and marked ⚠) in `tests/database.rules.spec.ts`. Hardening: require `newData.exists()` for writes below the inbox and restrict deletes to the owning uid.

**Fixed 2026-08:** `video-calls/$roomId` previously carried `".read": "auth != null"`. RTDB read grants cascade downward and **cannot be revoked by a stricter rule on a child**, so the per-target reads on `offers`/`answers`/`ice-candidates` were dead code and any authenticated user could read every room's signaling traffic. The ancestor grant is gone; reads are now granted only on `users` (the roster, which every participant needs) and per-target under the three signaling nodes.

**RTDB rules are now covered by tests:** `npm run test:rules:db` runs `tests/database.rules.spec.ts` against the `database` emulator (`vitest.database.rules.config.ts`; the emulator is declared in `firebase.json` on port **9002**, because 9000 is commonly taken by `php-fpm`). The suite opens with a canary that fails if the ruleset loaded permissive _or_ deny-everything, and it was mutation-checked by temporarily re-introducing the cascading-read regression above — which produced exactly the 6 expected failures. Rules the suite records as ⚠ are asserted **as they currently behave**, not as they should; see weaknesses 2 and 3.

---

## Storage rules (`storage.rules`)

Solid. `images/{id}`: public read; write requires auth **and** `size < 5 MB` **and** `contentType` matches `image/.*` **and** filename extension in `{jpg,jpeg,png,gif,webp}`. Everything else denied by default. Note SVG is **not** in the allowlist (good — avoids SVG-borne script). Uploaded images are re-encoded through a canvas client-side (`src/services/imageProcessing.ts`) before upload, which drops EXIF/metadata (incl. GPS); non-photo formats (gif) pass through untouched to avoid flattening animation.

---

## Cloud Functions (`functions/src/index.ts`)

All 9 are **2nd gen** (`firebase-functions/v2`) on **nodejs24** — that runtime is 2nd-gen only, which is why the migration happened. Handlers read a single `request` (`request.auth`, `request.data`) rather than `(data, context)`, and Firestore triggers read `event.data`, which v2 types as optional.

**Runtime identity is pinned, and it is a security boundary.** `RUNTIME_OPTIONS` (`functions/src/runtime.ts`) is spread into all 9 definitions and sets both `region: us-central1` (the client calls `getFunctions(app)` with no region) and `serviceAccount: <project>@appspot.gserviceaccount.com`. Gen 2 otherwise runs as the project's default **compute** account, which held only `eventarc.eventReceiver` and `run.invoker` — every admin-SDK call then fails with "Provided authentication credentials for the app named [DEFAULT] are invalid", which is exactly what happened on cutover. Pinning to the App Engine account inherits the roles these functions were written against: `firebase.sdkAdminServiceAgent` (RTDB + Firestore) and `firebaseauth.admin` (listUsers/deleteUsers), plus `roles/eventarc.eventReceiver`, which had to be granted before the RTDB and Firestore triggers would deploy at all.

**Do not swap that for `setGlobalOptions`.** It was tried and failed silently: the call sits in `index.ts`'s body, but ES imports are evaluated first, so `getTurnCredentials` and `onPackReported` were already constructed and kept the SDK defaults — they deployed under the _wrong service account_ while the CLI reported success. Spreading an explicit constant is order-independent.

9 exported functions: scheduled cleanups (stale users ~5 min, inactive anonymous accounts daily, video-call signaling + stale roster entries ~5 min), RTDB presence triggers (`onUserDisconnect`, presence validation), a pack-report notification, two **callable** admin helpers, and `getTurnCredentials`.

**`getTurnCredentials`** — mints Cloudflare TURN credentials (2h TTL, 10s upstream budget, 30s function timeout so a hung call returns a real error rather than a platform timeout with no CORS headers) from the `CLOUDFLARE_TURN_TOKEN` secret. Not admin-gated: any signed-in caller may use it, but only for a room where they already hold a `video-calls/{roomId}/users/{uid}` presence node. That check is the first spend control — relay bandwidth bills to us and anonymous guest accounts are free to create, so `request.auth` alone would gate nothing.

**Per-uid rate limit** (`functions/src/rateLimit.ts`): **60 mints per 10-minute window**, enforced after the presence check and before any Cloudflare call. `rate-limits/{uid}` holds one document per user with a `{ count, windowStartedAt }` bucket per action; the collection is `allow read, write: if false` in `firestore.rules`, so only the admin SDK touches it. Read-decide-write runs in a transaction — a bare `FieldValue.increment` would make the write atomic but not the _decision_. Blocked calls write nothing and raise `resource-exhausted` with `retryAfterMs`. Two deliberate choices: the quota is **generous** (steady state is ~1 mint per tab per 110 min; the worst legitimate case, a full retry storm across all 4 peers, is 24 mints in ~57s) because a false block breaks webcam calls, and the gate **fails open** if Firestore is unavailable, so a Firestore blip cannot take video down globally. Note what this does _not_ do: one credential relays unlimited bytes for its 2h TTL, so the cap bounds how widely an account can redistribute credentials, not bandwidth.

**App Check is staged but inert** (`functions/src/appCheck.ts`): `APP_CHECK_ENFORCED = false`, with a soft observer that logs when a verified token arrives. Enforcement must not be switched on until reCAPTCHA v3 is registered in the Firebase console **and** the client calls `initializeAppCheck` — otherwise every `getTurnCredentials` call 403s and webcam breaks. The `ttl` field on rate-limit docs is likewise inert until a TTL policy is configured on the collection.

Steps to enable, in order — each one 403s every call on its own if skipped:

1. **reCAPTCHA v3 site registration** — <https://www.google.com/recaptcha/admin> → Create → reCAPTCHA v3 → add `blitzedout.com` and `localhost`. Keep the **secret key**; the site key is public and belongs in the client.
2. **Register the web app with App Check** — Firebase console → Build → App Check → Apps → the web app → reCAPTCHA v3 → paste the secret key. Leave every API at **Unenforced**.
3. **Debug token for local dev** — App Check → Apps → web app → ⋮ → Manage debug tokens; add the token the browser prints when `self.FIREBASE_APPCHECK_DEBUG_TOKEN = true` is set before `initializeAppCheck`.
4. **Client wiring** in `src/services/firebase/app.ts`: `initializeAppCheck(app, { provider: new ReCaptchaV3Provider(import.meta.env.VITE_RECAPTCHA_SITE_KEY), isTokenAutoRefreshEnabled: true })`. Ship it, then wait for `observeAppCheck`'s "token verified" line to appear for real traffic across a release — that line is the go signal, and it is silent until wiring lands.
5. **Only then** set `APP_CHECK_ENFORCED = true` and `firebase deploy --only functions:getTurnCredentials`.

**Admin callables** — `manualCleanupStaleUsers` and `manualCleanupAnonymousAccounts`:

- Both gate on an `admin` **custom claim** (`request.auth.token.admin`), bypassed only in the Functions emulator. The anonymous-cleanup one additionally keys on `isProduction`.
- **This fails closed in production:** if no user has the `admin` claim set, nobody can invoke them. (The earlier worry that "any authenticated user could trigger cleanup" is **not** accurate for the production path.)

**Gen 2 notes.** Instances now serve up to 80 concurrent requests, where Gen 1 served one. The mint quota is unaffected because `consumeRateLimit` decides inside a Firestore transaction rather than read-then-write — that property is now load-bearing, so keep it if you touch `rateLimit.ts`. Gen 2 also runs as a different default service account than Gen 1's `<project>@appspot.gserviceaccount.com`, so the Secret Manager grants for `CLOUDFLARE_TURN_TOKEN` and `SENDGRID_API_KEY` have to follow it. Both failures are **silent**: a missing TURN secret degrades to the bundled relay via the client's catch-all fallback, and a missing SendGrid key logs an error and returns, so pack reports simply stop emailing.

**Verification.** `functions/src/__tests__/callables.test.ts` covers the `request`/`event` shapes with the SDK's `.run()` hook, and CI's `functions` job builds and runs it. The Functions emulator cannot invoke these handlers at all — `initializeApp({ credential: applicationDefault() })` fails there without real credentials, on v1 and v2 alike — so it verifies only that definitions load with the right trigger types and region.

**Weaknesses / hardening:**

- The gating differs between the two functions (`!isEmulator` vs `isProduction`), so in a **non-emulator, non-production** environment (e.g. a dev/staging project) the check can be skipped. Make the gate consistent and explicit.
- No rate limiting on the callables; repeated calls could be abused if the claim ever leaks.
- Logs include UIDs being cleaned up → low-grade PII in function logs.

---

## Secrets & configuration

- Client Firebase config (`VITE_FIREBASE_*`) and the Sentry DSN are **public by design** — they're meant to ship in the bundle, and Firebase access is constrained by the rules above. This is expected, not a leak.
- **TURN relay credentials.** The primary path is now short-lived: `getTurnCredentials` (a callable requiring `request.auth`) mints Cloudflare credentials server-side from the `CLOUDFLARE_TURN_TOKEN` Secret Manager secret, which never reaches the client. The bundled credentials (`VITE_METERED_*`) still ship in the client and remain harvestable — treat as low-privilege and **rotate periodically**. They are not merely a fallback: every call _starts_ on them, because minting happens in the background rather than blocking startup, so peers dialled before it completes keep using them for the life of the connection. They are also what the client falls back to whenever minting fails.
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
  - **Fixed 2026-08:** `thirdPartyErrorFilterIntegration` was dropping **every stack-traced error in production** since Nov 2025. It relies on module metadata injected by `sentryVitePlugin`, which only registers when `SENTRY_UPLOAD_SOURCEMAPS=true` — set nowhere — so every frame looked third-party. Reporting appeared healthy while only stackless events (gtag noise) arrived. The integration is gone; `ignoreErrors` and `beforeSend` handle extension/browser noise without depending on a build flag. Re-adding it requires making that plugin unconditional first.
  - **Noise filters** live in two places, split by what they need to inspect. Message-only patterns go in `IGNORED_ERROR_PATTERNS` / `NETWORK_ERROR_PATTERNS` (`src/services/sentry.ts`). Anything that has to read the **stack frames** goes in `src/services/sentryFilters.ts` as a pure predicate and is called from `beforeSend`: `isOpaqueStacklessError` (a bare `Error` with a short minified message and no frames — nothing in `src/` can produce one) and `isInjectedScriptStackOverflow` (a `RangeError: Maximum call stack size exceeded` with no frame from `/assets/` or `/js/`, i.e. browser-injected script such as Google Translate on Chrome iOS). Both keep events that carry a frame from our own bundle, so genuine bugs still report. A third, `isProxyRewrittenHostCall`, covers a content-filter proxy seen on iOS 2026-09-01 that rewrites third-party scripts to same-origin `/__av/<base64 of the original URL>` and runs them against a wrapped `window`, so WebKit rejects every host method they forward — observed as `Window.setTimeout` from Firebase Auth's gapi iframe loader and `Window.setInterval` from gtag. It matches the proxy's own frame; its docblock says why neither the message nor own-bundle absence can. Costs, accepted: sessions behind _this_ proxy go dark, and since the Safari branch of `isNetworkError` already swallows their failing Firestore `Listen/channel` POSTs, the whole broken-session signature is invisible — including that `signInWithPopup`/`signInWithRedirect` never works for them. Tagging instead of dropping was available (`network_error_with_trace`, a few lines down) and deliberately not taken: the proxy is the entire cause and no app change addresses it. A proxy using a different prefix reports as noise until its prefix joins `PROXY_REWRITE_DIRECTORIES`, which is the right direction to fail.
    - A **messageless** exception is still matchable by `ignoreErrors`, which is not obvious: `getPossibleEventMessages` only offers the `type: value` candidate when `value` is truthy, but `extractMessage` (`@sentry/browser/eventbuilder`) substitutes the literal `No error message` first, so the candidate always exists. That is what `/^NS_ERROR_FAILURE: No error message$/` matches — Firefox's bare nsresult, observed from Firestore's `SharedClientState` (pulled in by `persistentMultipleTabManager()`, dropped 2026-08-22 — see ADR 0001's amendment; Dexie's cross-tab polling still throws the same shape), which clears `localStorage` keys from a `pagehide` handler and throws when Firefox has storage blocked (ETP strict, "never remember history"). `ignoreErrors` is the right seam over a `beforeSend` predicate for two reasons: frame scoping is impossible anyway (`beforeSend` runs in the browser, before sourcemap resolution, and `chunkFileNames` derives from `facadeModuleId`, which vendor chunks lack — so Firebase ships as `js/chunk-<hash>.js`, inside the same `/js/` directory `sentryFilters.ts` treats as our own bundle), and it matches the **last** exception value, where the thrown error lives — the `sentryFilters.ts` predicates read `values[0]`, which is the innermost `cause` once `linkedErrorsIntegration` has chained one. Consequence, accepted: a messageless nsresult from our own persisted stores is dropped too. One that names what failed still reports.
    - `/the database connection is closing/i` covers `InvalidStateError` from IndexedDB closed while a consumer still held it (page unload and iOS backgrounding both do this; the breadcrumbs do not say which). Seen on iOS Safari from `@firebase/auth`'s 800 ms persistence poller, which only surfaces the throw once `_withRetries` has spent all three attempts, i.e. the connection is gone, not flaky. Anchored on the condition rather than the `Failed to execute 'transaction' on 'IDBDatabase'` prefix, which names the IDB call and varies per caller and engine. Same frame-scoping limit as above, so a Dexie occurrence drops too. That one is not costless: `SafariConnectionStrategy` (`src/utils/dbRecovery.ts`) already matches `database connection` and retries once through a close/reopen, so a suppressed app-path event is a recovery that **failed** — and `logger` never forwards to Sentry, which leaves no signal. Accepted, because the retry already happened and the connection is gone either way. A real IDB misuse (`The transaction is inactive or finished`) still reports. Residual risk, accepted: the auth poller's `setInterval` is never cleared on rejection, so it recovers on the next tick — but if IndexedDB is gone for good (Safari eviction), the tab stays signed in with no signal anywhere, and this pattern removes the last one.
    - `/^SecurityError: The operation is insecure\.$/` covers storage entirely blocked — iOS Lockdown Mode, aggressive tracking prevention, or similarly locked-down private browsing, where merely accessing `localStorage`/`IndexedDB` throws instead of just failing quota/version checks. Seen from two vendor call sites at once: Dexie's cross-tab schema-sync poll (`indexedDB.databases()`, called on an interval from library code, not from any app `db.open()` call) and Firestore's `SharedClientState.Je` reading `window.localStorage` during lazy IndexedDB-persistence init — the latter happens asynchronously well after `initializeFirestore`'s synchronous try/catch (`src/services/firebase/app.ts`) has already returned, so that catch can't see it; a `localStorage` probe added ahead of the `persistentLocalCache` call sidesteps it by choosing the memory-cache branch up front instead. Anchored on the full `type: value` wording rather than a bare `SecurityError` substring, because WebKit reuses that type for unrelated tainted-canvas `getImageData` calls (this app has a dice-box canvas surface) that must still report. Same frame-scoping limit as above. Distinct from `getActiveBoard`/`getBoards` (`src/stores/gameBoard.ts`), which had no try/catch at all and let a `SecurityError` from Dexie propagate as a genuine unhandled rejection through `useLiveQuery` — that's an app-code gap, fixed with `retryOnCursorError`, not a Sentry filter.
  - `SENTRY_UPLOAD_SOURCEMAPS` is set nowhere, so nothing is **uploaded** to Sentry — but `vite.config.ts` builds with `sourcemap: true`, the chunks keep their `sourceMappingURL`, and the `.map` files ship to the deploy branch, so Sentry fetches them from the public URL and production stacks do resolve (not every chunk's map is present, so coverage is partial). Consequence: the maps are world-readable. Accepted — a client bundle is readable anyway and no secret lives in it; secrets are in Functions config. Sourcemaps do **not** help stackless or document-attributed events — there are no frames to map.
  - **`isExpectedDOMError` (`src/constants/errorPatterns.ts`) suppresses in two places at once.** `FilteredErrorBoundary` shares it between `getDerivedStateFromError` and `componentDidCatch`, so widening it stops the crash screen _and_ the Sentry report together. It now matches WebKit's bare `The object can not be found here` with no DOM method named, because that evidence only exists in the stack frames, which the predicate never sees. Accepted trade-off: a genuine `NotFoundError` thrown during render (e.g. direct DOM work on a detached node) is now invisible in both places.
- No in-app cookie/analytics consent banner or documented data-deletion/opt-out flow.

---

## Strengths (for balance)

- HTTPS everywhere (GitHub Pages + Firebase); data encrypted at rest by Firebase.
- Owner-scoped `user-data`; storage default-deny; RTDB top-level default-deny.
- Message create is field-validated and length-capped; boards/custom-actions are create-only with TTL cleanup, size-capped, and field-locked.
- Firestore **and** RTDB rules are covered by emulator-backed tests (`npm run test:rules`, `npm run test:rules:db`).
- `getTurnCredentials` is presence-gated and rate-limited per uid; the Cloudflare token stays in Secret Manager.
- No `eval`/`Function` constructors, no `dangerouslySetInnerHTML` in app code, safe markdown.

---

## Prioritized hardening backlog

1. **Enforce room membership in `chat-rooms` rules** (read + write) — highest-value fix; today private rooms are obscurity-only.
2. **Scope RTDB presence reads** (`users`) to auth/own record.
3. **Stop authed strangers deleting a room's signaling inboxes** (require `newData.exists()`; owner-only delete) — a one-line DoS today, now pinned by a rules test.
4. **Validate `from` on signaling writes** (the write itself must stay open — both parties write into each other's inboxes).
5. **Finish App Check on `getTurnCredentials`**: console setup + client `initializeAppCheck`, then flip `APP_CHECK_ENFORCED`.
6. **Make admin-callable gating consistent**; extend the per-uid limiter to the other callables (`appCheckRuntimeOptions()` and `enforceRateLimit` are reusable).
7. Sanitize/normalize display names; add a privacy notice + analytics opt-out (GA4 loads unconditionally today, with no consent gate and no policy in the repo).

## Known benign console warnings

- **`Cross-Origin-Opener-Policy policy would block the window.closed/window.close call`** — emitted by Chrome during Google sign-in. Firebase's `signInWithPopup` (`src/services/firebase/auth.ts:loginWithGoogle`) polls `popup.closed` / calls `popup.close()` on the cross-origin `accounts.google.com` popup; Chrome warns about this as a heads-up. No COOP/COEP header is set in dev or prod (the site is served from GitHub Pages), so nothing is actually being blocked — auth completes normally. Removing the warning would require switching to `signInWithRedirect`, a UX/behavior change (redirect flow, `getRedirectResult`, Safari-ITP/mobile considerations) deliberately not made for a cosmetic console line.
- Note: the `headers` block in `firebase.json` (CSP, HSTS, etc.) is **not applied in production** — the app deploys via `gh-pages -b master` (GitHub Pages), not Firebase Hosting. Those headers only take effect if/when the app is served from Firebase Hosting.
