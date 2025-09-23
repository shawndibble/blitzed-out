// Analytics-specific types that extend existing domain types
import { GameMode, PlayerRole, ThemeMode } from './Settings';
import { GroupType } from '@/services/validationService';

// Common analytics interaction types
export type InteractionType = 'enable' | 'disable' | 'configure' | 'use';
export type CrudAction = 'create' | 'modify' | 'delete' | 'use';
export type FeatureCategory = 'game_mode' | 'customization' | 'social' | 'settings' | 'ui';
export type SettingCategory = 'user_preference' | 'game_config' | 'ui_setting';
export type RoomType = 'public' | 'private';

// Base analytics event structure
export interface BaseAnalyticsEvent {
  event_category?: string;
  event_label?: string;
  value?: number;
  custom_parameter_1?: string;
  custom_parameter_2?: string;
  custom_parameter_3?: string;
}

// Specific analytics event types using domain types
export interface SettingsChangeEvent extends BaseAnalyticsEvent {
  setting_name: string;
  old_value: string;
  new_value: string;
  setting_category: SettingCategory;
}

export interface ActionSelectionEvent extends BaseAnalyticsEvent {
  action_type: GroupType; // Reuses existing domain type
  intensity_level?: number;
  intensity_label?: string;
  custom_group?: string;
  variation?: string;
  is_custom_action: boolean;
}

export interface FeatureUsageEvent extends BaseAnalyticsEvent {
  feature_name: string;
  feature_category: FeatureCategory;
  interaction_type: InteractionType;
}

export interface GameModeEvent extends BaseAnalyticsEvent {
  game_mode: GameMode; // Reuses existing domain type
  player_count?: number;
  room_type?: RoomType;
  has_custom_actions: boolean;
}

export interface CustomGroupEvent extends BaseAnalyticsEvent {
  group_name: string;
  group_type: GroupType; // Reuses existing domain type
  intensity_count: number;
  is_default_template: boolean;
  action_type: CrudAction;
}

// Union type for all analytics events
export type AnalyticsEvent =
  | SettingsChangeEvent
  | ActionSelectionEvent
  | FeatureUsageEvent
  | GameModeEvent
  | CustomGroupEvent;

// Re-export commonly used domain types for convenience
export type { GameMode, PlayerRole, ThemeMode, GroupType };
