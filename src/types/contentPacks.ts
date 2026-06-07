// Content-pack type definitions.
//
// A content pack is a durable, shareable bundle of custom tiles + groups
// (optionally disabled-defaults) published to the public `content-packs`
// Firestore collection and imported by others via a `?importPack=<id>` link.
import type { ExportData } from './importExport';

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
  contents: string; // JSON.stringify(ExportData) — reuses import/export serialization
  contentHash: string; // sha256 of `contents` (dedup + change detection)
  packVersion: number; // author publish counter; bumps on each republish
  formatVersion: string; // ExportData schema version (distinct from packVersion)
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
}

/** Parsed pack ready to preview/import (contents deserialized). */
export interface ParsedContentPack {
  doc: ContentPackDoc;
  data: ExportData;
}

/**
 * Local record of a pack the user has subscribed to. Stored in Dexie
 * (`packSubscriptions`) and synced cross-device so update/unsubscribe work
 * everywhere the pack's tiles landed.
 */
export interface PackSubscription {
  id?: number;
  packId: string;
  packVersion: number; // last imported version
  name: string;
  authorName: string;
  gameMode: string;
  locale: string;
  subscribedAt: number; // Unix ms
  updatedAt: number; // Unix ms; drives last-writer-wins during sync
}

/** Result of comparing a subscription's imported version against the live pack. */
export interface PackUpdateStatus {
  packId: string;
  name: string;
  currentVersion: number;
  latestVersion: number;
  hasUpdate: boolean;
}
