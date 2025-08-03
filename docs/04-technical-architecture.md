# Technical Architecture

## Overview

Blitzed Out is built as a modern Progressive Web Application (PWA) using React 19.1.0 and TypeScript. The architecture follows an offline-first approach with real-time synchronization capabilities, ensuring optimal performance and user experience across all devices.

## Technology Stack

### Core Technologies

#### Frontend Framework
- **React 19.1.0**: Latest React with concurrent features
- **TypeScript 5.8.2**: Type-safe development
- **React Router DOM v7**: Client-side routing

#### Build & Development
- **Vite 7.0.0**: Lightning-fast build tool
- **SWC Plugin**: Fast TypeScript/JSX compilation
- **ESBuild**: Optimized bundling

#### UI Framework
- **Material-UI v7**: Component library
- **Emotion**: CSS-in-JS styling
- **Framer Motion**: Animation library

#### State Management
- **Zustand 5.0.6**: Lightweight state management
- **Dexie 4.0.1**: IndexedDB wrapper
- **React Context**: Cross-component state

#### Backend Services
- **Firebase 12.0.0**: 
  - Authentication
  - Firestore Database
  - Realtime Database
  - Cloud Storage

#### Internationalization
- **i18next 25.0.0**: Translation framework
- **react-i18next**: React integration
- **Language detection**: Browser language auto-detect
- **Supported Languages**: English, Spanish, French
- **Dynamic Loading**: Locale files from `src/locales/`
- **Game Mode Separation**: Separate action/content files for local vs online game modes
- **Storage**: Browser language detection with localStorage persistence

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client (PWA)                         │
├─────────────────────────────────────────────────────────────┤
│                     React Application                       │
│  ┌──────────────┬──────────────┬──────────────────────┐   │
│  │   UI Layer   │ State Layer  │   Service Layer      │   │
│  │              │              │                      │   │
│  │  Components  │   Zustand    │  Firebase Service   │   │
│  │  Views       │   Context     │  Sync Service       │   │
│  │  Hooks       │   Dexie DB    │  Migration Service  │   │
│  └──────────────┴──────────────┴──────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                               │
                               │ HTTPS/WebSocket
                               │
┌─────────────────────────────────────────────────────────────┐
│                      Firebase Cloud                         │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┬──────────────┬──────────────────────┐   │
│  │    Auth      │   Firestore   │  Realtime Database  │   │
│  │              │               │                      │   │
│  │  Users       │  Game Data    │  Presence           │   │
│  │  Sessions    │  Custom Tiles │  Messages           │   │
│  │              │  Boards       │  Room State         │   │
│  └──────────────┴──────────────┴──────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Layered Architecture

#### 1. Presentation Layer
**Location**: `/src/views/`, `/src/components/`

- **Views**: Page-level components
- **Components**: Reusable UI elements
- **Layouts**: Page structure components
- **Styles**: Theme and styling

#### 2. Business Logic Layer
**Location**: `/src/services/`, `/src/helpers/`

- **Services**: Core business operations
- **Helpers**: Utility functions
- **Validators**: Data validation
- **Transformers**: Data transformation

#### 3. State Management Layer
**Location**: `/src/stores/`, `/src/context/`

- **Zustand Stores**: Application state management in `src/stores/`
- **Context Providers**: Cross-component state (auth, messages, userList, schedule)
- **Dexie Database**: Local persistence with sync middleware
- **Firebase Services**: Cloud storage and real-time features
- **Local Storage**: Persistent settings
- **Session Storage**: Temporary data

### File Structure Patterns

#### Component Organization

- Each component in its own directory with `index.tsx`
- Styles in separate CSS files or Material-UI styled components
- Complex components have sub-components in nested directories

#### Services Layer

- `src/services/firebase.ts` - All Firebase operations
- `src/services/syncService.ts` - Dexie/Firebase sync logic
- `src/services/syncMiddleware.ts` - Dexie middleware for automatic sync

#### Type Definitions

