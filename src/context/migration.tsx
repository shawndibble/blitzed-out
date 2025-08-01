import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  checkMigrationHealth,
  recoverFromFailedMigration,
} from '@/services/migrationHealthChecker';

/**
 * Context value interface for migration state management.
 * Provides centralized migration control and status tracking.
 */
interface MigrationContextValue {
  /** Whether all supported languages have been migrated */
  isMigrationCompleted: boolean;
  /** Whether any migration operation is currently in progress */
  isMigrationInProgress: boolean;
  /** Whether the current language has been successfully migrated */
  currentLanguageMigrated: boolean;
  /** Any error that occurred during migration (non-blocking) */
  error: string | null;
  /** Whether the migration system is healthy and data is complete */
  isHealthy: boolean;
  /** Whether automatic recovery has been attempted */
  recoveryAttempted: boolean;
  /** Trigger migration for the current language */
  triggerMigration: () => Promise<void>;
  /** Ensure a specific language is migrated */
  ensureLanguageMigrated: (locale?: string) => Promise<boolean>;
  /** Force recovery from failed migration */
  forceRecovery: () => Promise<void>;
}

const MigrationContext = createContext<MigrationContextValue | undefined>(undefined);

/**
 * Hook to access migration context.
 * Must be used within a MigrationProvider.
 *
 * @throws {Error} When used outside of MigrationProvider
 * @returns Migration context value with state and control functions
 */
export function useMigration() {
  const context = useContext(MigrationContext);
  if (context === undefined) {
    throw new Error('useMigration must be used within a MigrationProvider');
  }
  return context;
}

interface MigrationProviderProps {
  children: React.ReactNode;
}

/**
 * Migration context provider that manages language file migration state.
 * Handles automatic migration on language changes with intelligent debouncing.
 *
 * ## Migration Lifecycle:
 * 1. **Initialization**: Checks migration status for current language
 * 2. **Language Change Detection**: Listens for i18next language changes
 * 3. **Debounced Migration**: Prevents duplicate migrations during rapid language switches
 * 4. **Status Updates**: Broadcasts migration state to all consuming components
 * 5. **Error Handling**: Graceful fallbacks when migration fails
 *
 * ## Key Features:
 * - **Lazy Loading**: Migration service loaded only when needed
 * - **Debouncing**: 300ms debounce prevents unnecessary migration attempts
 * - **Automatic Triggers**: Migrates new languages automatically
 * - **Status Tracking**: Comprehensive state management for all components
 * - **Error Resilience**: App continues functioning even if migration fails
 *
 * ## Usage:
 * Wrap your app with MigrationProvider at the root level, above all other providers
 * that might need access to migrated data.
 *
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <MigrationProvider>
 *       <AuthProvider>
 *         <Router>
 *           <AppRoutes />
 *         </Router>
 *       </AuthProvider>
 *     </MigrationProvider>
 *   );
 * }
 * ```
 */
