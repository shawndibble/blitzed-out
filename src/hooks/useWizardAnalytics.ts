import { useCallback, useEffect, useRef } from 'react';
import { analytics } from '@/services/analytics';
import { getWizardStepName } from '@/views/GameSettingsWizard/stepConfig';

interface UseWizardAnalyticsProps {
  gameMode?: string;
  isPublicRoom?: boolean;
}

interface WizardAnalytics {
  trackScreenView: (step: number) => void;
}

// Module-level so FinishStep (a separate hook instance) can mark completion
// before the wizard unmounts and the abandonment check runs.
let wizardCompleted = false;

export function markWizardCompleted(): void {
  wizardCompleted = true;
}

/**
 * Wizard funnel analytics: one screen-view per step entered, a completion
 * event when settings are submitted, and an abandonment event (with the last
 * screen seen) if the wizard unmounts without completing.
 */
export function useWizardAnalytics({
  gameMode = 'online',
  isPublicRoom = false,
}: UseWizardAnalyticsProps): WizardAnalytics {
  const roomType = isPublicRoom ? 'public' : 'private';
  const lastScreenRef = useRef<string | null>(null);

  // Keep current values readable from the unmount cleanup without re-running it
  const contextRef = useRef({ gameMode, roomType });
  contextRef.current = { gameMode, roomType };

  const trackScreenView = useCallback(
    (step: number) => {
      const screenName = getWizardStepName(step);
      if (screenName === lastScreenRef.current) return;
      lastScreenRef.current = screenName;
      analytics.trackWizardScreenView(screenName, gameMode, roomType);
    },
    [gameMode, roomType]
  );

  useEffect(() => {
    wizardCompleted = false;
    return () => {
      if (!wizardCompleted && lastScreenRef.current) {
        const { gameMode: topology, roomType: room } = contextRef.current;
        analytics.trackWizardAbandoned(lastScreenRef.current, topology, room);
      }
      wizardCompleted = false;
    };
  }, []);

  return {
    trackScreenView,
  };
}
