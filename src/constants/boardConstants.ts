/**
 * Constants for game board sizing
 */

/**
 * Code-level fallback tile count for callers that read an unset `roomTileCount`.
 * The persisted store default for fresh installs is set separately (the wizard's
 * Medium board length); rooms honor the user's chosen `roomTileCount`.
 */
export const DEFAULT_TILE_COUNT = 60;
