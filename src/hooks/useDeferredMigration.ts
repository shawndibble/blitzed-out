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
 * Provides deferred loading with graceful fallbacks.
 *
 * @example
 * ```tsx
 * function GameSettings() {
 *   const { isReady, isLoading, triggerMigration } = useDeferredMigration({
 *     required: true, // This component needs migrated data
 *     immediate: false // Don't block rendering, load in background
 *   });
 *
 *   if (isLoading) {
 *     return <SettingsSkeleton />;
 *   }
 *
 *   return <GameSettingsContent />;
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
    // If immediate mode is requested, trigger migration right away
    if (immediate && !hasTriggered) {
      setHasTriggered(true);
      if (locale) {
        migration.ensureLanguageMigrated(locale);
      } else {
        migration.triggerMigration();
      }
    }
  }, [immediate, locale, hasTriggered, migration]);

  // Auto-trigger migration when component mounts if required
  useEffect(() => {
    if (
      required &&
      !migration.currentLanguageMigrated &&
      !migration.isMigrationInProgress &&
      !hasTriggered
    ) {
      setHasTriggered(true);
      if (locale) {
        migration.ensureLanguageMigrated(locale);
      } else {
        migration.triggerMigration();
      }
    }
  }, [required, locale, hasTriggered, migration]);

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
