import { isPublicRoom } from '@/helpers/strings';
import { getURLPath } from '@/helpers/urls';
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
  return (
    urlContainsAny(url, ['media.discordapp.net', 'cdn.discordapp.com']) && !isDirectVideoUrl(url)
  );
}

function urlContainsAny(url: string, domains: string[]): boolean {
  try {
    const parsed = new URL(url);
    return domains.some((domain) => parsed.host === domain || parsed.host.endsWith('.' + domain));
  } catch (error) {
    // If URL parsing fails, use substring check as fallback (less secure but functional)
    logger.debug('URL parsing failed in urlContainsAny, using fallback:', error);
    return domains.some((domain) => url.includes(domain));
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
    case url.includes('vimeo.com'):
      embedUrl = vimeo(url);
      break;
    case urlContainsAny(url, ['youtube.com', 'youtu.be']):
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
    case urlContainsAny(url, ['imgur.com', 'i.imgur.com']):
      embedUrl = imgur(url);
      break;
    case urlContainsAny(url, ['thisvid.com', 'boyfriendtv.com']):
      embedUrl = url;
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