- Main types in `src/types/index.ts`
- Specific feature types in dedicated files (e.g., `Settings.ts`, `Message.ts`)
- Firebase User type extended with custom properties

#### 4. Data Access Layer
**Location**: `/src/services/firebase.ts`, `/src/stores/store.ts`

- **Dexie Database**: Local data storage
- **Firebase SDK**: Cloud data access
- **Sync Middleware**: Data synchronization
- **Migration Service**: Schema updates

## Authentication System

### Architecture
**Main File**: `/src/context/auth.tsx`

```typescript
// Authentication flow
Anonymous → Email/Password → OAuth (Google)
         ↘                 ↗
           Account Merge
```

### Features

#### Authentication Methods
1. **Anonymous Authentication**
   - No registration required
   - Automatic session creation
   - Can convert to full account

2. **Email/Password**
   - Traditional registration
   - Password reset functionality
   - Email verification

3. **OAuth Providers**
   - Google Sign-In
   - Social account linking
   - Profile import

#### Multi-Modal Authentication System

- **Anonymous → Registered**: Anonymous users can convert to registered accounts
- **Firebase Auth Integration**: Custom context provider for seamless auth state management
- **Automatic Data Sync**: Local Dexie data syncs to Firebase on auth state changes

#### Session Management
- **Token Refresh**: Automatic token renewal
- **Session Persistence**: Remember me functionality
- **Multi-Device**: Cross-device sessions
- **Logout**: Clean session termination

#### Security Features
- **Password Requirements**: Minimum complexity
- **Rate Limiting**: Brute force protection
- **Secure Storage**: Encrypted tokens
- **HTTPS Only**: Secure transport

## Real-time Features

### Firebase Realtime Database
**Service**: `/src/services/firebase.ts`

#### User Presence System
```typescript
interface UserPresence {
  uid: string;
  displayName: string;
  lastSeen: number;
  isOnline: boolean;
  room: string;
}
```

**Implementation**:
- Heartbeat mechanism
- Automatic disconnect detection
- Presence recovery
- Room-based tracking

#### Message System
```typescript
interface Message {
  id: string;
  text: string;
  type: 'chat' | 'action' | 'system';
  uid: string;
  displayName: string;
  timestamp: number;
  room: string;
}
```

**Features**:
- Real-time delivery
- Message types
- Auto-expiry (24 hours)
- Room isolation

#### Board Synchronization
- Player positions
- Turn management
- Game state
- Settings sync

### WebSocket Connection Management
- **Connection State**: Online/offline detection
- **Reconnection**: Automatic retry with backoff
- **Queue Management**: Offline action queue
- **Conflict Resolution**: Last-write-wins

## Data Synchronization

### Sync Architecture
**Main Service**: `/src/services/syncService.ts`
**Middleware**: `/src/services/syncMiddleware.ts`

```
Local Change → Dexie → Sync Middleware → Firebase
                ↑                           ↓
            Local Cache ← Sync Service ← Remote Change
```

### Sync Strategy

#### Offline-First Approach
1. All changes write to local Dexie first
2. Sync middleware queues for upload
3. Background sync when online
4. Conflict resolution on sync

#### Sync Middleware
```typescript
// Middleware intercepts Dexie operations
db.use(createSyncMiddleware({
  tables: ['customTiles', 'gameBoard', 'customGroups'],
  debounceMs: 1000,
  batchSize: 50
}));
```

#### Conflict Resolution
- **Strategy**: Last-write-wins
- **Timestamps**: Server timestamps
- **Versioning**: Optimistic locking
- **Merge**: Custom merge strategies

### Data Flow
1. **User Action** → Component state
2. **State Update** → Zustand store
3. **Persistence** → Dexie database
4. **Sync** → Firebase (if online)
5. **Broadcast** → Other clients
6. **Update** → UI re-render

## Key Features Implementation

### Game System

- **Multi-player Board Game**: Real-time updates across connected clients
- **Custom Tile Creation**: User-generated content with category management
- **Intensity-Based Actions**: 1-5 scale action system with translations
- **Timer & Countdown**: Game session timing functionality
- **Cast Mode**: External screen display mode for shared gameplay

