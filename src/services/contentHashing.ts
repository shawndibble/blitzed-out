import { CustomGroupPull } from '@/types/customGroups';
import { CustomTile } from '@/types/customTiles';

/**
 * Normalizes content for consistent hashing
 * Removes whitespace variations and ensures consistent ordering
 */
function normalizeForHashing(item: any): string {
  // Create a deep copy to avoid modifying original
  const normalized = JSON.parse(JSON.stringify(item));

  // Sort object keys recursively for consistent ordering
  const sortKeys = (obj: any): any => {
    if (Array.isArray(obj)) {
      return obj.map(sortKeys);
    } else if (obj !== null && typeof obj === 'object') {
      const sorted: any = {};
      Object.keys(obj)
        .sort()
        .forEach((key) => {
          sorted[key] = sortKeys(obj[key]);
        });
      return sorted;
    }
    return obj;
  };

  return JSON.stringify(sortKeys(normalized));
}

/**
 * Generates SHA-256 hash using Web Crypto API
 */
async function generateSHA256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return `sha256-${hashHex}`;
}

/**
 * Generates content hash for a custom group
 */
export async function generateGroupContentHash(group: Partial<CustomGroupPull>): Promise<string> {
  const normalizedIntensities = (group.intensities || [])
    .map((i) => ({
      value: i.value,
      label: i.label,
    }))
    .sort((a, b) => a.value - b.value); // Sort by value for consistency

  const hashInput = {
    name: group.name,
    gameMode: group.gameMode,
    type: group.type,
    intensities: normalizedIntensities,
  };

  const normalizedInput = normalizeForHashing(hashInput);
  return await generateSHA256(normalizedInput);
}

/**
 * Generates content hash for a custom tile
 */
export async function generateTileContentHash(
  tile: Partial<CustomTile>,
  groupName: string
): Promise<string> {
  const normalizedTags = (tile.tags || []).sort(); // Sort tags for consistency

  const hashInput = {
    action: tile.action,
    groupName,
    intensity: tile.intensity,
    gameMode: 'online', // Default since tiles don't store gameMode directly
    tags: normalizedTags,
  };

  const normalizedInput = normalizeForHashing(hashInput);
  return await generateSHA256(normalizedInput);
}

/**
 * Generates content hash for a disabled default tile
 */
export async function generateDisabledDefaultContentHash(
  action: string,
  groupName: string,
  intensity: number,
  gameMode: string
): Promise<string> {
  const hashInput = {
    action,
    groupName,
    intensity,
    gameMode,
  };

  const normalizedInput = normalizeForHashing(hashInput);
  return await generateSHA256(normalizedInput);
}

/**
 * Validates if a content hash matches the item's current content
 */
export async function validateContentHash(
  item: any,
  expectedHash: string,
  type: 'group' | 'tile' | 'disabled'
): Promise<boolean> {
  let actualHash: string;

  switch (type) {
    case 'group':
      actualHash = await generateGroupContentHash(item);
      break;
    case 'tile':
      // For tiles, we need the group name - this should be provided in the validation context
      if (!item.groupName) {
        console.warn('Missing groupName for tile hash validation');
        return false;
      }
      actualHash = await generateTileContentHash(item, item.groupName);
      break;
    case 'disabled':
      actualHash = await generateDisabledDefaultContentHash(
        item.action,
        item.groupName,
        item.intensity,
        item.gameMode
      );
      break;
    default:
      return false;
  }

  return actualHash === expectedHash;
}

/**
 * Generates a content hash for any item type
 */
export async function generateContentHash(
  item: any,
  type: 'group' | 'tile' | 'disabled',
  groupName?: string
): Promise<string> {
  switch (type) {
    case 'group':
      return await generateGroupContentHash(item);
    case 'tile':
      if (!groupName) {
        throw new Error('groupName is required for tile content hashing');
      }
      return await generateTileContentHash(item, groupName);
    case 'disabled':
      return await generateDisabledDefaultContentHash(
        item.action,
        item.groupName || groupName,
        item.intensity,
        item.gameMode
      );
    default:
      throw new Error(`Unknown item type: ${type}`);
  }
}
