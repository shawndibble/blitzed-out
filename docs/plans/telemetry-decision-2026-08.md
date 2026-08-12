# WebRTC transport telemetry — decision memo

**Decision owner: repo owner. No code ships until this is answered.**
Question on the table: should the app automatically report which ICE candidate pair carried a call
(`host`/`srflx` = direct vs `relay` = paid TURN) for users who have _not_ opted in?

Every behavioural claim below was read from the files cited. Uncertainties are marked.

---

## 0. Two questions, not one

The proposal conflates two questions with very different prices.

| Question                                                          | Needs client telemetry?                            |
| ----------------------------------------------------------------- | -------------------------------------------------- |
| **Is TURN carrying calls at all?** (bytes relayed)                | **No** — the provider bills for it and reports it. |
| **What share of connections need relay?** (ratio, per connection) | Yes. Only this justifies new disclosure.           |

The first question has already been answered once by a dashboard, with zero user data: the Metered
reading of **23 MB / 0.5 GB** is what refuted "relay quota exhausted" and promoted ghost presence to
the primary cause (`docs/plans/webcam-fix-2026-08.md:14-32`). The incident was diagnosed without
telemetry — by counting roster entries in the Firebase console
(`docs/plans/webcam-fix-2026-08.md:134-136`). **Answer question 1 from the Cloudflare dashboard
before comparing options; if it suffices, nothing ships.**

---

## 1. What the code does today (verified)

- `logSelectedCandidatePair` reads `pc.getStats()`, picks the nominated pair, and logs
  `{ local, remote }` **candidate types only** (never addresses):
  `src/stores/videoCallStore.ts:601-636`, emit at `:629-632`. ICE transitions at `:718-719`.
- `logger` writes to the console only when `MODE` is `development`/`test`
  (`src/utils/logger.ts:19`) or the user opts in via `?debug=1` / `localStorage.debug = 'true'`
  (`:30-44`, gate at `:46-47`). In production, with no opt-in, these lines reach nobody.
- Nothing in the video-call path touches Sentry or GA4 today — grep of
  `src/stores/videoCallStore.ts`, `src/services/firebaseSignaling.ts`, `src/components/VideoCall/**`
  for `analytics`/`Sentry`: **zero hits.** `src/views/Room/index.tsx` does import `analytics`
  (`:37`) but every call site is gameplay (`:87`, `:130-161`: rolls, game start/finish/abandon,
  group selection) — none fires on opening the cam panel, and a repo-wide grep for a
  video/webcam/cam analytics event returns nothing. **"This device did a webcam call" is currently a
  fact no third party receives.**
- TURN credentials are minted per _attempt_, not per success, and cached account-wide
  (`src/services/iceServers.ts:33-37`, `:34-50`). **Mint count measures demand, never usage** — do
  not mistake it for the answer.
- A hang-up releases the roster slot (`src/stores/videoCallStore.ts:427-429`), so anything that
  tallies live roster nodes on a cron tick samples only calls in progress at that moment.

### Is Sentry even receiving errors? No — verified empirically.

`sentryVitePlugin` (which injects the module metadata carrying `applicationKey: 'blitzed-out'`) is
only registered when `SENTRY_UPLOAD_SOURCEMAPS === 'true'` (`vite.config.ts:11`, `:38-49`).
Nothing sets that variable: not `package.json` (`deploy` = `predeploy` → `npm run build` →
`gh-pages -b master`, lines 11-16), not `.github/workflows/ci.yml` (its build job sets only
`SENTRY_TELEMETRY: false`), not `.env`. Vite does not copy `.env` values into `process.env`, so an
entry there would not help either.

Empirical confirmation against the **deployed** bundle (`origin/master`, built 2026-08-12 15:14,
`assets/index-CanLjY1w.js`): zero occurrences of `_sentryModuleMetadataGlobal`, and
`blitzed-out` appears exactly once — the `filterKeys` literal from `src/services/sentry.ts:150`.
No injected metadata is present.

Consequence, from the integration's own source
(`node_modules/@sentry/core/build/cjs/integrations/third-party-errors-filter.js`): frames without
`module_metadata` map to `[]` keys, `every()` over empty key sets is `true`, `behaviourApplies` is
`true`, and `drop-error-if-exclusively-contains-third-party-frames` (`src/services/sentry.ts:149-152`)
returns `null`. **Every error event with at least one filename+lineno frame is dropped in
production.** Events with no stack frames at all pass (`getFramesFromEvent` returns `undefined`,
so the filter is skipped) — which is why a metric or a frameless message would arrive even today.

