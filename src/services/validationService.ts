import { ValidationResult, CustomGroupBase, CustomGroupIntensity } from '@/types/customGroups';
import { CustomTile } from '@/types/customTiles';
import { isGroupNameUnique, getCustomGroupByName } from '@/stores/customGroups';

/**
 * Validation service for custom groups and tiles
 */

// Constants for validation rules
const MAX_GROUP_NAME_LENGTH = 50;
const MAX_GROUP_LABEL_LENGTH = 100;
const MAX_INTENSITY_LABEL_LENGTH = 50;
const MIN_INTENSITY_VALUE = 1;
const MAX_INTENSITY_VALUE = 10;
const MIN_INTENSITIES_COUNT = 1;
const MAX_INTENSITIES_COUNT = 10;

// Reserved group names that cannot be used for custom groups
// Only includes names that would cause technical issues or UX confusion
const RESERVED_GROUP_NAMES = [
  'none', // Used in UI for "select none" operations
  'all', // Used in UI for "select all" operations
  'default', // Aligns with isDefault system property
  'undefined', // JavaScript reserved word
  'null', // JavaScript reserved word
];

// Valid group types for custom groups
const VALID_GROUP_TYPES = ['solo', 'foreplay', 'sex', 'consumption'] as const;

// Export type for group types
export type GroupType = (typeof VALID_GROUP_TYPES)[number];

/**
 * Validate a custom group name
 */
export const validateGroupName = (
  name: string,
  _locale = 'en',
  _gameMode = 'online',
  _excludeId?: string
): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if name is provided
  if (!name || name.trim().length === 0) {
    errors.push('Group name is required');
    return { isValid: false, errors, warnings };
  }

  const trimmedName = name.trim();

  // Check name length
  if (trimmedName.length > MAX_GROUP_NAME_LENGTH) {
    errors.push(`Group name must be ${MAX_GROUP_NAME_LENGTH} characters or less`);
  }

  // Check for reserved names
  if (RESERVED_GROUP_NAMES.includes(trimmedName.toLowerCase())) {
    errors.push(`"${trimmedName}" is a reserved name and cannot be used`);
  }

  // Check for valid characters (alphanumeric, hyphens, underscores)
  const validNamePattern = /^[a-zA-Z0-9_-]+$/;
  if (!validNamePattern.test(trimmedName)) {
    errors.push('Group name can only contain letters, numbers, hyphens, and underscores');
  }

  // Check if name starts with a letter
  if (!/^[a-zA-Z]/.test(trimmedName)) {
    errors.push('Group name must start with a letter');
  }

  return { isValid: errors.length === 0, errors, warnings };
};

/**
 * Validate a custom group label
 */
export const validateGroupLabel = (label: string): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if label is provided
  if (!label || label.trim().length === 0) {
    errors.push('Group label is required');
    return { isValid: false, errors, warnings };
  }

  const trimmedLabel = label.trim();

  // Check label length
  if (trimmedLabel.length > MAX_GROUP_LABEL_LENGTH) {
    errors.push(`Group label must be ${MAX_GROUP_LABEL_LENGTH} characters or less`);
  }

  return { isValid: errors.length === 0, errors, warnings };
};

/**
 * Validate custom group intensities
 */
export const validateGroupIntensities = (intensities: CustomGroupIntensity[]): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if intensities are provided
  if (!intensities || intensities.length === 0) {
    errors.push('At least one intensity level is required');
    return { isValid: false, errors, warnings };
  }

  // Check intensities count
  if (intensities.length < MIN_INTENSITIES_COUNT) {
    errors.push(`At least ${MIN_INTENSITIES_COUNT} intensity level is required`);
  }

  if (intensities.length > MAX_INTENSITIES_COUNT) {
    errors.push(`Maximum ${MAX_INTENSITIES_COUNT} intensity levels allowed`);
  }

  // Track unique values and labels
  const usedValues = new Set<number>();
  const usedLabels = new Set<string>();

  for (let i = 0; i < intensities.length; i++) {
    const intensity = intensities[i];

    // Validate intensity ID
    if (!intensity.id || intensity.id.trim().length === 0) {
      errors.push(`Intensity level ${i + 1} is missing an ID`);
    }

    // Validate intensity label
    if (!intensity.label || intensity.label.trim().length === 0) {
      errors.push(`Intensity level ${i + 1} is missing a label`);
    } else {
      const trimmedLabel = intensity.label.trim();

      if (trimmedLabel.length > MAX_INTENSITY_LABEL_LENGTH) {
        errors.push(
          `Intensity level ${i + 1} label must be ${MAX_INTENSITY_LABEL_LENGTH} characters or less`
        );
      }

      // Check for duplicate labels
      if (usedLabels.has(trimmedLabel.toLowerCase())) {
        errors.push(`Intensity label "${trimmedLabel}" is used multiple times`);
      } else {
        usedLabels.add(trimmedLabel.toLowerCase());
      }
    }

    // Validate intensity value
    if (typeof intensity.value !== 'number' || !Number.isInteger(intensity.value)) {
      errors.push(`Intensity level ${i + 1} must have a valid integer value`);
    } else {
      if (intensity.value < MIN_INTENSITY_VALUE || intensity.value > MAX_INTENSITY_VALUE) {
        errors.push(
          `Intensity level ${i + 1} value must be between ${MIN_INTENSITY_VALUE} and ${MAX_INTENSITY_VALUE}`
        );
      }

      // Check for duplicate values
      if (usedValues.has(intensity.value)) {
        errors.push(`Intensity value ${intensity.value} is used multiple times`);
      } else {
        usedValues.add(intensity.value);
      }
    }
  }

  // Warn if intensity values are not sequential
  const sortedValues = Array.from(usedValues).sort((a, b) => a - b);
  let expectedValue = sortedValues[0];
  for (const value of sortedValues) {
    if (value !== expectedValue) {
      warnings.push(
        'Intensity values are not sequential. Consider using values like 1, 2, 3, 4 for better user experience'
      );
      break;
    }
    expectedValue++;
  }

  return { isValid: errors.length === 0, errors, warnings };
};

