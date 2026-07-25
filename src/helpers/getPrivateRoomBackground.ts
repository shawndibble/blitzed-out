import { Message, RoomMessage } from '@/types/Message';

import { latestMessageByType } from '@/helpers/messages';
import { processBackground } from '@/services/getBackgroundSource';

type ParsedRoom = {
  roomBackground?: string;
  roomBackgroundURL?: string;
};

interface BackgroundResult {
  isVideo: boolean;
  url: string;
}

export default function getPrivateRoomBackground(messages: Message[]): BackgroundResult {
  const roomMessage = latestMessageByType(messages, 'room') as RoomMessage | undefined;
  let isVideo = false;
  let url = '';

  if (roomMessage) {
    let roomBackground: string | undefined;
    let roomBackgroundURL: string | undefined;
    try {
      const parsed = JSON.parse(roomMessage.settings || '{}') as ParsedRoom;
      roomBackground = parsed.roomBackground;
      roomBackgroundURL = parsed.roomBackgroundURL;
    } catch {
      // ignore invalid JSON and fall back to empty defaults
    }

    // Prefer explicit roomBackground value. If custom, use URL; otherwise use the preset name.
    let backgroundInput: string | null = null;
    if (roomBackground === 'custom' && roomBackgroundURL) {
      backgroundInput = roomBackgroundURL;
    } else if (roomBackground) {
      backgroundInput = roomBackground;
    } else if (roomBackgroundURL) {
      // Backward compatibility: fall back to URL if set
      backgroundInput = roomBackgroundURL;
    }

    // Built-in theme sentinels never carry real media and must not reach
    // processBackground: its default case runs them through getURLPath,
    // which would turn 'color' into the real (404) path '/images/color'.
    // Short-circuiting here — before any URL processing — is also what
    // keeps this check an exact match instead of a substring test that
    // would blank real URLs containing the words "color"/"gray".
    if (backgroundInput === 'color' || backgroundInput === 'gray') {
      return { isVideo: false, url: '' };
    }

    const backgroundSource = processBackground(backgroundInput);
    isVideo = !!backgroundSource.isVideo;
    if (backgroundSource.url) url = backgroundSource.url;
  }

  return { isVideo, url };
}
