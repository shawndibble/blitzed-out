# Cloud Functions Gen 1 → Gen 2 cutover

The code migration is committed. **Nothing is deployed** — the code on `develop` is Gen 2,
production is still running Gen 1. Deploying is the step only you can do.

## Why the code and prod can disagree safely

`firebase deploy` will **refuse** to replace a Gen 1 function with a Gen 2 one of the same
name:

> Upgrading from GCFv1 to GCFv2 is not yet supported. Please delete your old function or
> wait for this feature to be ready.

So a deploy without the delete step below fails loudly rather than half-migrating. There is
no state where some functions silently changed generation.

## Run it as a wizard instead

`scripts/gen2-cutover-wizard.sh` walks the whole thing interactively — it checks the
preflight, gates every irreversible step behind a confirm, and runs the verification
below for you (including granting the secret bindings if they're missing):

```bash
./scripts/gen2-cutover-wizard.sh
```

The rest of this doc is the same procedure by hand.

## Prerequisites

- `firebase-tools` 14.15.0 or newer. Gen 2 has been supported since 11.x, so **no CLI
  upgrade is needed for this cutover.** (15.x is only required if you later want the
  nodejs24 runtime — see the last section.)
- Logged in as a principal that can delete and create functions on `blitzout-49b39`.
- A working `gcloud` credential for that project. `firebase deploy` does not need it, but
  every verification step here does — including the secret-access check, which is the one
  whose failure is silent. `gcloud auth login` if `gcloud functions list --project
blitzout-49b39` errors.

## Sequence

Delete-then-deploy, one function at a time. The docs suggest renaming and running both
generations side by side; that is wrong for this codebase:

- `onPackReported` sends **email** — two copies means two moderator emails per report.
- `cleanupStaleUsers`' `userCount > 100` branch runs a transaction on the **RTDB root**.
- `cleanupVideoCallSignaling` has a 300s timeout on a 5-minute schedule, so overlapping
  runs are already possible; a second deployed copy doubles that against logic whose whole
  design is about avoiding this race.

All four scheduled jobs tolerate a skipped cycle at zero cost, so there is no gap to bridge.

### 1. The scheduled jobs and RTDB triggers (no client coupling)

```bash
firebase functions:delete cleanupStaleUsers cleanupInactiveAnonymousAccounts \
  cleanupVideoCallSignaling onUserDisconnect validateUserPresence onPackReported \
  manualCleanupStaleUsers manualCleanupAnonymousAccounts \
  --project blitzout-49b39 --region us-central1
```

Then deploy them back as Gen 2. **Scope the deploy** — a bare `--only functions` would
also try to redeploy the Gen 1 `getTurnCredentials` still in place and fail on the
same-name generation rule:

```bash
firebase deploy --project blitzout-49b39 --only \
  functions:cleanupStaleUsers,functions:cleanupInactiveAnonymousAccounts,\
functions:cleanupVideoCallSignaling,functions:onUserDisconnect,\
functions:validateUserPresence,functions:onPackReported,\
functions:manualCleanupStaleUsers,functions:manualCleanupAnonymousAccounts
```

### 2. `getTurnCredentials` (the client-coupled one)

Same-name delete-then-deploy needs **no client change**: `resolveIceServers`
(`src/services/iceServers.ts`) catches any error from the callable and falls back to the
bundled relay. So the gap degrades relay quality; it does not break calls.

```bash
firebase functions:delete getTurnCredentials --project blitzout-49b39
firebase deploy --only functions:getTurnCredentials --project blitzout-49b39
```

**If the deploy fails after the delete, TURN stays down until it is fixed.** Calls keep
working on the bundled relay meanwhile.

## Verify actively — the failure modes are silent

Gen 2 runs as a **different default service account** than Gen 1's
`<project>@appspot.gserviceaccount.com`. If the Secret Manager grants do not follow it:

- `getTurnCredentials` throws `failed-precondition`, which the client swallows into the
  bundled-relay fallback. No crash report, no user complaint.
- `onPackReported` logs an error and returns. Pack reports simply stop emailing.

So check, rather than waiting to hear about it:

```bash
# 1. Which SA are the new functions running as?
gcloud functions describe getTurnCredentials --gen2 --region us-central1 \
  --project blitzout-49b39 --format='value(serviceConfig.serviceAccountEmail)'

# 2. Does that SA have access to both secrets?
gcloud secrets get-iam-policy CLOUDFLARE_TURN_TOKEN --project blitzout-49b39
gcloud secrets get-iam-policy SENDGRID_API_KEY --project blitzout-49b39
# Grant if missing:
#   gcloud secrets add-iam-policy-binding CLOUDFLARE_TURN_TOKEN \
#     --member=serviceAccount:<SA> --role=roles/secretmanager.secretAccessor \
#     --project blitzout-49b39

# 3. Real end-to-end check: join a room with webcam on and confirm the browser gets
#    Cloudflare ICE servers rather than the bundled VITE_METERED_* ones.

# 4. Orphaned scheduler jobs from the deleted Gen 1 schedules (harmless, but noisy):
gcloud scheduler jobs list --project blitzout-49b39
```

Also confirm all four schedules reappear and fire once:

```bash
gcloud functions list --project blitzout-49b39 --format='table(name,environment,state)'
```

`environment` should read `GEN_2` for all nine.

## Rollback

`git revert` the migration commit, then the same delete-then-deploy in reverse — Gen 2 → Gen 1
is blocked by the identical name rule, so the delete is required going back too.

## Afterwards: the nodejs24 question

Once every function is Gen 2, `engines.node: "24"` in `functions/package.json` becomes
available — nodejs24 is GA but **2nd-gen only**, which is the entire reason this migration
was needed for it. That step additionally needs `firebase-tools` **15.x**; 14.15.0 only
knows nodejs20 and nodejs22. Node 22 is supported until **2027-04-30** (deprecation), so
there is no schedule pressure.
