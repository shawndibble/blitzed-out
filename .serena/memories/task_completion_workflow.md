# Task Completion Workflow

## Quality Checks Before Completion

### 1. Type Checking

```bash
npm run type-check
```

- Must pass without errors
- Validates TypeScript types across the entire codebase

### 2. Linting

```bash
npx eslint src/
```

- Use `src/` target to avoid build artifact errors
- Fix all linting errors before completion
- Address warnings where reasonable

### 3. Testing

```bash
npm run test:failures
```

- **CRITICAL**: Use memory-safe testing command
- All tests must pass
- Address any failing tests
- Use `npm run test:focused` for detailed failure output if needed

### 4. Code Formatting

```bash
npm run format
```

- Automatically handled by pre-commit hooks
- Ensures consistent code style

### 5. Debug Code Cleanup

```bash
npm run cleanup:debug
```

- Removes console.log and debugger statements
- Maintains clean production code

## Pre-Commit Checklist

- [ ] TypeScript compilation passes
- [ ] Linting passes (source files only)
- [ ] Tests pass (using memory-safe command)
- [ ] Code is formatted
- [ ] No debug code remains
- [ ] Documentation updated if needed

## Git Workflow

1. Stage changes: `git add .`
2. Pre-commit hooks run automatically (lint + format)
3. Commit: `git commit -m "descriptive message"`
4. Push: `git push`

## Testing Strategy

- **Primary**: Use `npm run test:failures` for validation
- **Debugging**: Use `npm run test:focused` for detailed output
- **Memory issues**: Use `npm run test:memory` for low-memory environments
- **Never use**: `npm test` in watch mode during CI/validation

## Build Verification (Optional)

```bash
npm run build
```

- Verifies production build works
- Only needed for major changes or before deployment

## Deployment (When Ready)

```bash
npm run deploy
```

- Builds and deploys to GitHub Pages
- Only run when ready for production release
