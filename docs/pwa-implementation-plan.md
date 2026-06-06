# PWA + Offline Support: Implementation Plan

See [ADR-0001](./adr/0001-pwa-offline-support.md) for the rationale behind every decision here.
Do not deviate from ADR-0001 decisions without updating the ADR first.

---

## Project Context

- **Stack:** Vite 7.3.2, React 19, TypeScript, Firebase 12.12.1, Dexie (IndexedDB), MUI v7
- **Deploy:** GitHub Pages → custom domain `blitzedout.com`, `npm run deploy` runs
  `gh-pages -b master -d dist`
- **Router:** `BrowserRouter` (HTML5 history routing, no hash)
- **CI:** GitHub Actions (`.github/workflows/ci.yml`) — lint then test; no deploy step in CI
- **Tests:** Vitest + jsdom + React Testing Library, Firebase mocked via `src/__mocks__/`
- **Path alias:** `@/` → `src/`
- **TDD rule:** Write failing test first, then implementation (per project CLAUDE.md)

---

## What This Plan Does

1. Installs and configures `vite-plugin-pwa` so the app shell is cached by a service worker
2. Enables Firestore offline persistence so sync survives flaky connections
3. Updates the Firebase mock so tests still pass
4. Adds tests and a build-output smoke check that verify the configuration is wired correctly
5. Provides a manual verification checklist

**Out of scope:** caching sounds/videos, update banners, background sync, push notifications.

---

## Prerequisites

Confirm these before starting:

```bash
# Verify no existing SW registration
grep -r "serviceWorker\|workbox\|VitePWA" src/ --include="*.ts" --include="*.tsx"
# Should return nothing

# Verify firebase version supports persistentLocalCache (needs firebase >= 9.x modular)
cat package.json | grep '"firebase"'
# Should be ^12.x.x — confirmed

# Confirm vite-plugin-pwa is available and check latest version
npm info vite-plugin-pwa version
# Plan was written against 1.3.0 — verify API is unchanged if newer version installs

# Confirm dist exists and is a recent build (for chunk size reference only)
ls dist/js/*.js | head -5
```

---

## Step 1: Install Package

```bash
npm install -D vite-plugin-pwa
```

**Expected version:** 1.3.0 or higher. Check `package.json` after install.

No other packages needed — `vite-plugin-pwa` bundles its own Workbox dependency.

---

## Step 2: Write Tests First

Write these tests before the implementation changes in Steps 3-6. They should fail before the
corresponding implementation is added.

### 2a. Firebase offline persistence test

**File:** `src/services/__tests__/firebase.offline.test.ts` (create new)

This test imports `src/services/firebase.ts` dynamically (to control module initialization
timing) and verifies that Firestore is configured with offline persistence. The mock surface must
match the real imports in `src/services/firebase.ts`; otherwise this test can fail with unrelated
`X is not a function` errors before it reaches the persistence assertion.

