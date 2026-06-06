# Wizard Redesign + Offline Local Multiplayer: Implementation Plan

See [ADR-0001](./adr/0001-pwa-offline-support.md) for offline persistence decisions.
See [ADR-0002](./adr/0002-room-assignment-by-topology.md) for room assignment decisions.
See [CONTEXT.md](../CONTEXT.md) for domain terminology.

---

## Problem

The current wizard leads with Room Selection, forcing users to understand rooms before knowing
how they are playing. Solo play, shared-device, and individual-device multiplayer are not
explicit choices — they are implied by room type and whether local players are configured.

Offline shared-device multiplayer is not supported: the setup flow assumes a Firebase room
exists before local players can be configured.

---

## Goal

Redesign the setup wizard so that **player topology** is the first and primary choice. Room
assignment, anatomy, role, and other settings follow from that choice. Offline play falls out
naturally — it is not a separate mode, just the same flow with Individual Devices disabled.

---

## Decisions

| Decision                             | Choice                                                                     |
| ------------------------------------ | -------------------------------------------------------------------------- |
| Topology types                       | Solo / Shared Device / Individual Devices                                  |
| `gameMode` for Solo                  | `'solo'`                                                                   |
| `gameMode` for Shared Device         | `'local'`                                                                  |
| `gameMode` for Individual Devices    | `'online'`                                                                 |
| Solo room default                    | `'PUBLIC'` — optional private toggle auto-generates code                   |
| Shared Device room                   | Always auto-generated private code (client-side, works offline)            |
| Individual Devices room              | User selects in Room Selection step                                        |
| Offline                              | `!navigator.onLine` disables Individual Devices; everything else unchanged |
| Temporarily offline                  | Firebase `persistentLocalCache` handles transparently (ADR-0001)           |
| `roomRealtime`                       | Advanced Settings within Individual Devices room step only                 |
| Anatomy + role for Shared Device     | Per-player in Local Player Setup                                           |
| Anatomy + role for Solo / Individual | Collected in Game Mode step                                                |
| Shared Device game board             | Single shared board — one intensity, one game type                         |

---

## New Wizard Flow

```
Step 1  Player Topology
        ┌──────────────┬───────────────┬──────────────────────┐
        │    Solo      │ Shared Device │ Individual Devices   │
        │  [private?]  │  2-4 players  │  [disabled offline]  │
        └──────────────┴───────────────┴──────────────────────┘
          sets gameMode    sets gameMode    sets gameMode
          'solo'           'local'          'online'
          room: PUBLIC     room: <code>     room: TBD step 2
          (or <code>)

Step 2  [Shared Device]      → Local Player Setup (name + anatomy + role per player)
        [Individual Devices] → Room Selection (public/private; roomRealtime auto-set)
        [Solo]               → skipped

Step 3  Game Mode
        Solo / Individual Devices:  anatomy (gender) + role + game type + intensity
        Shared Device:              game type + intensity only

Step 4  Actions Selection

Step 5  Finish Setup
```

---

## Concrete File Changes

### 1. New helper — `src/helpers/networkStatus.ts`

```ts
export const isOffline = (): boolean => !navigator.onLine;
```

Used in the topology step (disable Individual Devices) and in `usePresence` (RTDB guard).

---

### 2. `src/views/GameSettingsWizard/stepConfig.ts`

Current steps: `advanced_settings(0), room_setup(1), local_players(2), game_mode(3), actions(4), finish(5)`

New steps:

```ts
export const WIZARD_STEPS = {
  0: 'advanced_settings',
  1: 'player_topology', // was room_setup
  2: 'player_details', // was local_players — label adapts per topology
  3: 'game_mode',
  4: 'actions',
  5: 'finish',
} as const;
```

Step 2 label in the stepper UI should read "Local Players" when `gameMode === 'local'` and
"Room Selection" when `gameMode === 'online'`. Step 2 is skipped entirely for `gameMode === 'solo'`.

---

### 3. `src/views/GameSettingsWizard/LocalPlayersStep/index.tsx` → **Player Topology step**

Rename the component and file to `PlayerTopologyStep` (or keep filename, rename component).
Replace the current two-card layout with three cards:

**Solo card**

- Sets `gameMode: 'solo'`, `room: 'PUBLIC'`
- Checkbox/toggle "Play privately" → replaces `room` with `generateRoomCode()`
- Disabled state: never

**Shared Device card**

- Sets `gameMode: 'local'`, `room: generateRoomCode()`
- Room code generated with `customAlphabet('123456789ABCDEFGHJKLMNPQRSTUVWXYZ', 5)()` directly
- **Do NOT use `checkRoomExists`** from `RoomStep` — that calls Firebase RTDB and fails offline
- Disabled state: never

**Individual Devices card**

- Sets `gameMode: 'online'`; room determined in Step 2
- Disabled and shows tooltip when `isOffline()`

