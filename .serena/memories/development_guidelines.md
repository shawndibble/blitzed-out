# Development Guidelines & Patterns

## Key Design Patterns

### Test-Driven Development (TDD)

- **Red**: Write a failing test describing desired functionality
- **Green**: Write minimal code to make the test pass
- **Refactor**: Improve code while keeping tests green
- Always write tests before implementing features

### Component Architecture

- Each component in its own directory with `index.tsx`
- Props interfaces defined in types
- Material-UI `sx` prop for styling
- Default exports for main components

### State Management Strategy

- **Zustand**: Global application state
- **Local state**: Component-specific with useState
- **Context**: Cross-component concerns (migration, theme)
- **Dexie**: Local database storage
- **Firebase**: Cloud synchronization

### Error Boundaries & Mocking

- Firebase mocks in `src/__mocks__/`
- Migration context mocks for tests
- Comprehensive error handling patterns

## Critical Rules

### File Creation

- **NEVER** create files unless absolutely necessary
- **ALWAYS** prefer editing existing files
- **NEVER** proactively create documentation files
- Only create files if explicitly requested

### Internationalization (i18n)

- **CRITICAL**: When updating translations, ALWAYS update all 5 languages
- Languages: `en`, `es`, `fr`, `zh`, `hi`
- Files: `src/locales/*/translation.json`
- Never leave translations incomplete

### Memory Management

- Use `npm run test:failures` for memory-safe testing
- Avoid `npm test` in watch mode during validation
- Monitor memory usage with large test suites

### Code Quality

- TypeScript strict mode enforced
- ESLint rules must pass
- Prettier formatting required
- No debug code in production

## Framework-Specific Patterns

### React 19 Features

- Concurrent features enabled
- New JSX transform (no React imports needed)
- React Compiler integration via Babel

### Material-UI v7

- Theme customization in `src/theme.ts`
- Dark mode support (avoid hardcoded light colors like 'grey.50')
- Consistent component patterns

### Firebase Integration

- Authentication with anonymous support
- Firestore for persistent data
- Realtime Database for live features
- Cloud Storage for file uploads
- Security rules properly configured

### PWA Features

- Service worker for offline support
- Installable app capabilities
- Responsive design patterns
- Performance optimizations

## Performance Considerations

- Code splitting via Vite configuration
- Bundle optimization with manual chunks
- Image and asset optimization
- Lazy loading for large components
- Memory-efficient testing strategies

## Security Guidelines

- CSP headers configured in Firebase hosting
- Input validation and sanitization
- Secure Firebase rules
- Anonymous mode support
- Privacy-first data handling
