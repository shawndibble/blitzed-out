import { GroupedActions, MappedGroup } from '@/types/customTiles';

import { camelToPascal } from '@/helpers/strings';

/**
 * Transforms grouped actions into a flat array of mapped groups for UI components
 *
 * @param actionsFolder - Object containing grouped actions with intensities
 * @returns Array of mapped groups with intensity levels and labels
 *
 * Features:
 * - Creates individual entries for each intensity level
 * - Converts group names to PascalCase for consistency
 */
/** Matches a {dom}/{sub} role token in any form: bare, piped, or as a pipe target. */
const ROLE_TOKEN_PATTERN = /[{|](dom|sub)[}|]/;

/**
 * Whether a group's action text references a {dom}/{sub} role.
 *
 * Pure-question groups (e.g. confessions, would-you-rather) never reference a
 * role, so a role selector for them is meaningless and should be hidden.
 */
export function groupUsesRoleTokens(group?: GroupedActions[string]): boolean {
  const actions = group?.actions;
  if (!actions) return false;
  return Object.values(actions).some(
    (level) =>
      Array.isArray(level) &&
      level.some((action) => typeof action === 'string' && ROLE_TOKEN_PATTERN.test(action))
  );
}

export default function groupActionsFolder(actionsFolder: GroupedActions): MappedGroup[] {
  return Object.entries(actionsFolder).flatMap(([key, { label, actions }]) => {
    if (!actions) return [];
    const intensities = Object.keys(actions);
    return intensities.map((intensity, index) => ({
      group: camelToPascal(key),
      groupLabel: label,
      value: key,
      intensity: Number(index + 1),
      translatedIntensity: intensity,
      label: `${label} - ${intensity}`,
    }));
  });
}
