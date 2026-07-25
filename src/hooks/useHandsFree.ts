import { useCallback } from 'react';

import { analytics } from '@/services/analytics';
import { DEFAULT_HANDS_FREE_PRESET, HandsFreePreset } from '@/helpers/handsFree';
import { useSettings } from '@/stores/settingsStore';

interface UseHandsFreeResult {
  enabled: boolean;
  preset: HandsFreePreset;
  /** Enable if `checked`, disable otherwise. The single write path for both. */
  toggle: (checked: boolean) => void;
  setPreset: (preset: HandsFreePreset) => void;
  /** Explicit exit, for callers (roll menu, auto-roll) that never offer enable. */
  disable: () => void;
}

/**
 * Single mediator for the Hands-Free enable/disable invariant (see CONTEXT.md
 * "Hands-Free"): enabling forces `readRoll` on, disabling must restore
 * whatever it was before. `updateSettings` is a shallow key/value writer that
 * cannot enforce that two-key relationship on its own, so every caller that
 * flips Hands-Free off goes through this hook instead of writing
 * `handsFree`/`readRoll` directly.
 *
 * The pre-enable `readRoll` is stored in the `readRollBeforeHandsFree`
 * settings field, not a component ref/state, so it survives a remount (e.g.
 * page reload while Hands-Free is already on) instead of re-capturing the
 * forced-on value as if it were the user's original preference.
 */
export default function useHandsFree(): UseHandsFreeResult {
  const [settings, updateSettings] = useSettings();
  const enabled = Boolean(settings.handsFree);
  const preset = settings.handsFreePreset ?? DEFAULT_HANDS_FREE_PRESET;

  const enable = useCallback((): void => {
    // Guard against a repeat enable clobbering the memo with the already-forced true.
    if (settings.handsFree) return;
    updateSettings({
      handsFree: true,
      handsFreePreset: settings.handsFreePreset ?? DEFAULT_HANDS_FREE_PRESET,
      readRoll: true,
      readRollBeforeHandsFree: Boolean(settings.readRoll),
    });
    analytics.trackFeatureUsage({
      feature_name: 'hands_free',
      feature_category: 'settings',
      interaction_type: 'enable',
    });
  }, [settings.handsFree, settings.handsFreePreset, settings.readRoll, updateSettings]);

  const disable = useCallback((): void => {
    if (!settings.handsFree) return;
    updateSettings({
      handsFree: false,
      readRoll: settings.readRollBeforeHandsFree ?? false,
    });
    analytics.trackFeatureUsage({
      feature_name: 'hands_free',
      feature_category: 'settings',
      interaction_type: 'disable',
    });
  }, [settings.handsFree, settings.readRollBeforeHandsFree, updateSettings]);

  const toggle = useCallback(
    (checked: boolean): void => {
      if (checked) enable();
      else disable();
    },
    [enable, disable]
  );

  const setPreset = useCallback(
    (value: HandsFreePreset): void => {
      updateSettings({ handsFreePreset: value });
    },
    [updateSettings]
  );

  return { enabled, preset, toggle, setPreset, disable };
}
