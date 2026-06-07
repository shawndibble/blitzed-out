import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('firebase/firestore');
vi.mock('firebase/auth');
vi.mock('@/services/firebase', () => ({ db: {} }));
vi.mock('@/services/importExport', () => ({
  exportAllData: vi.fn(async () => '{"formatVersion":"2.0.0","data":{}}'),
  importData: vi.fn(async () => ({ success: true, errors: [] })),
}));

import { addDoc, collection, doc, getDoc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import {
  buildPackContents,
  getPack,
  importPack,
  parsePack,
  publishPack,
  republishPack,
} from '../contentPacks';
import { importData } from '@/services/importExport';
import type { ContentPackDoc } from '@/types/contentPacks';

const meta = {
  name: 'My Pack',
  description: 'desc',
  gameMode: 'online',
  locale: 'en',
  tags: ['fun'],
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getAuth).mockReturnValue({
    currentUser: { uid: 'u1', displayName: 'Tester' },
  } as any);
  vi.mocked(collection).mockReturnValue({} as any);
  vi.mocked(doc).mockReturnValue({} as any);
});

afterEach(() => vi.restoreAllMocks());

describe('contentPacks service', () => {
  it('buildPackContents returns contents + a sha256 hash', async () => {
    const { contents, contentHash } = await buildPackContents({ locales: ['en'] });
    expect(contents).toContain('formatVersion');
    expect(contentHash).toMatch(/^sha256-/);
  });

  it('publishPack creates a v1 doc owned by the current user', async () => {
    vi.mocked(addDoc).mockResolvedValue({ id: 'pack123' } as any);
    const id = await publishPack(meta, '{}', 'sha256-x');
    expect(id).toBe('pack123');
    const payload = vi.mocked(addDoc).mock.calls[0][1] as any;
    expect(payload.author).toBe('u1');
    expect(payload.packVersion).toBe(1);
    expect(payload.name).toBe('My Pack');
  });

  it('publishPack rejects when signed out', async () => {
    vi.mocked(getAuth).mockReturnValue({ currentUser: null } as any);
    await expect(publishPack(meta, '{}', 'sha256-x')).rejects.toThrow();
  });

  it('republishPack increments packVersion', async () => {
    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      id: 'pack123',
      data: () => ({ packVersion: 3, authorName: 'Tester' }),
    } as any);
    vi.mocked(updateDoc).mockResolvedValue(undefined as any);

    await republishPack('pack123', '{}', 'sha256-y', meta);

    const update = vi.mocked(updateDoc).mock.calls[0][1] as any;
    expect(update.packVersion).toBe(4);
  });

  it('getPack returns undefined for a missing pack', async () => {
    vi.mocked(getDoc).mockResolvedValue({ exists: () => false } as any);
    expect(await getPack('nope')).toBeUndefined();
  });

  it('importPack stamps pack provenance', async () => {
    const pack: ContentPackDoc = {
      id: 'pack123',
      author: 'u1',
      authorName: 'Tester',
      name: 'My Pack',
      description: '',
      gameMode: 'online',
      locale: 'en',
      tags: [],
      contents: '{"formatVersion":"2.0.0","data":{}}',
      contentHash: 'sha256-x',
      packVersion: 2,
      formatVersion: '2.0.0',
      createdAt: 1,
      updatedAt: 1,
    };
    await importPack(pack);
    const opts = vi.mocked(importData).mock.calls[0][1] as any;
    expect(opts.packProvenance).toEqual({ packId: 'pack123', packVersion: 2, packName: 'My Pack' });
  });

  it('parsePack returns undefined on invalid JSON', () => {
    const bad = { contents: 'not json' } as ContentPackDoc;
    expect(parsePack(bad)).toBeUndefined();
  });
});
