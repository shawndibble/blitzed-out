/**
 * Types and interfaces for the migration service
 */

export interface MigrationStatus {
  version: string;
  completed: boolean;
  completedAt?: Date;
  currentLanguageOnly?: boolean;
}

export interface BackgroundMigrationStatus {
  version: string;
  completedLanguages: string[];
  inProgress: boolean;
  startedAt?: Date;
  completedAt?: Date;
}

export interface MigrationLockStatus {
  inProgress: boolean;
  startedAt: string;
}

export interface LanguageMigrationStatus {
  locales: string[];
  startedAt: string;
}

export interface ImportResult {
  groupsImported: number;
  tilesImported: number;
}

export interface VersionCheckResult {
  versionChanged: boolean;
  oldVersion?: string;
}

export interface MigrationStatusSnapshot {
  main: MigrationStatus | null;
  background: BackgroundMigrationStatus | null;
}
