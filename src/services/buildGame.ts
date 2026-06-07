import { CustomGroupPull } from '@/types/customGroups';
import { CustomTilePull } from '@/types/customTiles';
import { Settings } from '@/types/Settings';
import { TileExport } from '@/types/gameBoard';
import { getCustomGroups } from '@/stores/customGroups';
import { getTiles } from '@/stores/customTiles';
import i18next from 'i18next';
import { shuffleArray } from '@/helpers/arrays';

interface GameTile {
  title: string;
  description: string;
  standalone?: boolean;
  role?: string;
  penetrative?: boolean;
}

/**
 * Resolve a tile's penetrative signal at build time. Strapon substitution is a
 * default-content feature: only default tiles tagged `penetrative` at import
 * qualify. Custom tiles never auto-strap.
 */
function resolvePenetrative(tile: CustomTilePull): boolean {
  return !tile.isCustom && (tile.tags?.includes('penetrative') ?? false);
}

interface BoardBuildResult {
  board: TileExport[];
  metadata: {
    totalTiles: number;
    tilesWithContent: number;
    selectedGroups: string[];
    missingGroups: string[];
    availableTileCount: number;
  };
}

/**
 * Two-method data source abstracting the Dexie tables the builder reads.
 * Production wraps `getCustomGroups`/`getTiles`; tests pass a plain object
 * with canned arrays, so the pure core never touches IndexedDB.
 */
export interface BoardDataSource {
  getGroups(opts: { locale: string; gameMode: string }): Promise<CustomGroupPull[]>;
  fetchTiles(opts?: Record<string, unknown>): Promise<CustomTilePull[]>;
}

/** Injectable dependencies for the pure core — no Dexie, no module-level i18next. */
export interface BoardBuildDeps {
  /** Resolves i18n keys; bound lazily by the facade, `(k) => k` in tests. */
  translate: (key: string) => string;
  /** Randomness source threaded into shuffling; defaults to `Math.random`. */
  random?: () => number;
  /** Array shuffler; defaults to a `random`-seeded `shuffleArray`. */
  shuffle?: <T>(arr: T[]) => T[];
}

/** Resolved dependencies threaded through the internal build helpers. */
interface BuildInternals {
  random: () => number;
  shuffle: <T>(arr: T[]) => T[];
  intensityCache: Map<string, number>;
}

/**
 * Shuffle bag implementation to ensure no duplicate actions until all actions are used.
 * This class groups tiles by group name and intensity, providing a fair distribution
 * of actions by ensuring all tiles in a category are used before any duplicates.
 */
class TileShuffleBag {
  /** Maps group-intensity keys to shuffled tile arrays */
  private bags: Map<string, CustomTilePull[]> = new Map();
  /** Stores original tile sets for refilling bags */
  private originalTiles: Map<string, CustomTilePull[]> = new Map();
  /** Injected shuffler so bag order is deterministic under a seeded rng */
  private shuffle: <T>(arr: T[]) => T[];

  /**
   * Creates a new shuffle bag from the provided tiles.
   * @param tiles Array of tiles to organize into shuffle bags
   * @param shuffle Shuffler used for initial fill and refills
   */
  constructor(tiles: CustomTilePull[], shuffle: <T>(arr: T[]) => T[]) {
    this.shuffle = shuffle;

    // Group tiles by group name and intensity for bag management
    const groupedTiles = new Map<string, CustomTilePull[]>();

    tiles.forEach((tile) => {
      const key = `${tile.group_id}-${tile.intensity}`;
      if (!groupedTiles.has(key)) {
        groupedTiles.set(key, []);
      }
      groupedTiles.get(key)!.push(tile);
    });

    // Initialize bags with shuffled tiles
    groupedTiles.forEach((tiles, key) => {
      this.bags.set(key, shuffle([...tiles]));
      this.originalTiles.set(key, [...tiles]);
    });
  }

  /**
   * Gets a tile from the specified group and intensity bag.
   * When a bag is empty, it refills and reshuffles automatically.
   * @param groupName The name of the group to get a tile from
   * @param intensity The intensity level to get a tile from
   * @returns A tile or null if no tiles are available
   */
  getTile(groupName: string, intensity: number): CustomTilePull | null {
    const key = `${groupName}-${intensity}`;
    let bag = this.bags.get(key);

    if (!bag || bag.length === 0) {
      // Refill and reshuffle the bag when empty
      const originalTiles = this.originalTiles.get(key);
      if (!originalTiles || originalTiles.length === 0) {
        return null;
      }

      bag = this.shuffle([...originalTiles]);
      this.bags.set(key, bag);
    }

    return bag.pop() || null;
  }
}

