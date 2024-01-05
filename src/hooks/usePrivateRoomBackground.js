import latestMessageByType from 'helpers/messages';
import getBackgroundSource from 'services/getBackgroundSource';

export default function usePrivateRoomBackground(messages, settings, room) {
  const roomMessage = latestMessageByType(messages, 'room');
  let isVideo = false;
  let url = '';
  if (roomMessage) {
    const { roomBackgroundURL } = JSON.parse(roomMessage.settings);
    const backgroundSource = getBackgroundSource(settings, room, roomBackgroundURL);
    isVideo = backgroundSource.isVideo;
    url = backgroundSource.url;
  }
  return { isVideo, url };
}
