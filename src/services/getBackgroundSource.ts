import { isPublicRoom } from '@/helpers/strings';
import { getURLPath } from '@/helpers/urls';

function vimeo(url: string): string {
  const vimeoRegex = /vimeo\.com\/(\d+)/;
  const match = url.match(vimeoRegex);
  const videoId = match ? match[1] : '';

  return `https://player.vimeo.com/video/${videoId}?autoplay=1&loop=1&autostart=true`;
}

function youtube(url: string): string {
  const youtubeRegex =
    /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|[^#]*[?&]v=|youtu\.be\/)([^"&?/ ]{11})|^(?:[^"&?/ ]{11})$)/;
  const match = url.match(youtubeRegex);
  const videoId = match ? match[1] : '';

  return `https://www.youtube.com/embed/${videoId}?autoplay=1&loop=1&autostart=true`;
}

function googleDrive(url: string): string {
  const driveRegex = /drive\.google\.com\/file\/d\/([^/]+)/;
  const match = url.match(driveRegex);
  const fileId = match ? match[1] : '';

  return `https://drive.google.com/file/d/${fileId}/preview?loop=1`;
}

function dropBox(url: string): string {
  const dropBoxRegex = /dropbox\.com\/s\/([^/]+)/;
  const match = url.match(dropBoxRegex);
  const fileId = match ? match[1] : '';

  return `https://www.dropbox.com/s/${fileId}?raw=1`;
}

function pornhub(url: string): string {
  const params = new URL(url);
  const viewKey = params.searchParams.get('viewkey') || '';

  return `https://pornhub.com/embed/${viewKey}?autoplay=1&loop=1&autostart=true`;
}

function xhamster(url: string): string {
  const urlParts = url.split('-');
  const key = urlParts[urlParts.length - 1];

  return `https://xhamster.com/xembed.php?video=${key}?autoplay=1&loop=1&autostart=true`;
}

interface BackgroundResult {
  url: string | null;
  isVideo: boolean;
}

export function processBackground(url: string | null | undefined): BackgroundResult {
  let embedUrl: string | null = null;
  let isVideo = true;

  if (!url) {
    return { url: '', isVideo: false };
  }

  /* eslint-disable indent */
  switch (true) {
    case url.includes('vimeo.com'):
      embedUrl = vimeo(url);
      break;
    case url.includes('youtube.com'):
    case url.includes('youtu.be'):
      embedUrl = youtube(url);
      break;
    case url.includes('drive.google.com'):
      embedUrl = googleDrive(url);
      break;
    case url.includes('pornhub.com'):
      embedUrl = pornhub(url);
      break;
    case url.includes('xhamster.com'):
      embedUrl = xhamster(url);
      break;
    case url.includes('dropbox.com'):
      embedUrl = dropBox(url);
      break;
    case url.includes('thisvid.com'):
    case url.includes('boyfriendtv.com'):
      embedUrl = url;
      break;
    default:
      embedUrl = getURLPath(url);
      isVideo = false;
      break;
  }
  /* eslint-enable indent */

  return {
    url: embedUrl,
    isVideo,
  };
}

interface BackgroundSettings {
  background?: string;
  backgroundURL?: string;
  roomBackground?: string;
}

export default function getBackgroundSource(
  settings: BackgroundSettings,
  room: string,
  roomBackgroundUrl: string | null | undefined
): BackgroundResult {
  const { background, backgroundURL, roomBackground } = settings;
  const backgroundSource = background !== 'custom' ? background : backgroundURL;
  const roomBackgroundSource = roomBackground === 'app' ? roomBackground : roomBackgroundUrl;

  const bgSource =
    !isPublicRoom(room) && roomBackground !== 'app' ? roomBackgroundSource : backgroundSource;

  if (!bgSource) return { url: null, isVideo: false };
  return processBackground(bgSource);
}
