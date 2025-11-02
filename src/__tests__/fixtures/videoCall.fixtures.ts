import { createMockMediaStream, createMockMediaStreamTrack } from '@/__mocks__/peerjs';

export const createMockUser = (id: string, overrides = {}) => ({
  uid: id,
  email: `${id}@example.com`,
  displayName: `User ${id}`,
  photoURL: null,
  ...overrides,
});

export const createMockRoom = (id: string, overrides = {}) => ({
  id,
  name: `Room ${id}`,
  createdAt: Date.now(),
  createdBy: 'user-1',
  isActive: true,
  participants: [],
  ...overrides,
});

export const createMockPeer = (id: string, overrides = {}) => ({
  id,
  stream: createMockMediaStream(),
  connection: null,
  metadata: {
    userId: `user-${id}`,
    displayName: `Peer ${id}`,
  },
  ...overrides,
});

export const createMockSignal = (type: string, from: string, to: string, overrides = {}) => ({
  type,
  from,
  to,
  timestamp: Date.now(),
  data: null,
  ...overrides,
});

export const createMockVideoConstraints = (overrides = {}) => ({
  width: { ideal: 1280 },
  height: { ideal: 720 },
  frameRate: { ideal: 30 },
  facingMode: 'user',
  ...overrides,
});

export const createMockAudioConstraints = (overrides = {}) => ({
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  ...overrides,
});

export const scenarios = {
  twoParticipants: {
    room: createMockRoom('room-1'),
    users: [createMockUser('user-1'), createMockUser('user-2')],
    peers: [createMockPeer('peer-1'), createMockPeer('peer-2')],
  },

  multiParticipants: {
    room: createMockRoom('room-2'),
    users: [
      createMockUser('user-1'),
      createMockUser('user-2'),
      createMockUser('user-3'),
      createMockUser('user-4'),
    ],
    peers: [
      createMockPeer('peer-1'),
      createMockPeer('peer-2'),
      createMockPeer('peer-3'),
      createMockPeer('peer-4'),
    ],
  },

  networkIssues: {
    poorQuality: {
      packetLoss: 15,
      jitter: 100,
      latency: 500,
      bitrate: 100000,
    },
    moderate: {
      packetLoss: 5,
      jitter: 30,
      latency: 150,
      bitrate: 500000,
    },
    good: {
      packetLoss: 0.5,
      jitter: 10,
      latency: 50,
      bitrate: 2000000,
    },
  },
};

export { createMockMediaStream, createMockMediaStreamTrack };
