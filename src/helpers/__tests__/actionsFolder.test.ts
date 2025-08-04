import { describe, expect, it, vi } from 'vitest';

import { GroupedActions } from '@/types/customTiles';
import groupActionsFolder from '../actionsFolder';

// Mock the translation
vi.mock('i18next', () => ({
  default: {
    t: (key: string) => {
      const translations: Record<string, string> = {
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
  it('should filter out None option and create mapped groups', () => {
    const actionsFolder: GroupedActions = {
      testGroup: {
        label: 'Test Group',
        type: 'sex',
        actions: {
          None: [],
          Beginner: ['action1'],
          Advanced: ['action2'],
        },
      },
    };

    const result = groupActionsFolder(actionsFolder);

    // Should have 2 intensity levels
    expect(result).toHaveLength(2);

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
        type: 'sex',
        actions: undefined,
      },
    };

    const result = groupActionsFolder(actionsFolder);

    expect(result).toHaveLength(0);
  });
});
