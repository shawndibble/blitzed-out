// Custom group and intensity management type definitions

// Individual intensity level within a custom group
export interface CustomGroupIntensity {
  id: string;
  label: string; // User-defined label (e.g., "Light", "Medium", "Intense")
  value: number; // Numeric value (1, 2, 3, 4, etc.)
  isDefault: boolean; // Whether this is a system default intensity
}

// Base custom group interface
export interface CustomGroupBase {
  name: string; // Unique identifier/key for the group
  label: string; // Display label for the group
  intensities: CustomGroupIntensity[];
  type?: string; // Action type (e.g., 'solo', 'consumption', 'action')
  isDefault?: boolean; // Whether this is a system default group
  locale?: string; // Locale this group belongs to
  gameMode?: string; // Game mode this group applies to
}

// Custom group for database push operations (id is optional)
export interface CustomGroupPush extends CustomGroupBase {
  id?: string;
}

// Custom group for database pull operations (id is required)
export interface CustomGroupPull extends CustomGroupBase {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  isDefault: boolean; // Required in pull operations
  locale: string; // Required in pull operations
  gameMode: string; // Required in pull operations
}

// Generic custom group type for most use cases
export type CustomGroup = CustomGroupPush | CustomGroupPull;

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

// Default intensity templates
export interface IntensityTemplate {
  name: string;
  intensities: Omit<CustomGroupIntensity, 'id'>[];
}

// Export data structure for import/export functionality
export interface CustomGroupExportData {
  customGroups: CustomGroup[];
  version: string;
  exportedAt: Date;
  locale: string;
  gameMode: string;
}

// Component prop interfaces
export interface CustomGroupDialogProps {
  open: boolean;
  onClose: () => void;
  onGroupCreated?: (group: CustomGroupPull) => void;
  onGroupUpdated?: (group: CustomGroupPull) => void;
  editingGroup?: CustomGroupPull | null;
  locale: string;
  gameMode: string;
}

export interface CustomGroupSelectorProps {
  value: string;
  onChange: (groupName: string) => void;
  locale: string;
  gameMode: string;
  includeDefault?: boolean;
  disabled?: boolean;
  refreshTrigger?: number;
}

export interface IntensitySelectorProps {
  groupName: string;
  value: number;
  onChange: (intensity: number) => void;
  locale: string;
  gameMode: string;
  disabled?: boolean;
}

// Filters for querying custom groups
export interface CustomGroupFilters {
  locale?: string;
  gameMode?: string;
  isDefault?: boolean;
  name?: string;
}

// Default intensity templates for common use cases
// Note: These labels should be translated using i18next in components
export const DEFAULT_INTENSITY_TEMPLATES: IntensityTemplate[] = [
  {
    name: 'Basic (1-4)',
    intensities: [
      { label: 'intensityLabels.light', value: 1, isDefault: true },
      { label: 'intensityLabels.medium', value: 2, isDefault: true },
      { label: 'intensityLabels.intense', value: 3, isDefault: true },
      { label: 'intensityLabels.extreme', value: 4, isDefault: true },
    ],
  },
  {
    name: 'Simple (1-3)',
    intensities: [
      { label: 'intensityLabels.beginner', value: 1, isDefault: true },
      { label: 'intensityLabels.intermediate', value: 2, isDefault: true },
      { label: 'intensityLabels.advanced', value: 3, isDefault: true },
    ],
  },
  {
    name: 'Extended (1-5)',
    intensities: [
      { label: 'intensityLabels.veryLight', value: 1, isDefault: true },
      { label: 'intensityLabels.light', value: 2, isDefault: true },
      { label: 'intensityLabels.medium', value: 3, isDefault: true },
      { label: 'intensityLabels.intense', value: 4, isDefault: true },
      { label: 'intensityLabels.veryIntense', value: 5, isDefault: true },
    ],
  },
];
