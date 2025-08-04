# Essential Development Commands

## Development Server

- `npm start` - Start Vite development server
  - **IMPORTANT**: DO NOT restart during work sessions, assume it's running
  - Runs on http://localhost:5173 with network access enabled

## Testing Commands (Memory-Optimized)

- `npm run test:failures` - **RECOMMENDED**: Memory-safe, shows only failing tests, stops after 10 failures
- `npm run test:focused` - Shows only failing tests with detailed output (higher memory usage)
- `npm run test:memory` - Low-memory test run with basic reporting
- `npm run test:run` - Run all tests once and exit (includes memory optimization)
- `npm run test:ci` - CI-optimized with extreme memory constraints
- `npm run test:ui` - Run tests with Vitest UI interface
- `npm run test:coverage` - Run tests with coverage reporting
- `npm test` - Run tests with Vitest in watch mode (high memory usage - use sparingly)

## Code Quality

- `npm run type-check` - Run TypeScript type checking without compilation
- `npm run lint` - Run ESLint on all files
- `npx eslint src/` - Lint only source files (excludes build artifacts)
- `npm run format` - Format code with Prettier
- `npm run cleanup:debug` - Check for debug code (console.log, debugger)
- `npm run cleanup:comments` - Check for TODO/FIXME comments

## Build & Deployment

- `npm run build` - Build for production (includes TypeScript compilation)
- `npm run deploy` - Deploy to GitHub Pages (builds to dist, deploys to master branch)

## Git Hooks (Automated)

- **Pre-commit**: Automatically runs lint + format on staged files via Husky

## Quick Quality Check (Before Commit)

```bash
npm run type-check && npx eslint src/ && npm run test:failures
```

## System Commands (Darwin/macOS)

- `ls` - List directory contents
- `cd` - Change directory
- `grep` - Search text patterns
- `find` - Find files and directories
- `git` - Version control operations
- `pwd` - Print working directory

## Firebase Commands (if firebase-tools installed)

- `firebase serve` - Serve locally
- `firebase deploy` - Deploy to Firebase hosting
- `firebase emulators:start` - Run local emulators

## Important Notes

- **Memory Management**: Always use `npm run test:failures` when fixing tests to prevent system memory overload
- **Development Server**: Assume it's running, don't restart unnecessarily
- **Linting**: Use `npx eslint src/` to avoid build artifact errors
