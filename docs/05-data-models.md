# Data Models & State Management

## Overview

Blitzed Out uses a hybrid data architecture combining local IndexedDB storage (via Dexie) for offline-first functionality with Firebase for cloud synchronization and real-time features. State management is handled through Zustand stores with React Context for cross-component state sharing.

## Data Architecture

### Storage Layers

```
┌─────────────────────────────────────────┐
│          Component State                │
│         (React useState)                │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│          Zustand Stores                 │
│    (Application State Management)       │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│          Dexie Database                 │
│    (IndexedDB - Local Storage)          │
└────────────────┬────────────────────────┘
                 │ Sync Middleware
┌────────────────▼────────────────────────┐
│          Firebase Cloud                 │
│  (Firestore & Realtime Database)        │
└─────────────────────────────────────────┘
```

## Database Schema

### Dexie Database Structure
**File**: `/src/stores/store.ts`

```typescript
class BlitzedOutDatabase extends Dexie {
  customTiles!: EntityTable<CustomTilePull, 'id'>;
  gameBoard!: EntityTable<DBGameBoard, 'id'>;
  customGroups!: EntityTable<CustomGroupPull, 'id'>;
  localPlayerSessions!: EntityTable<DBLocalPlayerSession, 'id'>;
  localPlayerMoves!: EntityTable<DBLocalPlayerMove, 'id'>;
  localPlayerStats!: EntityTable<DBLocalPlayerStats, 'id'>;
}
```

### Table Schemas

#### Custom Tiles Table
**Type**: `/src/types/customTiles.ts`

```typescript
interface CustomTilePull {
  id?: number;
  group: string;        // Action category
  intensity: number;    // 1-5 scale
  action: string;       // Action text
  isEnabled: boolean;   // Active/inactive
  tags?: string[];      // Categorization
  gameMode?: GameMode;  // solo/online/local
  isCustom: boolean;    // User-created flag
  locale: string;       // Language code
}
```

**Indexes**:
- `++id` (auto-increment primary key)
- `group` (category filtering)
- `intensity` (difficulty filtering)
- `locale` (language filtering)

#### Game Board Table
**Type**: `/src/types/gameBoard.ts`

```typescript
interface DBGameBoard {
  id?: number;
  title: string;           // Board name
  tiles: Tile[];          // Board configuration
  tags?: string[];        // Categorization
  gameMode?: string;      // Compatible modes
  isActive: number;       // Active board flag
  createdAt?: number;     // Creation timestamp
  updatedAt?: number;     // Last modified
}
```

**Indexes**:
- `++id` (auto-increment primary key)
- `title` (board search)
- `isActive` (active board filtering)

#### Custom Groups Table
**Type**: `/src/types/customGroups.ts`

```typescript
interface CustomGroupPull {
  id?: number;
  name: string;           // Group identifier
  label: string;          // Display name
  locale: string;         // Language code
  gameMode?: GameMode;    // Compatible modes
  isDefault: boolean;     // System default flag
  createdAt: number;      // Creation timestamp
  intensity?: number;     // Default intensity
  description?: string;   // Group description
}
```

**Indexes**:
- `++id` (auto-increment primary key)
- `[name+locale+gameMode]` (unique constraint)
- `createdAt` (sorting)

#### Local Player Sessions Table
**Type**: `/src/types/localPlayerDB.ts`

```typescript
interface DBLocalPlayerSession {
  id?: number;
  sessionId: string;      // Unique session ID
  roomId: string;         // Associated room
  players: LocalPlayer[]; // Player list
  currentPlayerIndex: number;
  isActive: boolean;      // Active session flag
  createdAt: number;      // Session start
  updatedAt: number;      // Last activity
  settings: LocalSessionSettings;
}
```

#### Local Player Moves Table
```typescript
interface DBLocalPlayerMove {
  id?: number;
  sessionId: string;      // Parent session
  playerId: string;       // Player reference
  fromPosition: number;   // Starting tile
  toPosition: number;     // Ending tile
  diceRoll: number;       // Roll value
  action?: string;        // Action taken
  timestamp: number;      // Move time
  sequence: number;       // Move order
}
```