// Filter tiles based on player role
function filterTilesByRole(
  tiles: CustomTilePull[],
  role: string,
  groups: CustomGroupPull[] = []
): CustomTilePull[] {
  return tiles.filter((tile) => {
    const action = tile.action;

    // Find the group for this tile to check its type
    const group = groups.find((g) => g.id === tile.group_id);

    // Consumption tiles should be available to all roles
    if (group?.type === 'consumption') {
      return true;
    }

    // Solo tiles should be available to all roles (self-directed activities)
    if (group?.type === 'solo') {
      return true;
    }

    const hasRolePlaceholder = action.match(/{(dom|sub)}/);

    if (role === 'vers') {
      return (
        !hasRolePlaceholder ||
        (action.includes('{sub}') && action.includes('{dom}')) ||
        action.includes('{player}')
      );
    }

    return !hasRolePlaceholder || action.includes(`{${role}}`);
  });
}

/**
 * Calculate intensity level based on board position for progression.
 * Results are cached (in a caller-owned map) to avoid repeated computation.
 */
function calculateIntensity(
  gameSize: number,
  maxIntensity: number,
  currentTile: number,
  cache: Map<string, number>
): number {
  // Create cache key for memoization
  const cacheKey = `${gameSize}-${maxIntensity}-${currentTile}`;
  const cached = cache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  // Simple linear progression from 1 to maxIntensity across the board
  const divider = gameSize / maxIntensity;
  const result = Math.floor(currentTile / divider) + 1; // Add 1 since intensities start at 1

  // Cache the result for future use
  cache.set(cacheKey, result);
  return result;
}

// Build individual tile content
function buildTileContent(
  availableGroups: CustomGroupPull[],
  shuffleBag: TileShuffleBag,
  selectedActions: Record<string, any>,
  currentTile: number,
  gameSize: number,
  settings: Settings,
  internals: BuildInternals
): GameTile {
  if (!availableGroups.length) {
    return { title: '', description: '' };
  }

  // Use the first (and typically only) group provided
  const currentGroup = availableGroups[0];

  // Check if this group should append or standalone
  const groupSelection = selectedActions[currentGroup.name];
  if (!groupSelection || !groupSelection.levels || groupSelection.levels.length === 0) {
    return { title: '', description: '' };
  }

  // Handle frequency/append logic
  if (groupSelection.variation) {
    const frequency =
      groupSelection.variation === 'appendSome'
        ? 0.4
        : groupSelection.variation === 'appendMost'
          ? 0.9
          : 1.0;

    if (groupSelection.variation !== 'standalone' && internals.random() > frequency) {
      return { title: '', description: '' };
    }
  }

  // Calculate intensity based on position for board progression
  const maxIntensity = Math.max(...currentGroup.intensities.map((i) => i.value));
  const calculatedIntensity = calculateIntensity(
    gameSize,
    maxIntensity,
    currentTile,
    internals.intensityCache
  );

  // Find the target intensity from user's selected levels
  const userSelectedLevels = groupSelection.levels;
  let targetIntensity: number;

  // Check if calculated intensity is in user's selection
  if (userSelectedLevels.includes(calculatedIntensity)) {
    targetIntensity = calculatedIntensity;
  } else {
    // Find closest available level
    targetIntensity = userSelectedLevels.reduce((prev: number, curr: number) =>
      Math.abs(curr - calculatedIntensity) < Math.abs(prev - calculatedIntensity) ? curr : prev
    );
  }

  // Try to get a tile from the shuffle bag with fallback logic
  let selectedTile = shuffleBag.getTile(currentGroup.id, targetIntensity);

  if (!selectedTile) {
    // Try other selected levels if target intensity doesn't have tiles
    const otherLevels = userSelectedLevels.filter((level: number) => level !== targetIntensity);
    for (const intensity of otherLevels) {
      selectedTile = shuffleBag.getTile(currentGroup.id, intensity);
      if (selectedTile) {
        break;
      }
    }

    if (!selectedTile) {
      return { title: '', description: '' };
    }
  }

  return {
    title: currentGroup.label,
    description: selectedTile.action,
    standalone: groupSelection.variation === 'standalone',
    role: settings.role || 'sub',
    penetrative: resolvePenetrative(selectedTile),
  };
}

