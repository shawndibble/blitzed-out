# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Commands

- `npm start` - Start development server (Vite) - **IMPORTANT**: DO NOT restart the development server during work sessions. Assume it is running.
- `npm run build` - Build for production (includes TypeScript compilation)
- `npm run type-check` - Run TypeScript type checking without compilation
- `npm run test:failures` - **RECOMMENDED**: Memory-optimized, shows only failing tests, stops after 10 failures
- `npm run test:focused` - Shows only failing tests with detailed output (higher memory usage)
- `npm run test:memory` - Low-memory test run with basic reporting
- `npm run test:run` - Run all tests once and exit (includes memory optimization)
- `npm test` - Run tests with Vitest in watch mode (high memory usage - use sparingly)
- `npm run test:ui` - Run tests with Vitest UI interface
- `npm run test:coverage` - Run tests with coverage reporting

### Code Quality

- `npm run lint` - Run ESLint on JS/JSX/TS/TSX files
- `npm run format` - Format code with Prettier
- `npm run cleanup:debug` - Check for and fail on debug code (console.log, debugger, etc.)
- `npm run cleanup:comments` - Check for TODO/FIXME comments that need attention

### Deployment

- `npm run deploy` - Deploy to GitHub Pages (builds to dist, deploys to master branch)

## Quick Project Overview

### Tech Stack Essentials

- **React 19.1.0** with TypeScript, Vite build tool
- **Material-UI v7** with dark mode theme (avoid hardcoded light colors like 'grey.50')
- **Zustand** stores in `src/stores/` + **Dexie** (IndexedDB) + **Firebase** sync
- **i18next** for English/Spanish/French/Chinese/Hindi localization

### Key Patterns

- **Components**: Each in own directory with `index.tsx`
- **State**: Zustand stores + Context providers for cross-component state
- **Types**: Main types in `src/types/index.ts`, feature-specific in separate files
- **Services**: Firebase operations in `src/services/firebase.ts`
- **Migration**: Smart language file migration via `src/context/migration.tsx`

**📖 Full Architecture Details**: See [docs/04-technical-architecture.md](docs/04-technical-architecture.md)

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

**Issue**: TypeScript compilation errors
**Solution**: Run `npm run type-check` to see specific type issues without building

### Testing Essentials

- **Test Framework**: Vitest with React Testing Library
- **Mocks**: Firebase and hooks mocks in `src/__mocks__/`
- **Memory-Safe Testing**: Use `npm run test:failures` to prevent system memory overload when fixing tests
- **Key Commands**:
  - `npm run test:failures` for memory-safe test validation (recommended)
  - `npm run test:focused` for detailed failure output
  - `npm run test:memory` for low-memory situations

**📖 Full Testing Details**: See [docs/04-technical-architecture.md](docs/04-technical-architecture.md)

#### Critical Testing Issues & Solutions

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
**Solution**: Tests automatically use mocks from `src/__mocks__/`

**Issue**: `Cannot resolve module` errors  
**Solution**: Check imports use `@/` path aliases correctly

## MCP Server Integration

### Available MCP Servers

- **Context7**: Up-to-date documentation and code examples from official sources
  - Status: ✓ Connected
  - URL: https://mcp.context7.com/mcp
- **Serena**: Advanced codebase analysis and semantic coding tools
  - Status: ✓ Connected
  - Provides intelligent code exploration, symbol analysis, and memory management

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

### Using Serena

Serena provides advanced semantic code analysis and is automatically available. Key capabilities:

**Symbol Analysis:**

- Find and analyze functions, classes, components by name
- Explore code relationships and dependencies
- Navigate codebase structure intelligently

**Memory Management:**

- Maintains project context across sessions
- Stores development patterns and conventions
- Preserves onboarding information

**Code Exploration:**

- Search for patterns and implementations
- Analyze code structure without reading entire files
- Find references and usages efficiently

**Best Practices:**

- Serena prefers targeted symbol reading over full file reads
- Use symbol-based operations for precise code modifications
- Leverages project memory for consistent development patterns

## Product Documentation

### Application Documentation

Comprehensive product documentation is available in the `docs/` folder:

- **📖 [docs/README.md](docs/README.md)** - Main documentation index and navigation
- **🎯 [docs/01-application-overview.md](docs/01-application-overview.md)** - Business overview, product vision, and value propositions
- **👥 [docs/02-user-features-workflows.md](docs/02-user-features-workflows.md)** - Complete feature documentation including:
  - App settings and configuration
  - Setup wizard workflow
  - Local players functionality
  - Solo mode features
  - Custom tiles dialog
  - Room management
  - Cast mode
- **🎲 [docs/03-game-mechanics.md](docs/03-game-mechanics.md)** - Game rules, mechanics, and player interactions
- **🏗️ [docs/04-technical-architecture.md](docs/04-technical-architecture.md)** - System architecture and technical implementation
- **💾 [docs/05-data-models.md](docs/05-data-models.md)** - Database schema, state management, and data models
- **🎨 [docs/06-ui-ux-components.md](docs/06-ui-ux-components.md)** - UI/UX patterns, components, and design system

**Usage:** These docs serve as a complete Business Requirements Document (BRD) and can answer all product questions with references to source code files.

## Development Workflow

### Test Driven Development (TDD)

This project follows **Test Driven Development**. Always write tests before implementing features:

1. **Red**: Write a failing test describing desired functionality
2. **Green**: Write minimal code to make the test pass
3. **Refactor**: Improve code while keeping tests green

### Quality Checks Before Commit

```bash
npm run type-check && npx eslint src/ && npm run test:failures
```

**Memory-Safe Testing**: Always use `npm run test:failures` when fixing tests or validating changes to prevent system memory overload.

**📖 Full Development Workflow**: See [docs/04-technical-architecture.md](docs/04-technical-architecture.md)

## Internationalization (i18n)

**CRITICAL RULE**: When updating translations, **ALWAYS** update all 5 language files: `en`, `es`, `fr`, `zh`, `hi` in `src/locales/*/translation.json`

**📖 Full i18n Guidelines**: See [docs/07-internationalization-guidelines.md](docs/07-internationalization-guidelines.md)
