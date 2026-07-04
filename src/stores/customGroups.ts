import { Collection, Table } from 'dexie';
import {
  CustomGroup,
  CustomGroupBase,
  CustomGroupFilters,
  CustomGroupIntensity,
  CustomGroupPull,
} from '@/types/customGroups';

import db from './store';
import i18next from 'i18next';
import { nanoid } from 'nanoid';
import { retryOnCursorError } from '@/utils/dbRecovery';
import { analyticsTracking } from '@/services/analyticsTracking';
import { waitForContentReady } from '@/services/migration/contentReadiness';

const { customGroups } = db;

// Only user-authored groups are analytics signal — default groups get seeded
// per user/locale by migration and touched by re-seeds, which would drown
// real usage data in GA4.
const trackIfUserAuthored = (
  action: 'create' | 'modify' | 'delete',
  group: CustomGroupBase,
  isDefault: boolean | undefined = group.isDefault
): void => {
  if (isDefault ?? false) return;
  analyticsTracking.trackCustomGroupAction(action, group, false);
};

/**
 * Post-commit analytics hook for contentLibrary.deleteGroup. Lives here so the
 * user-authored gate (default groups are seeded noise, never GA4 signal) stays
 * next to the create/modify tracking that enforces the same rule.
 */
export const trackGroupDeleted = (group: CustomGroupBase): void =>
  trackIfUserAuthored('delete', group);

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
    return await retryOnCursorError(
      db,
      async () => {
        const query = createFilteredQuery(filters);
        const arrayData = await query.toArray();
        return arrayData.sort((a, b) => a.name.localeCompare(b.name));
      },
      (message: string, error?: Error) => {
        console.error(`Error in getCustomGroups: ${message}`, error);
      }
    );
  } catch (error) {
    console.error('Final error in getCustomGroups:', error);
    return [];
  }
};

/**
 * Distinct source-pack ids present in the local library — i.e. which content
 * packs have already been imported. Uses the indexed `packId` key, so only
 * groups stamped with provenance contribute.
 */
export const getImportedPackIds = async (): Promise<Set<string>> => {
  try {
    const keys = await customGroups.orderBy('packId').uniqueKeys();
    return new Set(keys.map((k) => String(k)));
  } catch {
    // No imported packs / index unavailable — fall back to an empty set.
    return new Set();
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
    return await retryOnCursorError(
      db,
      async () => {
        // The creating hook will add/overwrite id, locale, gameMode, isDefault, and updatedAt fields
        // We provide required timestamps here (hook will overwrite updatedAt)
        const timestamp = new Date();
        const groupWithTimestamp = {
          ...group,
          createdAt: timestamp,
          updatedAt: timestamp, // Hook will overwrite this
        } as Omit<CustomGroupPull, 'id'>;

        const id = await customGroups.add(groupWithTimestamp);

        trackIfUserAuthored('create', group);

        return id;
      },
      (message: string, error?: Error) => {
        console.error(`Error in addCustomGroup: ${message}`, error);
      }
    );
  } catch (error) {
    console.error('Final error in addCustomGroup:', error);
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
    // Ensure database is open before operation
    if (typeof db.isOpen === 'function' && !db.isOpen()) {
      await db.open();
    }

    // Get the group before updating for analytics
    const group = await customGroups.get(id);
    const result = await customGroups.update(id, updates);

    if (result > 0 && group) {
      trackIfUserAuthored('modify', { ...group, ...updates }, updates.isDefault ?? group.isDefault);
    }

    return result;
  } catch (error) {
    console.error('Error in updateCustomGroup:', error);
    return 0;
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

    // bulkPut (upsert) keeps re-imports idempotent. Ids are globally-unique nanoids,
    // so a matching id is the same logical group — overwriting is correct, not collision.
    return await customGroups.bulkPut(groupsWithAllFields);
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
    // Key readiness on the locale ARGUMENT, not the current language — a
    // caller asking for another locale's groups needs THAT locale seeded.
    await waitForContentReady(locale);

    // Ensure database is ready before any operations (skip in test environment)
    if (typeof db.isOpen === 'function' && !db.isOpen()) {
      await db.open();
    }

    // Get all groups for this locale/gameMode from Dexie
    const groups = await getCustomGroups({ locale, gameMode });

    // Additional safety deduplication by name (keep the first occurrence)
    const uniqueGroups = groups
      .filter((group, index, self) => self.findIndex((g) => g.name === group.name) === index)
      .sort((a, b) => a.name.localeCompare(b.name));

    return uniqueGroups;
  } catch (error) {
    console.error('❌ getAllAvailableGroups: Database error', {
      locale,
      gameMode,
      error,
    });

    // If it's a cursor error, provide better error context
    if (error instanceof Error && error.message.includes('cursor')) {
      console.warn(
        'Database cursor error in getAllAvailableGroups, returning empty array to prevent crash'
      );
    }

    return [];
  }
};

/**
 * Utility functions for post-migration runtime queries
 * These query Dexie instead of reading JSON files
 */

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