/**
 * Validate a complete custom group
 */
export const validateCustomGroup = async (
  group: CustomGroupBase,
  excludeId?: string
): Promise<ValidationResult> => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate name
  const nameValidation = validateGroupName(
    group.name,
    group.locale || 'en',
    group.gameMode || 'online',
    excludeId
  );
  errors.push(...nameValidation.errors);
  warnings.push(...(nameValidation.warnings || []));

  // Validate label
  const labelValidation = validateGroupLabel(group.label);
  errors.push(...labelValidation.errors);
  warnings.push(...(labelValidation.warnings || []));

  // Validate intensities
  const intensitiesValidation = validateGroupIntensities(group.intensities);
  errors.push(...intensitiesValidation.errors);
  warnings.push(...(intensitiesValidation.warnings || []));

  // Check for unique name (async validation)
  if (nameValidation.isValid && group.name) {
    try {
      const isUnique = await isGroupNameUnique(
        group.name,
        group.locale || 'en',
        group.gameMode || 'online',
        excludeId
      );

      if (!isUnique) {
        errors.push(
          `A group with the name "${group.name}" already exists for this locale and game mode`
        );
      }
    } catch {
      warnings.push('Could not verify group name uniqueness');
    }
  }

  return { isValid: errors.length === 0, errors, warnings };
};

/**
 * Validate a custom tile against available groups
 */
export const validateCustomTileWithGroups = async (
  tile: CustomTile,
  locale = 'en',
  gameMode = 'online'
): Promise<ValidationResult> => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if group exists
  if (!tile.group || tile.group.trim().length === 0) {
    errors.push('Tile must belong to a group');
    return { isValid: false, errors, warnings };
  }

  try {
    const group = await getCustomGroupByName(tile.group, locale, gameMode);

    if (!group) {
      errors.push(`Group "${tile.group}" does not exist for ${locale}/${gameMode}`);
      return { isValid: false, errors, warnings };
    }

    // Check if intensity value is valid for this group
    const validIntensityValues = group.intensities.map((i) => i.value);
    if (!validIntensityValues.includes(tile.intensity)) {
      errors.push(
        `Intensity ${tile.intensity} is not valid for group "${tile.group}". Valid intensities: ${validIntensityValues.join(', ')}`
      );
    }

    // Check if action is provided
    if (!tile.action || tile.action.trim().length === 0) {
      errors.push('Tile action is required');
    }
  } catch (error) {
    errors.push(`Error validating tile: ${error}`);
  }

  return { isValid: errors.length === 0, errors, warnings };
};

/**
 * Validate intensity value for a specific group
 */
export const validateIntensityForGroup = async (
  groupName: string,
  intensity: number,
  locale = 'en',
  gameMode = 'online'
): Promise<ValidationResult> => {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const group = await getCustomGroupByName(groupName, locale, gameMode);

    if (!group) {
      errors.push(`Group "${groupName}" does not exist`);
      return { isValid: false, errors, warnings };
    }

    const validIntensityValues = group.intensities.map((i) => i.value);
    if (!validIntensityValues.includes(intensity)) {
      errors.push(
        `Intensity ${intensity} is not valid for group "${groupName}". Valid intensities: ${validIntensityValues.join(', ')}`
      );
    }
  } catch (error) {
    errors.push(`Error validating intensity: ${error}`);
  }

  return { isValid: errors.length === 0, errors, warnings };
};

/**
 * Get validation constants for use in components
 */
export const getValidationConstants = () => ({
  MAX_GROUP_NAME_LENGTH,
  MAX_GROUP_LABEL_LENGTH,
  MAX_INTENSITY_LABEL_LENGTH,
  MIN_INTENSITY_VALUE,
  MAX_INTENSITY_VALUE,
  MIN_INTENSITIES_COUNT,
  MAX_INTENSITIES_COUNT,
  RESERVED_GROUP_NAMES,
  VALID_GROUP_TYPES,
});

/**
 * Helper function to format validation errors for display
 */
export const formatValidationErrors = (validation: ValidationResult): string => {
  if (validation.isValid) return '';

  let message = validation.errors.join('\n');

  if (validation.warnings && validation.warnings.length > 0) {
    message += '\n\nWarnings:\n' + validation.warnings.join('\n');
  }

  return message;
};
