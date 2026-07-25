/**
 * The reader for the app's content wire format (`ExportData`) — the single
 * payload behind both file import/export and content packs.
 *
 * Consumers ask this module questions ("which tiles belong to this group?",
 * "which groups does the payload touch?", "what identity does this tile
 * have?") instead of reaching into the record and re-deriving the format's
 * invariants. Those invariants live here, once:
 *
 * - a tile may target a DEFAULT group with no `customGroups` entry, and (in
 *   payloads written before 2.1.0) no `groupExtensions` entry either — see
 *   ADR-0003;
 * - `disabledDefaultTiles` entries carry no locale, so it is recovered from a
 *   sibling section;
 * - stored tiles are canonical, so a payload's action must be canonicalized
 *   before it can be compared with one.
 */
import { normalizePlaceholders } from './placeholderAliasService';
import type {
  ExportData,
  ExportDisabledDefault,
  ExportGroup,
  ExportGroupExtension,
  ExportTile,
} from '@/types/importExport';

export interface PayloadCounts {
  groups: number;
  tiles: number;
  extensions: number;
  disabledDefaults: number;
}

export interface PackPayload {
  /** The validated document, for passing on to the import pipeline. */
  readonly document: ExportData;
  readonly formatVersion: string;
  readonly groups: ExportGroup[];
  readonly tiles: ExportTile[];
  /**
   * Exactly the extensions the document declares. The importer applies these
   * and nothing else — an inferred entry has no intensity levels to append.
   */
  readonly extensions: ExportGroupExtension[];
  readonly disabledDefaults: ExportDisabledDefault[];
  readonly counts: PayloadCounts;
  /** Tiles the payload carries for a group name, in document order. */
  tilesByGroup(groupName: string): ExportTile[];
  /**
   * Every default group the payload extends: the declared entries plus an
   * inferred one per group that only its tiles reveal. Previews, summaries and
   * the republish selection use this so no tile is invisible; the importer
   * uses `extensions`.
   */
  extendedGroups(): ExportGroupExtension[];
  /** Names of all groups the payload contributes to, custom or extended. */
  touchedGroupNames(): string[];
  /** Locale a section-less entry (a disabled default) resolves under. */
  entryLocale(groupName: string, gameMode: string): string;
  /** Identity of a payload tile inside an already-resolved group. */
  tileIdentityKey(tile: ExportTile, groupId: string): string;
}

/**
 * Identity of a tile already stored locally. Local actions are canonical by
 * intake normalization, so no placeholder handling is needed here — this is the
 * key both sides of an import comparison must agree on.
 */
export function storedTileIdentityKey(action: string, intensity: number, groupId: string): string {
  return `${action}_${intensity}_${groupId}`;
}

function isExportData(data: unknown): data is ExportData {
  if (!data || typeof data !== 'object') return false;
  const candidate = data as Partial<ExportData>;
  return (
    typeof candidate.formatVersion === 'string' &&
    !!candidate.data &&
    Array.isArray(candidate.data.customGroups) &&
    Array.isArray(candidate.data.customTiles)
  );
}

/**
 * Validate and wrap a payload. Accepts a JSON string or an already-parsed
 * document; returns `undefined` for anything that is not a readable payload —
 * the one place the format's shape is judged.
 */
export function readPackPayload(raw: string | ExportData | unknown): PackPayload | undefined {
  let document: unknown = raw;

  if (typeof raw === 'string') {
    try {
      document = JSON.parse(raw);
    } catch {
      return undefined;
    }
  }

  if (!isExportData(document)) return undefined;

  const groups = document.data.customGroups;
  const tiles = document.data.customTiles;
  const extensions = document.data.groupExtensions ?? [];
  // 2.0.0 payloads and hand-edited files can omit the section entirely.
  const disabledDefaults = document.data.disabledDefaultTiles ?? [];

  const tileBuckets = new Map<string, ExportTile[]>();
  for (const tile of tiles) {
    const bucket = tileBuckets.get(tile.groupName);
    if (bucket) bucket.push(tile);
    else tileBuckets.set(tile.groupName, [tile]);
  }

  const tilesByGroup = (groupName: string): ExportTile[] => tileBuckets.get(groupName) ?? [];

  const extendedGroups = (): ExportGroupExtension[] => {
    const covered = new Set([...groups.map((g) => g.name), ...extensions.map((e) => e.groupName)]);
    const inferred: ExportGroupExtension[] = [];
    for (const [groupName, groupTiles] of tileBuckets) {
      if (covered.has(groupName)) continue;
      const [first] = groupTiles;
      inferred.push({
        groupName,
        groupLabel: groupName,
        locale: first.locale,
        gameMode: first.gameMode,
        addedIntensities: [],
        contentHash: '',
      });
    }
    return [...extensions, ...inferred];
  };

  return {
    document,
    formatVersion: document.formatVersion,
    groups,
    tiles,
    extensions,
    disabledDefaults,
    counts: {
      groups: groups.length,
      tiles: tiles.length,
      extensions: extensions.length,
      disabledDefaults: disabledDefaults.length,
    },
    tilesByGroup,
    extendedGroups,
    touchedGroupNames: () => [
      ...new Set([...groups.map((g) => g.name), ...extendedGroups().map((e) => e.groupName)]),
    ],
    entryLocale: (groupName, gameMode) =>
      groups.find((g) => g.name === groupName && g.gameMode === gameMode)?.locale ||
      extensions.find((e) => e.groupName === groupName && e.gameMode === gameMode)?.locale ||
      tilesByGroup(groupName).find((t) => t.gameMode === gameMode)?.locale ||
      'en',
    tileIdentityKey: (tile, groupId) =>
      storedTileIdentityKey(
        normalizePlaceholders(tile.action, tile.locale),
        tile.intensity,
        groupId
      ),
  };
}
