import { DocumentData, DocumentReference } from 'firebase/firestore';
import { getOrCreateBoard, sendMessage } from './firebase';

import { CustomTilePull } from '@/types/customTiles';
import { Settings } from '@/types/Settings';
import { TileExport } from '@/types/gameBoard';
import { User } from '@/types';
import { getCustomGroupByName } from '@/stores/customGroups';
import i18next from 'i18next';
import { isOnlineMode } from '@/helpers/strings';

/**
 * Type guard to check if an object has a valid role property
 * @param obj - The object to check
 * @param role - The role key to look for
 * @returns true if obj is an object and has the role property
 */
function isValidRole(obj: unknown, role: unknown): obj is Record<string, unknown> {
  return obj !== null && typeof obj === 'object' && typeof role === 'string' && role in obj;
}

interface ActionsList {
  [key: string]: {
    label: string;
    actions: Record<string, any>;
    [key: string]: any;
  };
}

function getCustomTileCount(
  settings: Settings,
  customTiles: CustomTilePull[] | null | undefined,
  actionsList: ActionsList
): number {
  // Use selectedActions structure only
  const actionEntries = settings.selectedActions || {};

  const settingsDataFolder = Object.entries(actionsList)
    .filter(([key]) => actionEntries[key])
    .reduce<Record<string, string[]>>((acc, [key, value]) => {
      const levels = actionEntries[key].levels || [];
      const actionKeys = Object.keys(value.actions);
      acc[key] = levels.map((level) => actionKeys[level]).filter(Boolean);
      return acc;
    }, {});

  const usedCustomTiles =
    customTiles?.filter((entry) => {
      // Only count tiles that are actually custom (not migrated defaults)
      if (!entry.isCustom) return false;

      const intensityArray = settingsDataFolder[entry.group];
      return intensityArray && intensityArray.length >= Number(entry.intensity);
    }) || [];

  return usedCustomTiles.length;
}