On card selection, advance to Step 2 (or Step 3 for Solo).

---

### 4. `src/views/GameSettingsWizard/RoomStep/index.tsx` → **Individual Devices room selection**

This step is now only shown when `gameMode === 'online'` (Individual Devices path).

**Remove:**

- Gender picker (moves to Game Mode step)

**Keep:**

- Public / private room toggle
- Private room code display + share UI
- `roomRealtime` auto-set logic: `true` for PUBLIC, `false` for private (lines 90, 100 — this
  is programmatic, not a user-facing toggle; no UI change needed here)

No other changes to this component.

---

### 5. `src/views/GameSettingsWizard/GameModeStep/index.tsx`

**Remove:**

- The Local / Online mode toggle cards (lines ~57–128). Topology step already set `gameMode`.
  This is the most significant change to this component.

**Add:**

- Anatomy (gender) picker — moved from `RoomStep`. Render when `gameMode !== 'local'`.

**Update condition for role + intensity:**

```ts
// Before
const shouldShowRoleSelection = !isOnlineMode(formData?.gameMode) && !hasLocalPlayers;

// After
const shouldShowRoleSelection = formData?.gameMode !== 'local';
```

Anatomy, role, and intensity all show when `gameMode !== 'local'`.
None show when `gameMode === 'local'` — those are per-player in Local Player Setup.

---

### 6. `src/views/GameSettingsWizard/index.tsx`

**Change default `gameMode`:**

```ts
// Before
gameMode: 'online',

// After
gameMode: 'solo',
```

**Remove step-skip logic tied to `isPublicRoom`:**

```ts
// Remove: logic that prevented advancing to steps 2 or 3 for public rooms
// Replace with: advance to step 3 when gameMode === 'solo', step 2 otherwise
```

Step navigation rule:

- Solo selected → skip step 2, go to step 3 (Game Mode)
- Shared Device selected → go to step 2 (Local Player Setup)
- Individual Devices selected → go to step 2 (Room Selection)

---

### 7. `src/views/GameSettingsWizard/components/DynamicStepper.tsx`

`DynamicStepper` currently branches on `isPublicRoom: boolean` to show either a 3-step
(public) or 5-step (private) stepper. This prop no longer maps to the new topology-based flow.

**Replace** the `isPublicRoom` prop with `gameMode: GameMode`.

New step sets:

```ts
// gameMode === 'solo': 4 steps (Topology → Game Mode → Actions → Finish)
// gameMode === 'local': 4 steps (Topology → Local Players → Game Mode → Actions → Finish... wait, 5)
// gameMode === 'online': 5 steps (Topology → Room Selection → Game Mode → Actions → Finish)
```

Step 2 label: `gameMode === 'local'` → "Local Players"; `gameMode === 'online'` → "Room Selection".
Step 2 omitted from stepper display when `gameMode === 'solo'`.

Update all callers that pass `isPublicRoom` to pass `gameMode` instead.

---

### 8. `src/views/GameSettingsWizard/ActionsStep/PickActions/index.tsx`

`getAction()` currently returns `'solo'` content when `isOnlineMode(gameMode)` (i.e., `gameMode === 'online'`).
The new `gameMode: 'solo'` value falls through this check and would load the wrong content.

Fix the condition:

```ts
// Before
if (isOnlineMode(formData?.gameMode)) {
  return 'solo';
}

// After
if (formData?.gameMode === 'solo' || isOnlineMode(formData?.gameMode)) {
  return 'solo';
}
```

No Dexie migration or new content seeding required — solo action groups already exist in the
database (solo content was already the default for the `'online'` path before this redesign).

---

### 9. `src/hooks/usePresence.ts`

Firebase Realtime Database calls do not queue offline the way Firestore does. When the device
is offline, RTDB `set`/`onDisconnect` calls will silently fail or log errors.

Guard the hook:

```ts
import { isOffline } from '@/helpers/networkStatus';

// At the top of the hook, before any RTDB call:
if (isOffline()) return;
```

This prevents presence errors in the console and correctly no-ops presence for offline sessions.

---

### 10. `src/locales/*/translation.json` (all 5 languages)

New keys needed for the topology step. Add to all 5 files (`en`, `es`, `fr`, `zh`, `hi`):

```json
"playerTopology": {
  "title": "How are you playing?",
  "solo": {
    "title": "Solo",
    "description": "...",
    "privateToggle": "Play privately",
    "button": "Play Solo"
  },
  "sharedDevice": {
    "title": "Shared Device",
    "description": "...",
    "button": "Set Up Players"
  },
  "individualDevices": {
    "title": "Individual Devices",
    "description": "...",
    "offlineTooltip": "Requires internet connection",
    "button": "Choose a Room"
  }
}
```

---

## Tests (TDD — write these first, then implement)

