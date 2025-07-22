import { getAllAvailableGroups } from '@/stores/customGroups';
import { CustomGroupPull } from '@/types/customGroups';

/**
 * Convert Dexie custom groups to the format expected by the old importActions function
 */
export const convertDexieGroupsToActions = (groups: CustomGroupPull[]): Record<string, any> => {
  const actions: Record<string, any> = {};

  for (const group of groups) {
    // Convert the group to the expected format
    const actionObj: any = {
      label: group.label || group.name,
      type: group.type || 'action',
      actions: {
        None: [], // Always include None as it's expected
      },
    };

    // Convert intensities to actions format
    if (group.intensities && Array.isArray(group.intensities)) {
      for (const intensity of group.intensities) {
        // For now, create empty arrays for each intensity
        // The actual actions would come from custom tiles
        actionObj.actions[intensity.label] = [];
      }
    }

    actions[group.name] = actionObj;
  }

  return actions;
};

/**
 * Replacement for importActions from importLocales.ts
 * Gets actions from Dexie instead of JSON files
 */
export const importActions = async (
  locale = 'en',
  gameMode = 'online'
): Promise<Record<string, any>> => {
  try {
    const groups = await getAllAvailableGroups(locale, gameMode);
    return convertDexieGroupsToActions(groups);
  } catch (error) {
    console.error('Error importing actions from Dexie:', error);
    return {};
  }
};
