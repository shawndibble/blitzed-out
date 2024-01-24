import latestMessageByType from 'helpers/messages';
import getBackgroundSource, {
  processBackground,
} from 'services/getBackgroundSource';

export default function usePrivateRoomBackground(
  messages,
  settings,
  room,
  isCast = false
) {
  const roomMessage = latestMessageByType(messages, 'room');
  let isVideo = false;
  let url = '';
  if (roomMessage) {
    const { roomBackgroundURL } = JSON.parse(roomMessage.settings);
    const backgroundSource = isCast
      ? processBackground(roomBackgroundURL)
      : getBackgroundSource(settings, room, roomBackgroundURL);
    isVideo = backgroundSource.isVideo;
    url = backgroundSource.url;
  }
  return { isVideo, url };
}
