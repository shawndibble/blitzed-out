import { afterEach, beforeEach, describe, expect, it } from 'vitest';
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
});

describe('importData pack-tile preservation', () => {
  it('does NOT overwrite a locally-edited (detached) pack tile', async () => {
    const groupId = await seedGroupAndTile();
    // Same identity (action/intensity/group) as the imported tile, but edited
    // content (tags) and marked detached.
    const existing = await db.customTiles.where('group_id').equals(groupId).first();
    await db.customTiles.update(existing!.id!, {
      packId: 'p1',
      packDetached: true,
      tags: ['my-edit'],
    });

    // Imported tile has the same identity but differing content (empty tags).
    await importData(exportDoc('different'), { preserveDisabledDefaults: false });

    const after = await db.customTiles.get(existing!.id!);
    // The user's edit is preserved — not overwritten by the pack version.
    expect(after?.tags).toEqual(['my-edit']);
    expect(after?.packDetached).toBe(true);
  });

  it('overwrites a non-detached pack tile on update', async () => {
    const groupId = await seedGroupAndTile();
    const existing = await db.customTiles.where('group_id').equals(groupId).first();
    await db.customTiles.update(existing!.id!, { packId: 'p1', packDetached: false });

    await importData(exportDoc('different'), { preserveDisabledDefaults: false });

    const after = await db.customTiles.get(existing!.id!);
    // Same identity (action/intensity/group), content differed → updated in place.
    expect(after?.action).toBe('Existing action');
  });
});
