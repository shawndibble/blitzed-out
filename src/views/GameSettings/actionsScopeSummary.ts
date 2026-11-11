import type { TFunction } from 'i18next';

/**
 * Actions section summary: enabled count plus which category set the current
 * Playing mode unlocks — makes the Playing → Actions dependency visible
 * instead of only changing the picker's contents silently.
 */
export function buildActionsScopeSummary(
  t: TFunction,
  enabledCount: number,
  isSoloActionsScope: boolean
): string {
  const scopeKey = isSoloActionsScope ? 'actionsScopeSolo' : 'actionsScopeGroup';
  return `${t('enabledCount', { count: enabledCount })} · ${t(scopeKey)}`;
}
