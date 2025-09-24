import { ActionEntry } from '@/types';
import { Settings } from '@/types/Settings';
import { CustomGroupBase, CustomGroupIntensity } from '@/types/customGroups';
import { FeatureCategory, InteractionType, GroupType, CrudAction } from '@/types/analytics';
import { isPublicRoom } from '@/helpers/strings';
import { analytics } from './analytics';

/**
 * Service for handling analytics tracking throughout the application
 * This keeps the stores clean and provides a centralized place for tracking logic
 */
class AnalyticsTrackingService {
  /**
   * Track settings changes with automatic categorization
   */
  trackSettingsChange<K extends keyof Settings>(
    key: K,
    oldValue: Settings[K],
    newValue: Settings[K],
    newSettings: Settings
  ) {
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
          room_type: isPublicRoom(newSettings.room) ? 'public' : 'private',
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
        analytics.trackVoicePreference(newValue, newSettings.voicePitch ?? 1);
        break;
      case 'roomRealtime':
        analytics.trackRoomConfiguration(
          newSettings.room || 'unknown',
          newSettings.roomTileCount,
          newValue
        );
        break;
      default: {
        // Track general setting changes, excluding internal flags and sensitive data
        const doNotTrack = [
          'boardUpdated',
          'roomUpdated',
          'hasSeenRollButton',
          'displayName',
          'roomBackgroundURL',
          'selectedActions',
          'localPlayers',
          'customGroups',
        ];
        if (!doNotTrack.includes(String(key))) {
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
  }

  /**
   * Track action selection or removal
   */
  trackActionChange(actionEntry: ActionEntry | null, isRemoving: boolean) {
    if (!actionEntry) return;

    analytics.trackActionSelection({
      action_type: actionEntry.type,
      intensity_level: actionEntry.levels?.[0],
      intensity_label: `Level ${actionEntry.levels?.[0] || 1}`,
      variation: actionEntry.variation,
      is_custom_action: false,
      event_category: isRemoving ? 'action_removal' : 'action_selection',
      custom_parameter_1: actionEntry.levels?.length
        ? `${actionEntry.levels.length} levels`
        : '1 level',
      custom_parameter_2: actionEntry.levels?.join(',') || '1',
    });
  }

  /**
   * Track custom group operations (create, update, delete, use)
   */
  trackCustomGroupAction(action: CrudAction, group: CustomGroupBase, isDefaultTemplate?: boolean) {
    const intensityValues = group.intensities.map((i) => i.value).join(',');
    const intensityLabels = group.intensities.map((i) => i.label).join(' | ');

    analytics.trackCustomGroupUsage({
      group_name: group.name,
      group_type: (group.type as GroupType) || 'solo',
      intensity_count: group.intensities.length,
      is_default_template: isDefaultTemplate || false,
      action_type: action,
      custom_parameter_1: `Values: ${intensityValues}`,
      custom_parameter_2: `Labels: ${intensityLabels}`,
      custom_parameter_3: `Min: ${Math.min(...group.intensities.map((i) => i.value))}, Max: ${Math.max(...group.intensities.map((i) => i.value))}`,
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

    // Track specific intensity usage with enhanced details
    analytics.trackActionSelection({
      action_type: actionType,
      intensity_level: intensity.value,
      intensity_label: intensity.label,
      custom_group: customGroupName,
      is_custom_action: !!customGroupName,
      event_category: customGroupName
        ? 'custom_intensity_selection'
        : 'default_intensity_selection',
      custom_parameter_1: `${actionType}_${intensity.value}`,
      custom_parameter_2: customGroupName || 'default_group',
      custom_parameter_3: `intensity_${intensity.value}_${intensity.label}`,
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

      analytics.trackCustomEvent('bulk_action', {
        event_category: 'bulk_operations',
        event_label: actionName,
        value: itemCount,
        custom_parameter_1: `${actionName}_${itemCount}_items`,
        custom_parameter_2:
          itemCount > 10 ? 'high_volume' : itemCount > 5 ? 'medium_volume' : 'low_volume',
      });
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
