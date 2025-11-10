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

### Testing Essentials

- **Test Framework**: Vitest with React Testing Library
- **Mocks**: Firebase and hooks mocks in `src/__mocks__/`
- **Memory-Safe Testing**: Use `npm run test:failures` to prevent system memory overload when fixing tests
- **Key Commands**:
  - `npm run test:failures` for memory-safe test validation (recommended)
  - `npm run test:focused` for detailed failure output
  - `npm run test:memory` for low-memory situations

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

- **Claude Context**: Semantic code search and analysis for the entire codebase
  - Status: ✓ Connected
  - Provides natural language code search, intelligent indexing, and contextual code retrieval

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

### Using Claude Context

Claude Context enables semantic search across the entire codebase using natural language queries. It's automatically indexed and ready to use.

**Key Capabilities:**

- **Semantic Search**: Find code using natural language descriptions
- **Hybrid Search**: Combines BM25 and dense vector techniques for accurate results
- **Multi-Language Support**: Works with TypeScript, JavaScript, React components, and more
- **Contextual Retrieval**: Returns relevant code snippets with surrounding context

**Usage Examples:**

- "Find components that handle user authentication"
- "Show me how state management is implemented with Zustand"
- "Locate Firebase integration code for data synchronization"
- "Find TypeScript interfaces for user data structures"
- "Search for Material-UI theme customizations"

**Best Practices:**

- Use descriptive, natural language queries for better results
- Search for functionality rather than specific file names
- Combine with Context7 for comprehensive development workflow
- Leverage semantic search before creating new implementations to avoid duplication

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

## Internationalization (i18n)

**CRITICAL RULE**: When updating translations, **ALWAYS** update all 5 language files: `en`, `es`, `fr`, `zh`, `hi` in `src/locales/*/translation.json`

When adding anatomy-specific language to action files:

1. Replace hardcoded anatomy terms with placeholders
2. Use `{genital}` instead of dick/pussy/cock/clit
3. Use `{hole}` instead of pussy/ass/hole
4. Use `{chest}` instead of breasts/chest/pecs
5. Use pronouns for gender-neutral phrasing

**Before:**

```json
"{dom} rubs their dick on {sub}'s pussy."
```

**After:**

```json
"{dom} rubs their {genital} on {sub}'s {hole}."
```

## Coding Standards

- Do not comment out variables that are no longer used. Instead remove the variable entirely.
- Do not leave comments for code that is removed/replaced.
- Logging should only ever be used for troubleshooting. We should not have it in production code.
- If a comment is added, it shouldn't be telling what the code is doing but rather why it was coded that way. Concise functions, helpers, hooks and components should be used to help document the code as to what it is doing.
