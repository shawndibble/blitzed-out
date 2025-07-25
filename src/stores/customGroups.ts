import i18next from 'i18next';
import { nanoid } from 'nanoid';
import db from './store';
import {
  CustomGroup,
  CustomGroupBase,
  CustomGroupPull,
  CustomGroupFilters,
  CustomGroupIntensity,
} from '@/types/customGroups';
import { Collection, Table } from 'dexie';

const { customGroups } = db;

// Hook to set default values when creating custom groups
customGroups.hook(
  'creating',
  function (this: any, _primKey: string | undefined, obj: CustomGroup, _transaction: any) {
    if (!obj.id) obj.id = nanoid();
    if (obj.locale === undefined) obj.locale = i18next.resolvedLanguage || i18next.language || 'en';
    if (obj.gameMode === undefined) obj.gameMode = 'online';
    if (obj.isDefault === undefined) obj.isDefault = false;
    const now = new Date();
    if (!(obj as CustomGroupPull).createdAt) (obj as CustomGroupPull).createdAt = now;
    (obj as CustomGroupPull).updatedAt = now;
  }
);

// Hook to update the updatedAt timestamp when updating
customGroups.hook(
  'updating',
  function (this: any, modifications: any, _primKey: string, _obj: CustomGroup, _transaction: any) {
    modifications.updatedAt = new Date();
  }
);

// Helper function to create and filter the query
const createFilteredQuery = (filters: Partial<CustomGroupFilters>) => {
  const possibleFilters = ['locale', 'gameMode', 'name', 'isDefault'];
  let query: Collection<CustomGroupPull, string | undefined> = (
    customGroups as Table<CustomGroupPull, string>
  ).toCollection();

  const filtersArray = Object.entries(filters).filter(([key]) => possibleFilters.includes(key));

  filtersArray.forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;

    query = query.filter((group) => group[key as keyof CustomGroup] === value);
  });

  return query;
};

/**
 * Get custom groups with optional filtering
 */
export const getCustomGroups = async (
  filters: Partial<CustomGroupFilters> = {}
): Promise<CustomGroupPull[]> => {
  try {
    const query = createFilteredQuery(filters);
    return await query.toArray();
  } catch (error) {
    console.error('Error in getCustomGroups:', error);
    return [];
  }
};

/**
 * Get a single custom group by ID
 */
export const getCustomGroup = async (id: string): Promise<CustomGroupPull | undefined> => {
  try {
    return await customGroups.get(id);
  } catch (error) {
    console.error('Error in getCustomGroup:', error);
    return undefined;
  }
};

/**
 * Get a custom group by name, locale, and game mode
 */
export const getCustomGroupByName = async (
  name: string,
  locale = 'en',
  gameMode = 'online'
): Promise<CustomGroupPull | undefined> => {
  try {
    return await customGroups
      .where('name')
      .equals(name)
      .and((group) => group.locale === locale && group.gameMode === gameMode)
      .first();
  } catch (error) {
    console.error('Error in getCustomGroupByName:', error);
    return undefined;
  }
};

/**
 * Add a new custom group
 */