### Room Management

- **Room Types**: Public and private rooms with uppercase IDs
- **User Presence**: Real-time user presence tracking with heartbeat mechanism
- **Message History**: Chat system with automatic 24-hour cleanup
- **Schedule System**: Planned games with scheduling functionality

### Data Synchronization

- **Offline-First Design**: Local Dexie database with full offline functionality
- **Firebase Sync**: Automatic sync for registered users with conflict resolution
- **Debounced Operations**: 1000ms debouncing to prevent sync conflicts
- **Background Sync**: Periodic sync for registered users when online

## Offline-First Design

### Service Worker
**Configuration**: Vite PWA plugin

#### Caching Strategy
```javascript
// Cache-first for assets
/\.(js|css|png|jpg|woff2?)$/ → Cache First

// Network-first for API
/\/api\// → Network First, Cache Fallback

// Offline page for navigation
navigate → Offline Page if offline
```

#### Cache Layers
1. **App Shell**: Core HTML/CSS/JS
2. **Assets**: Images, fonts, sounds
3. **Data Cache**: API responses
4. **Dynamic Cache**: User content

### Offline Capabilities
- **Full Functionality**: All features work offline
- **Data Persistence**: IndexedDB storage
- **Queue Management**: Actions queue for sync
- **Status Indication**: Online/offline UI

### Progressive Enhancement
```typescript
// Feature detection and fallbacks
if ('serviceWorker' in navigator) {
  // PWA features
} else {
  // Traditional web app
}
```

## Performance Optimizations

### Code Splitting
**Implementation**: Dynamic imports with React.lazy

```typescript
// Route-based splitting
const GameSettings = lazy(() => import('./views/GameSettings'));
const CustomTileDialog = lazy(() => import('./views/CustomTileDialog'));

// Feature-based splitting
const Cast = lazy(() => import('./views/Cast'));
const Schedule = lazy(() => import('./views/Schedule'));
```

### Bundle Optimization
**Configuration**: `/vite.config.ts`

```javascript
rollupOptions: {
  output: {
    manualChunks: {
      'vendor': ['react', 'react-dom'],
      'mui': ['@mui/material'],
      'firebase': ['firebase/app'],
      'translations': ['i18next']
    }
  }
}
```

### Loading Performance

#### Critical Path Optimization
1. **Minimal Initial Bundle**: < 100KB
2. **Async Components**: Load on demand
3. **Preload Hints**: Critical resources
4. **Resource Hints**: DNS prefetch

#### Progressive Loading
```typescript
// Skeleton screens while loading
<Suspense fallback={<AppSkeleton />}>
  <FullApp />
</Suspense>
```

### Runtime Performance

#### React Optimizations
- **Memoization**: React.memo for pure components
- **useCallback**: Stable function references
- **useMemo**: Expensive computations
- **Virtual Lists**: Large list rendering

#### State Management
- **Atomic Updates**: Granular state updates
- **Selectors**: Computed state values
- **Subscriptions**: Targeted re-renders
- **Debouncing**: Rate-limited updates

## Migration System

### Overview
**Service**: `/src/services/migrationService.ts`
**Context**: `/src/context/migration.tsx`

### Migration Strategy

#### Lazy Migration
- Migrations run on-demand
- Only when language changes
- Deferred until needed
- Non-blocking startup

#### Migration Process
```typescript
interface Migration {
  version: number;
  migrate: (db: Dexie) => Promise<void>;
  rollback?: (db: Dexie) => Promise<void>;
}
```

1. **Check Version**: Compare current vs. target
2. **Run Migrations**: Execute in sequence
3. **Update Metadata**: Mark as complete
4. **Cache Results**: Prevent re-runs

### Performance Impact
- **60-80% faster** app startup
- **Deferred Loading**: Only when needed
- **Background Processing**: Non-blocking
- **Incremental**: Can be interrupted

## Security Architecture

### Frontend Security