#### Local Player Stats Table
```typescript
interface DBLocalPlayerStats {
  id?: number;
  sessionId: string;      // Parent session
  playerId: string;       // Player reference
  tilesCompleted: number; // Tiles visited
  actionsPerformed: number;
  actionsSkipped: number;
  totalRolls: number;
  averageRoll: number;
  lastActive: number;     // Last activity
}
```

## State Management

### Zustand Stores

#### Settings Store
**File**: `/src/stores/settingsStore.ts`

```typescript
interface SettingsStore {
  settings: Settings;
  setSettings: (settings: Partial<Settings>) => void;
  resetSettings: () => void;
  loadSettings: () => Promise<void>;
  saveSettings: () => Promise<void>;
}

interface Settings {
  gameMode: GameMode;
  roomRealtime?: boolean;
  role?: PlayerRole;
  boardUpdated: boolean;
  locale?: string;
  themeMode?: ThemeMode;
  finishRange?: [number, number];
  customGroups?: CustomGroupSetting[];
  selectedActions?: Record<string, ActionEntry>;
  // ... additional settings
}
```

#### Game Board Store
**File**: `/src/stores/gameBoard.ts`

```typescript
interface GameBoardStore {
  boards: DBGameBoard[];
  activeBoard: DBGameBoard | null;
  loadBoards: () => Promise<void>;
  addBoard: (board: DBGameBoard) => Promise<void>;
  updateBoard: (id: number, updates: Partial<DBGameBoard>) => Promise<void>;
  deleteBoard: (id: number) => Promise<void>;
  setActiveBoard: (id: number) => Promise<void>;
}
```

#### Custom Tiles Store
**File**: `/src/stores/customTiles.ts`

```typescript
interface CustomTilesStore {
  tiles: CustomTilePull[];
  loadTiles: () => Promise<void>;
  addTile: (tile: CustomTilePush) => Promise<void>;
  updateTile: (id: number, updates: Partial<CustomTilePull>) => Promise<void>;
  deleteTile: (id: number) => Promise<void>;
  toggleTile: (id: number) => Promise<void>;
  importTiles: (tiles: CustomTilePull[]) => Promise<void>;
  exportTiles: () => CustomTilePull[];
}
```

#### Local Player Store
**File**: `/src/stores/localPlayerStore.ts`

```typescript
interface LocalPlayerStore {
  session: LocalPlayerSession | null;
  players: LocalPlayer[];
  currentPlayerIndex: number;
  initializeSession: (roomId: string, players: LocalPlayer[]) => void;
  nextPlayer: () => void;
  previousPlayer: () => void;
  updatePlayer: (playerId: string, updates: Partial<LocalPlayer>) => void;
  endSession: () => void;
  recordMove: (move: PlayerMove) => void;
  updateStats: (playerId: string, stats: Partial<PlayerStats>) => void;
}
```

#### User List Store
**File**: `/src/stores/userListStore.ts`

```typescript
interface UserListStore {
  users: UserPresence[];
  loadUsers: (room: string) => void;
  addUser: (user: UserPresence) => void;
  removeUser: (uid: string) => void;
  updateUser: (uid: string, updates: Partial<UserPresence>) => void;
  clearUsers: () => void;
}
```

#### Schedule Store
**File**: `/src/stores/scheduleStore.ts`

```typescript
interface ScheduleStore {
  events: ScheduledGame[];
  loadEvents: () => Promise<void>;
  addEvent: (event: ScheduledGame) => Promise<void>;
  updateEvent: (id: string, updates: Partial<ScheduledGame>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  getUpcomingEvents: () => ScheduledGame[];
}
```

### React Context Providers

#### Auth Context
**File**: `/src/context/auth.tsx`

```typescript
interface AuthContextValue {
  user: User | null;
  loading: boolean;
  error: Error | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInAnonymously: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: ProfileUpdate) => Promise<void>;
}
```

#### Migration Context
**File**: `/src/context/migration.tsx`

```typescript
interface MigrationContextValue {
  currentLanguageMigrated: boolean;
  isMigrationInProgress: boolean;
  isMigrationCompleted: boolean;
  error: Error | null;
  triggerMigration: (language: string) => Promise<void>;
  ensureLanguageMigrated: (language: string) => Promise<void>;
}
```

#### Messages Context
**File**: `/src/context/messages.tsx`