Residual uncertainty: a local shell `export SENTRY_UPLOAD_SOURCEMAPS=true` at build time would
change this. The deployed-bundle grep above says it was not exported for the current release.
Ten-second confirmation: does prod Sentry show _any_ stack-traced error?

### What we already send (the frame for this decision)

| Sink                             | What it gets                                                                                                                             | Cite                                                                                                                 |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Sentry Replay                    | 10% of all sessions, **`maskAllText: false`, `blockAllMedia: false`** → chat text, tile text, display names                              | `src/services/sentry.ts:133-136`, `:156`                                                                             |
| Sentry, every event              | `event.request.url` = **full URL** + User-Agent + Referer, via default `httpContextIntegration`; `defaultIntegrations` is not overridden | `@sentry/browser` `sdk.js` `getDefaultIntegrations`, `integrations/httpcontext.js`; `src/services/sentry.ts:124-161` |
| Sentry, Firefox-mobile auth path | `scope.setUser({ username: displayName })`                                                                                               | `src/utils/firefoxMobileReporting.ts:99-103`                                                                         |
| GA4 (`G-93YN1YMTQ7`)             | loaded unconditionally; initial `page_view` URL; gameplay events incl. group names, intensity labels, topology, room type                | `index.html:5-12`; `src/services/analytics.ts:58-62`, `:342-349`                                                     |
| —                                | **No consent gate, no privacy policy, no opt-out anywhere in the repo** (grep for "privacy policy": no matches)                          | `docs/engineering/security.md:127`, `:147`                                                                           |

**The room code is in the URL.** The room route is `path="/:id"`
(`src/components/RouterSetup/index.tsx:82`; `/` redirects to `/PUBLIC` at `:52`). So the full URL
that rides on every Sentry event, and the GA4 page_view, already carry the room code — including
private room codes, which `docs/engineering/security.md:55` notes are the only thing protecting a
private room's chat.

This matters twice: it shows the baseline is already broader than users are told, and it means
"aggregate-only, no addresses" does **not** mean "aggregate-only in effect" for anything sent
through Sentry.

### Why this is not a normal SaaS telemetry call

`CONTEXT.md:68-71`: PUBLIC is the room where **solo players play alongside strangers**; ~90% of the
user base is solo-in-PUBLIC. Accounts are anonymous guests by default
(`docs/engineering/security.md:13`). A webcam call requires ≥2 people, so webcam users are a narrow
subset — cam-with-strangers on a sex app. A per-connection event tied to an IP, a persistent
analytics id, and a room code is not "connection metadata about a session"; it is a record that a
specific device did that. Nothing sends that fact today.

---

## 2. Options

### A. Status quo + vendor dashboard (+ fix the Sentry build)

**Answers:** "Is relay moving bytes, and roughly how many?" Plus, once the build is fixed, "are
webcam code paths throwing?" — which is the blindness that actually hurt last week.

**Fields sent to any third party: none new. Zero.**

**Build cost:** dashboard = 0. The `applicationKey` fix is a one-line build-config change
(`vite.config.ts:11` / the deploy script) — a **bug fix, not a privacy decision**: it changes
nothing about what is collected, only whether already-collected crash reports survive the filter.

**Does not tell you:** the share of connections that need relay; anything about a user whose call
fails before media flows (a failed connection relays zero bytes —
`docs/plans/webcam-fix-2026-08.md:26-32`); anything per-network.

**Verify, don't assume:** the Metered dashboard served this role; confirm the Cloudflare TURN key
has an equivalent usage view. I have not seen that dashboard and am not asserting its contents.

### B. Aggregate counter at the Sentry boundary

`Sentry.metrics.count('webrtc.connection', 1, { attributes: { transport: 'relay' | 'direct' } })`
at the `onConnected` site, with `local`/`remote` candidate types reduced to one enum.

**Answers:** the relay-vs-direct ratio across the fleet, over time, with a graph.

**Fields, one by one:**

| Field                                                                    | Content risk                                                                                                                                                                                                                                                                                                        |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| metric name `webrtc.connection`                                          | fixed literal. None.                                                                                                                                                                                                                                                                                                |
| `transport: 'relay' \| 'direct'`                                         | 2-value enum reduced from `candidateType` ∈ {host, srflx, prflx, relay}. **No** user content, room code, display name, or address. Not IP-derived — a category, not an address. Weakly correlates with network type (CGNAT / corporate / mobile).                                                                   |
| **client IP**                                                            | **Yes, unavoidably.** Sentry's ingest sees the source IP of the request; `sendDefaultPii` is set neither way in `src/services/sentry.ts:124-161`, so server-side IP handling is Sentry's default. _This is the one field I cannot fully verify from the repo — check the Sentry project's server-side PII setting._ |
| trace / release / environment / session context                          | pseudonymous ids that join this metric to other events from the same session.                                                                                                                                                                                                                                       |
| — _if implemented as an event instead of a metric_ — `event.request.url` | **the room code**, via default `httpContextIntegration`.                                                                                                                                                                                                                                                            |
| Replay linkage                                                           | not added by this call, but 10% of sessions already have an **unmasked** Replay (`:133-136`, `:156`) that the session context can sit beside.                                                                                                                                                                       |

