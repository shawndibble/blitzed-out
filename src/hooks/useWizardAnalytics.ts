import { useCallback } from 'react';
import { analytics } from '@/services/analytics';
import { getWizardStepName } from '@/views/GameSettingsWizard/stepConfig';

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
    return getWizardStepName(stepNumber);
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
