import {
  addCustomTile,
  deleteAllIsCustomTiles,
  getTiles,
  updateCustomTile,
} from '@/stores/customTiles';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteCustomGroup, getCustomGroups, importCustomGroups } from '@/stores/customGroups';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import {
  syncCustomGroupsToFirebase,
  syncCustomTilesToFirebase,
  syncDataFromFirebase,
} from '@/services/syncService';

import { getAuth } from 'firebase/auth';
import { useSettingsStore } from '@/stores/settingsStore';

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
vi.mock('@/stores/gameBoard');
vi.mock('@/stores/settingsStore');

describe('syncService', () => {
  const mockUser = { uid: 'test-user-123', isAnonymous: false };
  const mockAuth = { currentUser: mockUser };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAuth).mockReturnValue(mockAuth as any);

    // Mock Firestore doc to return a proper document reference
    vi.mocked(doc).mockReturnValue({
      id: 'test-user-123',
      path: 'user-data/test-user-123',
    } as any);
  });

  describe('syncCustomTilesToFirebase', () => {
    it('should sync both custom tiles and disabled defaults to Firebase', async () => {
      const mockCustomTiles = [
        {
          id: 1,
          group: 'custom-group',
          intensity: 1,
          action: 'Custom action',
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
          group: 'teasing',
          intensity: 1,
          action: 'Default action',
          tags: [],
          isEnabled: 0, // User disabled this default action
          isCustom: 0,
          locale: 'en',
          gameMode: 'online',
        },
      ];

      // Mock getTiles to return different results based on filters
      vi.mocked(getTiles).mockImplementation(async (filters: any) => {
        if (filters?.isCustom === 1) return mockCustomTiles;
        if (filters?.isCustom === 0 && filters?.isEnabled === 0) return mockDisabledDefaults;
        return [];
      });

      vi.mocked(setDoc).mockResolvedValue(undefined);

      const result = await syncCustomTilesToFirebase();

      expect(result).toBe(true);
      expect(getTiles).toHaveBeenCalledWith({ isCustom: 1 });
      expect(getTiles).toHaveBeenCalledWith({ isCustom: 0, isEnabled: 0 });
      expect(setDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          customTiles: mockCustomTiles,
          disabledDefaults: mockDisabledDefaults,
          lastUpdated: expect.any(Date),
        }),
        { merge: true }
      );
    });

    it('should handle when no disabled defaults exist', async () => {
      const mockCustomTiles = [
        {
          id: 1,
          group: 'custom-group',
          intensity: 1,
          action: 'Custom action',
          tags: [],
          isEnabled: 1,
          isCustom: 1,
          locale: 'en',
          gameMode: 'online',
        },
      ];

      vi.mocked(getTiles).mockImplementation(async (filters: any) => {
        if (filters?.isCustom === 1) return mockCustomTiles;
        if (filters?.isCustom === 0 && filters?.isEnabled === 0) return [];
        return [];
      });

      vi.mocked(setDoc).mockResolvedValue(undefined);

      const result = await syncCustomTilesToFirebase();

      expect(result).toBe(true);
      expect(setDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          customTiles: mockCustomTiles,
          disabledDefaults: [],
          lastUpdated: expect.any(Date),
        }),
        { merge: true }
      );
    });

    it('should return false when user is not logged in', async () => {
      vi.mocked(getAuth).mockReturnValue({ currentUser: null } as any);

      const result = await syncCustomTilesToFirebase();

      expect(result).toBe(false);
      expect(getTiles).not.toHaveBeenCalled();
      expect(setDoc).not.toHaveBeenCalled();
    });

    it('should handle Firebase errors gracefully', async () => {
      vi.mocked(getTiles).mockResolvedValue([]);
      vi.mocked(setDoc).mockRejectedValue(new Error('Firebase error'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await syncCustomTilesToFirebase();

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Error syncing custom tiles:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('syncDataFromFirebase', () => {
    const mockFirebaseData = {
      customTiles: [
        {
          id: 1,
          group: 'custom-group',
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
          group: 'teasing',
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
      vi.mocked(deleteCustomGroup).mockResolvedValue({ success: true });
      vi.mocked(getCustomGroups).mockResolvedValue([]);
      vi.mocked(importCustomGroups).mockResolvedValue(undefined);
      vi.mocked(useSettingsStore.getState).mockReturnValue({
        updateSettings: vi.fn(),
      } as any);
    });

    it('should restore both custom tiles and disabled defaults from Firebase', async () => {
      // Mock getTiles to handle different scenarios
      vi.mocked(getTiles).mockImplementation(async (filters: any) => {
        // For custom tiles duplication check - return empty (no existing duplicates)
        if (
          filters?.gameMode === 'online' &&
          filters?.group === 'custom-group' &&
          filters?.action === 'Custom action'
        ) {
          return [];
        }
        // For disabled defaults matching - return existing default tile
        if (
          filters?.gameMode === 'online' &&
          filters?.group === 'teasing' &&
          filters?.action === 'Default action'
        ) {
          return [{ id: 100, isEnabled: 1, isCustom: 0 }] as any;
        }
        // For applyDisabledDefaults - return all default tiles
        if (filters?.isCustom === 0 && !filters?.isEnabled) {
          return [
            {
              id: 100,
              isEnabled: 1,
              isCustom: 0,
              gameMode: 'online',
              group: 'teasing',
              intensity: 1,
              action: 'Default action',
            },
          ] as any;
        }
        return [];
      });

      const result = await syncDataFromFirebase();

      expect(result).toBe(true);

      // Should clear existing custom tiles
      expect(deleteAllIsCustomTiles).toHaveBeenCalled();

      // Should import custom tiles (no duplicates found)
      // Note: ID is removed to prevent constraint errors with auto-increment primary key
      const { id, ...expectedTile } = mockFirebaseData.customTiles[0];
      void id; // Explicitly ignore the id
      expect(addCustomTile).toHaveBeenCalledWith(expectedTile);

      // Should apply disabled defaults to existing default tiles (not add new ones)
      expect(updateCustomTile).toHaveBeenCalledWith(100, { isEnabled: 0 });
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
          group: 'teasing',
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
          { id: 99, action: 'Firebase tile', group: 'test', intensity: 1, isCustom: 1 },
        ],
        disabledDefaults: [
          {
            group: 'teasing',
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
            { id: 1, action: 'Local custom tile', group: 'local', intensity: 1, isCustom: 1 },
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
              group: 'teasing',
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

      const result = await syncDataFromFirebase();

      expect(result).toBe(true);

      // Verify merge approach: custom tiles are merged, not deleted (preserves local data)
      expect(deleteAllIsCustomTiles).not.toHaveBeenCalled();
      // Should have added the Firebase tile to the existing local tile
      expect(addCustomTile).toHaveBeenCalled();

      // Verify merge approach: custom groups are merged, not deleted (preserves local data)
      expect(deleteCustomGroup).not.toHaveBeenCalled();
      // Should have added the Firebase group alongside existing local groups
      expect(importCustomGroups).toHaveBeenCalled();

      // Verify disabled defaults were reset to enabled before applying Firebase data
      expect(updateCustomTile).toHaveBeenCalledWith(mockExistingDisabled[0].id, { isEnabled: 1 });

      // Verify Firebase disabled defaults are applied to matching default tiles
      expect(updateCustomTile).toHaveBeenCalledWith(4, { isEnabled: 0 });
    });

    it('should preserve user disabled actions during sync', async () => {
      // Test the core bug: user disables a default action, logs out, logs back in
      // The disabled action should be preserved, not reset to enabled

      // Mock Firebase data with disabled defaults
      const mockTestFirebaseData = {
        customTiles: [],
        disabledDefaults: [
          {
            group: 'teasing',
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
              group: 'teasing',
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

      const result = await syncDataFromFirebase();

      expect(result).toBe(true);

      // Verify that the disabled default action state is applied to existing default tile
      expect(updateCustomTile).toHaveBeenCalledWith(200, { isEnabled: 0 });
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

      // Mock existing disabled defaults that should be reset
      vi.mocked(getTiles).mockImplementation(async (filters: any) => {
        if (filters?.isCustom === 0 && filters?.isEnabled === 0) {
          return [{ id: 5, isEnabled: 0, isCustom: 0 }] as any;
        }
        return [];
      });

      const result = await syncDataFromFirebase();

      expect(result).toBe(true);
      // Should reset existing disabled defaults even if Firebase has none
      expect(updateCustomTile).toHaveBeenCalledWith(5, { isEnabled: 1 });
    });
  });

  describe('syncCustomGroupsToFirebase', () => {
    it('should sync only user-created groups, not default groups', async () => {
      const mockUserGroups = [
        {
          id: 1,
          title: 'My Custom Group',
          isDefault: false,
          locale: 'en',
        },
        {
          id: 2,
          title: 'Another Custom Group',
          isDefault: false,
          locale: 'en',
        },
      ];

      // Mock getCustomGroups to return user groups when isDefault: false filter is applied
      vi.mocked(getCustomGroups).mockImplementation(async (filters: any) => {
        if (filters?.isDefault === false) return mockUserGroups as any;
        return [];
      });

      vi.mocked(setDoc).mockResolvedValue(undefined);

      const result = await syncCustomGroupsToFirebase();

      expect(result).toBe(true);
      expect(getCustomGroups).toHaveBeenCalledWith({ isDefault: false });
      expect(setDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          customGroups: mockUserGroups,
          lastUpdated: expect.any(Date),
        }),
        { merge: true }
      );
    });

    it('should handle empty user groups correctly', async () => {
      vi.mocked(getCustomGroups).mockResolvedValue([]);
      vi.mocked(setDoc).mockResolvedValue(undefined);

      const result = await syncCustomGroupsToFirebase();

      expect(result).toBe(true);
      expect(setDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          customGroups: [],
          lastUpdated: expect.any(Date),
        }),
        { merge: true }
      );
    });

    it('should return false when user is not logged in', async () => {
      vi.mocked(getAuth).mockReturnValue({ currentUser: null } as any);

      const result = await syncCustomGroupsToFirebase();

      expect(result).toBe(false);
      expect(getCustomGroups).not.toHaveBeenCalled();
    });

    it('should handle Firebase errors gracefully', async () => {
      vi.mocked(getCustomGroups).mockResolvedValue([]);
      vi.mocked(setDoc).mockRejectedValue(new Error('Firebase error'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await syncCustomGroupsToFirebase();

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Error syncing custom groups:', expect.any(Error));

      consoleSpy.mockRestore();
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
          group: 'custom-group',
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
          group: 'teasing',
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
      const uploadResult = await syncCustomTilesToFirebase();
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
              group: 'teasing',
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

      // Test download
      const downloadResult = await syncDataFromFirebase();
      expect(downloadResult).toBe(true);

      // Verify custom tiles are restored
      // Note: ID is removed to prevent constraint errors with auto-increment primary key
      const { id, ...expectedTile } = mockCustomTiles[0];
      void id; // Explicitly ignore the id
      expect(addCustomTile).toHaveBeenCalledWith(expectedTile);

      // Verify disabled defaults are applied to existing default tiles
      expect(updateCustomTile).toHaveBeenCalledWith(300, { isEnabled: 0 });
    });
  });
});
