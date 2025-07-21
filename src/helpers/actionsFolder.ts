import { camelToPascal } from '@/helpers/strings';
import i18next from 'i18next';
import { GroupedActions, MappedGroup } from '@/types/customTiles';
import { DEFAULT_NONE_OPTION } from '@/constants/actionConstants';

/**
 * Transforms grouped actions into a flat array of mapped groups for UI components
 *
 * @param actionsFolder - Object containing grouped actions with intensities
 * @returns Array of mapped groups with intensity levels and labels
 *
 * Features:
 * - Filters out the default "None" option
 * - Creates individual entries for each intensity level
 * - Adds a "misc" group for general actions
 * - Converts group names to PascalCase for consistency
 */
export default function groupActionsFolder(actionsFolder: GroupedActions): MappedGroup[] {
  const mappedGroups = Object.entries(actionsFolder).flatMap(([key, { label, actions }]) => {
    if (!actions) return [];
    const intensities = Object.keys(actions).filter((entry) => entry !== DEFAULT_NONE_OPTION);
    return intensities.map((intensity, index) => ({
      group: camelToPascal(key),
      groupLabel: label,
      value: key,
      intensity: Number(index + 1),
      translatedIntensity: intensity,
      label: `${label} - ${intensity}`,
    }));
  });

  return [
    ...mappedGroups,
    {
      group: i18next.t('misc'),
      groupLabel: i18next.t('misc'),
      value: 'misc',
      intensity: 1,
      translatedIntensity: i18next.t('all'),
      label: `${i18next.t('misc')} - ${i18next.t('all')}`,
    },
  ];
}