```typescript
interface MessagesContextValue {
  messages: Message[];
  loading: boolean;
  sendMessage: (text: string, type: MessageType) => Promise<void>;
  deleteMessage: (id: string) => Promise<void>;
  clearMessages: () => Promise<void>;
}
```

## Firebase Data Models

### Firestore Collections

#### Users Collection
```typescript
// Collection: users/{userId}
interface FirestoreUser {
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Timestamp;
  lastLogin: Timestamp;
  settings?: UserSettings;
  stats?: UserStats;
}
```

#### Custom Tiles Collection
```typescript
// Collection: customTiles/{tileId}
interface FirestoreCustomTile {
  uid: string;           // Owner ID
  group: string;
  intensity: number;
  action: string;
  isPublic: boolean;     // Shareable flag
  tags: string[];
  locale: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  likes?: number;        // Community rating
  reports?: number;      // Moderation flags
}
```

#### Game Boards Collection
```typescript
// Collection: gameBoards/{boardId}
interface FirestoreGameBoard {
  uid: string;           // Owner ID
  title: string;
  tiles: Tile[];
  isPublic: boolean;
  tags: string[];
  gameMode: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  plays?: number;        // Usage count
  rating?: number;       // Community rating
}
```

### Realtime Database Structure

#### Presence System
```javascript
// Path: presence/{roomId}/{userId}
{
  uid: "user123",
  displayName: "Player Name",
  lastSeen: 1234567890,
  isOnline: true,
  status: "active",
  room: "ROOM123",
  role: "sub"
}
```

#### Messages System
```javascript
// Path: messages/{roomId}/{messageId}
{
  id: "msg123",
  text: "Message content",
  type: "chat",  // chat|action|system
  uid: "user123",
  displayName: "Player Name",
  timestamp: 1234567890,
  room: "ROOM123",
  metadata: {
    action: "rolled",
    value: 6
  }
}
```

#### Room State
```javascript
// Path: rooms/{roomId}
{
  id: "ROOM123",
  host: "user123",
  isPublic: true,
  currentPlayer: "user456",
  gameState: "active",  // waiting|active|paused|finished
  settings: {
    gameMode: "online",
    finishRange: [30, 40],
    intensity: [2, 3, 4]
  },
  players: {
    "user123": { position: 5, isFinished: false },
    "user456": { position: 12, isFinished: false }
  },
  createdAt: 1234567890,
  updatedAt: 1234567890
}
```

## Data Synchronization

### Sync Middleware
**File**: `/src/services/syncMiddleware.ts`

```typescript
interface SyncMiddleware {
  tables: string[];           // Tables to sync
  debounceMs: number;        // Sync delay
  batchSize: number;         // Batch upload size
  conflictResolution: 'local' | 'remote' | 'merge';
}
```

### Sync Flow

#### Upload Flow
```
1. Local Change → Dexie Hook
2. Sync Middleware → Queue Change
3. Debounce Timer → Batch Changes
4. Upload to Firebase → Handle Response
5. Update Sync Metadata → Complete
```

#### Download Flow
```
1. Firebase Listener → Change Event
2. Sync Service → Process Change
3. Conflict Check → Resolve
4. Update Dexie → Apply Change
5. Update UI → Re-render
```

### Conflict Resolution

#### Last-Write-Wins (Default)
```typescript
// Compare timestamps
if (remote.updatedAt > local.updatedAt) {
  applyRemoteChange();
} else {
  keepLocalChange();
}
```

#### Merge Strategy
```typescript
// Custom merge for specific fields
const merged = {
  ...local,
  ...remote,
  tiles: mergeTiles(local.tiles, remote.tiles),
  updatedAt: Math.max(local.updatedAt, remote.updatedAt)
};
```

## Type Definitions

### Core Types
**File**: `/src/types/index.ts`

```typescript
// Game modes
type GameMode = 'solo' | 'online' | 'local';

// Player roles
type PlayerRole = 'sub' | 'dom' | 'vers';

// Theme modes
type ThemeMode = 'light' | 'dark' | 'system';

// Message types
type MessageType = 'chat' | 'action' | 'system';

// Tile types
type TileType = 'normal' | 'special' | 'start' | 'finish';
```

### Action Types
```typescript
interface ActionEntry {
  type: string;
  level: number;
  variation?: string;
  [key: string]: unknown;
}

interface ActionGroup {
  name: string;
  actions: ActionEntry[];
  intensity: number;
}
```

