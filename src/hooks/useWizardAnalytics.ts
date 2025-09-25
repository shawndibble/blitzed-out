import { useCallback } from 'react';
import { analytics } from '@/services/analytics';

interface UseWizardAnalyticsProps {
  gameMode?: string;
  isPublicRoom: boolean;
}

interface WizardAnalytics {
  trackStepNavigation: (currentStep: number, targetStep?: number) => void;
}

/**
 * Custom hook for tracking wizard funnel analytics
 * Handles path-specific funnel tracking without cluttering components
 */
export function useWizardAnalytics({
  gameMode = 'online',
  isPublicRoom,
}: UseWizardAnalyticsProps): WizardAnalytics {
  const getFunnelName = useCallback(() => {
    const roomType = isPublicRoom ? 'public' : 'private';
    return `${gameMode}_${roomType}_setup`;
  }, [gameMode, isPublicRoom]);

  const getStepName = useCallback((stepNumber: number): string => {
    switch (stepNumber) {
      case 0:
        return 'advanced_settings';
      case 1:
        return 'room_setup';
      case 2:
        return 'local_players';
      case 3:
        return 'game_mode';
      case 4:
        return 'actions';
      case 5:
        return 'finish';
      default:
        return `step_${stepNumber}`;
    }
  }, []);

  const trackStepNavigation = useCallback(
    (currentStep: number, targetStep?: number) => {
      const funnelName = getFunnelName();
      const stepToTrack = targetStep ?? currentStep;
      const stepName = getStepName(stepToTrack);

      analytics.trackFunnelStep(funnelName, stepName, stepToTrack, true);
    },
    [getFunnelName, getStepName]
  );

  return {
    trackStepNavigation,
  };
}
