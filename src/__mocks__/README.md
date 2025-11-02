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

## See Also

- `/src/__tests__/fixtures/videoCall.fixtures.ts` - Test data factories
- `/src/__tests__/helpers/testSetup.ts` - Test setup utilities
- `.claude/plans/video-calling/TESTING_INFRASTRUCTURE_SUMMARY.md` - Complete testing guide
