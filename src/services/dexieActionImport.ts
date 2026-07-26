import { logger } from '@/utils/logger';
import { getAllAvailableGroups } from '@/stores/customGroups';
import { CustomGroupPull } from '@/types/customGroups';
import { GroupedActions } from '@/types/customTiles';
import { ContentGameMode } from '@/types/Settings';

/**
 * The settings catalog: Dexie groups → the `{ label, type, actions, intensities }`
 * shape every consumer of an actions list expects.
 *
 * `actions` carries a key per level (empty arrays — the text lives in
 * customTiles) and `intensities` maps a level VALUE to its label. Consumers must
 * read `intensities`: action-key position is not a level number, and a sparse
 * ladder (a group whose levels are 1, 2, 4) makes the two disagree.
 */
export const convertDexieGroupsToActions = (groups: CustomGroupPull[]): GroupedActions => {
  const catalog: GroupedActions = {};

  for (const group of groups) {
    const actions: Record<string, string[]> = {};
    const intensities: Record<number, string> = {};

    [...(group.intensities ?? [])]
      .sort((a, b) => a.value - b.value)
      .forEach((intensity) => {
        actions[intensity.label] = [];
        intensities[intensity.value] = intensity.label;
      });

    catalog[group.name] = {
      label: group.label || group.name,
      type: group.type || 'action',
      actions,
      intensities,
    };
  }

  return catalog;
};

/**
 * Load the settings catalog for a locale/game mode from Dexie.
 */
export const importActions = async (
  locale = 'en',
  gameMode: ContentGameMode = 'online'
): Promise<GroupedActions> => {
  try {
    const groups = await getAllAvailableGroups(locale, gameMode);
    return convertDexieGroupsToActions(groups);
  } catch (error) {
    logger.error('Error importing actions from Dexie:', error);
    return {};
  }
};
