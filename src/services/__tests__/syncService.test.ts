import {
  addCustomTile,
  canonicalizeTileAction,
  deleteAllIsCustomTiles,
  getTiles,
  updateCustomTile,
} from '@/stores/customTiles';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getCustomGroups, importCustomGroups } from '@/stores/customGroups';
import { deleteGroup } from '@/stores/contentLibrary';
import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import {
  subscribeToUserData,
  syncAllDataToFirebase,
  syncDataFromFirebase,
} from '@/services/syncService';

import { getAuth } from 'firebase/auth';
import { useSettingsStore } from '@/stores/settingsStore';
import { getBoards } from '@/stores/gameBoard';

// Override the global sync service mock for this test file
vi.mock('@/services/syncService', async () => {
  const actual = await vi.importActual('@/services/syncService');
  return actual;
});

// Mock Firebase
vi.mock('firebase/auth');
vi.mock('firebase/firestore');

// Mock stores
vi.mock('@/stores/customTiles');
vi.mock('@/stores/customGroups');
vi.mock('@/stores/contentLibrary');
vi.mock('@/stores/gameBoard');
vi.mock('@/stores/settingsStore');
vi.mock('@/stores/disabledDefaults', () => ({
  mergeRemoteDisabledRecords: vi.fn(async () => 0),
  reconcileDisabledRows: vi.fn(async () => undefined),
  getAllDisabledRecords: vi.fn(async () => []),
}));

import {
  mergeRemoteDisabledRecords,
  reconcileDisabledRows,
  getAllDisabledRecords,
} from '@/stores/disabledDefaults';

