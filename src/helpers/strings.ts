import type { ContentGameMode, GameMode } from '@/types/Settings';

export function camelToPascal(text?: string): string {
  const word = text?.replace(/([A-Z])/g, ' $1').trim();
  if (!word) return '';
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export function pascalToCamel(text: string): string {
  return text.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, (match, index) => {
    if (+match === 0) return ''; // or if (/\s+/.test(match)) for white spaces
    return index === 0 ? match.toLowerCase() : match.toUpperCase();
  });
}

export function a11yProps(index: number | string): {
  id: string;
  'aria-controls': string;
} {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

export function extractTime(string: string, timeValue: string): string[] | undefined {
  const reg = new RegExp(`\\d+\\s${timeValue}`, 'g');
  return string.match(reg)?.filter((value, index, array) => array.indexOf(value) === index);
}

export function isPublicRoom(room?: string): boolean {
  return room?.toUpperCase() === 'PUBLIC';
}

export function usesSoloActions(gameMode?: GameMode | string, soloPlay?: boolean): boolean {
  if (gameMode === 'solo') return true;
  if (gameMode === 'online') return soloPlay !== false;
  return false;
}

export function isLocalMode(gameMode?: GameMode | string): boolean {
  return gameMode === 'local';
}

/**
 * Content bundle for a participation style, not just raw topology: "With
 * Others" (online + soloPlay:false) needs the local bundle's foreplay/sex
 * groups, which the online bundle doesn't have (see CONTEXT.md
 * "Participation Style"). Unlike `deriveContentMode` (settingsStore.ts),
 * which maps topology alone, this is the one seam for any content consumer
 * that also cares about soloPlay — don't reconstruct this ternary inline.
 */
export function deriveParticipationContentMode(
  gameMode?: GameMode | string,
  soloPlay?: boolean
): ContentGameMode {
  return usesSoloActions(gameMode, soloPlay) ? 'online' : 'local';
}
