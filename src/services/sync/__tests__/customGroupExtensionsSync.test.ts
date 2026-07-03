import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  CustomGroupExtensionsSync,
  collectGroupExtensionRecords,
} from '@/services/sync/customGroupExtensionsSync';

vi.mock('@/stores/customGroups', () => ({
  getCustomGroups: vi.fn(),
  updateCustomGroup: vi.fn(),
}));

import { getCustomGroups, updateCustomGroup } from '@/stores/customGroups';

const ballBusting = {
  id: 'bb-id',
  name: 'ballBusting',
  label: 'Ball Busting',
  locale: 'en',
  gameMode: 'online',
  isDefault: true,
  intensities: [
    { id: 'bb-1', label: 'Slap/Squeeze', value: 1, isDefault: true },
    { id: 'bb-2', label: 'Punch/Crush', value: 2, isDefault: true },
  ],
};

describe('collectGroupExtensionRecords', () => {
  it('emits only default groups with non-default levels, as value/label pairs', async () => {
    vi.mocked(getCustomGroups).mockResolvedValue([
      ballBusting,
      {
        ...ballBusting,
        id: 'tt-id',
        name: 'titTorture',
        intensities: [
          ...ballBusting.intensities,
          { id: 'titTorture-ext-3', label: 'Clamps', value: 3, isDefault: false },
        ],
      },
    ] as any);

    const records = await collectGroupExtensionRecords();

    expect(records).toEqual([
      {
        groupName: 'titTorture',
        locale: 'en',
        gameMode: 'online',
        intensities: [{ value: 3, label: 'Clamps' }],
      },
    ]);
  });
});

describe('CustomGroupExtensionsSync.syncFromFirebase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('append-merges remote levels onto the local default group', async () => {
    vi.mocked(getCustomGroups).mockResolvedValue([ballBusting] as any);

    const result = await CustomGroupExtensionsSync.syncFromFirebase([
      {
        groupName: 'ballBusting',
        locale: 'en',
        gameMode: 'online',
        intensities: [{ value: 3, label: 'Rubber Bands' }],
      },
    ]);

    expect(result.success).toBe(true);
    expect(result.itemsProcessed).toBe(1);
    expect(updateCustomGroup).toHaveBeenCalledWith('bb-id', {
      intensities: [
        expect.objectContaining({ value: 1, isDefault: true }),
        expect.objectContaining({ value: 2, isDefault: true }),
        expect.objectContaining({ value: 3, label: 'Rubber Bands', isDefault: false }),
      ],
    });
  });

  it('is idempotent: already-present levels cause no write', async () => {
    vi.mocked(getCustomGroups).mockResolvedValue([
      {
        ...ballBusting,
        intensities: [
          ...ballBusting.intensities,
          { id: 'ballBusting-ext-3', label: 'Rubber Bands', value: 3, isDefault: false },
        ],
      },
    ] as any);

    const result = await CustomGroupExtensionsSync.syncFromFirebase([
      {
        groupName: 'ballBusting',
        locale: 'en',
        gameMode: 'online',
        intensities: [{ value: 3, label: 'Rubber Bands' }],
      },
    ]);

    expect(result.success).toBe(true);
    expect(updateCustomGroup).not.toHaveBeenCalled();
  });

  it('skips records whose group is missing locally', async () => {
    vi.mocked(getCustomGroups).mockResolvedValue([] as any);

    const result = await CustomGroupExtensionsSync.syncFromFirebase([
      {
        groupName: 'notSeededYet',
        locale: 'fr',
        gameMode: 'local',
        intensities: [{ value: 4, label: 'Extra' }],
      },
    ]);

    expect(result.success).toBe(true);
    expect(result.itemsProcessed).toBe(0);
    expect(updateCustomGroup).not.toHaveBeenCalled();
  });
});