describe('syncService', () => {
  const mockUser = { uid: 'test-user-123', isAnonymous: false };
  const mockAuth = { currentUser: mockUser };
  let consoleErrorSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAuth).mockReturnValue(mockAuth as any);
    // Auto-mocked module: restore the identity behavior the sync path relies on.
    vi.mocked(canonicalizeTileAction).mockImplementation((record) => record);

    // Suppress expected console.error messages during tests
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation((message: string) => {
      // Allow these specific error messages to be suppressed during testing
      const expectedErrors = [
        'No user logged in',
        'Error syncing game boards:',
        'Error syncing settings:',
        'Error in sync orchestrator:',
      ];

      if (!expectedErrors.some((error) => message.includes(error))) {
        // Only show unexpected errors
        console.warn('Unexpected error in test:', message);
      }
    });

    // Mock Firestore doc to return a proper document reference
    vi.mocked(doc).mockReturnValue({
      id: 'test-user-123',
      path: 'user-data/test-user-123',
    } as any);

    // One write per cycle means every push collects every section, so these
    // sources must answer in all describes, not just the pull ones. Set them
    // here rather than in the factory: the CI config resets mock
    // implementations between tests.
    vi.mocked(getTiles).mockResolvedValue([]);
    vi.mocked(getCustomGroups).mockResolvedValue([]);
    vi.mocked(setDoc).mockResolvedValue(undefined);
    vi.mocked(getBoards).mockResolvedValue([]);
    vi.mocked(getAllDisabledRecords).mockResolvedValue([]);
    vi.mocked(mergeRemoteDisabledRecords).mockResolvedValue(0);
    vi.mocked(reconcileDisabledRows).mockResolvedValue(undefined);
    vi.mocked(useSettingsStore.getState).mockReturnValue({
      settings: {},
      updateSettings: vi.fn(),
    } as any);
  });

  afterEach(() => {
    consoleErrorSpy?.mockRestore();
  });

  describe('syncAllDataToFirebase (one write per push)', () => {
    const mockCustomTiles = [
      {
        id: 1,
        group_id: 'custom-group-id',
        intensity: 1,
        action: 'Custom action',
        tags: [],
        isEnabled: 1,
        isCustom: 1,
        locale: 'en',
        gameMode: 'online',
      },
    ];

    it('publishes every section in a single merge write', async () => {
      const mockUserGroups = [{ id: 1, name: 'My Custom Group', isDefault: false, locale: 'en' }];
      vi.mocked(getTiles).mockImplementation(async (filters: any) =>
        filters?.isCustom === 1 ? (mockCustomTiles as any) : []
      );
      vi.mocked(getCustomGroups).mockImplementation(async (filters: any) =>
        filters?.isDefault === false ? (mockUserGroups as any) : []
      );
      vi.mocked(getBoards).mockResolvedValue([{ title: 'Board', tiles: [], isActive: 1 }] as any);
      vi.mocked(useSettingsStore.getState).mockReturnValue({
        settings: { locale: 'en', localPlayers: [{ name: 'device only' }], gone: undefined },
        updateSettings: vi.fn(),
      } as any);
      vi.mocked(setDoc).mockResolvedValue(undefined);

      const result = await syncAllDataToFirebase();

      expect(result).toBe(true);
      // The whole point of the card: six sequential writes became one.
      expect(setDoc).toHaveBeenCalledTimes(1);
      const [, payload, options] = vi.mocked(setDoc).mock.calls[0] as any[];
      expect(options).toEqual({ merge: true });
      expect(payload.customTiles).toEqual(mockCustomTiles);
      expect(payload.customGroups).toEqual(mockUserGroups);
      expect(payload.customGroupExtensions).toEqual([]);
      expect(payload.disabledDefaultsV2).toEqual([]);
      expect(payload.disabledDefaults).toEqual([]);
      expect(payload.gameBoards).toHaveLength(1);
      expect(payload.lastUpdated).toBeInstanceOf(Date);
      // Device-local and undefined settings never leave the device.
      expect(payload.settings).toEqual({ locale: 'en' });
    });

    it("omits gameBoards when this device has none, so it cannot blank another device's", async () => {
      vi.mocked(getTiles).mockResolvedValue([]);
      vi.mocked(getCustomGroups).mockResolvedValue([]);
      vi.mocked(getBoards).mockResolvedValue([]);
      vi.mocked(setDoc).mockResolvedValue(undefined);

      await syncAllDataToFirebase();

      const payload = vi.mocked(setDoc).mock.calls[0][1] as any;
      expect(payload).not.toHaveProperty('gameBoards');
    });

    it('writes legacy + V2 disabled-default fields, capping the legacy array at 100', async () => {
      const records = Array.from({ length: 120 }, (_, i) => ({
        key: `g1|1|A${i}`,
        group_id: 'g1',
        intensity: 1,
        action: `A${i}`,
        active: true,
        updatedAt: 100,
      }));
      // Include a tombstone that must NOT appear in the legacy (active-only) array.
      records.push({
        key: 'g1|1|T',
        group_id: 'g1',
        intensity: 1,
        action: 'T',
        active: false,
        updatedAt: 100,
      });
      vi.mocked(getTiles).mockResolvedValue([]);
      vi.mocked(getCustomGroups).mockResolvedValue([]);
      vi.mocked(getAllDisabledRecords).mockResolvedValue(records as any);
      vi.mocked(setDoc).mockResolvedValue(undefined);

      const result = await syncAllDataToFirebase();

      expect(result).toBe(true);
      const payload = vi.mocked(setDoc).mock.calls[0][1] as any;
      // V2 carries the full set (active + tombstones).
      expect(payload.disabledDefaultsV2).toHaveLength(121);
      // Legacy carries active-only, capped at 100.
      expect(payload.disabledDefaults).toHaveLength(100);
      expect(payload.disabledDefaults.every((d: any) => d.action !== 'T')).toBe(true);
    });

    it('drops disabled-default records above the V2 cap, loudly', async () => {
      const records = Array.from({ length: 1005 }, (_, i) => ({
        key: `g1|1|A${i}`,
        group_id: 'g1',
        intensity: 1,
        action: `A${i}`,
        active: false,
        updatedAt: 100,
      }));
      vi.mocked(getTiles).mockResolvedValue([]);
      vi.mocked(getCustomGroups).mockResolvedValue([]);
      vi.mocked(getAllDisabledRecords).mockResolvedValue(records as any);
      vi.mocked(setDoc).mockResolvedValue(undefined);
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await syncAllDataToFirebase();

      const payload = vi.mocked(setDoc).mock.calls[0][1] as any;
      expect(payload.disabledDefaultsV2).toHaveLength(1000);
      expect(warnSpy).toHaveBeenCalled();

      warnSpy.mockRestore();
    });

    it('should return false when user is not logged in', async () => {
      vi.mocked(getAuth).mockReturnValue({ currentUser: null } as any);

      const result = await syncAllDataToFirebase();

      expect(result).toBe(false);
      expect(getTiles).not.toHaveBeenCalled();
      expect(setDoc).not.toHaveBeenCalled();
    });

    it('should handle Firebase errors gracefully', async () => {
      vi.mocked(getTiles).mockResolvedValue([]);
      vi.mocked(getCustomGroups).mockResolvedValue([]);
      vi.mocked(setDoc).mockRejectedValue(new Error('Firebase error'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await syncAllDataToFirebase();

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Error syncing data to Firebase:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('pushes only user-created groups, never default ones', async () => {
      vi.mocked(getTiles).mockResolvedValue([]);
      vi.mocked(getCustomGroups).mockImplementation(async (filters: any) =>
        filters?.isDefault === false
          ? ([{ id: 1, name: 'Mine', isDefault: false }] as any)
          : ([{ id: 9, name: 'Default', isDefault: true, intensities: [] }] as any)
      );
      vi.mocked(setDoc).mockResolvedValue(undefined);

      await syncAllDataToFirebase();

      expect(getCustomGroups).toHaveBeenCalledWith({ isDefault: false });
      const payload = vi.mocked(setDoc).mock.calls[0][1] as any;
      expect(payload.customGroups).toEqual([{ id: 1, name: 'Mine', isDefault: false }]);
    });
  });

  describe('syncDataFromFirebase', () => {
    const mockFirebaseData = {
      customTiles: [
        {
          id: 1,
          group_id: 'custom-group-id',
          intensity: 1,
          action: 'Custom action',
          tags: [],
          isEnabled: 1,
          isCustom: 1,
          locale: 'en',
          gameMode: 'online',
        },
      ],
      disabledDefaults: [
        {
          id: 2,
          group_id: 'teasing-group-id',
          intensity: 1,
          action: 'Default action',
          tags: [],
          isEnabled: 0,
          isCustom: 0,
          locale: 'en',
          gameMode: 'online',
        },
      ],
      customGroups: [],
      gameBoards: [],
      settings: {},
    };

    beforeEach(() => {
      const mockDoc = {
        exists: () => true,
        data: () => mockFirebaseData,
      };
      vi.mocked(getDoc).mockResolvedValue(mockDoc as any);
      vi.mocked(deleteAllIsCustomTiles).mockResolvedValue(true);
      vi.mocked(getTiles).mockResolvedValue([]);
      vi.mocked(addCustomTile).mockResolvedValue(1);
      vi.mocked(updateCustomTile).mockResolvedValue(1);
      vi.mocked(deleteGroup).mockResolvedValue({ success: true });
      vi.mocked(getCustomGroups).mockResolvedValue([]);
      vi.mocked(importCustomGroups).mockResolvedValue(undefined);
      vi.mocked(useSettingsStore.getState).mockReturnValue({
        settings: {},
        updateSettings: vi.fn(),
      } as any);
      vi.mocked(getBoards).mockResolvedValue([]);
      // clearAllMocks resets calls, not implementations — reset setDoc so a
      // rejected mock from an earlier test doesn't leak into the push path.
      vi.mocked(setDoc).mockResolvedValue(undefined);
    });

    it('should restore both custom tiles and disabled defaults from Firebase', async () => {
      // Mock getTiles to handle different scenarios
      vi.mocked(getTiles).mockImplementation(async (filters: any) => {
        // For custom tiles duplication check - return empty (no existing duplicates)
        if (
          filters?.gameMode === 'online' &&
          filters?.group_id === 'custom-group-id' &&
          filters?.action === 'Custom action'
        ) {
          return [];
        }
        // For disabled defaults matching - return existing default tile
        if (
          filters?.gameMode === 'online' &&
          filters?.group_id === 'teasing-group-id' &&
          filters?.action === 'Default action'
        ) {
          return [{ id: 100, isEnabled: 1, isCustom: 0 }] as any;
        }
        // Locally-disabled defaults query (matchesLocal / resetDisabledDefaults):
        // nothing is disabled locally yet, so the remote set genuinely differs.
        if (filters?.isCustom === 0 && filters?.isEnabled === 0) {
          return [];
        }
        // For applyDisabledDefaults - return all default tiles
        if (filters?.isCustom === 0) {
          return [
            {
              id: 100,
              isEnabled: 1,
              isCustom: 0,
              gameMode: 'online',
              group_id: 'teasing-group-id',
              intensity: 1,
              action: 'Default action',
            },
          ] as any;
        }
        return [];
      });

      vi.mocked(mergeRemoteDisabledRecords).mockResolvedValueOnce(1);

      const result = await syncDataFromFirebase();

      expect(result).toBe(true);

      // Should clear existing custom tiles
      expect(deleteAllIsCustomTiles).toHaveBeenCalled();

      // Should import custom tiles (no duplicates found)
      // Note: ID is removed to prevent constraint errors with auto-increment primary key
      const { id, ...expectedTile } = mockFirebaseData.customTiles[0];
      void id; // Explicitly ignore the id
      expect(addCustomTile).toHaveBeenCalledWith(expectedTile);

      // Disabled defaults merge per-record (legacy array converted to records),
      // then the row flags are reconciled to the table.
      expect(mergeRemoteDisabledRecords).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ action: 'Default action', active: true }),
        ])
      );
      expect(reconcileDisabledRows).toHaveBeenCalled();
    });

    it('publishes once after every merge, never per entity', async () => {
      // Local content plus different remote content forces the merge path, which
      // used to push from inside each entity sync — three writes racing.
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({
          customTiles: [
            {
              id: 9,
              group_id: 'remote-group-id',
              intensity: 1,
              action: 'Remote action',
              tags: [],
              isEnabled: 1,
              isCustom: 1,
            },
          ],
          customGroups: [],
        }),
      } as any);
      vi.mocked(getTiles).mockImplementation(async (filters: any) =>
        filters?.isCustom === 1
          ? ([
              {
                id: 1,
                group_id: 'local-group-id',
                intensity: 1,
                action: 'Local action',
                isCustom: 1,
              },
            ] as any)
          : []
      );

      const result = await syncDataFromFirebase();

      expect(result).toBe(true);
      expect(addCustomTile).toHaveBeenCalled();
      expect(setDoc).toHaveBeenCalledTimes(1);
    });

    it('keeps extension records for groups this device has not seeded', async () => {
      // CustomGroupExtensionsSync skips an unknown group expecting the record to
      // survive in the cloud; a blind local snapshot would delete it.
      const unseeded = {
        groupName: 'ballBusting',
        locale: 'de',
        gameMode: 'local',
        intensities: [{ value: 5, label: 'Brutal' }],
      };
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({
          customTiles: [],
          customGroupExtensions: [unseeded],
        }),
      } as any);
      // Local content with an empty cloud tiles list forces the cycle to publish.
      vi.mocked(getTiles).mockImplementation(async (filters: any) =>
        filters?.isCustom === 1
          ? ([{ id: 1, group_id: 'g', intensity: 1, action: 'Local', isCustom: 1 }] as any)
          : []
      );

      const result = await syncDataFromFirebase();

      expect(result).toBe(true);
      const payload = vi.mocked(setDoc).mock.calls[0][1] as any;
      expect(payload.customGroupExtensions).toEqual([unseeded]);
    });

    it('does not push when no merge changed anything', async () => {
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => ({ customTiles: [], customGroups: [], disabledDefaultsV2: [], settings: {} }),
      } as any);
      vi.mocked(getTiles).mockResolvedValue([]);
      vi.mocked(getCustomGroups).mockResolvedValue([]);

      const result = await syncDataFromFirebase();

      expect(result).toBe(true);
      // A no-op pull that pushed would echo straight back through the listener.
      expect(setDoc).not.toHaveBeenCalled();
    });

    it('should handle case where disabled defaults are not in Firebase data', async () => {
      const mockDataWithoutDisabled = {
        ...mockFirebaseData,
        disabledDefaults: undefined,
      };

      const mockDoc = {
        exists: () => true,
        data: () => mockDataWithoutDisabled,
      };
      vi.mocked(getDoc).mockResolvedValue(mockDoc as any);

      const result = await syncDataFromFirebase();

      expect(result).toBe(true);
      // Should still work even without disabled defaults
      expect(addCustomTile).toHaveBeenCalledTimes(1); // Only custom tiles
    });

    it('should handle empty custom tiles gracefully', async () => {
      const mockDataEmpty = {
        ...mockFirebaseData,
        customTiles: [],
        disabledDefaults: [],
      };

      const mockDoc = {
        exists: () => true,
        data: () => mockDataEmpty,
      };
      vi.mocked(getDoc).mockResolvedValue(mockDoc as any);

      const result = await syncDataFromFirebase();

      expect(result).toBe(true);
      // Should NOT delete local tiles when Firebase has empty tiles (data loss prevention)
      expect(deleteAllIsCustomTiles).not.toHaveBeenCalled();
      expect(addCustomTile).not.toHaveBeenCalled();
    });

    it('should return false when user document does not exist', async () => {
      const mockDoc = {
        exists: () => false,
      };
      vi.mocked(getDoc).mockResolvedValue(mockDoc as any);

      const result = await syncDataFromFirebase();

      // Now returns true because it syncs local data TO Firebase instead of returning false
      expect(result).toBe(true);
      expect(deleteAllIsCustomTiles).not.toHaveBeenCalled();
    });

    it('should return false when user is not logged in', async () => {
      vi.mocked(getAuth).mockReturnValue({ currentUser: null } as any);

      const result = await syncDataFromFirebase();

      expect(result).toBe(false);
      expect(getDoc).not.toHaveBeenCalled();
    });

    it('should handle Firebase read errors gracefully', async () => {
      vi.mocked(getDoc).mockRejectedValue(new Error('Firebase read error'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await syncDataFromFirebase();

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Error in sync orchestrator:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should use surgical approach to preserve default content', async () => {
      // Mock existing disabled defaults that need to be reset before applying Firebase data
      const mockExistingDisabled = [
        {
          id: 3,
          group_id: 'teasing-group-id',
          intensity: 1,
          action: 'Some old disabled action',
          tags: [],
          isEnabled: 0,
          isCustom: 0,
          locale: 'en',
          gameMode: 'online',
        },
      ];

      // Mock user-created groups that should be cleared
      const mockUserGroups = [
        {
          id: 1,
          title: 'My Custom Group',
          isDefault: false,
          locale: 'en',
        },
      ];

      // Mock Firebase data with disabled defaults that should be applied
      // Note: Empty arrays for customTiles and customGroups will trigger local preservation
      const mockTestFirebaseData = {
        customTiles: [
          { id: 99, action: 'Firebase tile', group_id: 'test-group-id', intensity: 1, isCustom: 1 },
        ],
        disabledDefaults: [
          {
            group_id: 'teasing-group-id',
            intensity: 1,
            action: 'Default action',
            gameMode: 'online',
          },
        ],
        customGroups: [{ id: 88, name: 'Firebase Group', isDefault: false }],
      };

      const mockDoc = {
        exists: () => true,
        data: () => mockTestFirebaseData,
      };
      vi.mocked(getDoc).mockResolvedValue(mockDoc as any);

      // Mock getTiles calls for different scenarios
      vi.mocked(getTiles).mockImplementation(async (filters: any) => {
        if (filters?.isCustom === 1) {
          // Return local custom tiles for conflict resolution
          return [
            {
              id: 1,
              action: 'Local custom tile',
              group_id: 'local-group-id',
              intensity: 1,
              isCustom: 1,
            },
          ] as any;
        }
        if (filters?.isCustom === 0 && filters?.isEnabled === 0) return mockExistingDisabled;
        if (filters?.isCustom === 0 && !('isEnabled' in filters)) {
          // For applyDisabledDefaults - return all default tiles for map building
          return [
            {
              id: 4,
              isEnabled: 1,
              isCustom: 0,
              gameMode: 'online',
              group_id: 'teasing-group-id',
              intensity: 1,
              action: 'Default action',
            },
          ] as any;
        }
        if (filters?.gameMode && filters?.group && filters?.intensity && filters?.action) {
          // For applyDisabledDefaults - finding matching tiles (legacy - not used now)
          return [{ id: 4, isEnabled: 1, isCustom: 0 }] as any;
        }
        return [];
      });

      vi.mocked(getCustomGroups).mockImplementation(async (filters: any) => {
        if (filters?.isDefault === false) return mockUserGroups as any;
        return [];
      });

      vi.mocked(mergeRemoteDisabledRecords).mockResolvedValueOnce(1);

      const result = await syncDataFromFirebase();

      expect(result).toBe(true);

      // Verify merge approach: custom tiles are merged, not deleted (preserves local data)
      expect(deleteAllIsCustomTiles).not.toHaveBeenCalled();
      // Should have added the Firebase tile to the existing local tile
      expect(addCustomTile).toHaveBeenCalled();

      // Verify merge approach: custom groups are merged, not deleted (preserves local data)
      expect(deleteGroup).not.toHaveBeenCalled();
      // Should have added the Firebase group alongside existing local groups
      expect(importCustomGroups).toHaveBeenCalled();

      // Disabled defaults merge per-record then reconcile row flags.
      expect(mergeRemoteDisabledRecords).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ action: 'Default action', active: true }),
        ])
      );
      expect(reconcileDisabledRows).toHaveBeenCalled();
    });

    it('should preserve user disabled actions during sync', async () => {
      // Test the core bug: user disables a default action, logs out, logs back in
      // The disabled action should be preserved, not reset to enabled

      // Mock Firebase data with disabled defaults
      const mockTestFirebaseData = {
        customTiles: [],
        disabledDefaults: [
          {
            group_id: 'teasing-group-id',
            intensity: 1,
            action: 'Default action',
            gameMode: 'online',
          },
        ],
        customGroups: [],
      };

      const mockDoc = {
        exists: () => true,
        data: () => mockTestFirebaseData,
      };
      vi.mocked(getDoc).mockResolvedValue(mockDoc as any);

      // Mock existing default tile that matches the disabled default from Firebase
      vi.mocked(getTiles).mockImplementation(async (filters: any) => {
        if (filters?.isCustom === 0 && !('isEnabled' in filters)) {
          // For applyDisabledDefaults - return all default tiles for map building
          return [
            {
              id: 200,
              isEnabled: 1,
              isCustom: 0,
              gameMode: 'online',
              group_id: 'teasing-group-id',
              intensity: 1,
              action: 'Default action',
            },
          ] as any;
        }
        if (filters?.gameMode && filters?.group && filters?.intensity && filters?.action) {
          // For applyDisabledDefaults - finding matching tiles (legacy - not used now)
          return [{ id: 200, isEnabled: 1, isCustom: 0 }] as any;
        }
        return [];
      });

      vi.mocked(mergeRemoteDisabledRecords).mockResolvedValueOnce(1);

      const result = await syncDataFromFirebase();

      expect(result).toBe(true);

      // The disabled default from Firebase is merged as an active record, then
      // reconciled onto the matching local default row.
      expect(mergeRemoteDisabledRecords).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ action: 'Default action', active: true }),
        ])
      );
      expect(reconcileDisabledRows).toHaveBeenCalled();
    });

    it('should handle missing disabledDefaults field in Firebase data gracefully', async () => {
      // Test backward compatibility - older Firebase data without disabledDefaults
      const mockDataWithoutDisabled = {
        customTiles: mockFirebaseData.customTiles,
        customGroups: mockFirebaseData.customGroups,
        // No disabledDefaults field
      };

      const mockDoc = {
        exists: () => true,
        data: () => mockDataWithoutDisabled,
      };
      vi.mocked(getDoc).mockResolvedValue(mockDoc as any);

      const result = await syncDataFromFirebase();

      expect(result).toBe(true);
      // Should not call any disabled defaults functions when the field doesn't exist
      expect(updateCustomTile).not.toHaveBeenCalled();
    });

    it('should handle empty disabledDefaults array correctly', async () => {
      const mockDataWithEmptyDisabled = {
        ...mockFirebaseData,
        disabledDefaults: [],
      };

      const mockDoc = {
        exists: () => true,
        data: () => mockDataWithEmptyDisabled,
      };
      vi.mocked(getDoc).mockResolvedValue(mockDoc as any);

      const result = await syncDataFromFirebase();

      expect(result).toBe(true);
      // An empty remote list is a no-op merge — re-enables now propagate via
      // tombstones, not via absence — so no rows are touched.
      expect(mergeRemoteDisabledRecords).toHaveBeenCalledWith([]);
      expect(reconcileDisabledRows).not.toHaveBeenCalled();
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete login workflow without data loss', async () => {
      // Simulate user workflow:
      // 1. User disables some default actions
      // 2. User creates custom actions
      // 3. User logs out and logs back in
      // 4. All actions should be preserved

      const mockCustomTiles = [
        {
          id: 1,
          group_id: 'custom-group-id',
          intensity: 1,
          action: 'User created action',
          tags: [],
          isEnabled: 1,
          isCustom: 1,
          locale: 'en',
          gameMode: 'online',
        },
      ];

      const mockDisabledDefaults = [
        {
          id: 2,
          group_id: 'teasing-group-id',
          intensity: 1,
          action: 'User disabled this default',
          tags: [],
          isEnabled: 0,
          isCustom: 0,
          locale: 'en',
          gameMode: 'online',
        },
      ];

      // Mock the upload (when user logs out)
      vi.mocked(getTiles).mockImplementation(async (filters: any) => {
        if (filters?.isCustom === 1) return mockCustomTiles;
        if (filters?.isCustom === 0 && filters?.isEnabled === 0) return mockDisabledDefaults;
        return [];
      });

      vi.mocked(setDoc).mockResolvedValue(undefined);

      // Test upload
      const uploadResult = await syncAllDataToFirebase();
      expect(uploadResult).toBe(true);

      // Mock the download (when user logs back in)
      const mockFirebaseData = {
        customTiles: mockCustomTiles,
        disabledDefaults: mockDisabledDefaults,
      };

      const mockDoc = {
        exists: () => true,
        data: () => mockFirebaseData,
      };
      vi.mocked(getDoc).mockResolvedValue(mockDoc as any);
      vi.mocked(deleteAllIsCustomTiles).mockResolvedValue(true);
      vi.mocked(getTiles).mockResolvedValue([]);
      vi.mocked(addCustomTile).mockResolvedValue(1);

      // Mock getTiles for the download test
      vi.mocked(getTiles).mockImplementation(async (filters: any) => {
        // For custom tiles duplication check - return empty (no existing duplicates)
        if (
          filters?.gameMode === 'online' &&
          filters?.group === 'custom-group' &&
          filters?.action === 'User created action'
        ) {
          return [];
        }
        // For applyDisabledDefaults - return all default tiles for map building
        if (filters?.isCustom === 0 && !('isEnabled' in filters)) {
          return [
            {
              id: 300,
              isEnabled: 1,
              isCustom: 0,
              gameMode: 'online',
              group_id: 'teasing-group-id',
              intensity: 1,
              action: 'User disabled this default',
            },
          ] as any;
        }
        // For disabled defaults matching - return existing default tile (legacy)
        if (
          filters?.gameMode === 'online' &&
          filters?.group === 'teasing' &&
          filters?.action === 'User disabled this default'
        ) {
          return [{ id: 300, isEnabled: 1, isCustom: 0 }] as any;
        }
        // For resetDisabledDefaults - return empty (no disabled tiles to reset)
        if (filters?.isCustom === 0 && filters?.isEnabled === 0) {
          return [];
        }
        return [];
      });

      vi.mocked(mergeRemoteDisabledRecords).mockResolvedValueOnce(1);

      // Test download
      const downloadResult = await syncDataFromFirebase();
      expect(downloadResult).toBe(true);

      // Verify custom tiles are restored
      // Note: ID is removed to prevent constraint errors with auto-increment primary key
      const { id, ...expectedTile } = mockCustomTiles[0];
      void id; // Explicitly ignore the id
      expect(addCustomTile).toHaveBeenCalledWith(expectedTile);

      // Verify disabled defaults are merged into the first-class table + reconciled
      expect(mergeRemoteDisabledRecords).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ action: 'User disabled this default', active: true }),
        ])
      );
      expect(reconcileDisabledRows).toHaveBeenCalled();
    });
  });

  describe('subscribeToUserData (real-time pull)', () => {
    let capturedSnapshotHandler: ((snap: any) => void) | null;

    beforeEach(() => {
      capturedSnapshotHandler = null;
      vi.mocked(onSnapshot).mockImplementation((_ref: any, next: any) => {
        capturedSnapshotHandler = next;
        return () => undefined;
      });
      // Empty doc → orchestrator reads it via getDoc; lets us detect a pull.
      vi.mocked(getDoc).mockResolvedValue({ exists: () => true, data: () => ({}) } as any);
    });

    it('does not register a listener for anonymous users', () => {
      vi.mocked(getAuth).mockReturnValue({
        currentUser: { uid: 'x', isAnonymous: true },
      } as any);
      subscribeToUserData();
      expect(onSnapshot).not.toHaveBeenCalled();
    });

    it('ignores snapshots from our own pending writes (echo guard)', async () => {
      subscribeToUserData();
      expect(onSnapshot).toHaveBeenCalledTimes(1);

      capturedSnapshotHandler?.({
        metadata: { hasPendingWrites: true },
        exists: () => true,
        data: () => ({}),
      });
      await Promise.resolve();

      expect(getDoc).not.toHaveBeenCalled();
    });

    it('pulls on a genuine remote change', async () => {
      subscribeToUserData();

      capturedSnapshotHandler?.({
        metadata: { hasPendingWrites: false },
        exists: () => true,
        data: () => ({}),
      });
      // Allow the async syncDataFromFirebase chain (dynamic import) to settle.
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(getDoc).toHaveBeenCalled();
    });
  });
});
