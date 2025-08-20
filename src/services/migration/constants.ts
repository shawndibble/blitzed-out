/**
 * Constants and configuration for the migration service
 */

// Supported languages for migration
export const SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'zh', 'hi'] as const;

// ============================================================================
// MIGRATION VERSION CONFIGURATION
// ============================================================================
//
// VERSION HISTORY:
// - 2.1.0: Initial migration system
// - 2.1.1: Fixed import path matching (@/locales vs /src/locales)
// - 2.1.2: Added corruption detection and auto-recovery
// - 2.2.0: Added body worship group
// - 2.3.0: Fix syncing issues with custom groups and tiles
//
export const MIGRATION_VERSION = '2.3.0';
// ============================================================================

// Configuration keys for localStorage
export const MIGRATION_KEY = 'blitzed-out-action-groups-migration';
export const BACKGROUND_MIGRATION_KEY = 'blitzed-out-background-migration';

// localStorage-based concurrency control keys for better reliability in hot module reloading environments
export const MIGRATION_IN_PROGRESS_KEY = 'blitzed-out-migration-in-progress';
export const CURRENT_LANGUAGE_MIGRATION_KEY = 'blitzed-out-current-language-migration';
export const BACKGROUND_MIGRATION_IN_PROGRESS_KEY = 'blitzed-out-background-migration-in-progress';

// Timeout configurations (in milliseconds)
export const MIGRATION_TIMEOUT = 30 * 1000; // 30 seconds
export const BACKGROUND_MIGRATION_TIMEOUT = 10 * 60 * 1000; // 10 minutes
export const STALE_LOCK_TIMEOUT = 5 * 60 * 1000; // 5 minutes

// Delay configurations
export const BACKGROUND_MIGRATION_DELAY = 10; // 10ms between operations
export const QUEUE_BACKGROUND_MIGRATION_DELAY = 1000; // 1 second
export const IDLE_CALLBACK_TIMEOUT = 5000; // 5 seconds

// Game modes
export const GAME_MODES = ['local', 'online'] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];
export type GameMode = (typeof GAME_MODES)[number];
