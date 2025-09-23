import React, { useCallback, useEffect } from 'react';
import { analyticsTracking } from '@/services/analyticsTracking';
import { CustomGroupIntensity } from '@/types/customGroups';
import { FeatureCategory, InteractionType, GroupType } from '@/types/analytics';

/**
 * Custom hook for analytics tracking throughout the application
 * Provides easy-to-use functions for tracking user interactions
 */
export const useAnalytics = () => {
  // Track feature usage
  const trackFeature = useCallback(
    (
      featureName: string,
      category: FeatureCategory = 'ui',
      interaction: InteractionType = 'use'
    ) => {
      analyticsTracking.trackFeatureUsage(featureName, category, interaction);
    },
    []
  );

  // Track intensity selection with context
  const trackIntensitySelection = useCallback(
    (actionType: GroupType, intensity: CustomGroupIntensity, customGroupName?: string) => {
      analyticsTracking.trackIntensitySelection(actionType, intensity, customGroupName);
    },
    []
  );

  // Track user flow progression
  const trackUserFlow = useCallback((flowName: string, step: string, success: boolean = true) => {
    analyticsTracking.trackUserFlow(flowName, step, success);
  }, []);

  // Track first-time feature discovery
  const trackFeatureDiscovery = useCallback((featureName: string, context: string = 'organic') => {
    analyticsTracking.trackFeatureDiscovery(featureName, context);
  }, []);

  // Track button clicks and UI interactions
  const trackClick = useCallback(
    (buttonName: string, context?: string) => {
      trackFeature(`click_${buttonName}`, 'ui', 'use');
      if (context) {
        analyticsTracking.trackUserFlow('button_interaction', `${buttonName}_in_${context}`, true);
      }
    },
    [trackFeature]
  );

  // Track dialog/modal interactions
  const trackDialog = useCallback(
    (dialogName: string, action: 'open' | 'close' | 'confirm' | 'cancel') => {
      trackFeature(`dialog_${dialogName}_${action}`, 'ui', 'use');
    },
    [trackFeature]
  );

  // Track page/view navigation
  const trackNavigation = useCallback((fromView: string, toView: string) => {
    analyticsTracking.trackUserFlow('navigation', `${fromView}_to_${toView}`, true);
  }, []);

  // Track error occurrences for UX improvement
  const trackError = useCallback(
    (errorType: string, context: string, resolved: boolean = false) => {
      analyticsTracking.trackUserFlow('error_handling', `${errorType}_in_${context}`, resolved);
    },
    []
  );

  return {
    trackFeature,
    trackIntensitySelection,
    trackUserFlow,
    trackFeatureDiscovery,
    trackClick,
    trackDialog,
    trackNavigation,
    trackError,
  };
};

/**
 * HOC for automatic component usage tracking
 */
export const withAnalytics = <P extends object>(
  Component: React.ComponentType<P>,
  componentName: string,
  trackMount: boolean = false
): React.ComponentType<P> => {
  const WrappedComponent = (props: P) => {
    const { trackFeature } = useAnalytics();

    useEffect(() => {
      if (trackMount) {
        trackFeature(`component_mount_${componentName}`, 'ui', 'use');
      }
    }, [trackFeature]);

    return React.createElement(Component, props);
  };

  return WrappedComponent;
};
