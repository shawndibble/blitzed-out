/**
 * Constants and configuration for the migration service
 */

// Supported languages for migration
// Must match i18n.ts's `supportedLngs` and the directories under src/locales.
// German shipped without being added here, so every gate keyed on this list —
// export/pack locale filtering, browser-language detection — treated a German
// user as unsupported. `locale.test.ts` pins the three lists together.
export const SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'zh', 'hi', 'de'] as const;

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
// - 2.4.0: Added clit training category
// - 2.5.0: Expanded confessions and added would you rather category
// - 2.6.0: Penetrative tag on default tiles + clit training oral intensity
// - 2.7.0: Oral Play intensity renames, {tip} anatomy placeholder, stale
//          default-tile pruning
//
export const MIGRATION_VERSION = '2.7.0';
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
export const STALE_LOCK_TIMEOUT = 5 * 60 * 1000; // 5 minutes

// Game modes
export const GAME_MODES = ['local', 'online'] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];
export type GameMode = (typeof GAME_MODES)[number];
