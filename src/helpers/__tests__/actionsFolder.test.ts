import { describe, expect, it, vi } from 'vitest';

import { GroupedActions } from '@/types/customTiles';
import groupActionsFolder, { actionUsesRoleTokens } from '../actionsFolder';

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
  it('should create mapped groups from actions', () => {
    const actionsFolder: GroupedActions = {
      testGroup: {
        label: 'Test Group',
        type: 'sex',
        actions: {
          Beginner: ['action1'],
          Advanced: ['action2'],
        },
      },
    };

    const result = groupActionsFolder(actionsFolder);

    // Should have 2 intensity levels
    expect(result).toHaveLength(2);

    // Check mapping structure
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

// Replaces the old group-shaped `groupUsesRoleTokens`: it inspected a catalog
// whose action arrays are always empty by design, so it could never return true
// and the role picker never appeared. Detection now runs per raw tile action, in
// the one query that holds the text.
describe('actionUsesRoleTokens', () => {
  it('detects a bare {dom} or {sub} token', () => {
    expect(actionUsesRoleTokens('{dom} spanks {sub}.')).toBe(true);
    expect(actionUsesRoleTokens('{sub} kneels.')).toBe(true);
  });

  it('detects piped tokens and pipe targets', () => {
    expect(actionUsesRoleTokens('Lick {genital|dom}.')).toBe(true);
    expect(actionUsesRoleTokens('{dom|self} watches.')).toBe(true);
  });

  it('returns false for role-less question groups', () => {
    expect(actionUsesRoleTokens('What is your favorite color?')).toBe(false);
    expect(actionUsesRoleTokens('Would you rather A or B?')).toBe(false);
  });

  it('returns false for missing or empty text', () => {
    expect(actionUsesRoleTokens(undefined)).toBe(false);
    expect(actionUsesRoleTokens('')).toBe(false);
  });

  it('does not match unrelated tokens like {player}', () => {
    expect(actionUsesRoleTokens('{player} does a thing.')).toBe(false);
  });
});
