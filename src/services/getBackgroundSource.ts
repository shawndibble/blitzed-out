import { getURLPath } from '@/helpers/urls';
import { isPublicRoom } from '@/helpers/strings';
import { logger } from '@/utils/logger';

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

  return `https://www.youtube.com/embed/${videoId}?autoplay=1&loop=1&autostart=true&mute=1&playsinline=1&controls=0&disablekb=1&fs=0&modestbranding=1&rel=0&iv_load_policy=3`;
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

  return `https://pornhub.com/embed/${viewKey}?autoplay=1&loop=1&autostart=true&playsinline=1`;
}

function xhamster(url: string): string {
  const urlParts = url.split('-');
  const key = urlParts[urlParts.length - 1];

  return `https://xhamster.com/xembed.php?video=${key}?autoplay=1&loop=1&autostart=true&playsinline=1`;
}

function tenor(url: string): string {
  // Handle direct media URLs: https://media.tenor.com/{id}/{filename}.mp4
  const directMediaRegex = /media\.tenor\.com\/([a-zA-Z0-9_-]+)\/[^/]*\.(mp4|gif|webp)/;
  const directMatch = url.match(directMediaRegex);

  if (directMatch) {
    // Return the direct media URL as-is for direct video playback
    return url;
  }

  // Handle view URLs: https://tenor.com/view/{title}-{id}
  const viewRegex = /tenor\.com\/view\/[^/]*-(\d+)/;
  const viewMatch = url.match(viewRegex);
  const gifId = viewMatch ? viewMatch[1] : '';

  // Use Tenor's embed format with autoplay for view URLs
  return `https://tenor.com/embed/${gifId}?autoplay=1`;
}

function giphy(url: string): string {
  const giphyRegex = /giphy\.com\/gifs\/[^/]*-([a-zA-Z0-9]+)/;
  const match = url.match(giphyRegex);
  const gifId = match ? match[1] : '';

  // For Cast compatibility, try direct media URL first, fallback to embed
  // Giphy direct media format: https://media.giphy.com/media/{id}/giphy.gif
  return `https://media.giphy.com/media/${gifId}/giphy.gif`;
}

function gfycat(url: string): string {
  // Handle both gfycat.com and redgifs.com
  const gfycatRegex = /(?:gfycat\.com|redgifs\.com)\/(?:watch\/)?([a-zA-Z0-9]+)/;
  const match = url.match(gfycatRegex);
  const gifId = match ? match[1] : '';

  // For Cast compatibility, try direct video URLs
  if (isValidHost(url, ['redgifs.com'])) {
    // RedGifs direct video format
    return `https://files.redgifs.com/${gifId}.mp4`;
  }
  // Gfycat direct video format
  return `https://giant.gfycat.com/${gifId}.mp4`;
}

function redtube(url: string): string {
  const redtubeRegex = /redtube\.com\/(\d+)/;
  const match = url.match(redtubeRegex);
  const videoId = match ? match[1] : '';
  return `https://embed.redtube.com/?id=${videoId}&autoplay=true&auto_play=1&playsinline=1&controls=1`;
}

function youporn(url: string): string {
  const youpornRegex = /youporn\.com\/watch\/(\d+)/;
  const match = url.match(youpornRegex);
  const videoId = match ? match[1] : '';

  return `https://www.youporn.com/embed/${videoId}?autoplay=1&playsinline=1`;
}

function tube8(url: string): string {
  const tube8Regex = /tube8\.com\/[^/]+\/[^/]+\/(\d+)/;
  const match = url.match(tube8Regex);
  const videoId = match ? match[1] : '';

  return `https://www.tube8.com/embed/${videoId}?autoplay=1&playsinline=1`;
}

function twitter(url: string): string {
  // Twitter/X video URLs - use oEmbed approach or direct embed
  // For now, return the original URL as Twitter handles embedding
  return url;
}

function thisvid(url: string): string {
  // Thisvid URLs don't have extractable IDs in a predictable format
  // Return the original URL as-is since the site handles its own embedding
  return url;
}

