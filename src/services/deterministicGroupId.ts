/**
 * Deterministic ID generation for default (seeded) content groups.
 *
 * CRITICAL: this value is a Dexie `customGroups` primary key and syncs to
 * Firebase. Any change to the algorithm or output format orphans every
 * existing default group/tile on every device — see
 * src/services/__tests__/deterministicGroupId.test.ts, which pins the exact
 * output for several inputs and must keep passing across any edit here.
 */

/**
 * Creates a deterministic group ID for default groups
 * This ensures default groups have the same ID across all devices for sync consistency
 */
export function createDeterministicGroupId(
  groupName: string,
  locale: string,
  gameMode: string
): string {
  // Create a consistent hash-like ID based on group properties
  // Format: default-{locale}-{gameMode}-{groupName}
  // This ensures all devices generate the same ID for default groups
  const baseId = `default-${locale}-${gameMode}-${groupName}`;

  // Create a simple hash to keep IDs reasonably short but still unique
  let hash = 0;
  for (let i = 0; i < baseId.length; i++) {
    const char = baseId.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Convert to a positive hex string with prefix
  const hashStr = Math.abs(hash).toString(16).padStart(8, '0');
  return `default_${locale}_${gameMode}_${groupName}_${hashStr}`.slice(0, 50);
}
