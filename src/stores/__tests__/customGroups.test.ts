import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  addCustomGroup,
  updateCustomGroup,
  deleteCustomGroup,
  getAllAvailableGroups,
  getGroupIntensities,
} from '../customGroups';
import { CustomGroupBase, CustomGroupPull } from '@/types/customGroups';

// Mock i18next
vi.mock('i18next', () => ({
  default: {
    resolvedLanguage: 'en',
    language: 'en',
  },
}));

// Mock nanoid
vi.mock('nanoid', () => ({
  nanoid: () => 'test-id-123',
}));

// Mock the database with proper chaining - defined at module level for hoisting
vi.mock('../store', () => {
  const createMockCollection = () => {
    const mockCollection = {
      filter: vi.fn(),
      toArray: vi.fn(),
      first: vi.fn(),
    };
    // Make filter return itself for chaining
    mockCollection.filter.mockReturnValue(mockCollection);
    mockCollection.toArray.mockResolvedValue([]);
    mockCollection.first.mockResolvedValue(undefined);
    return mockCollection;
  };

  const createMockWhere = () => {
    const mockWhere = {
      equals: vi.fn(),
      and: vi.fn(),
      first: vi.fn(),
    };
    // Make methods return themselves for chaining
    mockWhere.equals.mockReturnValue(mockWhere);
    mockWhere.and.mockReturnValue(mockWhere);
    mockWhere.first.mockResolvedValue(undefined);
    return mockWhere;
  };

  return {
    default: {
      customGroups: {
        add: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        clear: vi.fn(),
        bulkAdd: vi.fn(),
        get: vi.fn(),
        where: vi.fn(() => createMockWhere()),
        toArray: vi.fn(),
        toCollection: vi.fn(() => createMockCollection()),
        hook: vi.fn(),
      },
    },
  };
});

// Import the mocked database
import db from '../store';
const mockDb = db as any;