```typescript
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({ type: 'firebase-app-mock' })),
}));

const { mockInitializeFirestore, mockPersistentLocalCache, mockPersistentMultipleTabManager } =
  vi.hoisted(() => ({
    mockInitializeFirestore: vi.fn(() => ({ type: 'firestore-mock' })),
    mockPersistentLocalCache: vi.fn(() => ({ type: 'persistent-local-cache' })),
    mockPersistentMultipleTabManager: vi.fn(() => ({ type: 'multi-tab-manager' })),
  }));

vi.mock('firebase/firestore', () => ({
  initializeFirestore: mockInitializeFirestore,
  persistentLocalCache: mockPersistentLocalCache,
  persistentMultipleTabManager: mockPersistentMultipleTabManager,
  getFirestore: vi.fn(() => ({})),
  collection: vi.fn(),
  doc: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  startAfter: vi.fn(),
  onSnapshot: vi.fn(),
  serverTimestamp: vi.fn(),
  Timestamp: {
    now: vi.fn(() => ({ seconds: 0, nanoseconds: 0 })),
    fromDate: vi.fn(() => ({ seconds: 0, nanoseconds: 0 })),
  },
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({ currentUser: null })),
  signInAnonymously: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signInWithPopup: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  updateProfile: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  linkWithCredential: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  EmailAuthProvider: {
    credential: vi.fn(),
  },
}));

vi.mock('firebase/database', () => ({
  getDatabase: vi.fn(() => ({})),
  ref: vi.fn(),
  push: vi.fn(),
  set: vi.fn(),
  remove: vi.fn(),
  onValue: vi.fn(),
  onDisconnect: vi.fn(() => ({
    remove: vi.fn(),
    set: vi.fn(),
  })),
}));

vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(() => ({})),
  ref: vi.fn(),
  uploadString: vi.fn(),
  getDownloadURL: vi.fn(),
}));

describe('firebase offline persistence', () => {
  beforeEach(() => {
    vi.resetModules();
    // Re-setup implementations: resetMocks:true in vitest.config clears them between tests
    mockPersistentMultipleTabManager.mockReturnValue({ type: 'multi-tab-manager' });
    mockPersistentLocalCache.mockReturnValue({ type: 'persistent-local-cache' });
    mockInitializeFirestore.mockReturnValue({ type: 'firestore-mock' });
  });

  it('initializes Firestore with persistentLocalCache', async () => {
    await import('@/services/firebase');

    expect(mockInitializeFirestore).toHaveBeenCalledOnce();
    expect(mockPersistentLocalCache).toHaveBeenCalledOnce();
    expect(mockPersistentMultipleTabManager).toHaveBeenCalledOnce();
  });

  it('passes persistentLocalCache result to initializeFirestore', async () => {
    await import('@/services/firebase');

    const [, options] = mockInitializeFirestore.mock.calls[0];
    expect(options).toEqual({
      localCache: { type: 'persistent-local-cache' },
    });
  });
});
```

### 2b. Manifest test

**File:** `src/__tests__/manifest.test.ts` (create new)

```typescript
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('site.webmanifest', () => {
  it('includes required installability fields', () => {
    const manifest = JSON.parse(
      readFileSync(resolve(__dirname, '../../public/site.webmanifest'), 'utf-8')
    );
    expect(manifest.start_url).toBe('/');
    expect(manifest.scope).toBe('/');
    expect(manifest.display).toBe('standalone');
    expect(manifest.icons).toHaveLength(2);
    expect(manifest.icons[0].sizes).toBe('192x192');
    expect(manifest.icons[1].sizes).toBe('512x512');
  });
});
```

### 2c. Build-output smoke check

**File:** `scripts/verify-pwa-build.cjs` (create new)

This is intentionally a post-build script instead of a Vitest unit test because the generated
service worker only exists after `npm run build`.

```javascript
const fs = require('node:fs');
const path = require('node:path');

const distDir = path.resolve(__dirname, '../dist');
const swPath = path.join(distDir, 'sw.js');
const indexPath = path.join(distDir, 'index.html');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

assert(fs.existsSync(swPath), 'Expected dist/sw.js to exist');
assert(
  fs.readdirSync(distDir).some((file) => /^workbox-.*\.js$/.test(file)),
  'Expected a Workbox runtime chunk'
);

const indexHtml = fs.readFileSync(indexPath, 'utf-8');
assert(
  /sw|workbox|registerSW/i.test(indexHtml),
  'Expected dist/index.html to reference SW registration'
);

const sw = fs.readFileSync(swPath, 'utf-8');
assert(
  !/\.mp3|sounds|\.mp4|videos/i.test(sw),
  'Audio/video files must not be precached by the service worker'
);

console.log('PWA build output verified');
```

Optionally add a package script after creating this file:

```json
"verify:pwa-build": "node scripts/verify-pwa-build.cjs"
```

---

## Step 3: Update `vite.config.ts`

**File:** `vite.config.ts` (root)

Add the import at the top of the file:

```typescript
import { VitePWA } from 'vite-plugin-pwa';
```

Add the plugin to the `plugins` array. Place it **before** `compression(...)` so the generated
`sw.js` and `workbox-*.js` files are themselves compressed by the build:

```typescript
VitePWA({
  registerType: 'prompt',
  injectRegister: 'auto',
  strategies: 'generateSW',
  manifest: false,

  workbox: {
    globPatterns: ['**/*.{js,css,html,png,svg,ico,webmanifest}'],
    maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3MB — all JS chunks are under 600KB
    navigateFallback: '/index.html',
    navigateFallbackDenylist: [
      /^\/api\//,
      /\.(?:mp3|mp4|webm|ogg|wav|flac|aac)$/i,
    ],
    skipWaiting: false,
    clientsClaim: false,
  },

  devOptions: {
    enabled: false, // Do not register SW in dev. Test against `vite preview` instead.
  },
}),
```

