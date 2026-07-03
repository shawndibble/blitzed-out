import { useCallback, useEffect, useRef } from 'react';
import { analytics } from '@/services/analytics';
import { getWizardStepName } from '@/views/GameSettingsWizard/stepConfig';

interface UseWizardAnalyticsProps {
  gameMode?: string;
  isPublicRoom?: boolean;
}

interface WizardAnalytics {
  trackScreenView: (step: number) => void;
  /** Call on successful settings submit; also suppresses the abandonment event. */
  markCompleted: (groupCount: number) => void;
}

/**
 * Wizard funnel analytics: one screen-view per step entered, a completion
 * event when settings are submitted, and an abandonment event (with the last
 * screen seen) if the wizard unmounts without completing. Completion state is
 * per-instance — the wizard passes markCompleted down to the finish step.
 */
export function useWizardAnalytics({
  gameMode = 'online',
  isPublicRoom = false,
}: UseWizardAnalyticsProps): WizardAnalytics {
  const roomType = isPublicRoom ? 'public' : 'private';
  const lastScreenRef = useRef<string | null>(null);
  const completedRef = useRef(false);

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

  const markCompleted = useCallback((groupCount: number) => {
    completedRef.current = true;
    const { gameMode: topology, roomType: room } = contextRef.current;
    analytics.trackWizardCompleted(topology, room, groupCount);
  }, []);

  useEffect(() => {
    return () => {
      if (!completedRef.current && lastScreenRef.current) {
        const { gameMode: topology, roomType: room } = contextRef.current;
        analytics.trackWizardAbandoned(lastScreenRef.current, topology, room);
      }
    };
  }, []);

  return {
    trackScreenView,
    markCompleted,
  };
}
