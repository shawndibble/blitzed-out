import { useEffect, useState } from 'react';
import { useMigration } from '@/context/migration';

export interface DeferredMigrationOptions {
  /**
   * Whether to trigger migration immediately when the hook is used
   * Default: false (migration happens in background)
   */
  immediate?: boolean;

  /**
   * Specific locale to ensure is migrated
   * Default: current i18n language
   */
  locale?: string;

  /**
   * Whether this component requires migrated data to function
   * If true, will show loading state until migration completes
   * Default: false
   */
  required?: boolean;
}

export interface DeferredMigrationResult {
  /**
   * Whether migration is currently in progress
   */
  isLoading: boolean;

  /**
   * Whether migration has completed successfully
   */
  isReady: boolean;

  /**
   * Any error that occurred during migration
   */
  error: string | null;

  /**
   * Manual trigger function to start migration
   */
  triggerMigration: () => Promise<void>;

  /**
   * Function to ensure a specific language is migrated
   */
  ensureLanguage: (locale: string) => Promise<boolean>;
}

/**
 * Hook for components that need migrated data.
 * Provides deferred loading with graceful fallbacks and flexible migration strategies.
 *
 * ## Usage Patterns:
 *
 * **Background Migration (Recommended):**
 * - `immediate: false, required: false` - Non-blocking, best for performance
 * - Migration happens in background, component renders immediately
 * - Use when component can function without migrated data initially
 *
 * **Required Migration:**
 * - `immediate: false, required: true` - Shows loading state until migration completes
 * - Use when component absolutely needs migrated data to function
 * - Automatically triggers migration on mount if not already migrated
 *
 * **Immediate Migration:**
 * - `immediate: true` - Forces migration to start immediately when hook is used
 * - Use sparingly, can impact performance if used in multiple components
 *
 * ## Return Values:
 * - `isLoading`: Only true when `required: true` and migration is in progress
 * - `isReady`: Whether current language migration has completed successfully
 * - `error`: Any error that occurred during migration (non-blocking)
 * - `triggerMigration`: Manual function to start migration process
 * - `ensureLanguage`: Function to migrate a specific language
 *
 * @param options - Configuration options for migration behavior
 * @returns Migration state and control functions
 *
 * @example
 * ```tsx
 * // Background migration (recommended for most components)
 * function GameSettings() {
 *   const { isReady } = useDeferredMigration({
 *     required: false // Component can render without migration
 *   });
 *
 *   return <GameSettingsContent enhanced={isReady} />;
 * }
 *
 * // Required migration with loading state
 * function ActionsList() {
 *   const { isReady, isLoading } = useDeferredMigration({
 *     required: true // Component needs migrated data
 *   });
 *
 *   if (isLoading) {
 *     return <ActionsSkeleton />;
 *   }
 *
 *   return <ActionsContent />;
 * }
 *
 * // Specific language migration
 * function LanguageSwitcher() {
 *   const { ensureLanguage } = useDeferredMigration();
 *
 *   const handleLanguageChange = async (locale: string) => {
 *     await ensureLanguage(locale);
 *     // Language is now ready
 *   };
 * }
 * ```
 */
export function useDeferredMigration(
  options: DeferredMigrationOptions = {}
): DeferredMigrationResult {
  const { immediate = false, locale, required = false } = options;

  const migration = useMigration();
  const [hasTriggered, setHasTriggered] = useState(false);

  useEffect(() => {
    let shouldTrigger = false;

    if (immediate && !hasTriggered) {
      shouldTrigger = true;
    }

    if (
      required &&
      !migration.currentLanguageMigrated &&
      !migration.isMigrationInProgress &&
      !hasTriggered
    ) {
      shouldTrigger = true;
    }

    if (shouldTrigger) {
      queueMicrotask(() => {
        setHasTriggered(true);
        if (locale) {
          migration.ensureLanguageMigrated(locale);
        } else {
          migration.triggerMigration();
        }
      });
    }
  }, [immediate, required, locale, hasTriggered, migration]);

  const triggerMigration = async () => {
    setHasTriggered(true);
    await migration.triggerMigration();
  };

  const ensureLanguage = async (targetLocale: string) => {
    setHasTriggered(true);
    return await migration.ensureLanguageMigrated(targetLocale);
  };

  return {
    isLoading: required ? migration.isMigrationInProgress : false,
    isReady: migration.currentLanguageMigrated,
    error: migration.error,
    triggerMigration,
    ensureLanguage,
  };
}
