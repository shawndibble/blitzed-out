import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import db from '../store';
import {
  disableDefaultTile,
  enableDefaultTile,
  getActiveDisabledKeys,
  getAllDisabledRecords,
  mergeRemoteDisabledRecords,
  reconcileDisabledRows,
  disabledKey,
} from '../disabledDefaults';
import type { CustomTilePull, DisabledDefault } from '@/types/customTiles';

function defaultRow(
  id: number,
  group_id: string,
  intensity: number,
  action: string
): CustomTilePull {
  return { id, group_id, intensity, action, tags: [], isEnabled: 1, isCustom: 0 };
}

beforeEach(async () => {
  await db.customTiles.clear();
  await db.disabledDefaults.clear();
});

afterEach(async () => {
  await db.customTiles.clear();
  await db.disabledDefaults.clear();
});

describe('disabledDefaults store', () => {
  it('disabling a default records an active disablement and flips the row', async () => {
    await db.customTiles.add(defaultRow(1, 'g1', 2, 'Spank'));

    await disableDefaultTile({ group_id: 'g1', intensity: 2, action: 'Spank' });

    const record = await db.disabledDefaults.get(
      disabledKey({ group_id: 'g1', intensity: 2, action: 'Spank' })
    );
    expect(record?.active).toBe(true);
    const row = await db.customTiles.get(1);
    expect(Number(row?.isEnabled)).toBe(0);
  });

  it('re-enabling writes a tombstone and re-enables the row', async () => {
    await db.customTiles.add(defaultRow(1, 'g1', 2, 'Spank'));
    await disableDefaultTile({ group_id: 'g1', intensity: 2, action: 'Spank' });

    await enableDefaultTile({ group_id: 'g1', intensity: 2, action: 'Spank' });

    const record = await db.disabledDefaults.get(
      disabledKey({ group_id: 'g1', intensity: 2, action: 'Spank' })
    );
    expect(record?.active).toBe(false); // tombstone, not deleted
    const row = await db.customTiles.get(1);
    expect(Number(row?.isEnabled)).toBe(1);
  });

  describe('mergeRemoteDisabledRecords (last-writer-wins)', () => {
    it('applies a newer remote record', async () => {
      const remote: DisabledDefault[] = [
        { key: 'g1|1|A', group_id: 'g1', intensity: 1, action: 'A', active: true, updatedAt: 100 },
      ];
      const changed = await mergeRemoteDisabledRecords(remote);
      expect(changed).toBe(1);
      expect((await db.disabledDefaults.get('g1|1|A'))?.active).toBe(true);
    });

    it('ignores an older remote record', async () => {
      await db.disabledDefaults.put({
        key: 'g1|1|A',
        group_id: 'g1',
        intensity: 1,
        action: 'A',
        active: true,
        updatedAt: 500,
      });
      const changed = await mergeRemoteDisabledRecords([
        { key: 'g1|1|A', group_id: 'g1', intensity: 1, action: 'A', active: false, updatedAt: 200 },
      ]);
      expect(changed).toBe(0);
      expect((await db.disabledDefaults.get('g1|1|A'))?.active).toBe(true); // unchanged
    });

    it('propagates a re-enable tombstone from another device', async () => {
      // Local thinks the tile is disabled...
      await db.disabledDefaults.put({
        key: 'g1|1|A',
        group_id: 'g1',
        intensity: 1,
        action: 'A',
        active: true,
        updatedAt: 100,
      });
      // ...remote re-enabled it later (tombstone).
      const changed = await mergeRemoteDisabledRecords([
        { key: 'g1|1|A', group_id: 'g1', intensity: 1, action: 'A', active: false, updatedAt: 300 },
      ]);
      expect(changed).toBe(1);
      expect((await db.disabledDefaults.get('g1|1|A'))?.active).toBe(false);
    });

    it('survives well past the old 100-record cap (no silent drop)', async () => {
      const remote: DisabledDefault[] = Array.from({ length: 150 }, (_, i) => ({
        key: `g1|1|A${i}`,
        group_id: 'g1',
        intensity: 1,
        action: `A${i}`,
        active: true,
        updatedAt: 100,
      }));
      const changed = await mergeRemoteDisabledRecords(remote);
      expect(changed).toBe(150);
      const all = await getAllDisabledRecords();
      expect(all.length).toBe(150);
    });
  });

  describe('reconcileDisabledRows', () => {
    it('flips default rows to match the active record set', async () => {
      await db.customTiles.bulkAdd([defaultRow(1, 'g1', 1, 'A'), defaultRow(2, 'g1', 1, 'B')]);
      await db.disabledDefaults.put({
        key: 'g1|1|A',
        group_id: 'g1',
        intensity: 1,
        action: 'A',
        active: true,
        updatedAt: 100,
      });
      // Tombstone for B must NOT disable it.
      await db.disabledDefaults.put({
        key: 'g1|1|B',
        group_id: 'g1',
        intensity: 1,
        action: 'B',
        active: false,
        updatedAt: 100,
      });

      await reconcileDisabledRows();

      expect(Number((await db.customTiles.get(1))?.isEnabled)).toBe(0);
      expect(Number((await db.customTiles.get(2))?.isEnabled)).toBe(1);
    });

    it('does not touch custom tiles', async () => {
      await db.customTiles.add({
        id: 9,
        group_id: 'g1',
        intensity: 1,
        action: 'C',
        tags: [],
        isEnabled: 0,
        isCustom: 1,
      });
      const keys = await getActiveDisabledKeys();
      expect(keys.size).toBe(0);
      await reconcileDisabledRows();
      // Custom tile keeps its (user-chosen) disabled state.
      expect(Number((await db.customTiles.get(9))?.isEnabled)).toBe(0);
    });
  });
});