#### Input Validation
- **XSS Prevention**: Input sanitization
- **CSRF Protection**: Token validation
- **SQL Injection**: Parameterized queries
- **Path Traversal**: Path validation

#### Content Security Policy
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline';
               style-src 'self' 'unsafe-inline';
               img-src 'self' data: https:;">
```

### Data Security

#### Encryption
- **Transport**: HTTPS only
- **Storage**: Encrypted IndexedDB
- **Tokens**: Secure token storage
- **Passwords**: Bcrypt hashing

#### Access Control
- **Room Permissions**: Owner/member roles
- **Content Filtering**: User preferences
- **Rate Limiting**: API throttling
- **Session Management**: Timeout/renewal

### Privacy Protection
- **Data Minimization**: Collect only necessary
- **Anonymous Mode**: No PII required
- **Local Storage**: Data stays on device
- **Auto-Cleanup**: Expired data removal

## Error Handling

### Error Boundaries
**Component**: Error boundary wrappers

```typescript
class ErrorBoundary extends Component {
  componentDidCatch(error, errorInfo) {
    // Log to service
    // Show fallback UI
  }
}
```

### Error Recovery

#### Network Errors
- Automatic retry with backoff
- Offline queue for failed requests
- User notification
- Fallback to cached data

#### Application Errors
- Error boundaries catch crashes
- Graceful degradation
- Error reporting
- Recovery suggestions

### Logging & Monitoring

#### Client-Side Logging
```typescript
// Structured logging
logger.error('Operation failed', {
  operation: 'syncData',
  error: error.message,
  context: { userId, roomId }
});
```

#### Error Tracking
- Console logging in development
- Sentry integration (planned)
- User feedback collection
- Performance monitoring

## Testing Architecture

### Testing Stack
- **Vitest**: Test runner
- **React Testing Library**: Component testing
- **MSW**: API mocking
- **Coverage**: Istanbul

### Test Categories

#### Unit Tests
**Location**: `__tests__` folders
- Component logic
- Helper functions
- Store operations
- Service methods

#### Integration Tests
- Component interactions
- API integration
- State management
- Data flow

#### E2E Tests (Planned)
- User workflows
- Critical paths
- Cross-browser
- Performance

### Testing Configuration

- **Test Framework**: Vitest with jsdom environment
- **Test Setup**: `src/setupTests.ts` for global test configuration
- **Testing Library**: React Testing Library with user-event
- **Mocks**: Firebase and hooks mocks in `src/__mocks__/`
- **Coverage**: Excludes mocks, setup files, and build directories
- **Memory**: Configured with max old space size for large test suites

### Testing Guidelines

#### Running Tests

- **Full test suite**: `npm run test:run` - Use for CI/CD and validation (exits after completion)
- **Watch mode**: `npm test` - Interactive testing during development
- **Specific files**: `npm run test:run -- path/to/test.tsx` - Run individual test files
- **Pattern matching**: `npm run test:run -- "**/hooks/**"` - Run tests matching glob patterns

#### Common Testing Issues & Solutions

**Issue**: `useMigration must be used within a MigrationProvider`
**Solution**: Add migration context mock to test files:

```typescript
vi.mock('@/context/migration', () => ({
  useMigration: () => ({
    currentLanguageMigrated: true,
    isMigrationInProgress: false,
    isMigrationCompleted: true,
    error: null,
    triggerMigration: vi.fn(),
    ensureLanguageMigrated: vi.fn(),
  }),
}));
```

**Issue**: Firebase mocking errors
**Solution**: Tests automatically use mocks from `src/__mocks__/` - ensure Firebase operations are properly mocked

**Issue**: `Cannot resolve module` errors
**Solution**: Check if imports use `@/` path aliases correctly and modules exist

#### Test Structure

- Component tests use React Testing Library patterns
- Services have comprehensive unit tests with Firebase mocking
- Integration tests cover complete user workflows
- Hook tests require proper context mocking (auth, migration, etc.)
- Slow tests flagged at 1000ms threshold

#### Test-Driven Development (TDD)

This project follows **Test Driven Development** practices. Always write tests before implementing features:

1. **Red**: Write a failing test that describes the desired functionality
2. **Green**: Write the minimal code to make the test pass
3. **Refactor**: Improve the code while keeping tests green

**TDD Workflow:**

1. Write a failing test for new functionality
2. Run tests to confirm they fail: `npm run test:run`
3. Implement minimal code to make tests pass
4. Run tests to confirm they pass: `npm run test:run`
5. Refactor code while maintaining test coverage
6. Repeat for each new feature or bug fix

#### Development Best Practices

**Before Making Changes:**

1. **Run type check**: `npm run type-check` - Ensure no type errors
2. **Run source lint**: `npx eslint src/` - Check code quality
3. **Run relevant tests**: `npm run test:run -- path/to/affected/tests`

**When Adding New Hooks:**

- Add proper context mocking in tests (migration, auth, etc.)
- Test error scenarios and loading states
- Ensure cleanup in useEffect return functions
- Add TypeScript types for all parameters and return values

**When Modifying Context Providers:**

- Update test mocks to match new context shape
- Test provider with and without required props
- Ensure error boundaries handle context failures
- Document context dependencies in component comments

**Quality Checks Before Commit:**

```bash
npm run type-check && npx eslint src/ && npm run test:run
```

**Git Workflow:**

- Use semantic commit messages: `fix:`, `feat:`, `refactor:`, `perf:`, etc.
- Keep commits focused and atomic
- Run tests before pushing changes

### Test Coverage
- **Target**: 80% coverage
- **Critical Paths**: 100% coverage
- **UI Components**: 70% coverage
- **Utilities**: 90% coverage

## Development Workflow

### Local Development
```bash
npm start          # Start dev server
npm test          # Run tests
npm run lint      # Code quality
npm run type-check # Type checking
```

### Build Process
```bash
npm run build     # Production build
npm run deploy    # Deploy to GitHub Pages
```

### Build Optimization

- Manual code splitting for vendor libraries, MUI, translations, and Firebase
- Asset optimization including MP3 files
- Dependency optimization for faster builds

### Code Quality
- **ESLint**: Code standards
- **Prettier**: Code formatting
- **Husky**: Git hooks
- **TypeScript**: Type safety

#### Linting & Formatting

- **ESLint**: `npm run lint` - Check code quality (config in `eslint.config.js`)
- **Source only**: `npx eslint src/` - Lint only source files (excludes build artifacts)
- **TypeScript**: `npm run type-check` - Type checking without compilation
- **Prettier**: `npm run format` - Code formatting
- **Pre-commit**: Husky hooks run lint + format on staged files automatically

#### Common Lint Issues

**Issue**: Many lint errors from `public/` directory
**Solution**: These are build artifacts - use `npx eslint src/` to check only source code

**Issue**: `react-refresh/only-export-components` warning
**Solution**: This warning on context files is expected and can be ignored

**Issue**: TypeScript compilation errors
**Solution**: Run `npm run type-check` to see specific type issues without building

## Deployment Architecture

### Build Pipeline
1. **Type Check**: TypeScript validation
2. **Lint**: Code quality check
3. **Test**: Run test suite
4. **Build**: Create production bundle
5. **Deploy**: Push to hosting

### Hosting
- **GitHub Pages**: Static hosting
- **CDN**: CloudFlare (automatic)
- **Domain**: blitzedout.com
- **SSL**: Let's Encrypt

### Environment Configuration
```typescript
// Environment variables
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
```

## Scalability Considerations

### Horizontal Scaling
- **Stateless Design**: No server state
- **CDN Distribution**: Global edge caching
- **Firebase Scaling**: Automatic scaling
- **Load Balancing**: CloudFlare

### Performance Targets
- **Initial Load**: < 3s on 3G
- **Time to Interactive**: < 5s
- **Lighthouse Score**: > 90
- **Bundle Size**: < 500KB initial

### Future Scaling
- **Microservices**: Service separation
- **Edge Functions**: Computation at edge
- **Database Sharding**: Data partitioning
- **Multi-Region**: Geographic distribution