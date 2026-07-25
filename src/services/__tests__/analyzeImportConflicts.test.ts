import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import i18next from 'i18next';
import db from '@/stores/store';
import { addCustomGroup } from '@/stores/customGroups';
import { addCustomTile } from '@/stores/customTiles';
import { analyzeImportConflicts, importData } from '../importExport';
import { generateTileContentHash } from '../contentHashing';
import type { ExportData } from '@/types/importExport';

async function seedGroupAndTile() {
  const groupId = await addCustomGroup({
    name: 'g1',
    label: 'Group 1',
    intensities: [{ id: 'g1-1', label: 'L1', value: 1, isDefault: false }],
    type: 'solo',
    isDefault: false,
    locale: 'en',
    gameMode: 'online',
  });
  await addCustomTile({
    group_id: groupId as string,
    intensity: 1,
    action: 'Existing action',
    tags: [],
    isCustom: 1,
  });
  return groupId as string;
}

function exportDoc(tileContentHash: string): ExportData {
  return {
    formatVersion: '2.0.0',
    exportedAt: new Date().toISOString(),
    data: {
      customGroups: [
        {
          name: 'g1',
          label: 'Group 1',
          gameMode: 'online',
          locale: 'en',
          type: 'solo',
          intensities: [{ value: 1, label: 'L1' }],
          contentHash: 'group-hash',
        },
      ],
      customTiles: [
        {
          action: 'Existing action',
          groupName: 'g1',
          intensity: 1,
          tags: [],
          gameMode: 'online',
          locale: 'en',
          isEnabled: true,
          contentHash: tileContentHash,
        },
      ],
      disabledDefaultTiles: [],
    },
  };
}

beforeEach(async () => {
  await db.customTiles.clear();
  await db.customGroups.clear();
});
afterEach(async () => {
  await db.customTiles.clear();
  await db.customGroups.clear();
  vi.restoreAllMocks();
});

describe('analyzeImportConflicts', () => {
  it('flags a contentMatch when an imported tile differs from the local one', async () => {
    await seedGroupAndTile();
    const analysis = await analyzeImportConflicts(exportDoc('totally-different-hash'));

    const conflict = analysis.tileConflicts.find((c) => c.imported.action === 'Existing action');
    expect(conflict).toBeDefined();
    expect(conflict?.conflictType).toBe('contentMatch');
  });

  it('flags identical when hashes match', async () => {
    const groupId = await seedGroupAndTile();
    const existing = await db.customTiles.where('group_id').equals(groupId).first();
    const hash = await generateTileContentHash(existing!, 'g1');

    const analysis = await analyzeImportConflicts(exportDoc(hash));

    const conflict = analysis.tileConflicts.find((c) => c.imported.action === 'Existing action');
    expect(conflict?.conflictType).toBe('identical');
  });

  it('returns no tile conflicts when nothing matches locally', async () => {
    const analysis = await analyzeImportConflicts(exportDoc('x'));
    expect(analysis.tileConflicts).toHaveLength(0);
  });

  it('agrees with the importer on a localized-token payload', async () => {
    // The preview and the importer must derive tile identity the same way. A
    // non-en pack can carry localized placeholder aliases while stored tiles
    // are canonical, so both sides have to canonicalize before keying.
    vi.spyOn(i18next, 't').mockImplementation(((key: string, opts?: any) => {
      if (key === 'placeholders:tokens' && opts?.returnObjects) return { genital: 'genitales' };
      return key;
    }) as typeof i18next.t);

    const groupId = await addCustomGroup({
      name: 'g2',
      label: 'Grupo 2',
      intensities: [{ id: 'g2-1', label: 'L1', value: 1, isDefault: false }],
      type: 'solo',
      isDefault: false,
      locale: 'es',
      gameMode: 'online',
    });
    await addCustomTile({
      group_id: groupId as string,
      intensity: 1,
      action: 'Toca tus {genital}.',
      tags: [],
      isCustom: 1,
    });

    const localizedDoc: ExportData = {
      formatVersion: '2.1.0',
      exportedAt: new Date().toISOString(),
      data: {
        customGroups: [],
        customTiles: [
          {
            action: 'Toca tus {genitales}.',
            groupName: 'g2',
            intensity: 1,
            tags: [],
            gameMode: 'online',
            locale: 'es',
            isEnabled: true,
            contentHash: 'differs-from-local',
          },
        ],
        disabledDefaultTiles: [],
      },
    };

    const analysis = await analyzeImportConflicts(localizedDoc);
    expect(analysis.tileConflicts).toHaveLength(1);
    expect(analysis.tileConflicts[0].conflictType).toBe('contentMatch');

    // The importer resolves the same identity: it updates in place rather than
    // inserting a second tile.
    await importData(localizedDoc, { preserveDisabledDefaults: false });
    const tiles = await db.customTiles
      .where('group_id')
      .equals(groupId as string)
      .toArray();
    expect(tiles).toHaveLength(1);
  });

  it('overwrites a pack tile of the same identity but differing content', async () => {
    const groupId = await seedGroupAndTile();
    const existing = await db.customTiles.where('group_id').equals(groupId).first();
    // Stale local tags that the (empty-tags) imported tile should overwrite.
    await db.customTiles.update(existing!.id!, { packId: 'p1', tags: ['stale'] });

    await importData(exportDoc('different'), { preserveDisabledDefaults: false });

    const after = await db.customTiles.get(existing!.id!);
    // Copy-only model: same identity, differing content → pack version replaces local.
    expect(after?.tags).toEqual([]);
  });
});
