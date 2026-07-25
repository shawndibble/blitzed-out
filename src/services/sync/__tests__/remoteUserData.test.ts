import { describe, expect, it, vi } from 'vitest';

vi.mock('@/services/firebase', () => ({ db: {} }));
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
}));

import { decodeRemoteUserData } from '../remoteUserData';

describe('decodeRemoteUserData', () => {
  it('reports absent sections as undefined, so a merge never treats them as emptied', () => {
    const decoded = decodeRemoteUserData({});

    expect(decoded.customTiles).toBeUndefined();
    expect(decoded.customGroups).toBeUndefined();
    expect(decoded.groupExtensions).toBeUndefined();
    expect(decoded.disabledDefaults).toBeUndefined();
    expect(decoded.gameBoards).toBeUndefined();
    expect(decoded.settings).toBeUndefined();
  });

  it('distinguishes a present-but-empty section from an absent one', () => {
    const decoded = decodeRemoteUserData({ customTiles: [], settings: {} });

    expect(decoded.customTiles).toEqual([]);
    expect(decoded.settings).toEqual({});
    expect(decoded.customGroups).toBeUndefined();
  });

  it('prefers the V2 disabled-defaults field when both are present', () => {
    const v2 = [
      { key: 'g|1|A', group_id: 'g', intensity: 1, action: 'A', active: false, updatedAt: 500 },
    ];
    const decoded = decodeRemoteUserData({
      disabledDefaultsV2: v2,
      disabledDefaults: [{ group_id: 'g', intensity: 1, action: 'A' }],
    });

    // The tombstone survives: taking the legacy array here would resurrect it as
    // active and undo a re-enable made on another device.
    expect(decoded.disabledDefaults).toEqual(v2);
  });

  it('up-converts a legacy-only document into active records stamped 1', () => {
    const decoded = decodeRemoteUserData({
      disabledDefaults: [
        { group_id: 'g', intensity: 2, action: 'Legacy' },
        { group_id: 'g', intensity: 2 }, // no action — unusable, dropped
      ],
    });

    expect(decoded.disabledDefaults).toEqual([
      {
        key: 'g|2|Legacy',
        group_id: 'g',
        intensity: 2,
        action: 'Legacy',
        active: true,
        updatedAt: 1,
      },
    ]);
  });

  it('reads group extensions from the document field name', () => {
    const records = [
      { groupName: 'ballBusting', locale: 'en', gameMode: 'online', intensities: [] },
    ];
    const decoded = decodeRemoteUserData({ customGroupExtensions: records });

    expect(decoded.groupExtensions).toEqual(records);
  });

  it('treats a null section as empty rather than throwing', () => {
    const decoded = decodeRemoteUserData({ customTiles: null, gameBoards: null });

    expect(decoded.customTiles).toEqual([]);
    expect(decoded.gameBoards).toEqual([]);
  });
});
