# Test Mocks

This directory contains mock implementations for testing video calling functionality.

## Available Mocks

### peerjs.ts

Mock implementation of PeerJS for testing WebRTC connections without real peer connections.

**Classes**:

- `MockPeer` - Simulates PeerJS peer instance
- `MockMediaConnection` - Simulates media stream connections
- `MockDataConnection` - Simulates data channel connections

**Functions**:

- `createMockMediaStream(options)` - Creates mock MediaStream
- `createMockMediaStreamTrack(kind)` - Creates mock audio/video tracks

**Usage**:

```typescript
import { MockPeer, createMockMediaStream } from '@/__mocks__/peerjs';

const peer = new MockPeer('test-peer-id');
const stream = createMockMediaStream({ audio: true, video: true });
```

### mediaDevices.ts

Mock implementation of navigator.mediaDevices for testing camera/microphone access.

**Functions**:

- `setupMediaDevicesMocks()` - Setup all device mocks
- `resetMediaDevicesMocks()` - Reset mocks between tests
- `mockGetUserMediaError(error)` - Simulate getUserMedia errors
- `createNotAllowedError()` - Permission denied error
- `createNotFoundError()` - Device not found error
- `createNotReadableError()` - Device in use error
- `createOverconstrainedError()` - Invalid constraints error

**Usage**:

```typescript
import {
  setupMediaDevicesMocks,
  createNotAllowedError,
  mockGetUserMediaError,
} from '@/__mocks__/mediaDevices';

beforeEach(() => {
  setupMediaDevicesMocks();
});

// Simulate permission denied
mockGetUserMediaError(createNotAllowedError());
```

### realtimeDatabase.ts

Fake Realtime Database that models **registrations per path**, for tests where
more than one module listens on the same node.

The usual per-file `vi.mock('firebase/database')` factory returns a bare
`onValue: vi.fn()` and `off: vi.fn()`, so nothing can observe what the SDK does
when listeners share a path. Two real behaviours are invisible to those stubs,
and both have bitten:

- `off(query)` with no event type and no callback detaches **every** listener at
  that location, not just the caller's.
- `onValue` replays the last value **synchronously** when the path is already
  cached — which it is whenever another listener is up.

**Exports**:

- `fakeDatabase` — the shared instance: `publish(path, value)`, `fail(path, err)`,
  `listenerCount(path)`, `reset()`
- `realtimeDatabaseModule()` — the `firebase/database` module shape, backed by it

**Usage** (call inside the factory — `vi.mock` is hoisted above imports):

```typescript
import { fakeDatabase, realtimeDatabaseModule } from '@/__mocks__/realtimeDatabase';

vi.mock('firebase/database', () => realtimeDatabaseModule());

beforeEach(() => fakeDatabase.reset());

fakeDatabase.publish('video-calls/PUBLIC/users', { alice: { lastSeen: Date.now() } });
expect(fakeDatabase.listenerCount('video-calls/PUBLIC/users')).toBe(2);
```

Reach for this only when a test needs two readers on one node. A single-module
test is better served by the inline factory the rest of the suite uses.

## See Also

- `/src/__tests__/fixtures/videoCall.fixtures.ts` - Test data factories
- `/src/__tests__/helpers/testSetup.ts` - Test setup utilities
- `.claude/plans/video-calling/TESTING_INFRASTRUCTURE_SUMMARY.md` - Complete testing guide