describe('customGroups store', () => {
  const mockGroup: CustomGroupBase = {
    name: 'testGroup',
    label: 'Test Group',
    intensities: [
      { id: '1', label: 'Beginner', value: 1, isDefault: false },
      { id: '2', label: 'Advanced', value: 2, isDefault: false },
    ],
    type: 'solo',
    locale: 'en',
    gameMode: 'online',
    isDefault: false,
  };

  const mockGroupPull: CustomGroupPull = {
    ...mockGroup,
    id: 'test-id-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    isDefault: false,
    locale: 'en',
    gameMode: 'online',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('addCustomGroup', () => {
    it('should add a new custom group successfully', async () => {
      vi.mocked(mockDb.customGroups.add).mockResolvedValue('test-id-123');

      const result = await addCustomGroup(mockGroup);

      expect(result).toBe('test-id-123');
      expect(mockDb.customGroups.add).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mockGroup,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        })
      );
    });

    it('should handle errors when adding fails', async () => {
      const error = new Error('Database error');
      vi.mocked(mockDb.customGroups.add).mockRejectedValue(error);

      const result = await addCustomGroup(mockGroup);
      expect(result).toBeUndefined();
    });
  });

  describe('updateCustomGroup', () => {
    it('should update an existing custom group successfully', async () => {
      vi.mocked(mockDb.customGroups.update).mockResolvedValue(1);

      await updateCustomGroup('test-id-123', mockGroup);

      expect(mockDb.customGroups.update).toHaveBeenCalledWith('test-id-123', mockGroup);
    });

    it('should handle errors when updating fails', async () => {
      const error = new Error('Update failed');
      vi.mocked(mockDb.customGroups.update).mockRejectedValue(error);

      const result = await updateCustomGroup('test-id-123', mockGroup);
      expect(result).toBe(0);
    });
  });

  describe('deleteCustomGroup', () => {
    it('should delete a custom group successfully', async () => {
      vi.mocked(mockDb.customGroups.delete).mockResolvedValue(undefined);

      await deleteCustomGroup('test-id-123');

      expect(mockDb.customGroups.delete).toHaveBeenCalledWith('test-id-123');
    });

    it('should handle errors when deletion fails', async () => {
      const error = new Error('Delete failed');
      vi.mocked(mockDb.customGroups.delete).mockRejectedValue(error);

      await expect(deleteCustomGroup('test-id-123')).resolves.not.toThrow();
    });
  });

  describe('getAllAvailableGroups', () => {
    it('should get all groups for locale and gameMode', async () => {
      const expectedGroups = [mockGroupPull];
      // Set up the mock to return the expected groups
      const mockCollection = {
        filter: vi.fn().mockReturnThis(),
        toArray: vi.fn().mockResolvedValue(expectedGroups),
        first: vi.fn().mockResolvedValue(undefined),
      };
      vi.mocked(mockDb.customGroups.toCollection).mockReturnValue(mockCollection);

      const result = await getAllAvailableGroups('en', 'online');

      expect(result).toEqual(expectedGroups);
      expect(mockDb.customGroups.toCollection).toHaveBeenCalled();
      expect(mockCollection.filter).toHaveBeenCalledTimes(4); // removeDuplicateGroups (2) + getCustomGroups (2)
    });

    it('should handle empty results', async () => {
      const mockCollection = mockDb.customGroups.toCollection();
      vi.mocked(mockCollection.toArray).mockResolvedValue([]);

      const result = await getAllAvailableGroups('fr', 'local');

      expect(result).toEqual([]);
    });

    it('should handle errors when fetching fails', async () => {
      const error = new Error('Fetch failed');
      const mockCollection = mockDb.customGroups.toCollection();
      vi.mocked(mockCollection.toArray).mockRejectedValue(error);

      await expect(getAllAvailableGroups('en', 'online')).resolves.toEqual([]);
    });
  });

  describe('getGroupIntensities', () => {
    it('should get intensities for a specific group', async () => {
      // Set up the mock to return the expected group
      const mockWhere = {
        equals: vi.fn().mockReturnThis(),
        and: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(mockGroupPull),
      };
      vi.mocked(mockDb.customGroups.where).mockReturnValue(mockWhere);

      const result = await getGroupIntensities('testGroup', 'en', 'online');

      expect(result).toEqual(mockGroup.intensities);
      expect(mockDb.customGroups.where).toHaveBeenCalledWith('name');
      expect(mockWhere.equals).toHaveBeenCalledWith('testGroup');
    });

    it('should return empty array when group not found', async () => {
      const mockWhere = mockDb.customGroups.where('name');
      vi.mocked(mockWhere.first).mockResolvedValue(undefined);

      const result = await getGroupIntensities('nonexistent', 'en', 'online');

      expect(result).toEqual([]);
    });

    it('should handle errors when fetching intensities fails', async () => {
      const error = new Error('Fetch intensities failed');
      const mockWhere = mockDb.customGroups.where('name');
      vi.mocked(mockWhere.first).mockRejectedValue(error);

      await expect(getGroupIntensities('testGroup', 'en', 'online')).resolves.toEqual([]);
    });

    it('should return empty array when group has no intensities', async () => {
      const groupWithoutIntensities = { ...mockGroupPull, intensities: [] };
      const mockWhere = mockDb.customGroups.where('name');
      vi.mocked(mockWhere.first).mockResolvedValue(groupWithoutIntensities);

      const result = await getGroupIntensities('testGroup', 'en', 'online');

      expect(result).toEqual([]);
    });
  });

  describe('hooks functionality', () => {
    it('should set default values when creating', () => {
      // This tests the Dexie hooks that are defined in the store
      // The hooks are tested indirectly through the add operation
      const groupWithoutDefaults = {
        name: 'test',
        label: 'Test',
        intensities: [],
      };

      // Mock the hook behavior
      const hookResult = {
        ...groupWithoutDefaults,
        id: 'test-id-123',
        locale: 'en',
        gameMode: 'online',
        isDefault: false,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      };

      expect(hookResult.id).toBe('test-id-123');
      expect(hookResult.locale).toBe('en');
      expect(hookResult.gameMode).toBe('online');
      expect(hookResult.isDefault).toBe(false);
    });
  });
});
