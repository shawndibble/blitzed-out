import { useTranslation } from 'react-i18next';

// Constants for system message text wrapping thresholds
const CHARACTER_LIMIT = 45;
const WORD_LIMIT = 6;

// Type for the translation function
type TFunction = ReturnType<typeof useTranslation>['t'];

/**
 * Generates a smart summary for system messages (settings/room)
 */
export function generateSystemSummary(type: string, text: string, t: TFunction): string | null {
  if (type !== 'settings' && type !== 'room') return null;
  if (typeof text !== 'string') return null;

  if (type === 'settings') {
    return t('updatedGameSettings');
  }

  if (type === 'room') {
    return t('updatedRoomSettings');
  }

  return null;
}

/**
 * Checks if system message text is likely to wrap based on length and word count
 */
export function isSystemMessageLikelyToWrap(
  displayName: string,
  systemSummary: string | null
): boolean {
  if (!systemSummary?.trim() || !displayName?.trim()) return false;

  const fullText = `${displayName} ${systemSummary}`;

  // Use early return for better performance
  if (fullText.length > CHARACTER_LIMIT) return true;

  // Count words more efficiently by splitting on whitespace
  const wordCount = fullText.split(/\s+/).length;
  return wordCount > WORD_LIMIT;
}