The resulting `plugins` array order should be:

```typescript
plugins: [
  react(),
  // ... other existing plugins ...
  VitePWA({ ... }),   // ← BEFORE compression
  compression(...),
]
```

**Rules:**

- Do NOT set `registerType: 'autoUpdate'` — this forces page reloads mid-game.
- Do NOT set `skipWaiting: true` — same problem.
- Do NOT add sounds or videos to `globPatterns` — see ADR-0001.
- `manifest: false` is intentional — the existing `public/site.webmanifest` and `index.html`
  `<link rel="manifest">` tag handle the web app manifest. Do not move manifest config into
  the plugin.
- `injectRegister: 'auto'` is explicit to avoid ambiguity; it injects the SW registration
  script into `index.html` automatically.

---

## Step 4: Update Firestore Initialization in `src/services/firebase.ts`

**File:** `src/services/firebase.ts`

### 4a. Update imports

Find the existing `firebase/firestore` import block. It currently includes `getFirestore`.
Replace `getFirestore` with `initializeFirestore`, `persistentLocalCache`, and
`persistentMultipleTabManager`:

```typescript
// REMOVE from the import:
getFirestore,

// ADD to the import:
initializeFirestore,
persistentLocalCache,
persistentMultipleTabManager,
```

The full import line for these three should be added within the existing
`from 'firebase/firestore'` import block.

### 4b. Replace the db initialization

Find line:

```typescript
export const db = getFirestore(app);
```

Replace with:

```typescript
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});
```

**Rules:**

- Do NOT add `cacheSizeBytes` — the default (100MB) is appropriate.
- Do NOT use `persistentSingleTabManager` — see ADR-0001.
- Do NOT use the deprecated `enableIndexedDbPersistence()` function.
- This must remain a module-level export (not inside a function) — other modules import `db`
  directly.

---

## Step 5: Update Global Firebase Mock in `src/setupTests.ts`

**File:** `src/setupTests.ts`

The global `vi.mock('firebase/firestore', ...)` block in `src/setupTests.ts` is applied to
every test via Vitest's `setupFiles`. It currently mocks `getFirestore` but does NOT mock
`initializeFirestore`, `persistentLocalCache`, or `persistentMultipleTabManager`. After the
Step 4 change, every test that touches Firebase will break with
`initializeFirestore is not a function`.

Add the missing entries to the **existing** `vi.mock('firebase/firestore', () => ({...}))`
block. While touching the mock, also add `limit` and `startAfter` so the global test mock matches
the real import surface in `src/services/firebase.ts`. The final mock object must include all of
these:

```typescript
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  initializeFirestore: vi.fn(() => ({})), // ADD
  persistentLocalCache: vi.fn(() => ({})), // ADD
  persistentMultipleTabManager: vi.fn(() => ({})), // ADD
  collection: vi.fn(),
  doc: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  startAfter: vi.fn(),
  onSnapshot: vi.fn(),
  serverTimestamp: vi.fn(),
  Timestamp: {
    now: vi.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 })),
    fromDate: vi.fn((date: Date) => ({ seconds: date.getTime() / 1000, nanoseconds: 0 })),
  },
}));
```

Do not switch to the `async (importOriginal)` factory form — the existing synchronous factory
form is correct and sufficient here. The three persistence entries just need to return empty
objects since no existing global test exercises Firestore persistence behavior directly.

---

## Step 6: Update `public/site.webmanifest`

The existing manifest is missing `start_url` and `scope`, which are required for installability.
Update `public/site.webmanifest`:

```json
{
  "name": "Blitzed Out",
  "short_name": "Blitzed Out",
  "start_url": "/",
  "scope": "/",
  "icons": [
    {
      "src": "/android-chrome-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/android-chrome-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "theme_color": "#000000",
  "background_color": "#000000",
  "display": "standalone"
}
```

Do NOT add `"purpose": "any maskable"` to `android-chrome-512x512.png` unless the asset was
designed with the maskable safe zone (artwork within the inner 80% circle). Marking a standard
square icon as `any maskable` will crop it badly on Android install surfaces. To add maskable
support, create a separate properly-padded 512×512 asset and add a second 512px entry with
`"purpose": "maskable"` — leave the existing entry with no `purpose` field (defaults to `"any"`).

