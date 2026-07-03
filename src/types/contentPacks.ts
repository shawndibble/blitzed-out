// Content-pack type definitions.
//
// A content pack is a durable, shareable bundle of an author's selected custom
// groups (their custom tiles + group defs), stored in the `content-packs`
// Firestore collection. Packs are imported as a one-time copy — by code/link
// (`?importPack=<id>`) for any pack, or from the public directory when `public`.
import type { ExportData } from './importExport';

/** A pack's discovery scope: `public` is directory-listed, `private` is unlisted. */
export type PackVisibility = 'public' | 'private';

/** The Firestore document stored at `content-packs/{id}`. */
export interface ContentPackDoc {
  id: string;
  author: string; // publisher uid (immutable after create)
  authorName: string; // displayName snapshot
  name: string;
  description: string;
  gameMode: string; // 'online' | 'solo' | 'local'
  locale: string;
  tags: string[];
  visibility: PackVisibility; // 'public' = directory-listed; 'private' = unlisted
  contents: string; // JSON.stringify(ExportData) — reuses import/export serialization
  contentHash: string; // sha256 of `contents` (dedup + change detection)
  packVersion: number; // author publish counter; bumps on each republish
  formatVersion: string; // ExportData schema version (distinct from packVersion)
  // Denormalized summary so directory cards render without parsing `contents`.
  tileCount: number;
  groupCount: number;
  groupLabels: string[];
  extensionCount: number; // default-group extensions bundled in the pack
  extensionLabels: string[]; // labels of the extended default groups
  importCount: number; // times imported (popularity; incremented by importers)
  createdAt: number; // Unix ms
  updatedAt: number; // Unix ms
}

/** Metadata supplied by the author when publishing or republishing a pack. */
export interface ContentPackMeta {
  name: string;
  description: string;
  gameMode: string;
  locale: string;
  tags: string[];
  visibility: PackVisibility;
}

/** Parsed pack ready to preview/import (contents deserialized). */
export interface ParsedContentPack {
  doc: ContentPackDoc;
  data: ExportData;
}
