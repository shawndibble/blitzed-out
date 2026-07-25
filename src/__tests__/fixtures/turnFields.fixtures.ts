import type { TurnFields } from '@/types/Message';

/**
 * Single source of truth for a TurnFields literal in tests. Producer tests
 * (usePlayerMove/useReturnToStart) and consumer tests (ActionCard,
 * usePlayerList) both build on this so a change to the field shape breaks
 * both sides instead of only the hand-written consumer fixture drifting
 * silently out of sync with what the encoder actually emits.
 */
export function makeTurnFields(overrides: Partial<TurnFields> = {}): TurnFields {
  return {
    kind: 'normal',
    roll: 2,
    location: 6,
    title: 'Spanking',
    description: '10 swats',
    finished: false,
    ...overrides,
  };
}
