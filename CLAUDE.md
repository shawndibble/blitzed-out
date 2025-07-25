# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Commands

- `npm start` - Start development server (Vite)
- `npm run build` - Build for production (includes TypeScript compilation)
- `npm run type-check` - Run TypeScript type checking without compilation
- `npm test` - Run tests (currently returns success without running tests)

### Code Quality

- `npm run lint` - Run ESLint on JS/JSX/TS/TSX files
- `npm run format` - Format code with Prettier

### Deployment

- `npm run deploy` - Deploy to GitHub Pages (builds to dist, deploys to master branch)

## Project Architecture

### Tech Stack

- **Framework**: React 19.1.0 with TypeScript
- **Build Tool**: Vite with SWC plugin
- **Styling**: Material-UI (MUI) v7 with Emotion
- **State Management**: Zustand (stores in `src/stores/`)
- **Database**: Dexie (IndexedDB wrapper) with Firebase sync
- **Backend**: Firebase (Auth, Firestore, Realtime Database, Storage)
- **Routing**: React Router DOM v7
- **Internationalization**: i18next with React integration

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

## Development Notes

### Path Aliases

- `@/*` maps to `src/*` (configured in vite.config.ts and tsconfig.json)

### Code Quality

- ESLint configuration in `eslint.config.js`
- Prettier integration with lint-staged
- Husky pre-commit hooks
- TypeScript strict mode enabled

### Build Optimization

- Manual code splitting for vendor libraries, MUI, translations, and Firebase
- Asset optimization including MP3 files
- Dependency optimization for faster builds