export function MigrationProvider({ children }: MigrationProviderProps) {
  const { i18n } = useTranslation();
  const [isMigrationInProgress, setIsMigrationInProgress] = useState(false);
  const [currentLanguageMigrated, setCurrentLanguageMigrated] = useState(false);
  const [isMigrationCompleted, setIsMigrationCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHealthy, setIsHealthy] = useState(false);
  const [recoveryAttempted, setRecoveryAttempted] = useState(false);
  const [languageChangeTimeout, setLanguageChangeTimeout] = useState<NodeJS.Timeout | null>(null);

  // Lazy load migration service to avoid blocking main bundle
  const loadMigrationService = useCallback(async () => {
    const migrationService = await import('@/services/migrationService');
    return migrationService;
  }, []);

  // Check migration status and health on mount
  useEffect(() => {
    const checkMigrationStatus = async () => {
      try {
        const migrationService = await loadMigrationService();
        const currentLocale = i18n.language || 'en';

        const isCurrentMigrated =
          migrationService.isCurrentLanguageMigrationCompleted(currentLocale);
        const isAllMigrated = migrationService.isMigrationCompleted();

        setCurrentLanguageMigrated(isCurrentMigrated);
        setIsMigrationCompleted(isAllMigrated);

        // Perform health check if migration appears complete but we want to verify data integrity
        if (isCurrentMigrated) {
          const healthReport = await checkMigrationHealth(currentLocale, 'online');
          setIsHealthy(healthReport.isHealthy);

          // If migration claims to be complete but health check fails, attempt recovery
          if (!healthReport.isHealthy && healthReport.requiresRecovery && !recoveryAttempted) {
            setRecoveryAttempted(true);
            const recovered = await recoverFromFailedMigration(currentLocale, 'online');

            if (recovered) {
              // Trigger a fresh migration attempt after recovery
              setCurrentLanguageMigrated(false);
              setError(null);
            } else {
              setError('Migration recovery failed. Some features may not work correctly.');
            }
          }
        }
      } catch (error) {
        console.warn('Failed to check migration status:', error);
        setError('Failed to check migration status');
        setIsHealthy(false);
      }
    };

    // Only check status after i18n is initialized
    if (i18n.language && i18n.language !== 'undefined') {
      checkMigrationStatus();
    }
  }, [i18n.language, loadMigrationService, recoveryAttempted]);

  const forceRecovery = useCallback(async () => {
    const currentLocale = i18n.language || 'en';

    try {
      setIsMigrationInProgress(true);
      setError(null);

      const recovered = await recoverFromFailedMigration(currentLocale, 'online');

      if (recovered) {
        setRecoveryAttempted(true);
        setCurrentLanguageMigrated(false);
        setIsHealthy(false);

        // Trigger fresh migration after recovery
        const migrationService = await loadMigrationService();
        const success = await migrationService.runMigrationIfNeeded();

        if (success) {
          await migrationService.cleanupDuplicatesIfNeeded();
          setCurrentLanguageMigrated(true);
          setIsMigrationCompleted(migrationService.isMigrationCompleted());

          // Re-check health after successful migration
          const healthReport = await checkMigrationHealth(currentLocale, 'online');
          setIsHealthy(healthReport.isHealthy);
        }
      } else {
        setError('Force recovery failed. Please try refreshing the page.');
      }
    } catch (error) {
      console.error('Force recovery failed:', error);
      setError('Force recovery failed. Please try refreshing the page.');
    } finally {
      setIsMigrationInProgress(false);
    }
  }, [i18n.language, loadMigrationService]);

  const triggerMigration = useCallback(async () => {
    if (isMigrationInProgress) return;

    setIsMigrationInProgress(true);
    setError(null);

    try {
      const migrationService = await loadMigrationService();
      const success = await migrationService.runMigrationIfNeeded();

      if (success) {
        // Clean up any duplicates
        await migrationService.cleanupDuplicatesIfNeeded();

        setCurrentLanguageMigrated(true);
        setIsMigrationCompleted(migrationService.isMigrationCompleted());

        // Perform health check after successful migration
        const currentLocale = i18n.language || 'en';
        const healthReport = await checkMigrationHealth(currentLocale, 'online');
        setIsHealthy(healthReport.isHealthy);

        // If health check fails immediately after migration, something is wrong
        if (!healthReport.isHealthy) {
          setError(
            'Migration completed but data validation failed. Some features may not work correctly.'
          );
        }
      } else {
        setError('Migration failed but app will continue with existing data');
        setIsHealthy(false);
      }
    } catch (error) {
      console.error('Migration failed:', error);
      setError('Migration failed but app will continue with existing data');
      setIsHealthy(false);
    } finally {
      setIsMigrationInProgress(false);
    }
  }, [isMigrationInProgress, loadMigrationService, i18n.language]);

  // Debounced language change handler
  const handleLanguageChange = useCallback(
    (newLanguage: string) => {
      // Clear any existing timeout
      if (languageChangeTimeout) {
        clearTimeout(languageChangeTimeout);
      }

      // Debounce language changes by 300ms to handle rapid switches
      const timeout = setTimeout(async () => {
        try {
          const migrationService = await loadMigrationService();

          // Check if this language is already migrated
          if (migrationService.isCurrentLanguageMigrationCompleted(newLanguage)) {
            setCurrentLanguageMigrated(true);
            return;
          }

          // Trigger migration for the new language
          setIsMigrationInProgress(true);
          setError(null);

          const success = await migrationService.ensureLanguageMigrated(newLanguage);

          if (success) {
            setCurrentLanguageMigrated(true);
            // Update overall migration status
            setIsMigrationCompleted(migrationService.isMigrationCompleted());
          } else {
            setError('Migration failed but app will continue with existing data');
          }
        } catch (error) {
          console.error(`Failed to migrate language ${newLanguage}:`, error);
          setError('Migration failed but app will continue with existing data');
        } finally {
          setIsMigrationInProgress(false);
        }
      }, 300);

      setLanguageChangeTimeout(timeout);
    },
    [languageChangeTimeout, loadMigrationService]
  );

  const ensureLanguageMigrated = useCallback(
    async (locale?: string): Promise<boolean> => {
      const targetLocale = locale || i18n.language || 'en';

      try {
        const migrationService = await loadMigrationService();

        // Check if already migrated
        if (migrationService.isCurrentLanguageMigrationCompleted(targetLocale)) {
          setCurrentLanguageMigrated(true);
          return true;
        }

        // Trigger migration if needed
        setIsMigrationInProgress(true);
        const success = await migrationService.ensureLanguageMigrated(targetLocale);

        if (success) {
          setCurrentLanguageMigrated(true);
        }

        return success;
      } catch (error) {
        console.error(`Failed to ensure ${targetLocale} migration:`, error);
        return false;
      } finally {
        setIsMigrationInProgress(false);
      }
    },
    [i18n.language, loadMigrationService]
  );

  // Listen for i18next language changes
  useEffect(() => {
    if (!i18n.language || i18n.language === 'undefined') return;

    // Set up language change listener
    const languageChangedHandler = (lng: string) => {
      handleLanguageChange(lng);
    };

    // Subscribe to language change events
    i18n.on('languageChanged', languageChangedHandler);

    // Initial migration check for current language
    const checkInitialLanguage = async () => {
      try {
        const migrationService = await loadMigrationService();
        const currentLocale = i18n.language || 'en';

        const isCompleted = migrationService.isCurrentLanguageMigrationCompleted(currentLocale);
        setCurrentLanguageMigrated(isCompleted);

        // If current language hasn't been migrated, trigger it
        if (!isCompleted && !isMigrationInProgress) {
          handleLanguageChange(currentLocale);
        }
      } catch (error) {
        console.warn('Failed to check initial migration status:', error);
      }
    };

    checkInitialLanguage();

    // Cleanup subscription on unmount
    return () => {
      i18n.off('languageChanged', languageChangedHandler);
      if (languageChangeTimeout) {
        clearTimeout(languageChangeTimeout);
      }
    };
  }, [
    i18n,
    handleLanguageChange,
    isMigrationInProgress,
    languageChangeTimeout,
    loadMigrationService,
  ]);

  const value: MigrationContextValue = {
    isMigrationCompleted,
    isMigrationInProgress,
    currentLanguageMigrated,
    error,
    isHealthy,
    recoveryAttempted,
    triggerMigration,
    ensureLanguageMigrated,
    forceRecovery,
  };

  return <MigrationContext.Provider value={value}>{children}</MigrationContext.Provider>;
}
