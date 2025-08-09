/**
 * Utility functions for background filtering and management
 */

/**
 * Filters available background options based on context
 * @param backgrounds - All available background options
 * @param isRoom - Whether this is for room background selection
 * @param isPrivateRoom - Whether the current context is a private room
 * @returns Filtered background options appropriate for the context
 */
export function filterBackgroundOptions(
  backgrounds: Record<string, string>,
  isRoom: boolean = false,
  isPrivateRoom: boolean = false
): Record<string, string> {
  if (isRoom) {
    // Room backgrounds - return all options
    return backgrounds;
  }

  // App backgrounds - filter based on room type
  const filtered = { ...backgrounds };

  if (!isPrivateRoom) {
    // Public room - remove "Use Room Background" option since it's not available
    delete filtered.useRoomBackground;
  }

  return filtered;
}

/**
 * Gets the appropriate background key based on context
 * @param isRoom - Whether this is for room background selection
 * @returns The settings key to use for background selection
 */
export function getBackgroundKey(isRoom: boolean): string {
  return isRoom ? 'roomBackground' : 'background';
}

/**
 * Gets the appropriate background URL key based on context
 * @param isRoom - Whether this is for room background selection
 * @returns The settings key to use for background URL
 */
export function getBackgroundURLKey(isRoom: boolean): string {
  return isRoom ? 'roomBackgroundURL' : 'backgroundURL';
}
