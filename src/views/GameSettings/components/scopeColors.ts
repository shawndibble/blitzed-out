export type SettingsScope = 'room' | 'board' | 'me';

/** Scope accent colors used by section badges and the jump navigation. */
export const SCOPE_COLORS: Record<SettingsScope, string> = {
  room: '#a78bfa',
  board: '#22d3ee',
  me: '#fbbf24',
};
