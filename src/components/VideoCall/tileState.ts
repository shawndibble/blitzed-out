import type { MediaState } from '@/types/videoCall';

/** The id our own tile is keyed by. Never a real user id. */
export const LOCAL_PARTICIPANT_ID = 'local';

/**
 * What a participant's tile should say about them.
 *
 * One state per thing a viewer can do something about. `connecting`/`reconnecting`/
 * `failed` must stay distinguishable from the camera states: rendered alike, "they
 * turned their camera off" and "the connection never came up" look identical.
 */
export type TileState =
  /** Publishing video, and it is arriving. */
  | 'video'
  /** Dialling, or connected but the first frames have not landed yet. */
  | 'connecting'
  /** Was connected; the link has been down long enough to be worth saying so. */
  | 'reconnecting'
  /** Out of retries. Needs a deliberate nudge to try again. */
  | 'failed'
  /** Camera deliberately off, microphone live. */
  | 'audioOnly'
  /** Camera and microphone both off — present, contributing nothing. */
  | 'viewingOnly'
  /** No camera to publish — no device, or permission refused. */
  | 'noCamera'
  /** Their page is backgrounded. */
  | 'away'
  /** An older client that publishes no media state. Say nothing rather than guess. */
  | 'unknown';

export interface TileInputs {
  /** Whether a video track is actually attached to this participant's stream. */
  hasVideoTrack: boolean;
  /** What they say they are publishing. Absent fields mean unknown, not off. */
  media: MediaState;
  /** The peer connection's state, or undefined when nobody has dialled them yet. */
  connectionState?: RTCPeerConnectionState;
  /** `disconnected` outlived the grace period, i.e. worth mentioning. */
  reconnecting?: boolean;
  /** Torn down mid-backoff, awaiting a redial. Not a first connection. */
  awaitingRetry?: boolean;
  /** Retry budget spent, so nothing will dial them again unprompted. */
  retriesExhausted?: boolean;
  /** Our own tile has no connection to report on. */
  isLocal?: boolean;
}

/**
 * Resolve a participant to a single tile state.
 *
 * Transport trouble outranks media state throughout: someone whose connection is
 * down is not "camera off", however their last roster write described them.
 */
export function resolveTileState({
  hasVideoTrack,
  media,
  connectionState,
  reconnecting,
  awaitingRetry,
  retriesExhausted,
  isLocal = false,
}: TileInputs): TileState {
  if (!isLocal) {
    if (retriesExhausted) return 'failed';
    if (connectionState === 'failed') return 'failed';
    if (reconnecting || awaitingRetry) return 'reconnecting';
    if (!connectionState || connectionState === 'new' || connectionState === 'connecting') {
      return 'connecting';
    }
  }

  switch (media.cam) {
    case 'none':
      return 'noCamera';
    case 'hidden':
      return 'away';
    case 'off':
      return media.mic === 'off' ? 'viewingOnly' : 'audioOnly';
    case 'on':
      // They say the camera is on but nothing has arrived — still coming up, or a
      // transport that is nominally connected and carrying nothing.
      return hasVideoTrack ? 'video' : 'connecting';
    default:
      // No published state at all. Trust what is actually rendering and describe
      // nothing we cannot substantiate.
      return hasVideoTrack ? 'video' : 'unknown';
  }
}

/** The label for a collapsed tile. `null` means there is nothing honest to say. */
const TILE_STATE_LABELS: Record<TileState, string | null> = {
  video: null,
  unknown: null,
  audioOnly: 'videoCall.state.audioOnly',
  viewingOnly: 'videoCall.state.viewingOnly',
  noCamera: 'videoCall.state.noCamera',
  away: 'videoCall.state.away',
  connecting: 'videoCall.state.connecting',
  reconnecting: 'videoCall.state.reconnecting',
  failed: 'videoCall.state.disconnected',
};

/** Whether a state renders as a full video tile rather than a collapsed row. */
export function showsVideo(state: TileState): boolean {
  return state === 'video';
}

export function tileStateLabelKey(state: TileState): string | null {
  return TILE_STATE_LABELS[state];
}