// Handle append logic for combining tiles
function processAppendTiles(
  mainTile: GameTile,
  appendGroups: CustomGroupPull[],
  shuffleBag: TileShuffleBag,
  selectedActions: Record<string, any>,
  currentTile: number,
  gameSize: number,
  settings: Settings,
  internals: BuildInternals
): { description: string; penetrative?: boolean } {
  if (mainTile.standalone || !appendGroups.length || !mainTile.description) {
    return { description: mainTile.description || '', penetrative: mainTile.penetrative };
  }

  const appendTile = buildTileContent(
    appendGroups,
    shuffleBag,
    selectedActions,
    currentTile,
    gameSize,
    settings,
    internals
  );

  if (appendTile.description) {
    const ensurePunctuation = appendTile.description.trim().replace(/([^.,!?])$/, '$1.');
    return {
      description: `${ensurePunctuation} ${mainTile.description}`,
      penetrative: Boolean(mainTile.penetrative || appendTile.penetrative),
    };
  }

  return { description: mainTile.description, penetrative: mainTile.penetrative };
}

// Build the complete game board
function buildBoard(
  availableGroups: CustomGroupPull[],
  allTiles: CustomTilePull[],
  settings: Settings,
  size: number,
  internals: BuildInternals
): GameTile[] {
  const selectedActions = settings.selectedActions || {};

  // Create shuffle bag for tile selection
  const shuffleBag = new TileShuffleBag(allTiles, internals.shuffle);

  // Separate groups into main and append categories
  const mainGroups = availableGroups.filter((group) => {
    const selection = selectedActions[group.name];
    return (
      selection &&
      selection.levels &&
      selection.levels.length > 0 &&
      (!selection.variation || selection.variation === 'standalone')
    );
  });

  const appendGroups = availableGroups.filter((group) => {
    const selection = selectedActions[group.name];
    return (
      selection &&
      selection.levels &&
      selection.levels.length > 0 &&
      (selection.variation === 'appendSome' || selection.variation === 'appendMost')
    );
  });

  // Shuffle main groups to ensure variety in group selection.
  // Use the return value so a pure (non-mutating) injected shuffle still works.
  const shuffledMainGroups = internals.shuffle([...mainGroups]);
  let groupIndex = 0;

  const board: GameTile[] = [];

  for (let currentTile = 1; currentTile <= size; currentTile++) {
    // Rotate through groups to ensure variety
    const selectedMainGroups =
      shuffledMainGroups.length > 0
        ? [shuffledMainGroups[groupIndex % shuffledMainGroups.length]]
        : [];
    groupIndex++;

    const mainTile = buildTileContent(
      selectedMainGroups,
      shuffleBag,
      selectedActions,
      currentTile,
      size,
      settings,
      internals
    );

    const appended = processAppendTiles(
      mainTile,
      appendGroups,
      shuffleBag,
      selectedActions,
      currentTile,
      size,
      settings,
      internals
    );

    board.push({
      title: mainTile.title,
      description: appended.description.trim(),
      role: mainTile.role,
      penetrative: appended.penetrative,
    });
  }

  return board;
}

// Add start and finish tiles
function addStartAndFinishTiles(
  board: GameTile[],
  settings: Settings,
  translate: (key: string) => string
): TileExport[] {
  const startTile: TileExport = {
    title: translate('start'),
    description: translate('start'),
  };

  const { finishRange = [33, 66] } = settings;
  const finishDescription =
    `${translate('noCum')} ${finishRange[0]}%` +
    `\r\n${translate('ruined')} ${finishRange[1] - finishRange[0]}%` +
    `\r\n${translate('cum')} ${100 - finishRange[1]}%`;

  const finishTile: TileExport = {
    title: translate('finish'),
    description: finishDescription,
  };

  return [
    startTile,
    ...board.map((tile) => ({
      title: tile.title,
      description: tile.description,
      penetrative: tile.penetrative,
    })),
    finishTile,
  ];
}

/**
 * Pure core: build a board from already-fetched groups and tiles.
 * No Dexie, no module-level i18next — all I/O and randomness are injected,
 * making the bag distribution, role filtering, and intensity progression
 * directly testable and reproducible.
 *
 * @param groups Available groups (default + custom) for the locale/game mode
 * @param tiles All candidate tiles; filtered to the provided groups internally
 * @param settings Game settings including selectedActions
 * @param tileCount Total number of tiles to generate (excluding start/finish)
 * @param deps Injected `translate`, plus optional `random`/`shuffle`
 */
