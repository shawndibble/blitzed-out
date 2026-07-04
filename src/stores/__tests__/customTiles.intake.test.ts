import { beforeEach, describe, expect, it, vi } from 'vitest';

// The intake guard reads the current UI language and its alias map from the
// i18next singleton; pin both so the tests are hermetic.
vi.mock('i18next', () => ({
  default: {
    resolvedLanguage: 'es',
    language: 'es',
    t: (key: string, opts?: { returnObjects?: boolean }) => {
      if (key === 'placeholders:tokens' && opts?.returnObjects) {
        return { genital: 'genitales', hole: 'agujero', player: 'jugador' };
      }
      return key;
    },
  },
}));

import db from '../store';
import {
  addCustomTile,
  canonicalizeTileAction,
  importCustomTiles,
  updateCustomTile,
} from '../customTiles';

describe('customTiles intake canonicalization', () => {
  beforeEach(async () => {
    await db.customTiles.clear();
  });

  it('addCustomTile stores canonical English tokens for a localized action', async () => {
    const id = await addCustomTile({
      group_id: 'g1',
      intensity: 1,
      action: 'Toca tu {agujero} y {genitales}.',
      tags: [],
      isCustom: 1,
    });

    const stored = await db.customTiles.get(id!);
    expect(stored?.action).toBe('Toca tu {hole} y {genital}.');
  });

  it('addCustomTile leaves canonical text unchanged (idempotent)', async () => {
    const id = await addCustomTile({
      group_id: 'g1',
      intensity: 1,
      action: 'Touch your {hole} and {genital}.',
      tags: [],
      isCustom: 1,
    });

    const stored = await db.customTiles.get(id!);
    expect(stored?.action).toBe('Touch your {hole} and {genital}.');
  });

  it('updateCustomTile normalizes a changed action but passes through partials without one', async () => {
    const id = await addCustomTile({
      group_id: 'g1',
      intensity: 1,
      action: 'Touch your {hole}.',
      tags: [],
      isCustom: 1,
    });

    await updateCustomTile(id!, { isEnabled: 0 });
    let stored = await db.customTiles.get(id!);
    expect(stored?.action).toBe('Touch your {hole}.');
    expect(stored?.isEnabled).toBe(0);

    await updateCustomTile(id!, { action: 'Lame el {agujero|dom}.' });
    stored = await db.customTiles.get(id!);
    expect(stored?.action).toBe('Lame el {hole|dom}.');
  });

  it('importCustomTiles normalizes every record in the bulk path', async () => {
    await importCustomTiles([
      { group_id: 'g1', intensity: 1, action: 'Besa al {jugador}.', tags: [], isCustom: 1 },
      { group_id: 'g1', intensity: 2, action: 'Kiss the {player}.', tags: [], isCustom: 1 },
    ]);

    const actions = (await db.customTiles.toArray()).map((t) => t.action).sort();
    expect(actions).toEqual(['Besa al {player}.', 'Kiss the {player}.']);
  });

  it('canonicalizeTileAction is exported for identity-sensitive callers (sync, import dedup)', () => {
    expect(canonicalizeTileAction({ action: '{agujero}' }).action).toBe('{hole}');
    expect(canonicalizeTileAction({ isEnabled: 0 })).toEqual({ isEnabled: 0 });
  });
});
