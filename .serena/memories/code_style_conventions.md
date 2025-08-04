# Code Style & Conventions

## TypeScript Configuration

- **Target**: ES2020 with strict mode enabled
- **Module**: ESNext with bundler resolution
- **JSX**: react-jsx (no React imports needed)
- **Path aliases**: `@/*` maps to `src/*`
- **Strict typing**: noUnusedLocals, noUnusedParameters, noFallthroughCasesInSwitch

## Code Formatting (Prettier)

- **Semicolons**: Required (semi: true)
- **Quotes**: Single quotes (singleQuote: true)
- **Print width**: 100 characters
- **Tab width**: 2 spaces
- **Trailing commas**: ES5 style

## ESLint Rules

- **React**: JSX runtime (no React imports needed)
- **TypeScript**: @typescript-eslint with recommended rules
- **Unused variables**: Error (with underscore prefix exception)
- **No explicit any**: Disabled
- **Display name**: Off for components
- **Prop types**: Off (using TypeScript)
- **Multi-spaces**: Error
- **React hooks**: Rules enforced

## File Organization

- **Components**: Each in own directory with `index.tsx`
- **Types**: Main types in `src/types/index.ts`, feature-specific in separate files
- **Stores**: Zustand stores in `src/stores/`
- **Services**: Firebase operations in `src/services/`
- **Hooks**: Custom hooks in `src/hooks/`
- **Utils**: Utility functions in `src/utils/`
- **Constants**: Application constants in `src/constants/`

## Naming Conventions

- **Components**: PascalCase (e.g., `ButtonRow`, `GameBoard`)
- **Files**: kebab-case for non-component files, PascalCase for components
- **Variables**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Types/Interfaces**: PascalCase with descriptive suffixes (Props, Settings, etc.)

## Component Patterns

- **Default exports**: Used for main component files
- **Named exports**: Used for utilities, types, and secondary components
- **Props typing**: Dedicated interface for each component's props
- **Material-UI**: Consistent use of sx prop for styling
- **Path aliases**: Always use `@/` for src imports

## State Management

- **Zustand**: Stores in `src/stores/` with TypeScript interfaces
- **Local state**: useState for component-specific state
- **Context**: Used for cross-component concerns (migration, theme)

## Testing Patterns

- **Test files**: Co-located with components in `__tests__` directories
- **Mocks**: Centralized in `src/__mocks__/`
- **Test utilities**: React Testing Library with custom utilities in `src/test-utils.tsx`