export async function getSettingsMessage(
  settings: Settings,
  customTiles: CustomTilePull[] | null | undefined,
  actionsList: ActionsList,
  reason?: string
): Promise<string> {
  const { t } = i18next;
  let message = `### ${i18next.t('gameSettingsHeading')}\r\n`;
  if (reason) {
    message += `##### ${reason}\r\n`;
  }
  message += '--- \r\n';

  // output only settings that have a corresponding actionsList entry.
  // Use selectedActions structure only
  const actionEntries = settings.selectedActions || {};

  Object.entries(actionsList).forEach(([key, val]) => {
    if (!actionEntries[key]) return;

    const { role, variation, levels } = actionEntries[key];
    const actualRole = role || settings.role || 'sub';

    if (levels && levels.length > 0) {
      const actionsKeys = Object.keys(val?.actions || {});
      // Get the max level for display purposes
      // const selectedActions = levels.map(level => actionsKeys[level] || '').filter(Boolean);
      const maxLevel = Math.max(...levels);
      message += `* ${val?.label}: ${actionsKeys[maxLevel] || ''} (Levels: ${levels.join(', ')})`;

      if (variation) {
        message += ` (${t(variation)})`;
      }

      if (!isOnlineMode(settings.gameMode) && !variation) {
        // if we have a role from the translation files, use them first.
        const roleText = isValidRole(val, actualRole)
          ? (val[actualRole as string] as string)
          : t(actualRole as string);
        message += ` (${roleText})`;
      }
      message += '\r\n';
    }
  });

  // Add custom groups from settings.customGroups
  if (settings.customGroups && Array.isArray(settings.customGroups)) {
    for (const customGroup of settings.customGroups) {
      if (customGroup.groupName && customGroup.intensity) {
        try {
          // Get the actual custom group data to access the label
          const groupData = await getCustomGroupByName(
            customGroup.groupName,
            settings.locale || 'en',
            settings.gameMode || 'online'
          );

          const groupLabel = groupData?.label || customGroup.groupName;
          message += `* ${groupLabel}: Level ${customGroup.intensity} (Custom)\r\n`;
        } catch (error) {
          console.error(`Error loading custom group ${customGroup.groupName}:`, error);
          // Fallback to using groupName as label
          message += `* ${customGroup.groupName}: Level ${customGroup.intensity} (Custom)\r\n`;
        }
      }
    }
  }

  // if our last line was the --- \r\n then return nothing because we have no settings.
  if (message.endsWith('--- \r\n')) {
    return '';
  }

  const { finishRange } = settings;

  message += '--- \r\n';

  if (finishRange) {
    const noCumPercent = finishRange[0];
    const ruinedPercent = finishRange[1] - finishRange[0];
    const normalPercent = 100 - finishRange[1];

    // Count how many non-zero options we have
    const optionList: Array<{ percent: number; text: string } | null> = [
      noCumPercent > 0 ? { percent: noCumPercent, text: t('noCum') as string } : null,
      ruinedPercent > 0 ? { percent: ruinedPercent, text: t('ruined') as string } : null,
      normalPercent > 0 ? { percent: normalPercent, text: t('cum') as string } : null,
    ];

    const activeOptions = optionList.filter(
      (option): option is { percent: number; text: string } => option !== null
    );

    if (activeOptions.length === 1 && activeOptions[0].percent === 100) {
      // Single option at 100% - show inline without bullets
      message += `* ${t('finishSlider')} ${activeOptions[0].text.replace(':', '')} \r\n`;
    } else if (activeOptions.length > 0) {
      // Multiple options or single option not at 100% - show with bullets
      message += `* ${t('finishSlider')} \r\n\r\n`;

      activeOptions.forEach((option) => {
        const optionText =
          option.percent === 100
            ? option.text.replace(':', '')
            : `${option.text} ${option.percent}%`;
        message += `  - ${optionText} \r\n`;
      });
    }
  }

  const customTileCount = getCustomTileCount(settings, customTiles, actionsList);
  if (customTileCount) {
    message += `* ${t('customTilesLabel')}: ${customTileCount} \r\n`;
  }

  return message;
}

function exportSettings(formData: Settings): Record<string, any> {
  const newSettings: Record<string, any> = {};
  Object.entries(formData).forEach(([settingKey, settingValue]) => {
    // list of settings to not export and thus not import.
    const personalSettings = [
      'displayName',
      'background',
      'boardUpdated',
      'chatSound',
      'mySound',
      'otherSound',
      'othersDialog',
      'playerDialog',
      'readRoll',
      'hideBoardActions',
      'advancedSettings',
    ];
    // don't export personal settings nor room specific settings.
    if (!personalSettings.includes(settingKey) && !settingKey.startsWith('room')) {
      newSettings[settingKey] = settingValue;
    }
  });
  return newSettings;
}

interface SendMessageOptions {
  title: string;
  formData: Settings;
  user: User;
  actionsList: ActionsList;
  tiles: TileExport[];
  customTiles?: CustomTilePull[];
  reason?: string;
}

export default async function sendGameSettingsMessage({
  title,
  formData,
  user,
  actionsList,
  tiles,
  customTiles = [],
  reason = '',
}: SendMessageOptions): Promise<DocumentReference<DocumentData> | void> {
  const settings = JSON.stringify(exportSettings(formData));

  const gameBoard = await getOrCreateBoard({
    title,
    gameBoard: JSON.stringify(tiles),
    settings,
  });

  const text = await getSettingsMessage(formData, customTiles, actionsList, reason);

  if (!gameBoard?.id || text === '') {
    return;
  }

  return sendMessage({
    room: formData?.room || 'PUBLIC',
    user,
    text,
    type: 'settings',
    gameBoardId: gameBoard.id,
    boardSize: tiles.length,
    gameMode: formData.gameMode,
  });
}
