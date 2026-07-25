import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportAllData } from '@/services/importExport';
import type { CustomGroupPull } from '@/types/customGroups';
import type { CustomTile } from '@/types/customTiles';

vi.mock('@/stores/customGroups', () => ({
  getCustomGroups: vi.fn(),
  addCustomGroup: vi.fn(),
  updateCustomGroup: vi.fn(),
}));

vi.mock('@/stores/customTiles', () => ({
  getTiles: vi.fn(),
  addCustomTile: vi.fn(),
  updateCustomTile: vi.fn(),
}));

vi.mock('@/services/contentHashing', () => ({
  generateGroupContentHash: vi.fn(async () => 'group-hash'),
  generateTileContentHash: vi.fn(async () => 'tile-hash'),
  generateDisabledDefaultContentHash: vi.fn(async () => 'disabled-hash'),
  generateExtensionContentHash: vi.fn(async () => 'extension-hash'),
}));

import { getCustomGroups } from '@/stores/customGroups';
import { getTiles } from '@/stores/customTiles';
import { generateTileContentHash } from '@/services/contentHashing';

const customGroup: CustomGroupPull = {
  id: 'custom-1',
  name: 'myGroup',
  label: 'My Group',
  intensities: [{ id: 'i1', label: 'Light', value: 1, isDefault: false }],
  type: 'solo',
  isDefault: false,
  locale: 'en',
  gameMode: 'online',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const defaultGroup: CustomGroupPull = {
  ...customGroup,
  id: 'default-1',
  name: 'ballBusting',
  label: 'Ball Busting',
  isDefault: true,
  intensities: [
    { id: 'd1', label: 'Easy', value: 1, isDefault: true },
    { id: 'd2', label: 'Brutal', value: 2, isDefault: false },
  ],
};

const customTile: CustomTile = {
  id: 1,
  group_id: 'custom-1',
  intensity: 1,
  action: 'Custom action',
  tags: [],
  isEnabled: 1,
  isCustom: 1,
};

const disabledDefaultTile: CustomTile = {
  id: 2,
  group_id: 'default-1',
  intensity: 1,
  action: 'Disabled default action',
  tags: [],
  isEnabled: 0,
  isCustom: 0,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getCustomGroups).mockImplementation(async (filters: any = {}) =>
    filters?.isDefault === false ? [customGroup] : [customGroup, defaultGroup]
  );
  vi.mocked(getTiles).mockImplementation(async (filters: any = {}) => {
    if (filters?.isCustom === 0 && filters?.isEnabled === 0) return [disabledDefaultTile as any];
    if (filters?.isCustom === 1) return [customTile as any];
    return [];
  });
  vi.mocked(generateTileContentHash).mockResolvedValue('tile-hash');
});

async function sectionsFor(scope: 'all' | 'custom' | 'single' | 'disabled', extra = {}) {
  const parsed = JSON.parse(await exportAllData({ scope, ...extra }));
  return parsed.data;
}

describe('exportAllData honours the declared scope', () => {
  it("'all' carries every section, disabled defaults included", async () => {
    const data = await sectionsFor('all');

    expect(data.customGroups.map((g: any) => g.name)).toEqual(['myGroup']);
    expect(data.customTiles.map((t: any) => t.action)).toEqual(['Custom action']);
    expect(data.disabledDefaultTiles.map((t: any) => t.action)).toEqual([
      'Disabled default action',
    ]);
  });

  it("'custom' drops disabled defaults and keeps the author's own content", async () => {
    const data = await sectionsFor('custom');

    expect(data.customGroups.map((g: any) => g.name)).toEqual(['myGroup']);
    expect(data.customTiles.map((t: any) => t.action)).toEqual(['Custom action']);
    expect(data.disabledDefaultTiles).toEqual([]);
  });

  it("'disabled' carries only disabled defaults", async () => {
    const data = await sectionsFor('disabled');

    expect(data.customGroups).toEqual([]);
    expect(data.customTiles).toEqual([]);
    expect(data.disabledDefaultTiles.map((t: any) => t.action)).toEqual([
      'Disabled default action',
    ]);
  });

  it("'single' narrows to one group and keeps its disabled defaults", async () => {
    const data = await sectionsFor('single', { singleGroupName: 'myGroup' });

    expect(data.customGroups.map((g: any) => g.name)).toEqual(['myGroup']);
    expect(data.customTiles.map((t: any) => t.action)).toEqual(['Custom action']);
    // The disabled default belongs to another group, so it drops out.
    expect(data.disabledDefaultTiles).toEqual([]);
  });

  it('skips tile hashing for sections the scope excludes', async () => {
    await sectionsFor('disabled');
    expect(generateTileContentHash).not.toHaveBeenCalled();
  });

  it('leaves callers that pass no scope on their explicit options', async () => {
    const withDisabled = JSON.parse(await exportAllData({ includeDisabledDefaults: true }));
    expect(withDisabled.data.disabledDefaultTiles).toHaveLength(1);

    const without = JSON.parse(await exportAllData({}));
    expect(without.data.disabledDefaultTiles).toEqual([]);
    expect(without.data.customGroups).toHaveLength(1);
  });
});
