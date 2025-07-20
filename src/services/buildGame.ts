import { cycleArray } from '@/helpers/arrays';
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

// Calculate intensity level based on board position and difficulty
function calculateIntensity(
  gameSize: number,
  maxIntensity: number,
  currentTile: number,
  difficulty?: string
): number {
  if ([undefined, 'normal'].includes(difficulty)) {
    const divider = gameSize / maxIntensity;
    return Math.floor(currentTile / divider) + 1; // Add 1 since intensities start at 1
  }

  // Accelerated difficulty
  if (maxIntensity >= 3) {
    // 40% chance of picking a lower intensity
    if (Math.random() >= 0.6) {
      return maxIntensity - 1;
    }
  }
  return maxIntensity;
}

// Get available tiles for a specific group and intensity
function getGroupTiles(
  allTiles: CustomTilePull[],
  groupName: string,
  intensity: number
): CustomTilePull[] {
  return allTiles.filter(
    (tile) => tile.group === groupName && tile.intensity === intensity && tile.isEnabled
  );
}

// Build individual tile content
function buildTileContent(
  availableGroups: CustomGroupPull[],
  allTiles: CustomTilePull[],
  selectedActions: Record<string, any>,
  currentTile: number,
  gameSize: number,
  settings: Settings
): GameTile {
  if (!availableGroups.length) {
    return { title: '', description: '' };
  }

  // Cycle through available groups for variety
  cycleArray(availableGroups);
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
  const targetIntensity = Math.min(
    calculateIntensity(gameSize, maxIntensity, currentTile, settings.difficulty),
    groupSelection.level
  );

  // Get available tiles for this group and intensity
  const groupTiles = getGroupTiles(allTiles, currentGroup.name, targetIntensity);

  if (!groupTiles.length) {
    // Try lower intensities if target not available
    for (let intensity = targetIntensity - 1; intensity >= 1; intensity--) {
      const fallbackTiles = getGroupTiles(allTiles, currentGroup.name, intensity);
      if (fallbackTiles.length > 0) {
        cycleArray(fallbackTiles);
        return {
          title: currentGroup.label,
          description: fallbackTiles[0].action,
          standalone: groupSelection.variation === 'standalone',
          role: settings.role || 'sub',
        };
      }
    }
    return { title: '', description: '' };
  }

  // Select random tile from available options
  cycleArray(groupTiles);

  return {
    title: currentGroup.label,
    description: groupTiles[0].action,
    standalone: groupSelection.variation === 'standalone',
    role: settings.role || 'sub',
  };
}

// Handle append logic for combining tiles
function processAppendTiles(
  mainTile: GameTile,
  appendGroups: CustomGroupPull[],
  allTiles: CustomTilePull[],
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
    allTiles,
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

  const board: GameTile[] = [];

  for (let currentTile = 1; currentTile <= size; currentTile++) {
    const mainTile = buildTileContent(
      mainGroups,
      allTiles,
      selectedActions,
      currentTile,
      size,
      settings
    );

    const finalDescription = processAppendTiles(
      mainTile,
      appendGroups,
      allTiles,
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
      console.warn('No available groups or tiles for board building', {
        selectedGroups: selectedGroupNames,
        availableGroups: availableGroupNames,
        relevantTiles: relevantTiles.length,
      });

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
