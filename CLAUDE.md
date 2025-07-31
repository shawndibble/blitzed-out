# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Commands

- `npm start` - Start development server (Vite) - **IMPORTANT**: DO NOT restart the development server during work sessions. Assume it is running.
- `npm run build` - Build for production (includes TypeScript compilation)
- `npm run type-check` - Run TypeScript type checking without compilation
- `npm test` - Run tests with Vitest in watch mode
- `npm run test:run` - Run tests once and exit (includes memory optimization)
- `npm run test:ui` - Run tests with Vitest UI interface
- `npm run test:coverage` - Run tests with coverage reporting

### Code Quality

- `npm run lint` - Run ESLint on JS/JSX/TS/TSX files
- `npm run format` - Format code with Prettier

### Deployment

- `npm run deploy` - Deploy to GitHub Pages (builds to dist, deploys to master branch)

## Project Architecture

### Tech Stack

- **Framework**: React 19.1.0 with TypeScript
- **Build Tool**: Vite with SWC plugin
- **Styling**: Material-UI (MUI) v7 with Emotion (Dark Mode Theme)
- **State Management**: Zustand (stores in `src/stores/`)
- **Database**: Dexie (IndexedDB wrapper) with Firebase sync
- **Backend**: Firebase (Auth, Firestore, Realtime Database, Storage)
- **Routing**: React Router DOM v7
- **Internationalization**: i18next with React integration

### UI/UX Notes

- **Theme**: Application uses dark mode by default
- **Design System**: Material-UI components with dark theme styling
- **Colors**: Use theme-aware colors (avoid hardcoded light-mode colors like 'grey.50')

### Key Architecture Patterns

#### State Management

- **Zustand stores** in `src/stores/` for client-side state
- **Dexie database** for local persistence with sync middleware
- **Firebase services** for cloud storage and real-time features
- **Context providers** for cross-component state (auth, messages, userList, schedule)

#### Authentication System

- Multi-modal auth: anonymous, email/password, Google OAuth
- Anonymous users can convert to registered accounts
- Firebase Auth integration with custom context provider
- Automatic data sync between local Dexie and Firebase on auth state changes

#### Real-time Features

- Firebase Realtime Database for user presence
- Firestore for messages and game data
- Automatic cleanup with TTL for messages (24 hours) and boards (30 days)

#### Internationalization

- Support for English, Spanish, French
- Dynamic locale loading from `src/locales/`
- Separate action/content files for local vs online game modes
- Browser language detection with localStorage persistence

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

### Key Features

#### Game System

- Multi-player board game with real-time updates
- Custom tile creation and board management
- Intensity-based action system with translations
- Timer and countdown functionality
- Cast mode for display on external screens

#### Room Management

- Public and private rooms with uppercase IDs
- Real-time user presence tracking
- Message history with automatic cleanup
- Schedule system for planned games

#### Data Sync

- Offline-first with local Dexie database
- Automatic sync to Firebase for registered users
- Debounced sync operations to prevent conflicts
- Periodic background sync for registered users

#### Migration System

- **MigrationProvider**: Context provider managing language file migrations from locale files to Dexie
- **Smart Migration**: Only runs when user actually changes language (reactive vs proactive)
- **Performance Optimized**: 60-80% faster app load by deferring migration until needed
- **State Tracking**: `currentLanguageMigrated`, `isMigrationInProgress`, `isMigrationCompleted`
- **Auto-Debouncing**: 100ms debouncing on language change events prevents duplicate migrations
- **Error Handling**: Graceful fallbacks when migration fails, app continues with existing data

**Key Files**:

- `src/context/migration.tsx` - Main migration context and provider
- `src/hooks/useDeferredMigration.ts` - Smart migration triggers and fallbacks
- `src/hooks/useUnifiedActionList.ts` - Language-aware action loading (waits for migration)
- `src/services/migrationService.ts` - Core migration logic (lazy-loaded)

## Development Notes

### Path Aliases

- `@/*` maps to `src/*` (configured in vite.config.ts and tsconfig.json)

### Code Quality

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

### Build Optimization

- Manual code splitting for vendor libraries, MUI, translations, and Firebase
- Asset optimization including MP3 files
- Dependency optimization for faster builds

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
- **With UI**: `npm run test:ui` - Visual test runner interface
- **Coverage**: `npm run test:coverage` - Generate coverage reports

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

## Context7 MCP Integration

### Available MCP Servers

- **Context7**: Up-to-date documentation and code examples from official sources
  - Status: ✓ Connected
  - URL: https://mcp.context7.com/mcp

### Using Context7

To get current, version-specific documentation and code examples, add `use context7` to your prompts:

**Examples:**

- "Create a React 19 component with TypeScript. use context7"
- "Show me how to implement Firebase v12 authentication. use context7"
- "How to use Material-UI v7 with custom themes? use context7"
- "Implement Zustand store with TypeScript. use context7"

**Benefits:**

- Real-time access to official documentation
- Version-specific code examples for project dependencies
- Reduces outdated or incorrect code suggestions
- Eliminates need to manually reference documentation

**Project-Specific Usage:**

- When working with React 19.1.0 features
- Material-UI v7 component implementations
- Firebase v12 integration patterns
- Vite build configuration
- TypeScript strict mode patterns

## Development Workflow

### Before Making Changes

1. **Run type check**: `npm run type-check` - Ensure no type errors
2. **Run source lint**: `npx eslint src/` - Check code quality
3. **Run relevant tests**: `npm run test:run -- path/to/affected/tests`

### When Adding New Hooks

- Add proper context mocking in tests (migration, auth, etc.)
- Test error scenarios and loading states
- Ensure cleanup in useEffect return functions
- Add TypeScript types for all parameters and return values

### When Modifying Context Providers

- Update test mocks to match new context shape
- Test provider with and without required props
- Ensure error boundaries handle context failures
- Document context dependencies in component comments

### Quality Checks Before Commit

```bash
npm run type-check && npx eslint src/ && npm run test:run
```

### Git Workflow

- Use semantic commit messages: `fix:`, `feat:`, `refactor:`, `perf:`, etc.
- Keep commits focused and atomic
- Run tests before pushing changes
- Use selective staging for commits: `git add specific/files` instead of `git add .`
