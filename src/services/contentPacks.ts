/**
 * Content packs: durable, shareable bundles of an author's selected custom
 * groups (their custom tiles + group definitions) published to the
 * `content-packs` Firestore collection and imported by others via a
 * `?importPack=<id>` link or, when public, browsed in the directory.
 *
 * Serialization reuses the import/export pipeline (`exportAllData`/`importData`),
 * so a pack's `contents` is exactly an `ExportData` JSON string. Imports are a
 * one-time copy — there is no subscription or auto-update.
 */
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit as fbLimit,
  orderBy,
  query,
  startAfter,
  updateDoc,
  where,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { sha256 } from 'js-sha256';
import { db } from './firebase';
import { exportAllData, importData } from './importExport';
import { getCustomGroups } from '@/stores/customGroups';
import { getTilesByGroupIds } from '@/stores/customTiles';
import type { ExportData, ExportOptions, ImportResult } from '@/types/importExport';
import type { ContentPackDoc, ContentPackMeta, ParsedContentPack } from '@/types/contentPacks';

const COLLECTION = 'content-packs';
const FORMAT_VERSION = '2.0.0';

export interface BuildPackOptions {
  locales?: string[];
  gameModes?: string[];
  groupNames: string[];
  includeDisabledDefaults?: boolean;
}

export interface PublishableGroup {
  name: string;
  label: string;
  tileCount: number;
}

/**
 * Custom groups in the given mode + locale that an author can bundle into a
 * pack, each with its custom-tile count for the publish multi-select.
 */
export async function listPublishableGroups(
  gameMode: string,
  locale: string
): Promise<PublishableGroup[]> {
  // Groups carry gameMode/locale; tiles are scoped only by group_id, so count
  // them via group membership (mirrors how exportAllData narrows tiles).
  const groups = await getCustomGroups({ gameMode, locale, isDefault: false });
  const tiles = await getTilesByGroupIds(groups.map((g) => g.id));
  const countByGroupId = new Map<string, number>();
  for (const tile of tiles) {
    if (tile.isCustom && tile.group_id) {
      countByGroupId.set(tile.group_id, (countByGroupId.get(tile.group_id) ?? 0) + 1);
    }
  }
  return groups
    .map((g) => ({
      name: g.name,
      label: g.label || g.name,
      tileCount: countByGroupId.get(g.id) ?? 0,
    }))
    .filter((g) => g.tileCount > 0);
}

/** Serialize the author's selected custom groups into pack `contents` + hash. */
export async function buildPackContents(
  options: BuildPackOptions
): Promise<{ contents: string; contentHash: string }> {
  const contents = await exportAllData({
    locales: options.locales as ExportOptions['locales'],
    gameModes: options.gameModes as ExportOptions['gameModes'],
    groupNames: options.groupNames,
    includeDisabledDefaults: options.includeDisabledDefaults ?? false,
  });
  return { contents, contentHash: `sha256-${sha256(contents)}` };
}

/** Denormalized summary derived from serialized contents, for directory cards. */
function summarizeContents(contents: string): {
  tileCount: number;
  groupCount: number;
  groupLabels: string[];
} {
  try {
    const parsed = JSON.parse(contents) as ExportData;
    const groups = parsed.data.customGroups ?? [];
    return {
      tileCount: parsed.data.customTiles?.length ?? 0,
      groupCount: groups.length,
      groupLabels: groups.map((g) => g.label || g.name),
    };
  } catch {
    return { tileCount: 0, groupCount: 0, groupLabels: [] };
  }
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
    visibility: meta.visibility,
    contents,
    contentHash,
    packVersion: 1,
    formatVersion: FORMAT_VERSION,
    ...summarizeContents(contents),
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
    visibility: meta.visibility,
    contents,
    contentHash,
    packVersion: existing.packVersion + 1,
    ...summarizeContents(contents),
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

export interface ListPublicPacksOptions {
  gameMode: string;
  locale: string;
  cursor?: QueryDocumentSnapshot;
  limit?: number;
}

export interface ListPublicPacksResult {
  packs: ContentPackDoc[];
  nextCursor?: QueryDocumentSnapshot;
}

/**
 * Page through the public directory, filtered by gameMode + locale, newest
 * first. The `visibility == 'public'` clause is mandatory — Firestore's `list`
 * rule rejects any query that omits it. Name/tag substring filtering happens
 * client-side over the loaded page (full-text search is out of scope for v1).
 */
export async function listPublicPacks(
  options: ListPublicPacksOptions
): Promise<ListPublicPacksResult> {
  const pageSize = options.limit ?? 24;
  const constraints = [
    where('visibility', '==', 'public'),
    where('gameMode', '==', options.gameMode),
    where('locale', '==', options.locale),
    orderBy('createdAt', 'desc'),
    ...(options.cursor ? [startAfter(options.cursor)] : []),
    fbLimit(pageSize),
  ];

  const snap = await getDocs(query(collection(db, COLLECTION), ...constraints));
  const packs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ContentPackDoc, 'id'>) }));
  const nextCursor = snap.docs.length === pageSize ? snap.docs[snap.docs.length - 1] : undefined;
  return { packs, nextCursor };
}

/** Author/admin delete (takedown). */
export async function deletePack(packId: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, packId));
}

/** Parse a pack's serialized contents into an ExportData document. */
export function parsePack(pack: ContentPackDoc): ParsedContentPack | undefined {
  try {
    const data = JSON.parse(pack.contents);
    if (
      !data ||
      typeof data !== 'object' ||
      typeof data.formatVersion !== 'string' ||
      !data.data ||
      !Array.isArray(data.data.customGroups) ||
      !Array.isArray(data.data.customTiles)
    ) {
      return undefined;
    }
    return { doc: pack, data: data as ExportData };
  } catch (error) {
    console.error('Failed to parse pack contents', error);
    return undefined;
  }
}

/** Import a pack's contents into Dexie as a one-time copy, stamping attribution. */
export async function importPack(pack: ContentPackDoc): Promise<ImportResult> {
  return importData(pack.contents, {
    preserveDisabledDefaults: true,
    packProvenance: {
      packId: pack.id,
      packName: pack.name,
    },
  });
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
