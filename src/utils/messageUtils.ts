import { useTranslation } from 'react-i18next';

// Type for the translation function
type TFunction = ReturnType<typeof useTranslation>['t'];

/**
 * Generates a smart summary for system messages (settings/room)
 */
export function generateSystemSummary(type: string, text: string, t: TFunction): string | null {
  if (type !== 'settings' && type !== 'room') return null;

  if (type === 'settings') {
    const settingsCount = (text.match(/\*/g) || []).length;
    if (settingsCount > 1) {
      return t('updatedMultipleSettings', { count: settingsCount });
    }
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
  if (!systemSummary) return false;
  const fullText = `${displayName} ${systemSummary}`;
  return fullText.length > 45 || fullText.split(' ').length > 6;
}
