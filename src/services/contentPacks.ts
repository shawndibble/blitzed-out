/**
 * Content packs: durable, shareable bundles of custom tiles + groups published
 * to the public `content-packs` Firestore collection and imported by others via
 * a `?importPack=<id>` link.
 *
 * Serialization reuses the import/export pipeline (`exportAllData`/`importData`),
 * so a pack's `contents` is exactly an `ExportData` JSON string.
 */
import { addDoc, collection, deleteDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { sha256 } from 'js-sha256';
import { db } from './firebase';
import { exportAllData, importData } from './importExport';
import type { ExportData, ExportOptions, ImportResult } from '@/types/importExport';
import type { ContentPackDoc, ContentPackMeta, ParsedContentPack } from '@/types/contentPacks';

const COLLECTION = 'content-packs';
const FORMAT_VERSION = '2.0.0';

export interface BuildPackOptions {
  locales?: string[];
  gameModes?: string[];
  singleGroupName?: string;
  includeDisabledDefaults?: boolean;
}

/** Serialize the user's selected custom content into pack `contents` + hash. */
export async function buildPackContents(
  options: BuildPackOptions = {}
): Promise<{ contents: string; contentHash: string }> {
  const contents = await exportAllData({
    locales: options.locales as ExportOptions['locales'],
    gameModes: options.gameModes as ExportOptions['gameModes'],
    singleGroupName: options.singleGroupName,
    includeDisabledDefaults: options.includeDisabledDefaults ?? false,
  });
  return { contents, contentHash: `sha256-${sha256(contents)}` };
}

/** Publish a new pack (packVersion = 1). Returns the new pack id. */
export async function publishPack(
  meta: ContentPackMeta,
  contents: string,
  contentHash: string
): Promise<string> {
  const user = getAuth().currentUser;
  if (!user) throw new Error('Must be signed in to publish a pack');

  const now = Date.now();
  const ref = await addDoc(collection(db, COLLECTION), {
    author: user.uid,
    authorName: user.displayName || 'Anonymous',
    name: meta.name,
    description: meta.description,
    gameMode: meta.gameMode,
    locale: meta.locale,
    tags: meta.tags,
    contents,
    contentHash,
    packVersion: 1,
    formatVersion: FORMAT_VERSION,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

/** Republish an existing pack as a new version (author only). */
export async function republishPack(
  packId: string,
  contents: string,
  contentHash: string,
  meta: ContentPackMeta
): Promise<void> {
  const existing = await getPack(packId);
  if (!existing) throw new Error('Pack not found');

  await updateDoc(doc(db, COLLECTION, packId), {
    name: meta.name,
    description: meta.description,
    tags: meta.tags,
    contents,
    contentHash,
    packVersion: existing.packVersion + 1,
    updatedAt: Date.now(),
    authorName: getAuth().currentUser?.displayName || existing.authorName,
  });
}

/** Fetch a pack by id (one-shot). */
export async function getPack(packId: string): Promise<ContentPackDoc | undefined> {
  try {
    const snap = await getDoc(doc(db, COLLECTION, packId));
    if (!snap.exists()) return undefined;
    return { id: snap.id, ...(snap.data() as Omit<ContentPackDoc, 'id'>) };
  } catch (error) {
    console.error('Failed to fetch content pack', error);
    return undefined;
  }
}

/** Author/admin delete (takedown). */
export async function deletePack(packId: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, packId));
}

/** Parse a pack's serialized contents into an ExportData document. */
export function parsePack(pack: ContentPackDoc): ParsedContentPack | undefined {
  try {
    const data = JSON.parse(pack.contents) as ExportData;
    return { doc: pack, data };
  } catch (error) {
    console.error('Failed to parse pack contents', error);
    return undefined;
  }
}

/**
 * Import a pack's contents into Dexie, stamping provenance so the app can show
 * the source pack and detect future updates.
 */
export async function importPack(pack: ContentPackDoc): Promise<ImportResult> {
  return importData(pack.contents, {
    preserveDisabledDefaults: true,
    packProvenance: {
      packId: pack.id,
      packVersion: pack.packVersion,
      packName: pack.name,
    },
  });
}

/**
 * Unsubscribe from a pack: drop the subscription and soft-remove its tiles
 * (disable rather than delete, so the change survives the no-tombstone sync).
 */
export async function unsubscribePack(packId: string): Promise<void> {
  const { removeSubscription } = await import('@/stores/packSubscriptions');
  const { softRemoveTilesByPackId } = await import('@/stores/customTiles');
  await softRemoveTilesByPackId(packId);
  await removeSubscription(packId);
}

/** File an abuse report against a pack. */
export async function reportPack(packId: string, reason: string): Promise<void> {
  const user = getAuth().currentUser;
  if (!user) throw new Error('Must be signed in to report a pack');
  await addDoc(collection(db, 'reports'), {
    packId,
    reporterUid: user.uid,
    reason,
    createdAt: Date.now(),
  });
}