**Build cost:** ~5 lines. `Sentry.metrics.count` is exported (`@sentry/react` → `@sentry/browser`
`types/exports.d.ts:3`) and `enableMetrics` **defaults to `true`**
(`@sentry/core` `types/types/options.d.ts:549`), so no init change is needed — and metric envelope
items are not `type === 'event'`, so the third-party filter that is currently eating errors does not
touch them. _Uncertain:_ whether the Sentry plan actually ingests and displays trace metrics. Not
verifiable from this repo; confirm in the Sentry UI before betting on it.

**What it discloses that nothing discloses today:** that this device completed a webcam call. New
category of fact, in an envelope carrying IP and session context, in a product where 10% of sessions
are already recorded with text unmasked.

**Does not tell you:** why a connection failed (only successes reach `onConnected`), which is the
population that generated the complaints; nor which network/ISP; nor anything about the 4-peer cap.

### C. Firebase-only counter (no new third party)

Client writes an append-only enum to a new RTDB path (`telemetry/transport/<push>` = `'relay'` |
`'direct'` + server timestamp), rules `.write: auth != null` with a `.validate` enum constraint and
no read; the already-scheduled cleanup function tallies and prunes.

**Answers:** the same ratio as B, in a store the app already owns (Firebase is already the processor
for chat, presence, boards).

**Fields:** the enum, plus a server timestamp. **No** uid, room, name, or address in the record.
Google-side infra sees the writer's uid and IP at write time as it does for every existing write —
no _new_ processor, no _new_ identifier stored.

**Build cost:** ~half a day. Client write, `database.rules.json` change, tally+prune in
`functions/src/index.ts`, plus a `firebase deploy`. Risk: a write-open path cannot be volume-capped
in rules — griefing/quota exposure, mitigated only by the prune.

> **Updated after this memo was written:** the RTDB rules harness now exists
> (`npm run test:rules:db`, `tests/database.rules.spec.ts`), so C's rules change would be
> emulator-tested rather than hand-verified. This lowers C's cost and risk; it does not change the
> recommendation, and the write-open surface remains C's weakest part.

**Does not tell you:** failures (same blind spot as B); and it is not queryable next to the crash
data, so correlating "relay" with "error" means two tools.

**C-lite (a live-debugging aid, not a measurement):** write the enum as an extra child of the
caller's own roster node — permitted by rules today, since `.validate` on
`video-calls/$roomId/users/$userId` only requires `hasChildren([...])` and self-write
(`database.rules.json`). Zero rules change, ~3 lines, visible in the Firebase console during an
incident. Two honest limits: that subtree is readable by **any authenticated user**
(`docs/engineering/security.md:68`), so it discloses to co-occupants of the room; and nothing
aggregates it — the roster entry is released on hang-up (`videoCallStore.ts:427-429`), so it is a
snapshot of live calls, not a count.

### D. Opt-in diagnostics toggle

A settings switch ("Help fix video calls") that enables automatic reporting for that user only.

**Answers:** nothing statistically — a self-selected minority cannot give you a fleet ratio.

**Build cost:** UI + persisted setting + strings in **all six locales** (`CLAUDE.md` § i18n): ~a
day. And it largely duplicates a mechanism that already exists: when a user reports a broken call,
`?debug=1` produces the same evidence on their machine (`src/utils/logger.ts:30-44`,
`docs/plans/webcam-fix-2026-08.md:117-119`).

