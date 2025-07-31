import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

interface MigrationContextValue {
  isMigrationCompleted: boolean;
  isMigrationInProgress: boolean;
  currentLanguageMigrated: boolean;
  error: string | null;
  triggerMigration: () => Promise<void>;
  ensureLanguageMigrated: (locale?: string) => Promise<boolean>;
}

const MigrationContext = createContext<MigrationContextValue | undefined>(undefined);

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

      // Debounce language changes by 100ms to handle rapid switches
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
      }, 100);

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
