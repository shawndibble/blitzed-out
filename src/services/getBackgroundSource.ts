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

function tenor(url: string): { url: string; isVideo: boolean } {
  // Handle direct media URLs: https://media.tenor.com/{id}/filename.{ext} or https://media1.tenor.com/m/{id}/filename.{ext}
  const directMediaRegex =
    /media1?\.tenor\.com\/(?:m\/)?([a-zA-Z0-9_-]+)\/[^/]*\.(mp4|gif|webp|webm)/;
  const directMatch = url.match(directMediaRegex);

  if (directMatch) {
    const extension = directMatch[2].toLowerCase();
    // Return the direct media URL as-is for direct playback
    return {
      url,
      isVideo: ['mp4', 'webm'].includes(extension),
    };
  }

  // Handle view URLs: https://tenor.com/view/{title}-{id}
  const viewRegex = /tenor\.com\/view\/[^/]*-(\d+)/;
  const viewMatch = url.match(viewRegex);

  if (viewMatch) {
    const numericId = viewMatch[1];
    // Use Tenor's embed endpoint which will be handled by iframe
    return {
      url: `https://tenor.com/embed/${numericId}`,
      isVideo: true,
    };
  }

  // If we can't match any pattern, return the original URL
  return {
    url,
    isVideo: false,
  };
}

function giphy(url: string): string {
  const giphyRegex = /giphy\.com\/gifs\/[^/]*-([a-zA-Z0-9]+)/;
  const match = url.match(giphyRegex);
  const gifId = match ? match[1] : '';

  // For Cast compatibility, try direct media URL first, fallback to embed
  // Giphy direct media format: https://media.giphy.com/media/{id}/giphy.gif
  return `https://media.giphy.com/media/${gifId}/giphy.gif`;
}

