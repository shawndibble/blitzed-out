import db from './store';
import { DisabledDefault, CustomTile } from '@/types/customTiles';
import { toggleCustomTile } from './customTiles';

const { disabledDefaults, customTiles } = db;

/** Stable content-tuple key for a default tile. */
export const disabledKey = (tile: {
  group_id?: string;
  intensity: number;
  action: string;
}): string => `${tile.group_id}|${tile.intensity}|${tile.action}`;

// Stamp/keep the last-writer-wins timestamp. Sync merges supply an explicit
// `updatedAt` (the remote one) and must not be restamped, mirroring the
// customTiles hooks.
disabledDefaults.hook('creating', function (this: any, _primKey, obj: DisabledDefault) {
  if (obj.updatedAt === undefined) obj.updatedAt = Date.now();
});
disabledDefaults.hook('updating', function (this: any, modifications: any) {
  if (modifications && !('updatedAt' in modifications)) {
    return { updatedAt: Date.now() };
  }
});

interface DefaultTileRef {
  group_id?: string;
  intensity: number;
  action: string;
}

/** Find the local default-tile row id for a content tuple, if present. */
async function findDefaultRowId(ref: DefaultTileRef): Promise<number | undefined> {
  const row = await customTiles
    .where('[group_id+intensity+action]')
    .equals([ref.group_id ?? '', ref.intensity, ref.action])
    .filter((t) => t.isCustom === 0)
    .first();
  return row?.id;
}

/** Disable a default tile: record an active disablement + flip the local row. */
export async function disableDefaultTile(ref: DefaultTileRef): Promise<void> {
  const key = disabledKey(ref);
  await disabledDefaults.put({
    key,
    group_id: ref.group_id,
    intensity: ref.intensity,
    action: ref.action,
    active: true,
    updatedAt: Date.now(),
  });
  const rowId = await findDefaultRowId(ref);
  if (rowId !== undefined) await customTiles.update(rowId, { isEnabled: 0 });
}

/** Re-enable a default tile: tombstone the record (active: false) + flip the row. */
export async function enableDefaultTile(ref: DefaultTileRef): Promise<void> {
  const key = disabledKey(ref);
  await disabledDefaults.put({
    key,
    group_id: ref.group_id,
    intensity: ref.intensity,
    action: ref.action,
    active: false,
    updatedAt: Date.now(),
  });
  const rowId = await findDefaultRowId(ref);
  if (rowId !== undefined) await customTiles.update(rowId, { isEnabled: 1 });
}

/**
 * Toggle a tile's enabled state. Custom tiles flip their row flag as before;
 * default tiles route through the first-class disabled-defaults table so the
 * change is durable and syncs with a tombstone.
 */
export async function toggleTileEnabled(tile: CustomTile): Promise<void> {
  const isCustom = tile.isCustom === 1;
  if (isCustom) {
    if (tile.id !== undefined) await toggleCustomTile(tile.id);
    return;
  }
  const currentlyEnabled = Number(tile.isEnabled) !== 0;
  const ref = { group_id: tile.group_id, intensity: tile.intensity, action: tile.action };
  if (currentlyEnabled) await disableDefaultTile(ref);
  else await enableDefaultTile(ref);
}

/** All records (incl. tombstones) — the full set the sync layer pushes. */
export async function getAllDisabledRecords(): Promise<DisabledDefault[]> {
  return await disabledDefaults.toArray();
}

/** Only the currently-disabled records (active: true). */
export async function getActiveDisabledRecords(): Promise<DisabledDefault[]> {
  return await disabledDefaults.filter((r) => r.active === true).toArray();
}

/** Set of active disabled keys, for fast membership checks. */
export async function getActiveDisabledKeys(): Promise<Set<string>> {
  const records = await getActiveDisabledRecords();
  return new Set(records.map((r) => r.key));
}

/**
 * Sole writer of default-row `isEnabled`, derived from the table. Called after
 * a sync pull (and available after migration). Default tile rows that match an
 * active record become disabled; everything else default becomes enabled. Custom
 * tiles (isCustom: 1) are never touched.
 */
export async function reconcileDisabledRows(): Promise<void> {
  const activeKeys = await getActiveDisabledKeys();
  const defaultRows = await customTiles.filter((t) => t.isCustom === 0).toArray();

  for (const row of defaultRows) {
    if (row.id === undefined) continue;
    const shouldBeDisabled = activeKeys.has(disabledKey(row));
    const isDisabled = Number(row.isEnabled) === 0;
    if (shouldBeDisabled && !isDisabled) {
      await customTiles.update(row.id, { isEnabled: 0 });
    } else if (!shouldBeDisabled && isDisabled) {
      await customTiles.update(row.id, { isEnabled: 1 });
    }
  }
}

/**
 * Merge remote disabled-default records into the local table using per-record
 * last-writer-wins. Returns the number of records changed (0 = no-op).
 */
export async function mergeRemoteDisabledRecords(remote: DisabledDefault[]): Promise<number> {
  let changed = 0;
  for (const r of remote) {
    if (!r || typeof r.key !== 'string') continue;
    const local = await disabledDefaults.get(r.key);
    const remoteTs = typeof r.updatedAt === 'number' ? r.updatedAt : 0;
    const localTs = typeof local?.updatedAt === 'number' ? local.updatedAt : -1;
    // Strict `>`: once both converge to the same timestamp, stop re-applying.
    if (remoteTs > localTs) {
      // Preserve the remote timestamp so the applied record doesn't look newer.
      await disabledDefaults.put({
        key: r.key,
        group_id: r.group_id,
        intensity: r.intensity,
        action: r.action,
        active: r.active === true,
        updatedAt: remoteTs,
      });
      changed++;
    }
  }
  return changed;
}
