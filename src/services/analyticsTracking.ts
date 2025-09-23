import { ActionEntry } from '@/types';
import { Settings } from '@/types/Settings';
import { CustomGroupBase, CustomGroupIntensity } from '@/types/customGroups';
import { FeatureCategory, InteractionType, GroupType, CrudAction } from '@/types/analytics';
import { analytics } from './analytics';

/**
 * Service for handling analytics tracking throughout the application
 * This keeps the stores clean and provides a centralized place for tracking logic
 */
class AnalyticsTrackingService {
  /**
   * Track settings changes with automatic categorization
   */
  trackSettingsChange(key: keyof Settings, oldValue: any, newValue: any, newSettings: Settings) {
    if (oldValue === newValue || newValue === undefined) return;

    switch (key) {
      case 'themeMode':
        analytics.trackThemeChange(oldValue, newValue);
        break;
      case 'locale':
        analytics.trackLanguageChange(oldValue, newValue);
        break;
      case 'role':
        analytics.trackRoleSelection(newValue);
        break;
      case 'gameMode':
        analytics.trackGameModeSelection({
          game_mode: newValue,
          has_custom_actions: Object.keys(newSettings.selectedActions || {}).length > 0,
          room_type: newSettings.room === 'PUBLIC' ? 'public' : 'private',
        });
        break;
      case 'mySound':
        analytics.trackSoundPreference('my', newValue);
        break;
      case 'otherSound':
        analytics.trackSoundPreference('other', newValue);
        break;
      case 'chatSound':
        analytics.trackSoundPreference('chat', newValue);
        break;
      case 'background':
        analytics.trackBackgroundChange(newValue);
        break;
      case 'voicePreference':
        analytics.trackVoicePreference(newValue, newSettings.voicePitch || 1);
        break;
      case 'roomRealtime':
        analytics.trackRoomConfiguration(
          newSettings.room || 'unknown',
          newSettings.roomTileCount,
          newValue
        );
        break;
      default:
        // Track general setting changes, excluding internal flags
        if (!['boardUpdated', 'roomUpdated', 'hasSeenRollButton'].includes(String(key))) {
          analytics.trackSettingChange({
            setting_name: String(key),
            old_value: String(oldValue || ''),
            new_value: String(newValue),
            setting_category: 'user_preference',
          });
        }
        break;
    }
  }

  /**
   * Track action selection or removal
   */
  trackActionChange(actionEntry: ActionEntry | null, isRemoving: boolean) {
    if (!actionEntry) return;

    analytics.trackActionSelection({
      action_type: actionEntry.type,
      intensity_level: actionEntry.levels?.[0],
      variation: actionEntry.variation,
      is_custom_action: false,
      event_category: isRemoving ? 'action_removal' : 'action_selection',
    });
  }

  /**
   * Track custom group operations (create, update, delete, use)
   */
  trackCustomGroupAction(action: CrudAction, group: CustomGroupBase, isDefaultTemplate?: boolean) {
    analytics.trackCustomGroupUsage({
      group_name: group.name,
      group_type: (group.type as GroupType) || 'solo',
      intensity_count: group.intensities.length,
      is_default_template: isDefaultTemplate || false,
      action_type: action,
    });
  }

  /**
   * Track intensity selection patterns
   */
  trackIntensitySelection(
    actionType: GroupType,
    intensity: CustomGroupIntensity,
    customGroupName?: string
  ) {
    analytics.trackIntensityPattern(actionType, intensity.value, customGroupName);

    // Track specific intensity usage
    analytics.trackActionSelection({
      action_type: actionType,
      intensity_level: intensity.value,
      intensity_label: intensity.label,
      custom_group: customGroupName,
      is_custom_action: !!customGroupName,
    });
  }

  /**
   * Track feature usage patterns
   */
  trackFeatureUsage(
    featureName: string,
    category: FeatureCategory,
    interactionType: InteractionType,
    value?: number
  ) {
    analytics.trackFeatureUsage({
      feature_name: featureName,
      feature_category: category,
      interaction_type: interactionType,
      value,
    });
  }

  /**
   * Track bulk actions (like clearing all selections)
   */
  trackBulkAction(actionName: string, itemCount: number) {
    if (itemCount > 0) {
      this.trackFeatureUsage(actionName, 'customization', 'use', itemCount);
    }
  }

  /**
   * Track user flow and journey patterns
   */
  trackUserFlow(flowName: string, step: string, success: boolean = true) {
    analytics.trackUserFlow(flowName, step, success);
  }

  /**
   * Track first-time feature discovery
   */
  trackFeatureDiscovery(featureName: string, context: string) {
    analytics.trackFeatureDiscovery(featureName, context);
  }
}

// Export singleton instance
export const analyticsTracking = new AnalyticsTrackingService();
