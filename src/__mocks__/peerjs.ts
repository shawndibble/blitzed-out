import { vi } from 'vitest';

type EventHandler = (...args: unknown[]) => void;

export class MockMediaConnection {
  peer: string;
  open: boolean = false;
  metadata: Record<string, unknown>;
  private eventHandlers: Map<string, EventHandler[]> = new Map();

  constructor(peer: string, metadata?: Record<string, unknown>) {
    this.peer = peer;
    this.metadata = metadata || {};
  }

  on(event: string, handler: EventHandler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)?.push(handler);
    return this;
  }

  off(event: string, handler?: EventHandler) {
    if (handler) {
      const handlers = this.eventHandlers.get(event) || [];
      const index = handlers.indexOf(handler);
      if (index > -1) handlers.splice(index, 1);
    } else {
      this.eventHandlers.delete(event);
    }
    return this;
  }

  close() {
    this.open = false;
    this.emit('close');
  }

  emit(event: string, ...args: unknown[]) {
    const handlers = this.eventHandlers.get(event) || [];
    handlers.forEach((handler) => handler(...args));
  }

  answer(stream?: MediaStream) {
    this.open = true;
    this.emit('stream', stream || createMockMediaStream());
  }
}

export class MockDataConnection {
  peer: string;
  open: boolean = false;
  private eventHandlers: Map<string, EventHandler[]> = new Map();

  constructor(peer: string) {
    this.peer = peer;
  }

  on(event: string, handler: EventHandler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)?.push(handler);
    return this;
  }

  off(event: string, handler?: EventHandler) {
    if (handler) {
      const handlers = this.eventHandlers.get(event) || [];
      const index = handlers.indexOf(handler);
      if (index > -1) handlers.splice(index, 1);
    } else {
      this.eventHandlers.delete(event);
    }
    return this;
  }

  send(data: unknown) {
    if (!this.open) throw new Error('Connection not open');
    this.emit('data', data);
  }

  close() {
    this.open = false;
    this.emit('close');
  }

  emit(event: string, ...args: unknown[]) {
    const handlers = this.eventHandlers.get(event) || [];
    handlers.forEach((handler) => handler(...args));
  }
}

export class MockPeer {
  id: string;
  open: boolean = false;
  disconnected: boolean = false;
  destroyed: boolean = false;
  private eventHandlers: Map<string, EventHandler[]> = new Map();
  connections: Map<string, MockMediaConnection[]> = new Map();

  constructor(id?: string) {
    this.id = id || `mock-peer-${Math.random().toString(36).substr(2, 9)}`;

    setTimeout(() => {
      this.open = true;
      this.emit('open', this.id);
    }, 0);
  }

  on(event: string, handler: EventHandler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)?.push(handler);
    return this;
  }

  off(event: string, handler?: EventHandler) {
    if (handler) {
      const handlers = this.eventHandlers.get(event) || [];
      const index = handlers.indexOf(handler);
      if (index > -1) handlers.splice(index, 1);
    } else {
      this.eventHandlers.delete(event);
    }
    return this;
  }

  call(
    peerId: string,
    _stream: MediaStream,
    metadata?: Record<string, unknown>
  ): MockMediaConnection {
    const connection = new MockMediaConnection(peerId, metadata);

    if (!this.connections.has(peerId)) {
      this.connections.set(peerId, []);
    }
    this.connections.get(peerId)?.push(connection);

    setTimeout(() => {
      connection.open = true;
      connection.emit('stream', createMockMediaStream());
    }, 10);

    return connection;
  }

  connect(peerId: string): MockDataConnection {
    const connection = new MockDataConnection(peerId);

    setTimeout(() => {
      connection.open = true;
      connection.emit('open');
    }, 10);

    return connection;
  }

  disconnect() {
    this.disconnected = true;
    this.open = false;
    this.emit('disconnected', this.id);
  }

  destroy() {
    this.destroyed = true;
    this.open = false;
    this.emit('close');
  }

  reconnect() {
    if (this.destroyed) {
      throw new Error('Cannot reconnect destroyed peer');
    }
    this.disconnected = false;
    this.open = true;
    this.emit('open', this.id);
  }

  emit(event: string, ...args: unknown[]) {
    const handlers = this.eventHandlers.get(event) || [];
    handlers.forEach((handler) => handler(...args));
  }
}

export function createMockMediaStream(options = { audio: true, video: true }): MediaStream {
  const tracks: MediaStreamTrack[] = [];

  if (options.audio) {
    tracks.push(createMockMediaStreamTrack('audio'));
  }

  if (options.video) {
    tracks.push(createMockMediaStreamTrack('video'));
  }

  const stream = {
    id: `stream-${Math.random().toString(36).substr(2, 9)}`,
    active: true,
    getTracks: vi.fn(() => tracks),
    getAudioTracks: vi.fn(() => tracks.filter((t) => t.kind === 'audio')),
    getVideoTracks: vi.fn(() => tracks.filter((t) => t.kind === 'video')),
    getTrackById: vi.fn((id: string) => tracks.find((t) => t.id === id)),
    addTrack: vi.fn((track: MediaStreamTrack) => tracks.push(track)),
    removeTrack: vi.fn((track: MediaStreamTrack) => {
      const index = tracks.indexOf(track);
      if (index > -1) tracks.splice(index, 1);
    }),
    clone: vi.fn(() => createMockMediaStream(options)),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(() => true),
  } as unknown as MediaStream;

  return stream;
}

export function createMockMediaStreamTrack(kind: 'audio' | 'video'): MediaStreamTrack {
  const track = {
    id: `track-${kind}-${Math.random().toString(36).substr(2, 9)}`,
    kind,
    label: `Mock ${kind} track`,
    enabled: true,
    muted: false,
    readyState: 'live' as MediaStreamTrackState,
    stop: vi.fn(function (this: { readyState: string }) {
      this.readyState = 'ended';
    }),
    clone: vi.fn(() => createMockMediaStreamTrack(kind)),
    getSettings: vi.fn(() => ({
      deviceId: 'mock-device',
      groupId: 'mock-group',
      ...(kind === 'video' && { width: 1280, height: 720, frameRate: 30 }),
      ...(kind === 'audio' && { sampleRate: 48000, channelCount: 2 }),
    })),
    getCapabilities: vi.fn(() => ({})),
    getConstraints: vi.fn(() => ({})),
    applyConstraints: vi.fn().mockResolvedValue(undefined),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(() => true),
  } as unknown as MediaStreamTrack;

  return track;
}

export default MockPeer;
