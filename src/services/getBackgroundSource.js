import { getURLPath } from 'helpers/strings';

function vimeo(url) {
  const vimeoRegex = /vimeo\.com\/(\d+)/;
  const videoId = url.match(vimeoRegex)[1];

  return `https://player.vimeo.com/video/${videoId}?autoplay=1&loop=1&autostart=true`;
}

function youtube(url) {
  const youtubeRegex =
    /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|[^#]*[?&]v=|youtu\.be\/)([^"&?/ ]{11})|^(?:[^"&?/ ]{11})$)/;
  const videoId = url.match(youtubeRegex)[1];

  return `https://www.youtube.com/embed/${videoId}?autoplay=1&loop=1&autostart=true`;
}

function googleDrive(url) {
  const driveRegex = /drive\.google\.com\/file\/d\/([^/]+)/;
  const fileId = url.match(driveRegex)[1];

  return `https://drive.google.com/file/d/${fileId}/preview?loop=1`;
}

function dropBox(url) {
  const dropBoxRegex = /dropbox\.com\/s\/([^/]+)/;
  const fileId = url.match(dropBoxRegex)[1];

  return `https://www.dropbox.com/s/${fileId}?raw=1`;
}

function pornhub(url) {
  const params = new URL(url);
  const viewKey = params.searchParams.get('viewkey');

  return `https://pornhub.com/embed/${viewKey}?autoplay=1&loop=1&autostart=true`;
}

function xhamster(url) {
  const urlParts = url.split('-');
  const key = urlParts[urlParts.length - 1];

  return `https://xhamster.com/xembed.php?video=${key}?autoplay=1&loop=1&autostart=true`;
}

export function processBackground(url) {
  let embedUrl;
  let isVideo = true;

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

export default function getBackgroundSource(settings, room, roomBackgroundUrl) {
  const { background, backgroundURL, roomBackground } = settings;
  const backgroundSource = background !== 'custom' ? background : backgroundURL;
  const roomBackgroundSource =
    roomBackground === 'app' ? roomBackground : roomBackgroundUrl;

  const bgSource =
    room.toUpperCase() !== 'PUBLIC' && roomBackground !== 'app'
      ? roomBackgroundSource
      : backgroundSource;

  if (!bgSource) return { url: null, isVideo: false };
  return processBackground(bgSource);
}
