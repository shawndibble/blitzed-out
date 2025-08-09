import { Message, RoomMessage } from '@/types/Message';

import latestMessageByType from '@/helpers/messages';
import { processBackground } from '@/services/getBackgroundSource';

interface BackgroundSource {
  isVideo?: boolean;
  url?: string;
}

interface BackgroundResult {
  isVideo: boolean;
  url: string;
}

export default function usePrivateRoomBackground(messages: Message[]): BackgroundResult {
  const roomMessage = latestMessageByType(messages, 'room') as RoomMessage | undefined;
  let isVideo = false;
  let url = '';

  if (roomMessage) {
    const { roomBackground, roomBackgroundURL } = JSON.parse(roomMessage.settings || '{}');

    // Prefer explicit roomBackground value. If custom, use URL; otherwise use the preset name.
    let backgroundInput: string | null = null;
    if (roomBackground === 'custom' && roomBackgroundURL) {
      backgroundInput = roomBackgroundURL as string;
    } else if (roomBackground && roomBackground !== 'useAppBackground') {
      backgroundInput = roomBackground as string;
    } else if (roomBackgroundURL) {
      // Backward compatibility: fall back to URL if set
      backgroundInput = roomBackgroundURL as string;
    }

    const backgroundSource = processBackground(backgroundInput) as BackgroundSource;
    if (backgroundSource?.isVideo) isVideo = backgroundSource.isVideo;
    if (backgroundSource?.url) url = backgroundSource.url;
  }

  if (['color', 'gray'].some((color) => url.includes(color))) url = '';

  return { isVideo, url };
}
