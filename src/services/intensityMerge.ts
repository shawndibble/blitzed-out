// Append-only intensity merging for default-group extensions.
// Used by import (groupExtensions), locale re-seeding, and sync pull so all
// three paths share identical merge semantics: existing entries are never
// removed or renamed, additions dedupe by value, and the combined ladder
// respects the global intensity constraints.
import type { CustomGroupIntensity } from '@/types/customGroups';
import {
  MAX_INTENSITIES_COUNT,
  MAX_INTENSITY_VALUE,
  MIN_INTENSITY_VALUE,
} from '@/services/validationService';

export interface IntensityAddition {
  value: number;
  label: string;
}

export interface IntensitySkip {
  value: number;
  // 'duplicate' — same value AND same label already present (expected on
  // re-import). 'valueConflict' — same value but a DIFFERENT label: the
  // incoming level means something else and was NOT applied, so tiles at this
  // value will carry the existing label (a mislabel risk callers must surface).
  reason: 'duplicate' | 'valueConflict' | 'overCap' | 'outOfRange';
}

export interface IntensityMergeResult {
  merged: CustomGroupIntensity[];
  added: CustomGroupIntensity[];
  skipped: IntensitySkip[];
}

export function extensionIntensityId(groupName: string, value: number): string {
  return `${groupName}-ext-${value}`;
}

/**
 * Appends custom intensity levels to an existing ladder. Never mutates or
 * removes existing entries. Additions are applied ascending by value so that
 * when the cap cuts off the tail, the lowest new levels win deterministically.
 */
export function appendIntensities(
  existing: CustomGroupIntensity[],
  additions: IntensityAddition[],
  groupName: string
): IntensityMergeResult {
  const takenValues = new Set(existing.map((i) => i.value));
  const labelByValue = new Map(existing.map((i) => [i.value, i.label]));
  const added: CustomGroupIntensity[] = [];
  const skipped: IntensitySkip[] = [];

  const sorted = [...additions].sort((a, b) => a.value - b.value);
  for (const addition of sorted) {
    if (
      !Number.isInteger(addition.value) ||
      addition.value < MIN_INTENSITY_VALUE ||
      addition.value > MAX_INTENSITY_VALUE
    ) {
      skipped.push({ value: addition.value, reason: 'outOfRange' });
      continue;
    }
    if (takenValues.has(addition.value)) {
      const existingLabel = labelByValue.get(addition.value);
      skipped.push({
        value: addition.value,
        reason:
          existingLabel !== undefined && existingLabel !== addition.label
            ? 'valueConflict'
            : 'duplicate',
      });
      continue;
    }
    if (existing.length + added.length >= MAX_INTENSITIES_COUNT) {
      skipped.push({ value: addition.value, reason: 'overCap' });
      continue;
    }
    takenValues.add(addition.value);
    labelByValue.set(addition.value, addition.label);
    added.push({
      id: extensionIntensityId(groupName, addition.value),
      label: addition.label,
      value: addition.value,
      isDefault: false,
    });
  }

  const merged = [...existing, ...added].sort((a, b) => a.value - b.value);
  return { merged, added, skipped };
}

/**
 * Re-seed merge: the locale bundle's default ladder is canonical; custom
 * (non-default) intensities appended by the user survive unless the bundle
 * now claims their value — on collision the bundle wins and the custom entry
 * is dropped (tiles at that value re-map to the new default level).
 */
export function mergeSeedIntensities(
  bundleIntensities: CustomGroupIntensity[],
  existingIntensities: CustomGroupIntensity[] | undefined
): CustomGroupIntensity[] {
  if (!existingIntensities?.length) return bundleIntensities;

  const bundleValues = new Set(bundleIntensities.map((i) => i.value));
  const preserved = existingIntensities.filter((i) => !i.isDefault && !bundleValues.has(i.value));
  return [...bundleIntensities, ...preserved].sort((a, b) => a.value - b.value);
}
