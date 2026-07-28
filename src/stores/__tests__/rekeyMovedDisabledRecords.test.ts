import { beforeEach, describe, expect, it } from 'vitest';

import db from '@/stores/store';
import {
  disabledKey,
  rekeyMovedDisabledRecords,
  reconcileDisabledRows,
} from '@/stores/disabledDefaults';

const GROUP = 'clitTraining-group-id';
const ACTION = "{sub} rubs {dom}'s clit in slow circles for 15 seconds.";

const seedTile = (intensity: number, isEnabled: number) =>
  db.customTiles.add({
    group_id: GROUP,
    intensity,
    action: ACTION,
    tags: ['default'],
    isEnabled,
    isCustom: 0,
  } as never);

const seedDisabledRecord = (intensity: number) =>
  db.disabledDefaults.put({
    key: disabledKey({ group_id: GROUP, intensity, action: ACTION }),
    group_id: GROUP,
    intensity,
    action: ACTION,
    active: true,
    updatedAt: 1,
  } as never);

describe('rekeyMovedDisabledRecords', () => {
  beforeEach(async () => {
    await db.customTiles.clear();
    await db.disabledDefaults.clear();
  });

  it('follows a disabled action that moved to a different intensity', async () => {
    // The player disabled this action while it sat at intensity 3; the ladder
    // rework moved it to 2, so the re-seeded row lives there now.
    await seedDisabledRecord(3);
    const tileId = await seedTile(2, 1);

    expect(await rekeyMovedDisabledRecords()).toBe(1);
    await reconcileDisabledRows();

    const tile = await db.customTiles.get(tileId);
    expect(tile?.isEnabled).toBe(0);

    const records = await db.disabledDefaults.toArray();
    expect(records).toHaveLength(1);
    expect(records[0].intensity).toBe(2);
  });

  it('without the re-key, reconcile would re-enable it', async () => {
    await seedDisabledRecord(3);
    const tileId = await seedTile(2, 1);

    await reconcileDisabledRows();

    expect((await db.customTiles.get(tileId))?.isEnabled).toBe(1);
  });

  it('leaves a record alone when its action still sits at the same intensity', async () => {
    await seedDisabledRecord(2);
    await seedTile(2, 0);

    expect(await rekeyMovedDisabledRecords()).toBe(0);
  });

  it('leaves a record alone when the action is gone entirely (a reword)', async () => {
    await seedDisabledRecord(3);
    await db.customTiles.add({
      group_id: GROUP,
      intensity: 3,
      action: 'Completely different wording.',
      tags: ['default'],
      isEnabled: 1,
      isCustom: 0,
    } as never);

    expect(await rekeyMovedDisabledRecords()).toBe(0);
  });

  it('is idempotent', async () => {
    await seedDisabledRecord(3);
    await seedTile(2, 1);

    expect(await rekeyMovedDisabledRecords()).toBe(1);
    expect(await rekeyMovedDisabledRecords()).toBe(0);
  });
});