### Form Types
```typescript
interface FormData {
  gameMode: GameMode;
  isNaked?: boolean;
  isAppend?: boolean;
  room: string;
  roomRealtime?: boolean;
  actions?: ActionEntry[];
  consumption?: any[];
  role?: PlayerRole;
  boardUpdated: boolean;
  finishRange?: [number, number];
  localPlayersData?: LocalPlayer[];
  localPlayerSessionSettings?: LocalSessionSettings;
  hasLocalPlayers?: boolean;
}
```

## Data Migration

### Migration System
**Service**: `/src/services/migrationService.ts`

```typescript
interface Migration {
  version: number;
  name: string;
  migrate: (db: Dexie) => Promise<void>;
  rollback?: (db: Dexie) => Promise<void>;
}
```

### Migration Process

#### Version Check
```typescript
const currentVersion = await db.version();
const targetVersion = LATEST_VERSION;

if (currentVersion < targetVersion) {
  await runMigrations(currentVersion, targetVersion);
}
```

#### Migration Execution
```typescript
async function runMigration(migration: Migration) {
  try {
    await migration.migrate(db);
    await updateMigrationLog(migration);
  } catch (error) {
    if (migration.rollback) {
      await migration.rollback(db);
    }
    throw error;
  }
}
```

### Language Migration
**Context**: `/src/context/migration.tsx`

```typescript
// Lazy migration for language files
async function migrateLanguageData(locale: string) {
  const actions = await loadLocaleActions(locale);
  await db.customTiles.bulkPut(actions);
  await markLanguageMigrated(locale);
}
```

## Data Validation

### Schema Validation
```typescript
// Validation schemas using TypeScript
interface ValidationResult {
  valid: boolean;
  errors?: ValidationError[];
}

function validateCustomTile(tile: unknown): ValidationResult {
  // Type guards and validation logic
  if (!isValidTile(tile)) {
    return { valid: false, errors: [...] };
  }
  return { valid: true };
}
```

### Import Validation
**Helper**: `/src/views/CustomTileDialog/ImportExport/getUniqueImportRecords.ts`

```typescript
function validateImport(data: unknown): ImportValidation {
  // Check structure
  // Validate types
  // Check constraints
  // Return validation result
}
```

## Performance Optimizations

### Indexing Strategy
- Primary keys for fast lookups
- Composite indexes for complex queries
- Covering indexes for common patterns

### Query Optimization
```typescript
// Efficient queries with indexes
db.customTiles
  .where('[group+locale]')
  .equals(['actions', 'en'])
  .and(tile => tile.intensity >= 3)
  .toArray();
```

### Caching Strategy
- Memory cache for frequently accessed data
- Session storage for temporary data
- Local storage for user preferences

### Batch Operations
```typescript
// Batch inserts for performance
await db.transaction('rw', db.customTiles, async () => {
  await db.customTiles.bulkAdd(tiles);
});
```

## Data Security

### Access Control
- Row-level security in Firebase
- User-owned data isolation
- Role-based permissions

### Data Encryption
- Sensitive data encrypted at rest
- Secure transmission over HTTPS
- Token-based authentication

### Privacy Protection
- PII minimization
- Anonymous mode support
- Data retention policies
- GDPR compliance

## Backup & Recovery

### Local Backup
```typescript
// Export all data
async function exportData() {
  const tiles = await db.customTiles.toArray();
  const boards = await db.gameBoard.toArray();
  return { tiles, boards, version: DB_VERSION };
}
```

### Cloud Backup
- Automatic Firebase backup
- Point-in-time recovery
- Cross-device sync

### Recovery Process
```typescript
// Restore from backup
async function restoreData(backup: Backup) {
  await db.transaction('rw', db.tables, async () => {
    await db.customTiles.clear();
    await db.customTiles.bulkAdd(backup.tiles);
    // ... restore other tables
  });
}
```

## Analytics & Metrics

### Data Metrics
- Table sizes and growth
- Query performance
- Sync latency
- Cache hit rates

### Usage Analytics
```typescript
interface DataAnalytics {
  totalRecords: number;
  storageUsed: number;
  syncOperations: number;
  cacheHitRate: number;
  queryPerformance: QueryMetrics[];
}
```