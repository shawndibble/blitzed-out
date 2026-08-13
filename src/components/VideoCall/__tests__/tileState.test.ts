import { describe, expect, test } from 'vitest';
import { resolveTileState, showsVideo, tileStateLabelKey } from '../tileState';

const connected = { connectionState: 'connected' as const };

describe('resolveTileState', () => {
  test('shows video when the camera is published and frames are arriving', () => {
    expect(
      resolveTileState({ hasVideoTrack: true, media: { cam: 'on', mic: 'on' }, ...connected })
    ).toBe('video');
  });

  test('separates camera-off-with-mic from camera-off-and-muted', () => {
    expect(
      resolveTileState({ hasVideoTrack: false, media: { cam: 'off', mic: 'on' }, ...connected })
    ).toBe('audioOnly');
    expect(
      resolveTileState({ hasVideoTrack: false, media: { cam: 'off', mic: 'off' }, ...connected })
    ).toBe('viewingOnly');
  });

  test('distinguishes having no camera from switching one off', () => {
    expect(
      resolveTileState({ hasVideoTrack: false, media: { cam: 'none', mic: 'on' }, ...connected })
    ).toBe('noCamera');
  });

  test('reports a backgrounded peer as away rather than camera-off', () => {
    expect(
      resolveTileState({ hasVideoTrack: true, media: { cam: 'hidden', mic: 'on' }, ...connected })
    ).toBe('away');
  });

  test('treats a published camera with no frames as still connecting', () => {
    expect(
      resolveTileState({ hasVideoTrack: false, media: { cam: 'on', mic: 'on' }, ...connected })
    ).toBe('connecting');
  });

  test('says nothing it cannot substantiate about an older client', () => {
    expect(resolveTileState({ hasVideoTrack: true, media: {}, ...connected })).toBe('video');
    expect(resolveTileState({ hasVideoTrack: false, media: {}, ...connected })).toBe('unknown');
    expect(tileStateLabelKey('unknown')).toBeNull();
  });

  test('is connecting while no peer has been dialled', () => {
    expect(resolveTileState({ hasVideoTrack: false, media: { cam: 'on' } })).toBe('connecting');
    expect(
      resolveTileState({
        hasVideoTrack: false,
        media: { cam: 'on' },
        connectionState: 'connecting',
      })
    ).toBe('connecting');
  });

  test('transport trouble outranks whatever the roster last said', () => {
    const camOff = { hasVideoTrack: false, media: { cam: 'off' as const, mic: 'on' as const } };

    expect(resolveTileState({ ...camOff, ...connected, reconnecting: true })).toBe('reconnecting');
    expect(resolveTileState({ ...camOff, connectionState: 'failed' })).toBe('failed');
    expect(resolveTileState({ ...camOff, retriesExhausted: true })).toBe('failed');
  });

  test('our own tile never reports a connection state', () => {
    // There is no peer connection to ourselves; without this the local tile would
    // sit at "connecting" for the whole call.
    expect(
      resolveTileState({ hasVideoTrack: true, media: { cam: 'on', mic: 'on' }, isLocal: true })
    ).toBe('video');
    expect(
      resolveTileState({ hasVideoTrack: false, media: { cam: 'off', mic: 'off' }, isLocal: true })
    ).toBe('viewingOnly');
  });
});

describe('showsVideo', () => {
  test('only the video state renders a video tile', () => {
    expect(showsVideo('video')).toBe(true);
    (
      [
        'connecting',
        'reconnecting',
        'failed',
        'audioOnly',
        'viewingOnly',
        'noCamera',
        'away',
      ] as const
    ).forEach((state) => expect(showsVideo(state)).toBe(false));
  });
});
