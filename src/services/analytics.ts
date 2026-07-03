import { ActionEntry } from '@/types';
import { CustomGroupIntensity } from '@/types/customGroups';
import {
  AnalyticsEventInput,
  SettingsChangeEvent,
  ActionSelectionEvent,
  FeatureUsageEvent,
  GameModeEvent,
  CustomGroupEvent,
  PackLifecycleEvent,
  PlayerRole,
  ThemeMode,
  GroupType,
} from '@/types/analytics';

// Global gtag function declaration
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

// Analytics service class
class AnalyticsService {
  private isDevelopment: boolean = false;
  private sessionId: string;

  constructor() {
    this.isDevelopment = import.meta.env.MODE === 'development';
    this.sessionId = this.generateSessionId();
  }

  // Generate unique session ID for tracking user sessions
  private generateSessionId(): string {
    const timestamp = Date.now();

    // Try crypto.randomUUID() first (most secure and simple)
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return `${timestamp}-${crypto.randomUUID()}`;
    }

    // Fallback to crypto.getRandomValues() for secure random bytes
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const arr = new Uint8Array(9);
      crypto.getRandomValues(arr);
      const randomStr = Array.from(arr, (byte) => byte.toString(36))
        .join('')
        .slice(0, 9);
      return `${timestamp}-${randomStr}`;
    }

    // Last resort fallback (non-cryptographic)
    return `${timestamp}-${Math.random().toString(36).slice(2, 11)}`;
  }

  // Check if analytics is available
  private canTrack(): boolean {
    if (this.isDevelopment) return false;
    if (typeof window === 'undefined') return false;
    return typeof window.gtag === 'function';
  }

  // Generic event tracking
  private trackEvent(eventName: string, parameters: AnalyticsEventInput = {}) {
    if (!this.canTrack()) return;

    // Add session context to all events for better user journey analysis
    const enrichedParameters = {
      ...parameters,
      session_id: this.sessionId,
      timestamp: Date.now(),
    };

    window.gtag!('event', eventName, enrichedParameters);
  }

  // Settings change tracking
  trackSettingChange(params: SettingsChangeEvent) {
    this.trackEvent('setting_change', {
      event_category: 'user_preferences',
      event_label: params.setting_name,
      custom_parameter_1: params.old_value,
      custom_parameter_2: params.new_value,
      custom_parameter_3: params.setting_category,
      ...params,
    });
  }

  // Action selection tracking
  trackActionSelection(params: ActionSelectionEvent) {
    this.trackEvent('action_selected', {
      event_category: 'action_usage',
      event_label: params.action_type,
      value: params.intensity_level,
      custom_parameter_1: params.custom_group || 'default',
      custom_parameter_2: params.intensity_label || '',
      custom_parameter_3: params.variation || '',
      ...params,
    });
  }

  // Feature usage tracking
  trackFeatureUsage(params: FeatureUsageEvent) {
    this.trackEvent('feature_usage', {
      event_category: params.feature_category,
      event_label: params.feature_name,
      custom_parameter_1: params.interaction_type,
      ...params,
    });
  }

  // Game mode selection tracking
  trackGameModeSelection(params: GameModeEvent) {
    this.trackEvent('game_mode_selected', {
      event_category: 'game_config',
      event_label: params.game_mode,
      value: params.player_count,
      custom_parameter_1: params.room_type || 'unknown',
      custom_parameter_2: params.has_custom_actions.toString(),
      ...params,
    });
  }

  // Custom group tracking
  trackCustomGroupUsage(params: CustomGroupEvent) {
    this.trackEvent('custom_group_action', {
      event_category: 'customization',
      event_label: params.group_name,
      value: params.intensity_count,
      custom_parameter_1: params.group_type,
      custom_parameter_2: params.action_type,
      custom_parameter_3: params.is_default_template.toString(),
      ...params,
    });
  }

  // Convenience methods for common tracking scenarios

  // Track theme changes
  trackThemeChange(oldTheme: ThemeMode, newTheme: ThemeMode) {
    this.trackSettingChange({
      setting_name: 'theme_mode',
      old_value: oldTheme,
      new_value: newTheme,
      setting_category: 'ui_setting',
    });
  }

  // Track language changes
  trackLanguageChange(oldLocale: string, newLocale: string) {
    this.trackSettingChange({
      setting_name: 'locale',
      old_value: oldLocale,
      new_value: newLocale,
      setting_category: 'user_preference',
    });
  }

  // Track role selection
  trackRoleSelection(role: PlayerRole) {
    this.trackSettingChange({
      setting_name: 'player_role',
      old_value: 'unknown',
      new_value: role,
      setting_category: 'game_config',
    });
  }

  // Track sound preference changes
  trackSoundPreference(soundType: string, enabled: boolean) {
    this.trackSettingChange({
      setting_name: `${soundType}_sound`,
      old_value: (!enabled).toString(),
      new_value: enabled.toString(),
      setting_category: 'ui_setting',
    });
  }

  // Track background selection
  trackBackgroundChange(backgroundType: string) {
    this.trackFeatureUsage({
      feature_name: 'background_selection',
      feature_category: 'customization',
      interaction_type: 'configure',
    });
    // Also track as setting change for consistency
    this.trackSettingChange({
      setting_name: 'background_type',
      old_value: 'unknown',
      new_value: backgroundType,
      setting_category: 'ui_setting',
    });
  }

  // Track voice preference changes
  trackVoicePreference(voice: string, pitch: number) {
    this.trackSettingChange({
      setting_name: 'voice_preference',
      old_value: 'unknown',
      new_value: voice,
      setting_category: 'user_preference',
      value: pitch,
    });
  }

  // Track intensity selection patterns
  trackIntensityPattern(actionType: GroupType, intensityLevel: number, customGroup?: string) {
    this.trackActionSelection({
      action_type: actionType,
      intensity_level: intensityLevel,
      custom_group: customGroup,
      is_custom_action: !!customGroup,
      event_category: 'intensity_usage',
    });
  }

  // Track room settings
  trackRoomConfiguration(roomType: string, tileCount?: number, isRealtime?: boolean) {
    this.trackFeatureUsage({
      feature_name: 'room_configuration',
      feature_category: 'game_mode',
      interaction_type: 'configure',
      custom_parameter_1: roomType,
      custom_parameter_2: tileCount?.toString() || '',
      custom_parameter_3: isRealtime?.toString() || '',
    });
  }

  // Track custom action usage with full details
  trackCustomActionUsage(
    actionEntry: ActionEntry,
    intensityData?: CustomGroupIntensity,
    customGroupName?: string
  ) {
    this.trackActionSelection({
      action_type: actionEntry.type as GroupType,
      intensity_level: intensityData?.value,
      intensity_label: intensityData?.label,
      custom_group: customGroupName,
      variation: actionEntry.variation,
      is_custom_action: !!customGroupName,
    });
  }

  // Track feature discovery and first-time usage
  trackFeatureDiscovery(featureName: string, context: string) {
    this.trackFeatureUsage({
      feature_name: featureName,
      feature_category: 'ui',
      interaction_type: 'use',
      custom_parameter_1: 'first_time',
      custom_parameter_2: context,
    });
  }

  // Track error or unusual behavior (for UX improvement)
  trackUserFlow(flowName: string, step: string, success: boolean) {
    this.trackEvent('user_flow', {
      event_category: 'user_experience',
      event_label: flowName,
      custom_parameter_1: step,
      custom_parameter_2: success.toString(),
    });
  }

  // Track custom events with parameters
  trackCustomEvent(eventName: string, parameters: AnalyticsEventInput = {}) {
    this.trackEvent(eventName, parameters);
  }

  // Track performance metrics for UX optimization
  trackPerformance(metricName: string, value: number, context?: string) {
    this.trackEvent('performance_metric', {
      event_category: 'performance',
      event_label: metricName,
      value: Math.round(value),
      custom_parameter_1: context || 'unknown',
    });
  }

  // Track user engagement patterns
  trackEngagement(engagementType: string, duration?: number, interactionCount?: number) {
    this.trackEvent('user_engagement', {
      event_category: 'engagement',
      event_label: engagementType,
      value: duration,
      custom_parameter_1: interactionCount?.toString() || '0',
    });
  }

  // --- Wizard funnel (lifecycle analytics) ---

  trackWizardScreenView(screenName: string, topology: string, roomType: string) {
    this.trackEvent('wizard_screen_view', {
      event_category: 'wizard_funnel',
      event_label: screenName,
      screen_name: screenName,
      topology,
      room_type: roomType,
    });
  }

  trackWizardCompleted(topology: string, roomType: string, groupCount: number) {
    this.trackEvent('wizard_completed', {
      event_category: 'wizard_funnel',
      event_label: topology,
      topology,
      room_type: roomType,
      value: groupCount,
    });
  }

  trackWizardAbandoned(lastScreenName: string, topology: string, roomType: string) {
    this.trackEvent('wizard_abandoned', {
      event_category: 'wizard_funnel',
      event_label: lastScreenName,
      screen_name: lastScreenName,
      topology,
      room_type: roomType,
    });
  }

  // --- Game lifecycle (are they playing? rolling? reaching the end?) ---

  trackGameStarted(params: {
    topology: string;
    room_type: string;
    group_count: number;
    board_size: number;
  }) {
    this.trackEvent('game_started', {
      event_category: 'gameplay',
      event_label: params.topology,
      topology: params.topology,
      room_type: params.room_type,
      value: params.group_count,
      board_size: params.board_size,
    });
  }

  trackGroupSelected(groupName: string, levels: number[], groupType: string) {
    this.trackEvent('group_selected', {
      event_category: 'gameplay',
      event_label: groupName,
      levels: levels.join(','),
      group_type: groupType,
    });
  }

  trackActionRolled(rollCount: number) {
    this.trackEvent('action_rolled', {
      event_category: 'gameplay',
      value: rollCount,
    });
  }

  private trackGameEnd(
    eventName: 'game_finished' | 'game_abandoned',
    rollCount: number,
    durationMs: number,
    gameMode: string,
    playerCount: number
  ) {
    this.trackEvent(eventName, {
      event_category: 'gameplay',
      event_label: gameMode,
      roll_count: rollCount,
      value: durationMs,
      game_mode: gameMode,
      player_count: playerCount,
    });
  }

  trackGameFinished(rollCount: number, durationMs: number, gameMode: string, playerCount: number) {
    this.trackGameEnd('game_finished', rollCount, durationMs, gameMode, playerCount);
  }

  trackGameAbandoned(rollCount: number, durationMs: number, gameMode: string, playerCount: number) {
    this.trackGameEnd('game_abandoned', rollCount, durationMs, gameMode, playerCount);
  }

  // --- Content pack lifecycle ---

  trackPackEvent(
    eventName:
      | 'pack_directory_viewed'
      | 'pack_previewed'
      | 'pack_imported'
      | 'pack_published'
      | 'pack_creation_started'
      | 'pack_creation_completed',
    params: PackLifecycleEvent = {}
  ) {
    this.trackEvent(eventName, {
      event_category: 'content_packs',
      ...params,
    });
  }

  // Track app startup and initialization
  trackAppStart(loadTime: number, userType: 'new' | 'returning' = 'returning') {
    this.trackPerformance('app_startup', loadTime, 'initialization');
    this.trackEngagement('app_session_start', 0, 0);

    // Track user type for cohort analysis
    this.trackEvent('app_lifecycle', {
      event_category: 'lifecycle',
      event_label: 'app_start',
      custom_parameter_1: userType,
      custom_parameter_2: loadTime.toString(),
    });
  }

  // Track game session metrics
  trackGameSession(duration: number, actionsCount: number, gameMode: string, playerCount?: number) {
    this.trackEngagement('game_session', duration, actionsCount);

    this.trackEvent('game_session_complete', {
      event_category: 'gameplay',
      event_label: gameMode,
      value: duration,
      custom_parameter_1: actionsCount.toString(),
      custom_parameter_2: playerCount?.toString() || '1',
    });
  }
}

// Create and export singleton instance
export const analytics = new AnalyticsService();

// Export types for use in other files
export type {
  SettingsChangeEvent,
  ActionSelectionEvent,
  FeatureUsageEvent,
  GameModeEvent,
  CustomGroupEvent,
};