function tumblr(url: string): string {
  // Handle direct Tumblr media URLs: https://64.media.tumblr.com/...
  // These are already direct media URLs, so return as-is for GIF playback
  const directMediaRegex = /\d+\.media\.tumblr\.com\/.*\.(gif|mp4|webm)(\?.*)?$/i;
  if (directMediaRegex.test(url)) {
    return url;
  }

  // Handle other Tumblr URL patterns if needed in the future
  // For now, just return the URL as-is since most Tumblr media URLs are direct
  return url;
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
  // Twitter/X embed: use twitframe.com to generate an embeddable URL for the tweet
  // This works for most public tweets and does not require API keys
  return `https://twitframe.com/show?url=${encodeURIComponent(url)}`;
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

  // Check if URL is already a direct i.imgur.com link with parameters or extension and return unchanged
  try {
    const parsed = new URL(url);
    if (parsed.host === 'i.imgur.com') {
      // Only return unchanged if it has parameters or a file extension
      if (parsed.search || parsed.pathname.match(/\.[a-zA-Z0-9]+$/)) {
        return url;
      }
      // If it's a bare i.imgur.com URL without extension or parameters, continue processing
    }
  } catch (error) {
    logger.debug('URL parsing failed for direct link check:', error);
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

  // Handle gallery URLs like:
  // https://imgur.com/gallery/title-3YkU9Yc#6fDSu6z (with fragment)
  // https://imgur.com/gallery/fusion-friday-wIJ8AJs (without fragment)
  if (url.includes('/gallery/')) {
    const galleryMatch = url.match(/imgur\.com\/gallery\/[^#]*#([a-zA-Z0-9]+)/);
    if (galleryMatch) {
      // Gallery URL with fragment - use the fragment ID (this is usually a direct image ID)
      imgurId = galleryMatch[1];
    } else {
      // Gallery URL without fragment - these are tricky because the ID in the path
      // is often a gallery ID, not a direct image ID. For galleries, we should
      // return the original URL and let the browser handle it, or try common formats
      const pathMatch = url.match(/imgur\.com\/gallery\/.*-([a-zA-Z0-9]+)/);
      if (pathMatch) {
        // Try the extracted ID but note this might not work for all galleries
        imgurId = pathMatch[1];
      } else {
        // If we can't extract an ID, return the original URL for graceful handling
        logger.debug('Could not extract image ID from gallery URL, returning original:', url);
        return url;
      }
    }
  } else {
    // Handle regular URLs - enhanced regex to be more inclusive
    const imgurRegex =
      /imgur\.com\/([a-zA-Z0-9]+)(?:\.(mp4|mov|avi|webm|mkv|flv|wmv|jpg|jpeg|png|gif|gifv|webp|bmp|tiff|svg))?|images-ext-\d+\.discordapp\.net\/external\/[^/]+\/https\/i\.imgur\.com\/([a-zA-Z0-9]+)\.(mp4|mov|avi|webm|mkv|flv|wmv|jpg|jpeg|png|gif|gifv|webp|bmp|tiff|svg)/;
    const match = url.match(imgurRegex);
    imgurId = match ? match[1] || match[3] : '';
  }

  if (!imgurId) {
    return '';
  }

  // Enhanced extension detection with more inclusive regex
  const extensionMatch = url.match(/\.([a-zA-Z0-9]+)(?:\?.*)?$/);
  let extension = 'jpg'; // Use .jpg as default instead of .gif for better compatibility

  if (extensionMatch && extensionMatch[1]) {
    // Preserve the original extension if it exists
    let originalExtension = extensionMatch[1].toLowerCase();

    // Extension mapping for compatibility - convert .gifv to .mp4
    const extensionMap: { [key: string]: string } = {
      gifv: 'mp4',
    };

    if (extensionMap[originalExtension]) {
      originalExtension = extensionMap[originalExtension];
    }

    // Only use common image/video extensions for security
    if (
      [
        'jpg',
        'jpeg',
        'png',
        'gif',
        'webp',
        'mp4',
        'mov',
        'avi',
        'webm',
        'mkv',
        'flv',
        'wmv',
        'bmp',
        'tiff',
        'svg',
      ].includes(originalExtension)
    ) {
      extension = originalExtension;
    }
  }

  const finalUrl = `https://i.imgur.com/${imgurId}.${extension}`;

  // Return direct link with preserved or converted extension
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
    case isValidHost(url, ['tenor.com']): {
      const tenorResult = tenor(url);
      embedUrl = tenorResult.url;
      isVideo = tenorResult.isVideo;
      break;
    }
    case isValidHost(url, ['giphy.com']):
      embedUrl = giphy(url);
      isVideo = true;
      break;
    case isValidHost(url, ['tumblr.com', 'media.tumblr.com']) ||
      /\d+\.media\.tumblr\.com/.test(url):
      embedUrl = tumblr(url);
      isVideo = embedUrl ? isDirectVideoUrl(embedUrl) : false;
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
  const { background, backgroundURL, roomBackgroundURL } = settings;

  // New simplified background resolution logic:
  // 1. User-set app background (always wins if set)
  // 2. Private room with "Use Room Background" + room has URL → use room URL
  // 3. Private room with "Use Room Background" + no room URL → "color"
  // 4. Public room → "color" (no "Use Room Background" option)
  // 5. No app background set → "color"

  let finalBackground: string | null = null;

  // Priority 1: Check if user has set an app background preference
  if (background) {
    if (background === 'custom') {
      // User wants custom app background
      finalBackground = backgroundURL || null;
    } else if (background === 'useRoomBackground') {
      // User wants to use room background (only valid in private rooms)
      if (!isPublicRoom(room) && roomBackgroundURL) {
        // Private room with room background URL set
        finalBackground = roomBackgroundURL;
      } else {
        // Public room or private room without room background URL
        finalBackground = 'color';
      }
    } else {
      // Built-in app background (color, gray, metronome.gif, etc.)
      finalBackground = background;
    }
  } else {
    // No app background preference set - default to color tiles
    finalBackground = 'color';
  }

  if (!finalBackground) {
    finalBackground = 'color';
  }

  // Handle built-in background types without processing
  if (finalBackground === 'color' || finalBackground === 'gray') {
    const result = { url: finalBackground, isVideo: false };
    return result;
  }

  const result = processBackground(finalBackground);

  return result;
}
