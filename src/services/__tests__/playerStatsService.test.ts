/**
 * @vitest-environment jsdom
 */
import { describe, test, expect, beforeEach } from 'vitest';
import { fetchPlayerStats, recordDiceRoll } from '../playerStatsService';
import db from '@/stores/store';

describe('playerStatsService', () => {
  beforeEach(async () => {
    await db.globalPlayerStats.clear();
  });

  describe('fetchPlayerStats (read-only — safe for liveQuery)', () => {
    test('returns a default object without writing when no row exists', async () => {
      const stats = await fetchPlayerStats('owner-1');

      expect(stats.ownerId).toBe('owner-1');
      expect(stats.diceRollCount).toBe(0);
      expect(stats.id).toBeUndefined();

      // The read must not have created a row — this is what triggered the
      // Dexie ReadOnlyError when called inside a liveQuery.
      const count = await db.globalPlayerStats.count();
      expect(count).toBe(0);
    });

    test('returns the existing row when one exists', async () => {
      await recordDiceRoll('owner-2', 6);

      const stats = await fetchPlayerStats('owner-2');
      expect(stats.id).toBeDefined();
      expect(stats.diceRollCount).toBe(1);
      expect(stats.diceRollSum).toBe(6);
    });
  });

  describe('getOrCreateStats idempotency (via recordDiceRoll)', () => {
    test('concurrent first-time writes create exactly one row', async () => {
      // Mirrors a multi-dice roll firing recordDiceRoll in parallel for a brand-new owner.
      await Promise.all([
        recordDiceRoll('owner-3', 1),
        recordDiceRoll('owner-3', 2),
        recordDiceRoll('owner-3', 3),
      ]);

      const rows = await db.globalPlayerStats.where('ownerId').equals('owner-3').toArray();
      expect(rows).toHaveLength(1);
      expect(rows[0].diceRollCount).toBe(3);
    });
  });
});
