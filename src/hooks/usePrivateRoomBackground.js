import latestMessageByType from 'helpers/messages';
import { processBackground } from 'services/getBackgroundSource';

export default function usePrivateRoomBackground(messages) {
  const roomMessage = latestMessageByType(messages, 'room');
  let isVideo = false;
  let url = '';
  if (roomMessage) {
    const { roomBackgroundURL } = JSON.parse(roomMessage.settings);
    const backgroundSource = processBackground(roomBackgroundURL);
    isVideo = backgroundSource.isVideo;
    url = backgroundSource.url;
  }
  return { isVideo, url };
}
