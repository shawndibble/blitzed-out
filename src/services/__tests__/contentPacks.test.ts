import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('firebase/firestore');
vi.mock('firebase/auth');
vi.mock('@/services/firebase', () => ({ db: {} }));
vi.mock('@/services/importExport', () => ({
  exportAllData: vi.fn(
    async () =>
      '{"formatVersion":"2.0.0","data":{"customGroups":[{"name":"g1","label":"Group 1"}],"customTiles":[{"action":"a"},{"action":"b"}],"disabledDefaultTiles":[]}}'
  ),
  importData: vi.fn(async () => ({ success: true, errors: [] })),
  EXPORT_FORMAT_VERSION: '2.1.0',
}));
vi.mock('@/stores/customGroups', () => ({ getCustomGroups: vi.fn(async () => []) }));
vi.mock('@/stores/customTiles', () => ({ getTilesByGroupIds: vi.fn(async () => []) }));

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import {
  buildPackContents,
  getPack,
  importPack,
  listPublicPacks,
  listPublishableGroups,
  parsePack,
  publishPack,
  republishPack,
} from '@/services/contentPacks';
import { getCustomGroups } from '@/stores/customGroups';
import { getTilesByGroupIds } from '@/stores/customTiles';
import { exportAllData, importData } from '@/services/importExport';
import type { ContentPackDoc } from '@/types/contentPacks';

const meta = {
  name: 'My Pack',
  description: 'desc',
  gameMode: 'online',
  locale: 'en',
  tags: ['fun'],
  visibility: 'public' as const,
};

const summarizableContents =
  '{"formatVersion":"2.0.0","data":{"customGroups":[{"name":"g1","label":"Group 1"}],"customTiles":[{"action":"a"},{"action":"b"}],"disabledDefaultTiles":[]}}';

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getAuth).mockReturnValue({
    currentUser: { uid: 'u1', displayName: 'Tester' },
  } as any);
  vi.mocked(collection).mockReturnValue({} as any);
  vi.mocked(doc).mockReturnValue({} as any);
  vi.mocked(query).mockImplementation((...args: any[]) => args as any);
  vi.mocked(where).mockImplementation((...args: any[]) => ({ where: args }) as any);
  vi.mocked(orderBy).mockImplementation((...args: any[]) => ({ orderBy: args }) as any);
  vi.mocked(limit).mockImplementation((n: any) => ({ limit: n }) as any);
  vi.mocked(startAfter).mockImplementation((c: any) => ({ startAfter: c }) as any);
});

afterEach(() => vi.restoreAllMocks());

