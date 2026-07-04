import { useMemo } from 'react';
import { GroupedActions } from '@/types/customTiles';
import { useMigrationStatus } from '@/services/migration/contentReadiness';

interface UseBrokenActionsStateReturn {
  isBroken: boolean;
  hasNoActions: boolean;
}

/**
 * Detect when the actions list is genuinely broken: loading finished, content
 * for the current locale is ready, yet no actions exist. Seeding suppresses
 * broken (content is still arriving); degraded suppresses broken too — a
 * transient seeding failure must never route users to the wipe-data screen.
 */
export default function useBrokenActionsState(
  actionsList: GroupedActions,
  isLoading: boolean
): UseBrokenActionsStateReturn {
  const { phase } = useMigrationStatus();

  return useMemo(() => {
    if (isLoading || phase !== 'ready') {
      return { isBroken: false, hasNoActions: false };
    }

    const hasNoActions = !actionsList || Object.keys(actionsList).length === 0;

    return { isBroken: hasNoActions, hasNoActions };
  }, [actionsList, isLoading, phase]);
}
