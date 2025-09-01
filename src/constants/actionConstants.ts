/**
 * Constants used across action-related components and services
 */

/**
 * Delay in milliseconds between clearing data and syncing with remote server
 * This prevents race conditions during data sync operations
 */
export const SYNC_DELAY_MS = 500;

/**
 * Common intensity labels used across the application
 * These map to translation keys for internationalization
 */
export const DEFAULT_INTENSITY_LABELS = {
  /** Beginner level intensity */
  BEGINNER: 'intensityLabels.beginner',
  /** Intermediate level intensity */
  INTERMEDIATE: 'intensityLabels.intermediate',
  /** Advanced level intensity */
  ADVANCED: 'intensityLabels.advanced',
} as const;