describe('contentPacks service', () => {
  it('buildPackContents forwards the selected groupNames and hashes contents', async () => {
    const { contents, contentHash } = await buildPackContents({
      locales: ['en'],
      gameModes: ['online'],
      groupNames: ['g1', 'g2'],
    });
    expect(contents).toContain('formatVersion');
    expect(contentHash).toMatch(/^sha256-/);
    expect(vi.mocked(exportAllData).mock.calls[0][0]).toMatchObject({ groupNames: ['g1', 'g2'] });
  });

  it('publishPack writes visibility + denormalized summary on a v1 doc', async () => {
    vi.mocked(addDoc).mockResolvedValue({ id: 'pack123' } as any);
    const id = await publishPack(meta, summarizableContents, 'sha256-x');
    expect(id).toBe('pack123');
    const payload = vi.mocked(addDoc).mock.calls[0][1] as any;
    expect(payload.author).toBe('u1');
    expect(payload.packVersion).toBe(1);
    expect(payload.visibility).toBe('public');
    expect(payload.tileCount).toBe(2);
    expect(payload.groupCount).toBe(1);
    expect(payload.groupLabels).toEqual(['Group 1']);
  });

  it('publishPack rejects when signed out', async () => {
    vi.mocked(getAuth).mockReturnValue({ currentUser: null } as any);
    await expect(publishPack(meta, '{}', 'sha256-x')).rejects.toThrow();
  });

  it('republishPack increments packVersion and refreshes the summary', async () => {
    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      id: 'pack123',
      data: () => ({ packVersion: 3, authorName: 'Tester' }),
    } as any);
    vi.mocked(updateDoc).mockResolvedValue(undefined as any);

    await republishPack('pack123', summarizableContents, 'sha256-y', {
      ...meta,
      visibility: 'private',
    });

    const update = vi.mocked(updateDoc).mock.calls[0][1] as any;
    expect(update.packVersion).toBe(4);
    expect(update.visibility).toBe('private');
    expect(update.tileCount).toBe(2);
    expect(update.groupCount).toBe(1);
  });

  it('getPack returns undefined for a missing pack', async () => {
    vi.mocked(getDoc).mockResolvedValue({ exists: () => false } as any);
    expect(await getPack('nope')).toBeUndefined();
  });

  it('importPack stamps only packId + packName (copy-only)', async () => {
    const pack: ContentPackDoc = {
      id: 'pack123',
      author: 'u1',
      authorName: 'Tester',
      name: 'My Pack',
      description: '',
      gameMode: 'online',
      locale: 'en',
      tags: [],
      visibility: 'public',
      contents: summarizableContents,
      contentHash: 'sha256-x',
      packVersion: 2,
      formatVersion: '2.0.0',
      tileCount: 2,
      groupCount: 1,
      groupLabels: ['Group 1'],
      extensionCount: 0,
      extensionLabels: [],
      importCount: 0,
      createdAt: 1,
      updatedAt: 1,
    };
    await importPack(pack);
    const opts = vi.mocked(importData).mock.calls[0][1] as any;
    expect(opts.packProvenance).toEqual({ packId: 'pack123', packName: 'My Pack' });
  });

  it('listPublicPacks queries public packs by mode + locale, newest first', async () => {
    vi.mocked(getDocs).mockResolvedValue({
      docs: [{ id: 'p1', data: () => ({ name: 'A', visibility: 'public' }) }],
    } as any);

    const result = await listPublicPacks({ gameMode: 'online', locale: 'en' });

    expect(vi.mocked(where).mock.calls).toEqual(
      expect.arrayContaining([
        ['visibility', '==', 'public'],
        ['gameMode', '==', 'online'],
        ['locale', '==', 'en'],
      ])
    );
    expect(vi.mocked(orderBy)).toHaveBeenCalledWith('createdAt', 'desc');
    expect(result.packs[0]).toMatchObject({ id: 'p1', name: 'A' });
    // Page smaller than the limit → no further cursor.
    expect(result.nextCursor).toBeUndefined();
  });

  it('listPublicPacks returns a cursor when the page is full and applies startAfter', async () => {
    const docs = Array.from({ length: 24 }, (_, i) => ({
      id: `p${i}`,
      data: () => ({ name: `pack ${i}`, visibility: 'public' }),
    }));
    vi.mocked(getDocs).mockResolvedValue({ docs } as any);

    const first = await listPublicPacks({ gameMode: 'online', locale: 'en' });
    expect(first.nextCursor).toBe(docs[23]);

    await listPublicPacks({ gameMode: 'online', locale: 'en', cursor: first.nextCursor });
    expect(vi.mocked(startAfter)).toHaveBeenCalledWith(docs[23]);
  });

  it('listPublishableGroups counts tiles by group membership (tiles lack gameMode/locale)', async () => {
    vi.mocked(getCustomGroups).mockResolvedValue([
      { id: 'gid-1', name: 'g1', label: 'Group One' },
      { id: 'gid-2', name: 'g2', label: 'Group Two' },
      { id: 'gid-3', name: 'g3', label: 'Empty Group' },
    ] as any);
    vi.mocked(getTilesByGroupIds).mockResolvedValue([
      { group_id: 'gid-1', isCustom: 1 },
      { group_id: 'gid-1', isCustom: 1 },
      { group_id: 'gid-2', isCustom: 1 },
      { group_id: 'gid-2', isCustom: 0 }, // default tile — not counted
    ] as any);

    const result = await listPublishableGroups('online', 'en');

    // Groups query is scoped by mode+locale (the indexed path); empty groups drop out.
    // Defaults are included too now — extendable default groups publish as extensions.
    expect(vi.mocked(getCustomGroups)).toHaveBeenCalledWith({
      gameMode: 'online',
      locale: 'en',
    });
    expect(result).toEqual([
      { name: 'g1', label: 'Group One', tileCount: 2, isExtension: false, addedIntensityCount: 0 },
      { name: 'g2', label: 'Group Two', tileCount: 1, isExtension: false, addedIntensityCount: 0 },
    ]);
  });

  it('parsePack returns undefined on invalid JSON', () => {
    const bad = { contents: 'not json' } as ContentPackDoc;
    expect(parsePack(bad)).toBeUndefined();
  });
});
