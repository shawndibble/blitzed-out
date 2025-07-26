import { shuffleArray } from '@/helpers/arrays';
import { Settings } from '@/types/Settings';
import { TileExport } from '@/types/gameBoard';
import { CustomTilePull } from '@/types/customTiles';
import { CustomGroupPull } from '@/types/customGroups';
import i18next from 'i18next';
import { getCustomGroups } from '@/stores/customGroups';
import { getTiles } from '@/stores/customTiles';

const { t } = i18next;

interface GameTile {
  title: string;
  description: string;
  standalone?: boolean;
  role?: string;
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
 * Shuffle bag implementation to ensure no duplicate actions until all actions are used.
 * This class groups tiles by group name and intensity, providing a fair distribution
 * of actions by ensuring all tiles in a category are used before any duplicates.
 */
class TileShuffleBag {
  /** Maps group-intensity keys to shuffled tile arrays */
  private bags: Map<string, CustomTilePull[]> = new Map();
  /** Stores original tile sets for refilling bags */
  private originalTiles: Map<string, CustomTilePull[]> = new Map();

  /**
   * Creates a new shuffle bag from the provided tiles.
   * @param tiles Array of tiles to organize into shuffle bags
   */
  constructor(tiles: CustomTilePull[]) {
    // Group tiles by group name and intensity for bag management
    const groupedTiles = new Map<string, CustomTilePull[]>();

    tiles.forEach((tile) => {
      const key = `${tile.group}-${tile.intensity}`;
      if (!groupedTiles.has(key)) {
        groupedTiles.set(key, []);
      }
      groupedTiles.get(key)!.push(tile);
    });

    // Initialize bags with shuffled tiles
    groupedTiles.forEach((tiles, key) => {
      const shuffledTiles = [...tiles];
      shuffleArray(shuffledTiles);
      this.bags.set(key, shuffledTiles);
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

      bag = [...originalTiles];
      shuffleArray(bag);
      this.bags.set(key, bag);
    }

    return bag.pop() || null;
  }
}

// Filter tiles based on player role
function filterTilesByRole(tiles: CustomTilePull[], role: string): CustomTilePull[] {
  return tiles.filter((tile) => {
    const action = tile.action;
    if (role === 'vers') {
      return (action.includes('{sub}') && action.includes('{dom}')) || action.includes('{player}');
    }
    return !action.match(/{(dom|sub)}/) || action.includes(`{${role}}`);
  });
}

/** Cache for intensity calculations to avoid repeated computation */
const intensityCache = new Map<string, number>();

/**
 * Calculate intensity level based on board position and difficulty.
 * Results are cached to improve performance for repeated calculations.
 */
function calculateIntensity(
  gameSize: number,
  maxIntensity: number,
  currentTile: number,
  difficulty?: string
): number {
  // Create cache key for memoization
  const cacheKey = `${gameSize}-${maxIntensity}-${currentTile}-${difficulty || 'normal'}`;
  const cached = intensityCache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  let result: number;

  if ([undefined, 'normal'].includes(difficulty)) {
    const divider = gameSize / maxIntensity;
    result = Math.floor(currentTile / divider) + 1; // Add 1 since intensities start at 1
  } else {
    // Accelerated difficulty
    if (maxIntensity >= 3) {
      // 40% chance of picking a lower intensity
      if (Math.random() >= 0.6) {
        result = maxIntensity - 1;
      } else {
        result = maxIntensity;
      }
    } else {
      result = maxIntensity;
    }
  }

  // Cache the result for future use
  intensityCache.set(cacheKey, result);
  return result;
}

// Build individual tile content
function buildTileContent(
  availableGroups: CustomGroupPull[],
  shuffleBag: TileShuffleBag,
  selectedActions: Record<string, any>,
  currentTile: number,
  gameSize: number,
  settings: Settings
): GameTile {
  if (!availableGroups.length) {
    return { title: '', description: '' };
  }

  // Use the first (and typically only) group provided
  const currentGroup = availableGroups[0];

  // Check if this group should append or standalone
  const groupSelection = selectedActions[currentGroup.name];
  if (!groupSelection || groupSelection.level <= 0) {
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

    if (groupSelection.variation !== 'standalone' && Math.random() > frequency) {
      return { title: '', description: '' };
    }
  }

  // Calculate intensity based on position and settings
  const maxIntensity = Math.max(...currentGroup.intensities.map((i) => i.value));
  const calculatedIntensity = calculateIntensity(
    gameSize,
    maxIntensity,
    currentTile,
    settings.difficulty
  );
  const targetIntensity = Math.min(calculatedIntensity, groupSelection.level);

  // Try to get a tile from the shuffle bag with fallback logic
  let selectedTile = shuffleBag.getTile(currentGroup.name, targetIntensity);

  if (!selectedTile) {
    // Try lower intensities first
    for (let intensity = targetIntensity - 1; intensity >= 1; intensity--) {
      selectedTile = shuffleBag.getTile(currentGroup.name, intensity);
      if (selectedTile) break;
    }

    // If no lower intensities work, try higher intensities
    if (!selectedTile) {
      for (let intensity = targetIntensity + 1; intensity <= maxIntensity; intensity++) {
        selectedTile = shuffleBag.getTile(currentGroup.name, intensity);
        if (selectedTile) break;
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
  settings: Settings
): string {
  if (mainTile.standalone || !appendGroups.length || !mainTile.description) {
    return mainTile.description || '';
  }

  const appendTile = buildTileContent(
    appendGroups,
    shuffleBag,
    selectedActions,
    currentTile,
    gameSize,
    settings
  );

  if (appendTile.description) {
    const ensurePunctuation = appendTile.description.trim().replace(/([^.,!?])$/, '$1.');
    return `${ensurePunctuation} ${mainTile.description}`;
  }

  return mainTile.description;
}

// Build the complete game board
async function buildBoard(
  availableGroups: CustomGroupPull[],
  allTiles: CustomTilePull[],
  settings: Settings,
  size: number
): Promise<GameTile[]> {
  const selectedActions = settings.selectedActions || {};

  // Create shuffle bag for tile selection
  const shuffleBag = new TileShuffleBag(allTiles);

  // Separate groups into main and append categories
  const mainGroups = availableGroups.filter((group) => {
    const selection = selectedActions[group.name];
    return (
      selection &&
      selection.level > 0 &&
      (!selection.variation || selection.variation === 'standalone')
    );
  });

  const appendGroups = availableGroups.filter((group) => {
    const selection = selectedActions[group.name];
    return (
      selection &&
      selection.level > 0 &&
      (selection.variation === 'appendSome' || selection.variation === 'appendMost')
    );
  });

  // Shuffle main groups to ensure variety in group selection
  shuffleArray(mainGroups);
  let groupIndex = 0;

  const board: GameTile[] = [];

  for (let currentTile = 1; currentTile <= size; currentTile++) {
    // Rotate through groups to ensure variety
    const selectedMainGroups =
      mainGroups.length > 0 ? [mainGroups[groupIndex % mainGroups.length]] : [];
    groupIndex++;

    const mainTile = buildTileContent(
      selectedMainGroups,
      shuffleBag,
      selectedActions,
      currentTile,
      size,
      settings
    );

    const finalDescription = processAppendTiles(
      mainTile,
      appendGroups,
      shuffleBag,
      selectedActions,
      currentTile,
      size,
      settings
    );

    board.push({
      title: mainTile.title,
      description: finalDescription.trim(),
      role: mainTile.role,
    });
  }

  return board;
}

// Add start and finish tiles
function addStartAndFinishTiles(board: GameTile[], settings: Settings): TileExport[] {
  const startTile: TileExport = {
    title: t('start'),
    description: t('start'),
  };

  const { finishRange = [33, 66] } = settings;
  const finishDescription =
    `${t('noCum')} ${finishRange[0]}%` +
    `\r\n${t('ruined')} ${finishRange[1] - finishRange[0]}%` +
    `\r\n${t('cum')} ${100 - finishRange[1]}%`;

  const finishTile: TileExport = {
    title: t('finish'),
    description: finishDescription,
  };

  return [
    startTile,
    ...board.map((tile) => ({ title: tile.title, description: tile.description })),
    finishTile,
  ];
}

/**
 * Build a game board directly from Dexie data
 * @param settings Game settings including selectedActions
 * @param locale Current locale for internationalization
 * @param gameMode Current game mode (online, local, solo)
 * @param tileCount Total number of tiles to generate (excluding start/finish)
 * @returns Promise containing the built board and metadata
 */
export default async function buildGameBoard(
  settings: Settings,
  locale: string,
  gameMode: string,
  tileCount = 40
): Promise<BoardBuildResult> {
  try {
    // Fetch all required data from Dexie in parallel
    const [availableGroups, allTiles] = await Promise.all([
      getCustomGroups({ locale, gameMode }), // Include both default and custom groups
      getTiles({ locale, gameMode }),
    ]);

    // Get selected action group names
    const selectedActions = settings.selectedActions || {};
    const selectedGroupNames = Object.keys(selectedActions).filter(
      (groupName) => selectedActions[groupName]?.level > 0
    );

    // Filter groups to only those selected by user
    const selectedGroups = availableGroups.filter((group) =>
      selectedGroupNames.includes(group.name)
    );

    // Find missing groups (selected but not available)
    const availableGroupNames = availableGroups.map((g) => g.name);
    const missingGroups = selectedGroupNames.filter((name) => !availableGroupNames.includes(name));

    // Filter tiles by role if specified
    const role = settings.role || 'sub';
    const filteredTiles = filterTilesByRole(allTiles, role);

    // Only get tiles for selected groups
    const relevantTiles = filteredTiles.filter((tile) => selectedGroupNames.includes(tile.group));

    // If no selected groups or tiles available, return empty board
    if (!selectedGroups.length || !relevantTiles.length) {
      return {
        board: addStartAndFinishTiles([], settings),
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
    const gameBoard = await buildBoard(selectedGroups, relevantTiles, settings, tileCount);

    // Calculate metadata
    const tilesWithContent = gameBoard.filter((tile) => tile.description.trim().length > 0).length;

    const finalBoard = addStartAndFinishTiles(gameBoard, settings);

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
  } catch (error) {
    console.error('Error building game board:', error);

    // Return empty board on error
    return {
      board: addStartAndFinishTiles([], settings),
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
