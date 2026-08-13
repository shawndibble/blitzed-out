/**
 * What a participant is publishing, as it travels between clients.
 *
 * This has to be signalled rather than read off the received tracks. Disabling a
 * track is a sender-local flag: per the WebRTC spec a disabled video track keeps its
 * SSRC alive and sends black frames, so the receiver's copy still reports
 * `enabled === true` and never fires `mute`. Every remote peer would see a black
 * rectangle with no way to tell "camera off" from "connection broken".
 */
export const CAMERA_STATES = [
  /** Publishing video. */
  'on',
  /** Deliberately off — the track is stopped, so the camera light is out. */
  'off',
  /** No camera to publish: permission denied, or no device at all. */
  'none',
  /** Page backgrounded. Frames are suppressed but the device is still held. */
  'hidden',
] as const;

export const MICROPHONE_STATES = ['on', 'off'] as const;

export type CameraState = (typeof CAMERA_STATES)[number];
export type MicrophoneState = (typeof MICROPHONE_STATES)[number];

/**
 * A participant's published media, as read from the signalling roster.
 *
 * Both fields are optional and absent means *unknown*, not off — a peer running an
 * older client publishes neither, and the UI has to say less rather than say
 * something wrong.
 */
export interface MediaState {
  cam?: CameraState;
  mic?: MicrophoneState;
}

/** The flags a client's own published state is derived from. */
export interface LocalMediaFlags {
  /** Whether a camera was ever acquired — "has none" is not "turned off". */
  hasCamera: boolean;
  isVideoOff: boolean;
  isPageHidden: boolean;
  isMuted: boolean;
}

/**
 * Resolve our own flags to what the room is told.
 *
 * Precedence is the point, and it lives here once: having no camera outranks having
 * switched one off, which outranks a backgrounded tab. Duplicating the ladder at
 * each mutation site is how the local tile and the published roster entry end up
 * disagreeing — the exact confusion this state exists to remove.
 */
export function deriveLocalMedia({
  hasCamera,
  isVideoOff,
  isPageHidden,
  isMuted,
}: LocalMediaFlags): MediaState {
  return {
    cam: !hasCamera ? 'none' : isVideoOff ? 'off' : isPageHidden ? 'hidden' : 'on',
    mic: isMuted ? 'off' : 'on',
  };
}

/**
 * Read a roster entry's media flags, discarding anything unrecognised.
 *
 * Roster nodes are written by other clients, so every value here is untrusted input
 * from a peer that may be running a different version of this code.
 */
export function parseMediaState(entry: unknown): MediaState {
  if (!entry || typeof entry !== 'object') return {};

  const { cam, mic } = entry as { cam?: unknown; mic?: unknown };

  return {
    ...(CAMERA_STATES.includes(cam as CameraState) ? { cam: cam as CameraState } : {}),
    ...(MICROPHONE_STATES.includes(mic as MicrophoneState) ? { mic: mic as MicrophoneState } : {}),
  };
}
