import { vi } from 'vitest';
import { createMockMediaStream } from './peerjs';

export const mockGetUserMedia = vi.fn((constraints: MediaStreamConstraints) => {
  return Promise.resolve(
    createMockMediaStream({
      audio: !!constraints.audio,
      video: !!constraints.video,
    })
  );
});

export const mockEnumerateDevices = vi.fn(() => {
  return Promise.resolve([
    {
      deviceId: 'default-audio',
      groupId: 'default-group',
      kind: 'audioinput' as MediaDeviceKind,
      label: 'Default Audio Input',
      toJSON: () => ({}),
    },
    {
      deviceId: 'default-video',
      groupId: 'default-group',
      kind: 'videoinput' as MediaDeviceKind,
      label: 'Default Video Input',
      toJSON: () => ({}),
    },
    {
      deviceId: 'default-audio-output',
      groupId: 'default-group',
      kind: 'audiooutput' as MediaDeviceKind,
      label: 'Default Audio Output',
      toJSON: () => ({}),
    },
  ]);
});

export function setupMediaDevicesMocks() {
  Object.defineProperty(navigator, 'mediaDevices', {
    writable: true,
    configurable: true,
    value: {
      getUserMedia: mockGetUserMedia,
      enumerateDevices: mockEnumerateDevices,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(() => true),
    },
  });
}

export function resetMediaDevicesMocks() {
  mockGetUserMedia.mockClear();
  mockEnumerateDevices.mockClear();
}

export function mockGetUserMediaError(error: DOMException) {
  mockGetUserMedia.mockRejectedValueOnce(error);
}

export function createNotAllowedError(): DOMException {
  return new DOMException('Permission denied', 'NotAllowedError');
}

export function createNotFoundError(): DOMException {
  return new DOMException('Requested device not found', 'NotFoundError');
}

export function createNotReadableError(): DOMException {
  return new DOMException('Could not start video source', 'NotReadableError');
}

export function createOverconstrainedError(): DOMException {
  return new DOMException('Constraints could not be satisfied', 'OverconstrainedError');
}
