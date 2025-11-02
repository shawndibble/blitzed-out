# Test Utilities

This directory contains test helpers, fixtures, and utilities for video calling tests.

## Directory Structure

```
__tests__/
├── fixtures/
│   └── videoCall.fixtures.ts    # Test data factories
├── helpers/
│   └── testSetup.ts             # Test setup utilities
└── e2e/                         # End-to-end tests (to be created)
```

## Available Utilities

### fixtures/videoCall.fixtures.ts

Pre-built test data and scenarios.

**Functions**:

- `createMockUser(id, overrides)` - Create test user objects
- `createMockRoom(id, overrides)` - Create test room objects
- `createMockPeer(id, overrides)` - Create test peer objects
- `createMockSignal(type, from, to, overrides)` - Create signaling messages
- `createMockVideoConstraints(overrides)` - Create video constraints
- `createMockAudioConstraints(overrides)` - Create audio constraints

**Scenarios**:

- `scenarios.twoParticipants` - 2-person call setup
- `scenarios.multiParticipants` - 4-person call setup
- `scenarios.networkIssues` - Network quality scenarios (poor/moderate/good)

**Usage**:

```typescript
import { scenarios, createMockPeer } from '@/__tests__/fixtures/videoCall.fixtures';

// Use pre-built scenario
const { peers, users, room } = scenarios.multiParticipants;

// Create custom peer
const peer = createMockPeer('custom-peer-id', { displayName: 'John Doe' });
```

### helpers/testSetup.ts

Common test setup and utilities.

**Functions**:

- `setupMigrationContextMock()` - Mock migration context (REQUIRED)
- `setupFirebaseMock()` - Mock Firebase Realtime Database
- `advanceTime(ms)` - Fast-forward timers for long call testing
- `setupTestTimers()` - Enable fake timers
- `cleanupTestTimers()` - Restore real timers

**Usage**:

```typescript
import { setupTestTimers, advanceTime, cleanupTestTimers } from '@/__tests__/helpers/testSetup';

test('2+ hour call', async () => {
  setupTestTimers();

  // ... start call

  // Fast-forward 2.5 hours
  await advanceTime(2.5 * 60 * 60 * 1000);

  // ... verify still connected

  cleanupTestTimers();
});
```

## Quick Start

### Basic Test Template

```typescript
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { setupMediaDevicesMocks } from '@/__mocks__/mediaDevices';

// REQUIRED: Migration context mock
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

describe('My Test Suite', () => {
  beforeEach(() => {
    setupMediaDevicesMocks();
  });

  test('my test case', () => {
    // Test implementation
  });
});
```

## Running Tests

```bash
# Memory-safe test run (RECOMMENDED)
npm run test:failures

# Test specific file
npm run test:failures -- src/path/to/test.ts

# Detailed output for debugging
npm run test:focused -- src/path/to/test.ts
```

## See Also

- `/src/__mocks__/` - Mock implementations
- `.claude/plans/video-calling/E2E_TEST_PLAN.md` - Manual E2E test checklist
- `.claude/plans/video-calling/TESTING_INFRASTRUCTURE_SUMMARY.md` - Complete testing guide
