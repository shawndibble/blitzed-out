import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { analytics } from '../analytics';
import { GroupType } from '@/types/analytics';

// Mock window.gtag
const mockGtag = vi.fn();

describe('Analytics Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.gtag
    Object.defineProperty(window, 'gtag', {
      value: mockGtag,
      writable: true,
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Basic Event Tracking', () => {
    it('should track theme changes', () => {
      analytics.trackThemeChange('light', 'dark');

      expect(mockGtag).toHaveBeenCalledWith(
        'event',
        'setting_change',
        expect.objectContaining({
          event_category: 'user_preferences',
          event_label: 'theme_mode',
          setting_name: 'theme_mode',
          old_value: 'light',
          new_value: 'dark',
          setting_category: 'ui_setting',
        })
      );
    });

    it('should track language changes', () => {
      analytics.trackLanguageChange('en', 'es');

      expect(mockGtag).toHaveBeenCalledWith(
        'event',
        'setting_change',
        expect.objectContaining({
          event_category: 'user_preferences',
          event_label: 'locale',
          setting_name: 'locale',
          old_value: 'en',
          new_value: 'es',
        })
      );
    });

    it('should track action selections', () => {
      analytics.trackActionSelection({
        action_type: 'foreplay',
        intensity_level: 3,
        intensity_label: 'Intense',
        custom_group: 'romantic',
        is_custom_action: true,
      });

      expect(mockGtag).toHaveBeenCalledWith(
        'event',
        'action_selected',
        expect.objectContaining({
          event_category: 'action_usage',
          event_label: 'foreplay',
          value: 3,
          custom_parameter_1: 'romantic',
          custom_parameter_2: 'Intense',
        })
      );
    });
  });

  describe('Game Mode Tracking', () => {
    it('should track game mode selection with context', () => {
      analytics.trackGameModeSelection({
        game_mode: 'solo',
        player_count: 1,
        room_type: 'private',
        has_custom_actions: true,
      });

      expect(mockGtag).toHaveBeenCalledWith(
        'event',
        'game_mode_selected',
        expect.objectContaining({
          event_category: 'game_config',
          event_label: 'solo',
          value: 1,
          custom_parameter_1: 'private',
          custom_parameter_2: 'true',
        })
      );
    });
  });

  describe('Custom Group Tracking', () => {
    it('should track custom group creation', () => {
      analytics.trackCustomGroupUsage({
        group_name: 'my_custom_group',
        group_type: 'foreplay',
        intensity_count: 4,
        is_default_template: false,
        action_type: 'create',
      });

      expect(mockGtag).toHaveBeenCalledWith(
        'event',
        'custom_group_action',
        expect.objectContaining({
          event_category: 'customization',
          event_label: 'my_custom_group',
          value: 4,
          custom_parameter_1: 'foreplay',
          custom_parameter_2: 'create',
          custom_parameter_3: 'false',
        })
      );
    });
  });

  describe('Privacy Controls', () => {
    it('should handle missing gtag gracefully', () => {
      // Mock window without gtag
      const originalGtag = window.gtag;
      (window as any).gtag = undefined;

      expect(() => {
        analytics.trackThemeChange('light', 'dark');
      }).not.toThrow();

      expect(mockGtag).not.toHaveBeenCalled();

      // Restore original gtag
      (window as any).gtag = originalGtag;
    });
  });

  describe('Development Mode', () => {
    it('should not track when gtag is missing', () => {
      // Simulate development mode by removing gtag
      const originalGtag = window.gtag;
      (window as any).gtag = undefined;

      // In development without gtag, should not throw and should not track
      expect(() => analytics.trackThemeChange('light', 'dark')).not.toThrow();
      expect(mockGtag).not.toHaveBeenCalled();

      // Restore original gtag
      (window as any).gtag = originalGtag;
    });
  });

  describe('Intensity Pattern Tracking', () => {
    it('should track intensity patterns correctly', () => {
      analytics.trackIntensityPattern('foreplay' as GroupType, 3, 'romantic_evening');

      expect(mockGtag).toHaveBeenCalledWith(
        'event',
        'action_selected',
        expect.objectContaining({
          action_type: 'foreplay',
          intensity_level: 3,
          custom_group: 'romantic_evening',
          is_custom_action: true,
          event_category: 'intensity_usage',
        })
      );
    });
  });

  describe('Feature Usage Tracking', () => {
    it('should track feature usage with proper categorization', () => {
      analytics.trackFeatureUsage({
        feature_name: 'voice_commands',
        feature_category: 'settings',
        interaction_type: 'enable',
      });

      expect(mockGtag).toHaveBeenCalledWith(
        'event',
        'feature_usage',
        expect.objectContaining({
          event_category: 'settings',
          event_label: 'voice_commands',
          custom_parameter_1: 'enable',
        })
      );
    });
  });
});