---

## Step 7: Run Quality Checks

```bash
# Type check first
npm run type-check

# Lint
npx eslint src/

# Tests (memory-safe)
npm run test:failures
```

All must pass before proceeding to Step 8.

---

## Step 8: Verify Build Output

```bash
npm run build
```

After build, run the automated smoke check:

```bash
npm run verify:pwa-build
```

If the package script was not added, run:

```bash
node scripts/verify-pwa-build.cjs
```

The script replaces these manual checks:

```bash
# SW file exists
ls dist/sw.js
ls dist/workbox-*.js  # Workbox runtime chunk

# SW is referenced in index.html
grep -i "sw\|workbox\|registerSW" dist/index.html

# Sounds are NOT in the SW precache manifest
grep "mp3\|sounds" dist/sw.js
# Should return nothing — sounds must not be precached
```

---

## Step 9: Manual Verification Checklist

Test against a production build, not `npm run dev` (SW is disabled in dev):

```bash
npm run build && npx vite preview
```

Open browser DevTools → Application → Service Workers.

**Checklist:**

- [ ] Service worker shows as "activated and running" after first page load
- [ ] Application → Cache Storage → workbox precache shows JS/CSS/HTML entries
- [ ] Application → Cache Storage → NO `.mp3` files present
- [ ] DevTools → Network → throttle to "Offline" → reload page → app loads from cache
- [ ] In offline mode, navigate to solo/local game mode → game plays without errors
- [ ] In offline mode, navigate to online game mode → shows connection error gracefully
      (does not crash or show blank screen)
- [ ] In offline mode, open Firestore-dependent view → shows cached/stale data, no crash
- [ ] Restore network → online mode works again, sync resumes
- [ ] Open app in two tabs → both tabs work normally (no tab manager conflicts)
- [ ] DevTools → Application → Manifest → "Add to homescreen" available
- [ ] Lighthouse PWA audit → installable + offline checks pass

---

## Step 10: Deploy

No changes to the deploy script needed. The `sw.js` and `workbox-*.js` files are output to
`dist/` and will be included in the existing `gh-pages -b master -d dist` command.

**Important:** GitHub Pages serves files from the `master` branch root with the `blitzedout.com`
CNAME. The SW is registered at `/` scope. This is correct — no path adjustments needed.

The `CNAME` file lives in `public/` and is copied to `dist/` by Vite, so it survives the
deploy.

---

## Known Gotchas

**1. `vite preview` for SW testing only**

`npm run dev` (Vite dev server) does not register the service worker because
`devOptions.enabled: false`. Always use `npm run build && npx vite preview` to test SW
behavior.

**2. Stale SW during development**

If you test the SW locally and then switch back to dev, Chrome may have a cached SW.
Clear it: DevTools → Application → Service Workers → "Unregister". Or use
incognito mode for dev testing.

**3. First visit still requires network**

PWA offline support only works for _returning_ users. A brand-new visitor on a flaky connection
will still fail to load. This is expected and acceptable.

**4. Firestore performance regression**

`persistentLocalCache` has a documented ~20x performance regression vs the deprecated
`enableIndexedDbPersistence` (firebase-js-sdk issue #7347). This affects Firestore cache query
speed, not write speed. Since Firestore is only used for background sync (not gameplay), this
is acceptable. Monitor if sync operations feel slow after deployment.

**5. Firestore secondary-tab metadata bug**

When using `persistentMultipleTabManager`, secondary tabs may not correctly report
`metadata.fromCache=false` (firebase-js-sdk issue #8314). Do not write code that relies on
`snapshot.metadata.fromCache` to drive UI state — this will be unreliable.

**6. Translation/action bundles in SW cache**

The glob pattern `**/*.{js,...}` will match the locale bundle chunks (e.g.,
`local-bundle.json-00ToRJ_8.js`). This is intentional — caching them means the
one-time migration can run offline on second visit. Do not exclude them.

**7. SW update timing**

After a new deploy, users running the old SW will not get updates until they close all
tabs and open a fresh one. This is the intended behavior per ADR-0001. Do not add
`skipWaiting` to change this.

**8. Sentry source maps**

If the project uses Sentry, the existing Sentry Vite plugin configuration will automatically
pick up `dist/sw.js.map` from the build output alongside the other chunk source maps. No
changes to Sentry configuration are needed.