function boyfriendtv(url: string): string {
  // BoyfriendTV URLs don't have extractable IDs in a predictable format
  // Return the original URL as-is since the site handles its own embedding
  return url;
}

function imgur(url: string): string {
  // For Discord proxy URLs that contain Imgur links, just return the URL directly
  try {
    const parsed = new URL(url);
    // Check if this is a legitimate Discord external proxy URL for Imgur
    // Discord external URLs follow the pattern: /external/{hash}/https/i.imgur.com/{id}.{ext}
    if (
      (parsed.host === 'discordapp.net' || parsed.host.endsWith('.discordapp.net')) &&
      parsed.pathname.startsWith('/external/') &&
      (parsed.pathname.includes('/https/i.imgur.com/') ||
        parsed.pathname.includes('/https/imgur.com/'))
    ) {
      return url;
    }
  } catch (error) {
    // If URL parsing fails, skip Discord proxy check for security
    logger.debug('URL parsing failed for Discord proxy check:', error);
  }

  // Extract the Imgur ID from different possible URL formats
  let imgurId = '';

  // Validate that this is actually an Imgur URL for security
  let isImgur = false;
  try {
    const parsed = new URL(url);
    isImgur = parsed.host === 'imgur.com' || parsed.host === 'i.imgur.com';
  } catch (error) {
    // If URL parsing fails, skip processing for security
    logger.debug('URL parsing failed for Imgur processing:', error);
    return '';
  }

  if (!isImgur) {
    // Not a valid Imgur URL, return empty string
    return '';
  }

  // Handle gallery URLs like: https://imgur.com/gallery/title-3YkU9Yc#6fDSu6z
  if (url.includes('/gallery/')) {
    const galleryMatch = url.match(/imgur\.com\/gallery\/[^#]*#([a-zA-Z0-9]+)/);
    if (galleryMatch) {
      imgurId = galleryMatch[1];
    } else {
      // Fallback: try to extract from the URL fragment or path
      const fragmentMatch = url.match(/#([a-zA-Z0-9]+)/);
      if (fragmentMatch) {
        imgurId = fragmentMatch[1];
      }
    }
  } else {
    // Handle regular URLs
    const imgurRegex =
      /imgur\.com\/([a-zA-Z0-9]+)(?:\.(mp4|jpg|jpeg|png|gif|webp))?|images-ext-\d+\.discordapp\.net\/external\/[^/]+\/https\/i\.imgur\.com\/([a-zA-Z0-9]+)\.(mp4|jpg|jpeg|png|gif|webp)/;
    const match = url.match(imgurRegex);
    imgurId = match ? match[1] || match[3] : '';
  }

  // Try video first, fallback to common image formats
  // We'll return the .mp4 URL and let the component handle if it fails to load
  const finalUrl = `https://i.imgur.com/${imgurId}.mp4`;

  // Return direct link - start with MP4, component will handle fallback
  return finalUrl;
}

function isDirectVideoUrl(url: string): boolean {
  return /\.(mp4|webm|ogg|mov)(\?.*)?$/.test(url);
}

function isDiscordMediaUrl(url: string): boolean {
  return isValidHost(url, ['media.discordapp.net', 'cdn.discordapp.com']) && !isDirectVideoUrl(url);
}

function isValidHost(url: string, allowedHosts: string[]): boolean {
  try {
    const parsed = new URL(url);
    return allowedHosts.some((host) => parsed.host === host || parsed.host.endsWith('.' + host));
  } catch (error) {
    // If URL parsing fails, reject for security
    logger.debug('URL parsing failed in isValidHost, rejecting for security:', error);
    return false;
  }
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

  switch (true) {
    case isValidHost(url, ['vimeo.com']):
      embedUrl = vimeo(url);
      break;
    case isValidHost(url, ['youtube.com', 'youtu.be']):
      embedUrl = youtube(url);
      break;
    case isValidHost(url, ['drive.google.com']):
      embedUrl = googleDrive(url);
      break;
    case isValidHost(url, ['pornhub.com']):
      embedUrl = pornhub(url);
      break;
    case isValidHost(url, ['xhamster.com']):
      embedUrl = xhamster(url);
      break;
    case isValidHost(url, ['dropbox.com']):
      embedUrl = dropBox(url);
      break;
    case isValidHost(url, ['imgur.com', 'i.imgur.com']):
      embedUrl = imgur(url);
      break;
    case isValidHost(url, ['tenor.com', 'media.tenor.com']):
      embedUrl = tenor(url);
      isVideo = true;
      break;
    case isValidHost(url, ['giphy.com']):
      embedUrl = giphy(url);
      isVideo = true;
      break;
    case isValidHost(url, ['gfycat.com', 'redgifs.com']):
      embedUrl = gfycat(url);
      isVideo = true;
      break;
    case isValidHost(url, ['redtube.com']):
      embedUrl = redtube(url);
      break;
    case isValidHost(url, ['youporn.com']):
      embedUrl = youporn(url);
      break;
    case isValidHost(url, ['tube8.com']):
      embedUrl = tube8(url);
      break;
    case isValidHost(url, ['twitter.com', 'x.com']):
      embedUrl = twitter(url);
      isVideo = false;
      break;
    case isValidHost(url, ['thisvid.com']):
      embedUrl = thisvid(url);
      break;
    case isValidHost(url, ['boyfriendtv.com']):
      embedUrl = boyfriendtv(url);
      break;
    case isDiscordMediaUrl(url):
      embedUrl = url;
      isVideo = false;
      break;
    case isDirectVideoUrl(url):
      embedUrl = url;
      break;
    default:
      embedUrl = getURLPath(url);
      isVideo = false;
      break;
  }

  return {
    url: embedUrl,
    isVideo,
  };
}

interface BackgroundSettings {
  background?: string;
  backgroundURL?: string;
  roomBackground?: string;
  roomBackgroundURL?: string;
}

export default function getBackgroundSource(
  settings: BackgroundSettings,
  room: string
): BackgroundResult {
  const { background, backgroundURL, roomBackground, roomBackgroundURL } = settings;

  // Helper function to resolve a background value to its actual source
  const resolveBackgroundSource = (bgValue: string | undefined, isRoom: boolean): string | null => {
    if (!bgValue) return null;

    if (bgValue === 'custom') {
      return isRoom ? roomBackgroundURL || null : backgroundURL || null;
    }

    if (bgValue === 'useAppBackground') {
      // Room trying to use app background - resolve app background (prevent circular reference)
      const appBg = background || 'color';
      if (appBg === 'useRoomBackground') {
        // Circular reference - fallback to default
        return 'color';
      }
      return appBg === 'custom' ? backgroundURL || null : appBg;
    }

    if (bgValue === 'useRoomBackground') {
      // App trying to use room background - only valid in private rooms
      if (isPublicRoom(room)) {
        return 'color'; // Fallback for public rooms
      }
      const roomBg = roomBackground || 'useAppBackground';
      if (roomBg === 'useAppBackground') {
        // Circular reference - fallback to default
        return 'color';
      }
      return roomBg === 'custom' ? roomBackgroundURL || null : roomBg;
    }

    // Regular background value (color, gray, metronome.gif, etc.)
    return bgValue;
  };

  // Determine final background based on context and precedence
  let finalBackground: string | null = null;

  if (!isPublicRoom(room) && roomBackground && roomBackground !== 'useAppBackground') {
    // Private room with specific room background preference
    finalBackground = resolveBackgroundSource(roomBackground, true);
  } else if (background) {
    // Use app background (either public room or private room falling back to app)
    finalBackground = resolveBackgroundSource(background, false);
  } else {
    // No preferences set, use default
    finalBackground = 'color';
  }

  if (!finalBackground) return { url: null, isVideo: false };

  // Handle built-in background types without processing
  if (finalBackground === 'color' || finalBackground === 'gray') {
    const result = { url: finalBackground, isVideo: false };
    return result;
  }

  const result = processBackground(finalBackground);

  return result;
}
