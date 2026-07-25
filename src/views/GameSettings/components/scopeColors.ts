/**
 * `setup` is the section that decides the other three rather than belonging to
 * them — the two questions every section below filters itself against.
 */
export type SettingsScope = 'setup' | 'room' | 'board' | 'me';

/** Scope accent colors used by section badges and the jump navigation. */
export const SCOPE_COLORS: Record<SettingsScope, string> = {
  setup: '#34d399',
  room: '#a78bfa',
  board: '#22d3ee',
  me: '#fbbf24',
};
