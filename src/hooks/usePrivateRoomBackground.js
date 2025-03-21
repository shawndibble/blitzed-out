import latestMessageByType from '@/helpers/messages';
import { processBackground } from '@/services/getBackgroundSource';

export default function usePrivateRoomBackground(messages) {
  const roomMessage = latestMessageByType(messages, 'room');
  let isVideo = false;
  let url = '';
  if (roomMessage) {
    const { roomBackgroundURL } = JSON.parse(roomMessage.settings);
    const backgroundSource = processBackground(roomBackgroundURL);
    if (backgroundSource?.isVideo) isVideo = backgroundSource.isVideo;
    if (backgroundSource?.url) url = backgroundSource.url;
  }

  if (['color', 'gray'].some((color) => url.includes(color))) url = '';

  return { isVideo, url };
}