export async function buildBoardFromData(
  groups: CustomGroupPull[],
  tiles: CustomTilePull[],
  settings: Settings,
  tileCount: number,
  deps: BoardBuildDeps
): Promise<BoardBuildResult> {
  const { translate } = deps;
  const random = deps.random ?? Math.random;
  const shuffle = deps.shuffle ?? (<T>(arr: T[]) => shuffleArray(arr, random));
  // Local cache prevents cross-test state leakage that a module-level map caused.
  const internals: BuildInternals = { random, shuffle, intensityCache: new Map() };

  // Tiles are linked to groups by id; keep only those in the available groups.
  const groupIds = groups.map((group) => group.id);
  const groupFilteredTiles =
    groupIds.length > 0
      ? tiles.filter((tile) => tile.group_id && groupIds.includes(tile.group_id))
      : [];

  // Get selected action group names
  const selectedActions = settings.selectedActions || {};
  const selectedGroupNames = Object.keys(selectedActions).filter(
    (groupName) =>
      selectedActions[groupName]?.levels && selectedActions[groupName].levels.length > 0
  );

  // Filter groups to only those selected by user
  const selectedGroups = groups.filter((group) => selectedGroupNames.includes(group.name));

  // Find missing groups (selected but not available)
  const availableGroupNames = groups.map((g) => g.name);
  const missingGroups = selectedGroupNames.filter((name) => !availableGroupNames.includes(name));

  // Filter tiles by role if specified
  const role = settings.role || 'sub';
  const roleFilteredTiles = filterTilesByRole(groupFilteredTiles, role, groups);

  // Only get tiles for selected groups
  const relevantTiles = roleFilteredTiles.filter((tile) =>
    groups.find((g) => g.id === tile.group_id)
  );

  // If no selected groups or tiles available, return empty board
  if (!selectedGroups.length || !relevantTiles.length) {
    return {
      board: addStartAndFinishTiles([], settings, translate),
      metadata: {
        totalTiles: tileCount + 2,
        tilesWithContent: 2, // Start and finish tiles
        selectedGroups: selectedGroupNames,
        missingGroups,
        availableTileCount: relevantTiles.length,
      },
    };
  }

  // Build the board
  const gameBoard = buildBoard(selectedGroups, relevantTiles, settings, tileCount, internals);

  // Calculate metadata
  const tilesWithContent = gameBoard.filter((tile) => tile.description.trim().length > 0).length;

  const finalBoard = addStartAndFinishTiles(gameBoard, settings, translate);

  return {
    board: finalBoard,
    metadata: {
      totalTiles: finalBoard.length,
      tilesWithContent: tilesWithContent + 2, // +2 for start/finish
      selectedGroups: selectedGroupNames,
      missingGroups,
      availableTileCount: relevantTiles.length,
    },
  };
}

/**
 * Default data source wrapping the Dexie-backed stores. Excludes disabled tiles
 * (`isEnabled: 0`) here — the pure builder is intentionally enabled-agnostic, so
 * disabled defaults must be filtered at the source or they leak onto the board.
 */
const dexieDataSource: BoardDataSource = {
  getGroups: (opts) => getCustomGroups(opts),
  fetchTiles: (opts) => getTiles({ ...(opts ?? {}), isEnabled: 1 }),
};

/**
 * I/O facade: fetch groups/tiles, then delegate to the pure core.
 * Signature is backward-compatible; `deps` lets callers (mainly tests)
 * swap the data source or translator without module mocking.
 *
 * @param settings Game settings including selectedActions
 * @param locale Current locale for internationalization
 * @param gameMode Current game mode (online, local, solo)
 * @param tileCount Total number of tiles to generate (excluding start/finish)
 * @param deps Optional `dataSource`/`translate` overrides
 * @returns Promise containing the built board and metadata
 */
export default async function buildGameBoard(
  settings: Settings,
  locale: string,
  gameMode: string,
  tileCount = 40,
  deps: { dataSource?: BoardDataSource; translate?: (key: string) => string } = {}
): Promise<BoardBuildResult> {
  const dataSource = deps.dataSource ?? dexieDataSource;
  // Bind lazily at call time so i18next is initialized before `t` is captured.
  const translate = deps.translate ?? ((key: string) => i18next.t(key));

  try {
    const groups = await dataSource.getGroups({ locale, gameMode });
    const tiles = await dataSource.fetchTiles({});

    return await buildBoardFromData(groups, tiles, settings, tileCount, { translate });
  } catch (error) {
    console.error('Error building game board:', error);

    // Return empty board on error
    return {
      board: addStartAndFinishTiles([], settings, translate),
      metadata: {
        totalTiles: 2,
        tilesWithContent: 2, // Start and finish tiles
        selectedGroups: [],
        missingGroups: [],
        availableTileCount: 0,
      },
    };
  }
}
