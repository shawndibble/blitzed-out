import { GroupedActions, MappedGroup } from '@/types/customTiles';

import { DEFAULT_NONE_OPTION } from '@/constants/actionConstants';
import { camelToPascal } from '@/helpers/strings';

/**
 * Transforms grouped actions into a flat array of mapped groups for UI components
 *
 * @param actionsFolder - Object containing grouped actions with intensities
 * @returns Array of mapped groups with intensity levels and labels
 *
 * Features:
 * - Filters out the default "None" option
 * - Creates individual entries for each intensity level
 * - Converts group names to PascalCase for consistency
 */
export default function groupActionsFolder(actionsFolder: GroupedActions): MappedGroup[] {
  return Object.entries(actionsFolder).flatMap(([key, { label, actions }]) => {
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
}