### `PlayerTopologyStep` tests

```
- Solo card: sets gameMode='solo', room='PUBLIC', advances to step 3
- Solo + private toggle: sets gameMode='solo', room is 5-char code (no Firebase call), advances to step 3
- Shared Device: sets gameMode='local', room is 5-char code (no Firebase call), advances to step 2
- Individual Devices: sets gameMode='online', advances to step 2
- Individual Devices: disabled when isOffline() returns true
- Individual Devices: shows offline tooltip when disabled
```

### `getAction` tests

```
- gameMode='solo' returns action type 'solo'
- gameMode='online' still returns action type 'solo' (regression)
- gameMode='local' returns non-solo action type (regression)
```

### `GameModeStep` tests

```
- gameMode='solo': shows anatomy picker
- gameMode='solo': shows role selection
- gameMode='online': shows anatomy picker
- gameMode='online': shows role selection
- gameMode='local': does NOT show anatomy picker
- gameMode='local': does NOT show role selection
- gameMode='*': does NOT show Local/Online toggle (removed)
```

### `DynamicStepper` tests

```
- gameMode='solo': renders 4-step stepper, no step 2 shown
- gameMode='local': renders 5-step stepper, step 2 label is "Local Players"
- gameMode='online': renders 5-step stepper, step 2 label is "Room Selection"
```

### `usePresence` tests

```
- When isOffline() returns true: no RTDB calls made
- When isOffline() returns false: normal RTDB presence behavior
```

### Wizard step navigation tests

```
- Selecting Solo advances to step 3 (Game Mode), not step 2
- Selecting Shared Device advances to step 2 (Local Player Setup)
- Selecting Individual Devices advances to step 2 (Room Selection)
```

### Regression tests

```
- Individual Devices private-room flow completes end-to-end
- PUBLIC room solo flow completes end-to-end
- roomRealtime is true for PUBLIC room, false for private room (auto-set in RoomStep)
- Existing local player session data loads correctly in Shared Device path
- LocalPlayerSetup still requires minimum 2 players
```

---

## Implementation Order

Follow TDD: write failing tests first, then implement each step.

1. **Add `isOffline()` helper** (`src/helpers/networkStatus.ts`) — unblocks everything else.
2. **Write all failing tests** (red phase).
3. **Fix `getAction`** — add `gameMode === 'solo'` condition. Smallest change, confirms solo content works.
4. **Guard `usePresence`** — no-op when `isOffline()`.
5. **Rewrite `LocalPlayersStep` → `PlayerTopologyStep`** — 3 cards, pure-nanoid room codes, offline guard.
6. **Update `stepConfig.ts`** — new step names, conditional step 2 label.
7. **Update `DynamicStepper`** — replace `isPublicRoom` prop with `gameMode`.
8. **Update `wizard/index.tsx`** — default `gameMode: 'solo'`, new step-skip logic.
9. **Update `RoomStep`** — remove gender picker, scope to Individual Devices.
10. **Update `GameModeStep`** — remove Local/Online toggle, add anatomy picker, fix conditions.
11. **Update all 5 locale files** with new i18n keys.
12. **Make tests green.**
13. Run `npm run type-check && npx eslint src/ && npm run test:failures`.
14. Manual verification (checklist below).

---

## Manual Verification Checklist

```bash
npm run build && npx vite preview
```

**Solo — public:**

- [ ] Step 1: 3 topology cards, Solo pre-selected
- [ ] Step 1 → 3 skips Step 2 entirely
- [ ] Game Mode shows anatomy picker + role
- [ ] Game plays in PUBLIC room

**Solo — private:**

- [ ] Private toggle on Solo card generates room code
- [ ] Game Mode shows anatomy picker + role
- [ ] Game plays in that private room

**Shared Device — online:**

- [ ] Step 1 → Step 2 (Local Player Setup)
- [ ] Room code generated silently, not shown
- [ ] Game Mode shows game type + intensity only (no anatomy, no role)
- [ ] Game plays with local players

**Shared Device — offline (DevTools → Offline):**

- [ ] Individual Devices card grayed out with tooltip
- [ ] Shared Device flow completes normally
- [ ] Room code generated client-side, no network error
- [ ] Game plays offline
- [ ] Restore network → session syncs to that room

**Individual Devices:**

- [ ] Step 1 → Step 2 (Room Selection, no gender picker)
- [ ] `roomRealtime` in Advanced Settings
- [ ] Game Mode shows anatomy + role
- [ ] Individual Devices card disabled when offline

**Regression:**

- [ ] No Firebase errors for any path
- [ ] Rolls persist through page reload
- [ ] Existing saved settings load correctly on return visit

---

## Non-Goals

- Offline individual-device multiplayer
- Background sync / push notifications
- Automatic conversion of offline sessions into online rooms
- Prompt to continue last session on return
