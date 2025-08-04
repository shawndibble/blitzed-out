# Codebase Structure

## Root Directory

- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration with path aliases
- `vite.config.ts` - Vite build configuration with optimizations
- `vitest.config.ts` - Testing configuration
- `eslint.config.js` - ESLint rules and TypeScript integration
- `.prettierrc` - Code formatting rules
- `firebase.json` - Firebase hosting and security headers
- `CLAUDE.md` - Development guidance for Claude Code

## Source Structure (`src/`)

### Main Application Files

- `src/App.tsx` - Main application component
- `src/index.jsx` - Application entry point
- `src/theme.ts` - Material-UI theme configuration
- `src/i18n.ts` - Internationalization setup

### Core Directories

#### Components (`src/components/`)

- Organized by feature/component name
- Each component in its own directory with `index.tsx`
- Examples: `ButtonRow/`, `GameBoard/`, `MessageList/`
- Shared UI components and dialogs

#### Views (`src/views/`)

- Page-level components and major features
- Examples: `Room/`, `GameSettings/`, `Cast/`
- Contains complex UI flows and wizards

#### Stores (`src/stores/`)

- Zustand state management
- `store.ts` - Main Dexie database configuration
- Feature-specific stores: `settingsStore.ts`, `gameBoard.ts`, etc.

#### Types (`src/types/`)

- `index.ts` - Main application types
- Feature-specific type definitions
- Component prop interfaces

#### Hooks (`src/hooks/`)

- Custom React hooks
- Examples: `useLocalPlayers.ts`, `useGameBoard.ts`
- Business logic and state management

#### Services (`src/services/`)

- External service integrations
- `firebase.ts` - Firebase operations
- API calls and data fetching

#### Helpers (`src/helpers/`)

- Utility functions and business logic
- `actionsFolder.ts` - Game action management
- Pure functions and calculations

#### Context (`src/context/`)

- React context providers
- `migration.tsx` - Data migration context
- Cross-component state sharing

#### Locales (`src/locales/`)

- Internationalization resources
- Organized by language: `en/`, `es/`, `fr/`, `zh/`, `hi/`
- `translation.json` files for each language

#### Other Directories

- `src/constants/` - Application constants
- `src/utils/` - Utility functions
- `src/images/` - Static images
- `src/sounds/` - Audio files
- `src/__mocks__/` - Test mocks (Firebase, etc.)
- `src/__tests__/` - Global test utilities

## Configuration Files

- `.husky/` - Git hooks configuration
- `docs/` - Project documentation (may need verification)
- `public/` - Static assets
- `functions/` - Firebase Cloud Functions
- `.github/` - GitHub Actions and workflows

## Key Patterns

- Path aliases: `@/*` maps to `src/*`
- Default exports for main components
- Co-located tests in `__tests__` directories
- Centralized type definitions
- Feature-based organization
