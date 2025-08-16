/**
 * Migration service to convert JSON action files to custom groups and custom tiles in Dexie.
 *
 * This file has been refactored into focused modules for better maintainability:
 * - types: Type definitions and interfaces
 * - constants: Configuration and constant values
 * - errorHandling: Centralized error handling patterns
 * - statusManager: localStorage-based migration tracking
 * - versionManager: Version checking and updates
 * - fileDiscovery: Dynamic file and locale discovery
 * - importOperations: File importing and data conversion
 * - validationUtils: Integrity checks and validation
 *
 * All functionality is preserved and re-exported from the modular structure.
 */

// Re-export all public functions from the refactored migration modules
export {
  // Main migration functions
  migrateActionGroups,
  migrateCurrentLanguage,
  migrateRemainingLanguages,
  queueBackgroundMigration,
  ensureLanguageMigrated,
  runMigrationIfNeeded,

  // Status and validation functions
  checkAndHandleVersionChange,
  isMigrationCompleted,
  isCurrentLanguageMigrationCompleted,
  verifyMigrationIntegrity,
  fixMigrationStatusCorruption,
  getMigrationStatus,
  resetMigrationStatus,

  // Utility functions
  forceFreshMigration,
  cleanupDuplicatesIfNeeded,

  // Types for external consumption
  type MigrationStatus,
  type BackgroundMigrationStatus,
  type ImportResult,
  type VersionCheckResult,
  type MigrationStatusSnapshot,
} from '@/services/migration';
