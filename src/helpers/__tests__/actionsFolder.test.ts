import { describe, it, expect, vi } from 'vitest';
import groupActionsFolder from '../actionsFolder';
import { GroupedActions } from '@/types/customTiles';

// Mock the translation
vi.mock('i18next', () => ({
  default: {
    t: (key: string) => {
      const translations: Record<string, string> = {
        misc: 'Miscellaneous',
        all: 'All',
      };
      return translations[key] || key;
    },
  },
}));

// Mock the strings helper
vi.mock('@/helpers/strings', () => ({
  camelToPascal: (str: string) => str.charAt(0).toUpperCase() + str.slice(1),
}));

describe('groupActionsFolder', () => {
  it('should handle empty actions folder', () => {
    const result = groupActionsFolder({});

    // Should still return the misc group
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      group: 'Miscellaneous',
      groupLabel: 'Miscellaneous',
      value: 'misc',
      intensity: 1,
      translatedIntensity: 'All',
      label: 'Miscellaneous - All',
    });
  });

  it('should filter out None option and create mapped groups', () => {
    const actionsFolder: GroupedActions = {
      testGroup: {
        label: 'Test Group',
        type: 'action',
        actions: {
          None: [],
          Beginner: ['action1'],
          Advanced: ['action2'],
        },
      },
    };

    const result = groupActionsFolder(actionsFolder);

    // Should have 2 intensity levels + 1 misc group
    expect(result).toHaveLength(3);

    // Check that None is filtered out
    const testGroupEntries = result.filter((item) => item.value === 'testGroup');
    expect(testGroupEntries).toHaveLength(2);

    // Check mapping structure
    expect(testGroupEntries[0]).toMatchObject({
      group: 'TestGroup',
      groupLabel: 'Test Group',
      value: 'testGroup',
      intensity: 1,
      translatedIntensity: 'Beginner',
      label: 'Test Group - Beginner',
    });

    expect(testGroupEntries[1]).toMatchObject({
      group: 'TestGroup',
      groupLabel: 'Test Group',
      value: 'testGroup',
      intensity: 2,
      translatedIntensity: 'Advanced',
      label: 'Test Group - Advanced',
    });
  });

  it('should handle groups with no actions', () => {
    const actionsFolder: GroupedActions = {
      emptyGroup: {
        label: 'Empty Group',
        type: 'action',
        actions: undefined,
      },
    };

    const result = groupActionsFolder(actionsFolder);

    // Should only have the misc group
    expect(result).toHaveLength(1);
    expect(result[0].value).toBe('misc');
  });

  it('should always include misc group as last item', () => {
    const actionsFolder: GroupedActions = {
      group1: {
        label: 'Group 1',
        type: 'action',
        actions: {
          None: [],
          Level1: ['action1'],
        },
      },
    };

    const result = groupActionsFolder(actionsFolder);

    const lastItem = result[result.length - 1];
    expect(lastItem.value).toBe('misc');
    expect(lastItem.group).toBe('Miscellaneous');
  });
});
