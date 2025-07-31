import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

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
  /** Trigger migration for the current language */
  triggerMigration: () => Promise<void>;
  /** Ensure a specific language is migrated */
  ensureLanguageMigrated: (locale?: string) => Promise<boolean>;
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
  const [languageChangeTimeout, setLanguageChangeTimeout] = useState<NodeJS.Timeout | null>(null);

  // Lazy load migration service to avoid blocking main bundle
  const loadMigrationService = useCallback(async () => {
    const migrationService = await import('@/services/migrationService');
    return migrationService;
  }, []);

  // Check migration status on mount
  useEffect(() => {
    const checkMigrationStatus = async () => {
      try {
        const migrationService = await loadMigrationService();
        const currentLocale = i18n.language || 'en';

        setCurrentLanguageMigrated(
          migrationService.isCurrentLanguageMigrationCompleted(currentLocale)
        );
        setIsMigrationCompleted(migrationService.isMigrationCompleted());
      } catch (error) {
        console.warn('Failed to check migration status:', error);
        setError('Failed to check migration status');
      }
    };

    // Only check status after i18n is initialized
    if (i18n.language && i18n.language !== 'undefined') {
      checkMigrationStatus();
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
      } else {
        setError('Migration failed but app will continue with existing data');
      }
    } catch (error) {
      console.error('Migration failed:', error);
      setError('Migration failed but app will continue with existing data');
    } finally {
      setIsMigrationInProgress(false);
    }
  }, [isMigrationInProgress, loadMigrationService]);

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
    triggerMigration,
    ensureLanguageMigrated,
  };

  return <MigrationContext.Provider value={value}>{children}</MigrationContext.Provider>;
}
