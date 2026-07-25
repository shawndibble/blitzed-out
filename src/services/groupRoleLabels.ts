import type { ContentGameMode } from '@/types/Settings';

export interface GroupRoleLabels {
  dom?: string;
  sub?: string;
}

/**
 * Per-group names for the two sides of a partnered action — Butt Play's
 * Top/Bottom, Ball Busting's Buster/Bustee, Throat Training's Receive/Give Oral.
 * Nine default groups define them; the rest fall back to generic Dominant /
 * Submissive.
 *
 * Read from the locale bundle rather than the database on purpose. The seeder
 * (`importActionFile`) builds each group row from an explicit field list that
 * omits `dom`/`sub`, so they have never reached Dexie — and seeding is gated on
 * `completedLanguages.includes(locale)` with no version check, so persisting
 * them would only ever reach fresh installs. Every existing player would keep
 * the generic wording indefinitely.
 *
 * This is presentation-only, locale-specific, and not user-editable, which is
 * what makes the bundle the right source: nothing here needs to survive a sync
 * or be overridable per player.
 */
export type RoleLabelBundleLoader = (
  locale: string,
  gameMode: ContentGameMode
) => Promise<Record<string, unknown>>;

const loadBundle: RoleLabelBundleLoader = (locale, gameMode) =>
  import(`@/locales/${locale}/${gameMode}-bundle.json`).then((module) => module.default);

const cache = new Map<string, Record<string, GroupRoleLabels>>();

/** Clears the memo — tests only; the bundles are immutable at runtime. */
export function resetGroupRoleLabelCache(): void {
  cache.clear();
}

/**
 * Role labels keyed by group name, for every group in the bundle that defines
 * them. Groups absent from the result (custom groups, imported packs, and the
 * defaults with no bespoke wording) get the generic labels from the caller.
 *
 * Returns `{}` rather than throwing on a missing or malformed bundle: generic
 * role wording is a fine outcome, a broken settings page is not.
 */
export async function getGroupRoleLabels(
  locale: string,
  gameMode: ContentGameMode,
  load: RoleLabelBundleLoader = loadBundle
): Promise<Record<string, GroupRoleLabels>> {
  const key = `${locale}:${gameMode}`;
  const cached = cache.get(key);
  if (cached) return cached;

  try {
    const bundle = await load(locale, gameMode);
    const labels: Record<string, GroupRoleLabels> = {};

    Object.entries(bundle ?? {}).forEach(([name, group]) => {
      const { dom, sub } = (group ?? {}) as GroupRoleLabels;
      if (typeof dom === 'string' || typeof sub === 'string') {
        labels[name] = {
          ...(typeof dom === 'string' && { dom }),
          ...(typeof sub === 'string' && { sub }),
        };
      }
    });

    cache.set(key, labels);
    return labels;
  } catch {
    return {};
  }
}