**Fields:** identical payload to whichever of B or C it wraps (the `transport` enum, plus that
option's envelope), but sent only after an explicit in-app yes.

**Discloses:** only what a consenting user turns on. Cleanest consent story of any option, worst
data.

---

## 3. Recommendation

**A now. If a ratio is still needed after that, C — not B.**

The measurement that has actually moved this investigation twice was a vendor dashboard and a
Firebase console read, both with zero disclosure; and the real blindness last week was not missing
candidate-pair data but that **production Sentry drops every stack-traced error**, which is a build
bug you can fix without collecting anything new. Against that, B buys a graph in exchange for the
first automatic per-device record that a user did cam on a sex app — landing in an envelope that
carries their IP, session context, and (as an event) the room code, in a project where 10% of
sessions are already recorded with text unmasked and no privacy notice exists. The enum itself is
genuinely harmless; the envelope is what you would be deciding to send, and the relay-vs-direct
ratio is a fleet statistic that needs a few hundred samples and no per-user granularity at all —
which is exactly what C provides without adding a processor.

**C's price, stated plainly where the recommendation lives:** half a day instead of five lines, a
`database.rules.json` change (now emulator-testable — see the update in § C), and a
`.write: auth != null` path that rules cannot volume-cap — on an app where guest accounts are free.
`getTurnCredentials` is now rate-limited per uid, but a new open RTDB write path would not be. That write-open surface is C's weakest part. Reporting
instead through an existing authenticated callable would avoid both the new rules and the griefing
surface, at the cost of biased sampling — a design choice for the owner, deliberately not designed
here.

**Smallest version worth shipping (today, no privacy decision required):**

1. Read the Cloudflare TURN usage view for the key in `docs/plans/webcam-fix-2026-08.md:179`. If
   relayed bytes are now plausible for the traffic, question 1 is answered — stop here.
2. Restore production error reporting. Two independent paths, either works: set
   `SENTRY_UPLOAD_SOURCEMAPS=true` for the deploy build so `applicationKey` is injected (confirm by
   grepping the next `dist` bundle for `_sentryBundlerPluginAppKey:blitzed-out`) — this also triggers
   sourcemap _upload_, so it needs `SENTRY_AUTH_TOKEN` in the deploy shell; **or**, source-only with
   no build-env dependency, change the filter itself at `src/services/sentry.ts:149-152` to
   `apply-tag-if-exclusively-contains-third-party-frames` (or drop
   `thirdPartyErrorFilterIntegration`), since the filter is the proximate cause of the drop.
   Neither path changes what is collected.
3. Keep the `?debug=1` path as the incident tool; nothing new is collected.

**If you want the ratio anyway,** the minimum is C's single enum with no uid and no room, tallied
and pruned by the existing scheduled function. Not B.

---

## 4. What would change this recommendation

- **The Cloudflare dashboard reads near-zero again while complaints continue.** Then bytes cannot
  answer it and you need the per-connection ratio → ship C.
- **Replay masking is fixed** (`maskAllText: true`, `docs/engineering/security.md:126`) **and** the
  `applicationKey` fix lands. The envelope objection to B weakens materially; B's 5 lines then
  become a reasonable trade if C has not shipped.
- **A privacy notice + opt-out ships** (`docs/engineering/security.md:147`). Any of B/C/D becomes
  defensible because it is disclosed; today none of them is.
- **Relay spend becomes material** (Cloudflare bills past 1,000 GB/mo). The ratio turns into a cost
  control, which raises what it is worth paying for.
- **A second incident where the reporting user cannot produce opt-in logs** (they will not run
  `?debug=1`, or the failure is not reproducible on demand). That is the case where automatic
  reporting earns its disclosure — and note both B and C are blind to it, since both fire only on
  success. If that is the trigger, the design question changes to reporting _failures_, which needs
  its own field-by-field pass.
- **Sentry turns out not to ingest trace metrics on this plan.** Then B is not 5 lines; it becomes a
  `captureMessage` event that carries `request.url` (the room code) and its cost/disclosure both go
  up. Re-evaluate against C.

---

## 5. Constraints on whatever is chosen

- **The owner decides before any code is written.** This is an unmade privacy decision, not a
  logging-config task (`docs/plans/webcam-fix-2026-08.md:121-125`).
- **`logger` still must not forward to Sentry** — under every option, including B.
  `src/utils/logger.ts:9-15` states why and it should not be relitigated: `logger` takes
  `...args: unknown[]` and its call sites pass the payload that failed — tiles, chat messages,
  display names, board contents. The seam has no allowlist and cannot have one, so wiring it to a
  sink forwards user-authored intimate content by default, and every future `logger.warn` silently
  enrolls its arguments. Any reporting is a **separate, explicit call site with a fixed field list**
  — which is precisely what makes it reviewable, and what makes this memo possible.
- If B is chosen, reduce to the enum **at the call site**, never at the sink: no `candidateType`
  strings, no `localCandidateId`/`remoteCandidateId`, no `address`/`port`/`relatedAddress`, no
  `targetUserId` (`src/stores/videoCallStore.ts:629-632` currently logs the peer's uid — that must
  not travel).
