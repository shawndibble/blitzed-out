import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  validateCustomGroup,
  validateGroupLabel,
  getValidationConstants,
} from '../validationService';
import { CustomGroupBase } from '@/types/customGroups';

// Mock the getAllAvailableGroups function
vi.mock('@/stores/customGroups', () => ({
  getAllAvailableGroups: vi.fn(),
}));

import { getAllAvailableGroups } from '@/stores/customGroups';

describe('validationService', () => {
  const validGroup: CustomGroupBase = {
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getValidationConstants', () => {
    it('should return validation constants', () => {
      const constants = getValidationConstants();

      expect(constants).toHaveProperty('MIN_INTENSITIES_COUNT');
      expect(constants).toHaveProperty('MAX_INTENSITIES_COUNT');
      expect(constants).toHaveProperty('MAX_GROUP_LABEL_LENGTH');
      expect(constants).toHaveProperty('MAX_INTENSITY_LABEL_LENGTH');
      expect(constants).toHaveProperty('VALID_GROUP_TYPES');

      expect(typeof constants.MIN_INTENSITIES_COUNT).toBe('number');
      expect(typeof constants.MAX_INTENSITIES_COUNT).toBe('number');
      expect(typeof constants.MAX_GROUP_LABEL_LENGTH).toBe('number');
      expect(typeof constants.MAX_INTENSITY_LABEL_LENGTH).toBe('number');
      expect(Array.isArray(constants.VALID_GROUP_TYPES)).toBe(true);
      expect(constants.VALID_GROUP_TYPES).toEqual(['solo', 'foreplay', 'sex', 'consumption']);

      expect(constants.MIN_INTENSITIES_COUNT).toBeGreaterThan(0);
      expect(constants.MAX_INTENSITIES_COUNT).toBeGreaterThan(constants.MIN_INTENSITIES_COUNT);
    });
  });

  describe('validateGroupLabel', () => {
    it('should validate a valid label', () => {
      const result = validateGroupLabel('Valid Group Name');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty label', () => {
      const result = validateGroupLabel('');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Group label is required');
    });

    it('should reject label with only whitespace', () => {
      const result = validateGroupLabel('   ');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Group label is required');
    });

    it('should reject label that is too long', () => {
      const constants = getValidationConstants();
      const longLabel = 'a'.repeat(constants.MAX_GROUP_LABEL_LENGTH + 1);
      const result = validateGroupLabel(longLabel);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        `Group label must be ${constants.MAX_GROUP_LABEL_LENGTH} characters or less`
      );
    });

    it('should accept label at maximum length', () => {
      const constants = getValidationConstants();
      const maxLabel = 'a'.repeat(constants.MAX_GROUP_LABEL_LENGTH);
      const result = validateGroupLabel(maxLabel);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject label with invalid characters', () => {
      const result = validateGroupLabel('Invalid<>Name');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Group label contains invalid characters');
    });

    it('should accept label with valid special characters', () => {
      const result = validateGroupLabel('Valid Name - Test (2024)');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validateCustomGroup', () => {
    it('should validate a complete valid group', async () => {
      vi.mocked(getAllAvailableGroups).mockResolvedValue([]);

      const result = await validateCustomGroup(validGroup);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject group with invalid label', async () => {
      vi.mocked(getAllAvailableGroups).mockResolvedValue([]);
      const invalidGroup = { ...validGroup, label: '' };

      const result = await validateCustomGroup(invalidGroup);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Group label is required');
    });

    it('should reject group without name', async () => {
      vi.mocked(getAllAvailableGroups).mockResolvedValue([]);
      const invalidGroup = { ...validGroup, name: '' };

      const result = await validateCustomGroup(invalidGroup);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Group name is required');
    });

    it('should reject group without intensities', async () => {
      vi.mocked(getAllAvailableGroups).mockResolvedValue([]);
      const invalidGroup = { ...validGroup, intensities: [] };

      const result = await validateCustomGroup(invalidGroup);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('At least 2 intensity levels are required');
    });

    it('should reject group with too few intensities', async () => {
      vi.mocked(getAllAvailableGroups).mockResolvedValue([]);
      const invalidGroup = {
        ...validGroup,
        intensities: [{ id: '1', label: 'Only One', value: 1, isDefault: false }],
      };

      const result = await validateCustomGroup(invalidGroup);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('At least 2 intensity levels are required');
    });

    it('should reject group with too many intensities', async () => {
      vi.mocked(getAllAvailableGroups).mockResolvedValue([]);
      const constants = getValidationConstants();
      const tooManyIntensities = Array.from(
        { length: constants.MAX_INTENSITIES_COUNT + 1 },
        (_, i) => ({
          id: `${i + 1}`,
          label: `Level ${i + 1}`,
          value: i + 1,
          isDefault: false,
        })
      );
      const invalidGroup = { ...validGroup, intensities: tooManyIntensities };

      const result = await validateCustomGroup(invalidGroup);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        `Maximum ${constants.MAX_INTENSITIES_COUNT} intensity levels allowed`
      );
    });

    it('should reject group with duplicate intensity values', async () => {
      vi.mocked(getAllAvailableGroups).mockResolvedValue([]);
      const invalidGroup = {
        ...validGroup,
        intensities: [
          { id: '1', label: 'First', value: 1, isDefault: false },
          { id: '2', label: 'Second', value: 1, isDefault: false }, // Duplicate value
        ],
      };

      const result = await validateCustomGroup(invalidGroup);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Intensity values must be unique');
    });

    it('should reject group with duplicate intensity labels', async () => {
      vi.mocked(getAllAvailableGroups).mockResolvedValue([]);
      const invalidGroup = {
        ...validGroup,
        intensities: [
          { id: '1', label: 'Same Label', value: 1, isDefault: false },
          { id: '2', label: 'Same Label', value: 2, isDefault: false }, // Duplicate label
        ],
      };

      const result = await validateCustomGroup(invalidGroup);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Intensity labels must be unique');
    });

    it('should reject group with invalid type', async () => {
      vi.mocked(getAllAvailableGroups).mockResolvedValue([]);
      const invalidGroup = { ...validGroup, type: 'invalid-type' as any };

      const result = await validateCustomGroup(invalidGroup);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid group type');
    });

    it('should accept group with valid type', async () => {
      vi.mocked(getAllAvailableGroups).mockResolvedValue([]);
      const constants = getValidationConstants();

      for (const type of constants.VALID_GROUP_TYPES) {
        const testGroup = { ...validGroup, type };
        const result = await validateCustomGroup(testGroup);

        expect(result.isValid).toBe(true);
      }
    });

    it('should reject group with name conflict (excluding current group)', async () => {
      const existingGroup = {
        id: 'existing-id',
        name: 'testGroup',
        label: 'Existing Group',
        intensities: [],
        locale: 'en',
        gameMode: 'online',
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(getAllAvailableGroups).mockResolvedValue([existingGroup]);

      const result = await validateCustomGroup(validGroup);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('A group with this name already exists');
    });

    it('should allow group with same name when updating existing group', async () => {
      const existingGroup = {
        id: 'existing-id',
        name: 'testGroup',
        label: 'Existing Group',
        intensities: [],
        locale: 'en',
        gameMode: 'online',
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(getAllAvailableGroups).mockResolvedValue([existingGroup]);

      const result = await validateCustomGroup(validGroup, 'existing-id');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject intensity labels that are too long', async () => {
      vi.mocked(getAllAvailableGroups).mockResolvedValue([]);
      const constants = getValidationConstants();
      const longLabel = 'a'.repeat(constants.MAX_INTENSITY_LABEL_LENGTH + 1);
      const invalidGroup = {
        ...validGroup,
        intensities: [
          { id: '1', label: longLabel, value: 1, isDefault: false },
          { id: '2', label: 'Valid', value: 2, isDefault: false },
        ],
      };

      const result = await validateCustomGroup(invalidGroup);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(`Intensity label "${longLabel}" is too long`);
    });

    it('should reject empty intensity labels', async () => {
      vi.mocked(getAllAvailableGroups).mockResolvedValue([]);
      const invalidGroup = {
        ...validGroup,
        intensities: [
          { id: '1', label: '', value: 1, isDefault: false },
          { id: '2', label: 'Valid', value: 2, isDefault: false },
        ],
      };

      const result = await validateCustomGroup(invalidGroup);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Intensity labels cannot be empty');
    });
  });
});
