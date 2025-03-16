import latestMessageByType from '@/helpers/messages';
import { processBackground } from '@/services/getBackgroundSource';

interface Message {
  settings: string;
  [key: string]: any;
}

interface BackgroundSource {
  isVideo?: boolean;
  url?: string;
}

export default function usePrivateRoomBackground(messages: Message[]): { isVideo: boolean; url: string } {
  const roomMessage = latestMessageByType(messages, 'room') as Message | undefined;
  let isVideo = false;
  let url = '';
  
  if (roomMessage) {
    const { roomBackgroundURL } = JSON.parse(roomMessage.settings);
    const backgroundSource = processBackground(roomBackgroundURL) as BackgroundSource;
    if (backgroundSource?.isVideo) isVideo = backgroundSource.isVideo;
    if (backgroundSource?.url) url = backgroundSource.url;
  }

  if (['color', 'gray'].some((color) => url.includes(color))) url = '';

  return { isVideo, url };
}
