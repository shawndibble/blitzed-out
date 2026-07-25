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
 * Whether one action's text references a {dom}/{sub} role, and so is worth
 * offering a role selector for.
 *
 * Pure-question groups (confessions, would-you-rather) never reference a role
 * even though they are partnered content, so type alone is not a safe proxy.
 * Applied to raw tile rows in `getTileCountsByGroup`, which is the only place
 * that already holds the action text — the settings page's own catalog builds
 * empty action arrays by design, so any group-shaped check against it is
 * permanently false.
 */
export function actionUsesRoleTokens(action?: string): boolean {
  return typeof action === 'string' && ROLE_TOKEN_PATTERN.test(action);
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
