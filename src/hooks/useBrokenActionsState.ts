import { useMemo } from 'react';
import { GroupedActions } from '@/types/customTiles';
import { useMigration } from '@/context/migration';

interface UseBrokenActionsStateReturn {
  isBroken: boolean;
  hasNoActions: boolean;
}

/**
 * Custom hook to detect when the actions list is in a broken state.
 * A broken state occurs when loading is complete, migration is finished,
 * but no actions are available.
 */
export default function useBrokenActionsState(
  actionsList: GroupedActions,
  isLoading: boolean
): UseBrokenActionsStateReturn {
  const { isMigrationInProgress, currentLanguageMigrated } = useMigration();

  return useMemo(() => {
    // Don't show broken state if currently loading actions
    if (isLoading) {
      return { isBroken: false, hasNoActions: false };
    }

    // Don't show broken state if migration is still in progress
    if (isMigrationInProgress) {
      return { isBroken: false, hasNoActions: false };
    }

    // Don't show broken state if current language hasn't finished migrating
    if (!currentLanguageMigrated) {
      return { isBroken: false, hasNoActions: false };
    }

    // Check if we have no actions available
    const hasNoActions = !actionsList || Object.keys(actionsList).length === 0;

    // Only consider it broken if all loading/migration is complete but no actions available
    const isBroken = hasNoActions;

    return { isBroken, hasNoActions };
  }, [actionsList, isLoading, isMigrationInProgress, currentLanguageMigrated]);
}