export const addCustomGroup = async (group: CustomGroupBase): Promise<string | undefined> => {
  try {
    // The creating hook will add id, createdAt, and updatedAt fields
    // We need to provide the required fields that the hook expects
    const groupWithTimestamps = {
      ...group,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Omit<CustomGroupPull, 'id'>;

    const id = await customGroups.add(groupWithTimestamps);
    return id;
  } catch (error) {
    console.error('Error in addCustomGroup:', error);
    return undefined;
  }
};

/**
 * Update an existing custom group
 */
export const updateCustomGroup = async (
  id: string,
  updates: Partial<CustomGroupBase>
): Promise<number> => {
  try {
    return await customGroups.update(id, updates);
  } catch (error) {
    console.error('Error in updateCustomGroup:', error);
    return 0;
  }
};

/**
 * Delete a custom group
 */
export const deleteCustomGroup = async (id: string): Promise<void> => {
  try {
    await customGroups.delete(id);
  } catch (error) {
    console.error('Error in deleteCustomGroup:', error);
  }
};

/**
 * Delete all custom groups (useful for migrations and testing)
 */
export const deleteAllCustomGroups = async (): Promise<boolean> => {
  try {
    await customGroups.clear();
    return true;
  } catch (error) {
    console.error('Error deleting all custom groups:', error);
    return false;
  }
};

/**
 * Import multiple custom groups
 */
export const importCustomGroups = async (
  groups: Partial<CustomGroup>[]
): Promise<string | undefined> => {
  try {
    const now = new Date();
    const groupsWithAllFields = groups.map((group) => {
      const fullGroup: CustomGroupPull = {
        name: group.name || '',
        label: group.label || '',
        intensities: group.intensities || [],
        id: group.id || nanoid(),
        locale: group.locale || 'en',
        gameMode: group.gameMode || 'online',
        isDefault: group.isDefault || false,
        createdAt: (group as CustomGroupPull).createdAt || now,
        updatedAt: (group as CustomGroupPull).updatedAt || now,
      };
      return fullGroup;
    });

    return await customGroups.bulkAdd(groupsWithAllFields);
  } catch (error) {
    console.error('Error in importCustomGroups:', error);
    return undefined;
  }
};

/**
 * Create default custom groups from locale action files
 * This is used during migration and initial setup
 */
export const createDefaultGroups = async (
  locale = 'en',
  gameMode = 'online'
): Promise<CustomGroupPull[]> => {
  try {
    // Get all existing groups from Dexie for this locale/gameMode
    const existingGroups = await getCustomGroups({ locale, gameMode, isDefault: true });

    // If we already have default groups, return them
    if (existingGroups.length > 0) {
      return existingGroups;
    }

    // If no groups exist, migration probably hasn't run yet
    // Return empty array - migration will handle creating groups
    return [];
  } catch (error) {
    console.error('Error creating default groups:', error);
    return [];
  }
};

/**
 * Get all available intensity levels for a specific group
 */
export const getGroupIntensities = async (
  groupName: string,
  locale = 'en',
  gameMode = 'online'
): Promise<CustomGroupIntensity[]> => {
  try {
    const group = await getCustomGroupByName(groupName, locale, gameMode);
    return group?.intensities || [];
  } catch (error) {
    console.error('Error in getGroupIntensities:', error);
    return [];
  }
};

/**
 * Validate that a custom group name is unique within the locale/gameMode
 */
export const isGroupNameUnique = async (
  name: string,
  locale = 'en',
  gameMode = 'online',
  excludeId?: string
): Promise<boolean> => {
  try {
    const existingGroup = await getCustomGroupByName(name, locale, gameMode);
    if (!existingGroup) return true;
    if (excludeId && existingGroup.id === excludeId) return true;
    return false;
  } catch (error) {
    console.error('Error in isGroupNameUnique:', error);
    return false;
  }
};

/**
 * Get all custom groups for the current locale and game mode
 */
export const getCurrentGroups = async (gameMode?: string): Promise<CustomGroupPull[]> => {
  const currentLocale = i18next.resolvedLanguage || i18next.language || 'en';
  return getCustomGroups({
    locale: currentLocale,
    gameMode: gameMode || 'online',
  });
};

/**
 * Get default and custom groups combined for display in selectors
 */
/**
 * Remove duplicate groups from the database
 * Keeps the first occurrence of each group name per locale/gameMode
 */
export const removeDuplicateGroups = async (
  locale = 'en',
  gameMode = 'online'
): Promise<number> => {
  try {
    const allGroups = await getCustomGroups({ locale, gameMode });
    const groupsByName = new Map<string, CustomGroupPull[]>();

    // Group by name
    allGroups.forEach((group) => {
      const existing = groupsByName.get(group.name) || [];
      existing.push(group);
      groupsByName.set(group.name, existing);
    });

    let removedCount = 0;

    // Remove duplicates (keep the first, remove the rest)
    for (const [, groups] of groupsByName) {
      if (groups.length > 1) {
        // Sort by creation date to keep the oldest
        groups.sort((a, b) => {
          try {
            const aTime =
              a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
            const bTime =
              b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
            return aTime - bTime;
          } catch (error) {
            // If date parsing fails, fall back to createdAt comparison for deterministic ordering
            console.warn(
              'Date parsing failed in removeDuplicateGroups, using createdAt fallback:',
              error
            );
            return a.createdAt.getTime() - b.createdAt.getTime();
          }
        });

        // Remove all but the first
        for (let i = 1; i < groups.length; i++) {
          await deleteCustomGroup(groups[i].id);
          removedCount++;
        }
      }
    }

    return removedCount;
  } catch (error) {
    console.error('Error in removeDuplicateGroups:', error);
    return 0;
  }
};

/**
 * Force recreate default groups with proper intensities from action files
 * This is useful when intensities need to be updated
 */
export const recreateDefaultGroups = async (): Promise<number> => {
  // This function is no longer needed since migration handles creating groups
  // Just return 0 to maintain compatibility
  return 0;
};

export const getAllAvailableGroups = async (
  locale = 'en',
  gameMode = 'online'
): Promise<CustomGroupPull[]> => {
  try {
    // Clean up any existing duplicates first
    await removeDuplicateGroups(locale, gameMode);

    // Get all groups for this locale/gameMode from Dexie
    const groups = await getCustomGroups({ locale, gameMode });

    // Additional safety deduplication by name (keep the first occurrence)
    const uniqueGroups = groups.filter(
      (group, index, self) => self.findIndex((g) => g.name === group.name) === index
    );

    return uniqueGroups;
  } catch (error) {
    console.error('❌ getAllAvailableGroups: Database error', {
      locale,
      gameMode,
      error,
    });
    return [];
  }
};

/**
 * Get custom groups that have associated custom tiles
 * Only returns groups that actually have tiles created for them
 */
export const getCustomGroupsWithTiles = async (
  locale = 'en',
  gameMode = 'online'
): Promise<CustomGroupPull[]> => {
  try {
    // Import getTiles from customTiles store
    const { getTiles } = await import('./customTiles');

    // Get all custom groups for this locale/gameMode
    const allGroups = await getCurrentGroups(gameMode);

    // Get all custom tiles for this locale/gameMode (only custom tiles, not default)
    const customTiles = await getTiles({
      locale,
      gameMode,
      isCustom: 1,
    });

    // Get unique group names that have custom tiles
    const groupNamesWithTiles = new Set(customTiles.map((tile) => tile.group));

    // Filter groups to only include those with tiles and are not default groups
    const groupsWithTiles = allGroups.filter(
      (group) => !group.isDefault && groupNamesWithTiles.has(group.name)
    );

    return groupsWithTiles;
  } catch (error) {
    console.error('Error in getCustomGroupsWithTiles:', error);
    return [];
  }
};

/**
 * Utility functions for post-migration runtime queries
 * These query Dexie instead of reading JSON files
 */

/**
 * Get all available locales from migrated data
 */
export const getAvailableLocales = async (): Promise<string[]> => {
  try {
    const groups = await getCustomGroups({ isDefault: true });
    const locales = [...new Set(groups.map((g) => g.locale))].sort();
    return locales;
  } catch (error) {
    console.error('Error getting available locales:', error);
    return ['en']; // fallback
  }
};

/**
 * Get all available game modes for a specific locale
 */
export const getAvailableGameModes = async (locale?: string): Promise<string[]> => {
  try {
    const filters: Partial<CustomGroupFilters> = { isDefault: true };
    if (locale) filters.locale = locale;

    const groups = await getCustomGroups(filters);
    const gameModes = [...new Set(groups.map((g) => g.gameMode))].sort();
    return gameModes;
  } catch (error) {
    console.error('Error getting available game modes:', error);
    return ['online']; // fallback
  }
};

/**
 * Get all action group names for a specific locale and game mode
 */
export const getActionGroupsForMode = async (
  locale: string,
  gameMode: string
): Promise<string[]> => {
  try {
    const groups = await getCustomGroups({ locale, gameMode, isDefault: true });
    return groups.map((g) => g.name).sort();
  } catch (error) {
    console.error('Error getting action groups for mode:', error);
    return [];
  }
};

/**
 * Get all available action group names across all locales and game modes
 */
export const getAllActionGroupNames = async (): Promise<string[]> => {
  try {
    const groups = await getCustomGroups({ isDefault: true });
    const groupNames = [...new Set(groups.map((g) => g.name))].sort();
    return groupNames;
  } catch (error) {
    console.error('Error getting all action group names:', error);
    return [];
  }
};

/**
 * Get available groups with their locale and game mode information
 */
export const getGroupAvailability = async (): Promise<
  {
    groupName: string;
    locales: string[];
    gameModes: string[];
    combinations: Array<{ locale: string; gameMode: string }>;
  }[]
> => {
  try {
    const groups = await getCustomGroups({ isDefault: true });
    const availability = new Map<
      string,
      {
        locales: Set<string>;
        gameModes: Set<string>;
        combinations: Array<{ locale: string; gameMode: string }>;
      }
    >();

    groups.forEach((group) => {
      if (!availability.has(group.name)) {
        availability.set(group.name, {
          locales: new Set(),
          gameModes: new Set(),
          combinations: [],
        });
      }

      const groupData = availability.get(group.name);
      if (groupData) {
        groupData.locales.add(group.locale);
        groupData.gameModes.add(group.gameMode);
        groupData.combinations.push({ locale: group.locale, gameMode: group.gameMode });
      } else {
        console.error(`Unexpected error: group data not found for group: ${group.name}`);
      }
    });

    return Array.from(availability.entries())
      .map(([groupName, data]) => ({
        groupName,
        locales: Array.from(data.locales).sort(),
        gameModes: Array.from(data.gameModes).sort(),
        combinations: data.combinations,
      }))
      .sort((a, b) => a.groupName.localeCompare(b.groupName));
  } catch (error) {
    console.error('Error getting group availability:', error);
    return [];
  }
};
