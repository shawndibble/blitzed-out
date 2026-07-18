import { GameMode, HandsFreePreset } from '@/types/Settings';

export type { HandsFreePreset };

export interface HandsFreeRange {
  min: number;
  max: number;
}

/** Roll cadence presets in seconds; each session picks a random delay within the range. */
export const HANDS_FREE_PRESETS: Record<HandsFreePreset, HandsFreeRange> = {
  quick: { min: 30, max: 60 },
  standard: { min: 60, max: 120 },
  extended: { min: 120, max: 300 },
};

export const DEFAULT_HANDS_FREE_PRESET: HandsFreePreset = 'standard';

/**
 * Hands-Free is Solo + Shared Device only (see CONTEXT.md "Hands-Free").
 * Online rooms keep manual rolling — auto-rolling actions at a possibly-AFK
 * player in a group room is a consent hazard.
 */
export function isHandsFreeAvailable(gameMode: GameMode | string | undefined): boolean {
  return gameMode === 'solo' || gameMode === 'local';
}

export function resolveHandsFreeRange(preset: HandsFreePreset | undefined): HandsFreeRange {
  if (preset && preset in HANDS_FREE_PRESETS) {
    return HANDS_FREE_PRESETS[preset];
  }
  return HANDS_FREE_PRESETS[DEFAULT_HANDS_FREE_PRESET];
}
