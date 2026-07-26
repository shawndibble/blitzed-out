import { DocumentData, DocumentReference } from 'firebase/firestore';
import { getOrCreateBoard } from '@/services/firebase/boards';
import { sendMessage } from '@/services/firebase/chat';

import { CustomTilePull, GroupedActions } from '@/types/customTiles';
import { Settings } from '@/types/Settings';
import { TileExport } from '@/types/gameBoard';
import { User } from '@/types';
import { getCustomGroupByName } from '@/stores/customGroups';
import i18next from 'i18next';
import { usesSoloActions } from '@/helpers/strings';

/**
 * A group's own wording for a role — Butt Play's "Top"/"Bottom", Ball Busting's
 * "Buster"/"Bustee". Only the two sides carry bespoke wording (see
 * `GroupRoleLabels`), so `vers` (Switch) always falls back to the generic label.
 */
function groupRoleWording(group: GroupedActions[string], role: string): string | undefined {
  if (role === 'dom') return group?.dom;
  if (role === 'sub') return group?.sub;
  return undefined;
}

async function getCustomTileCount(
  settings: Settings,
  customTiles: CustomTilePull[] | null | undefined,
  actionsList: GroupedActions
): Promise<number> {
  // Use selectedActions structure only
  const actionEntries = settings.selectedActions || {};

  // Selected level VALUES per group. Indexing `actions` by level would be off
  // by one (keys are positions, levels are 1-based) and wrong outright for a
  // sparse ladder.
  const selectedLevelsByGroup = Object.keys(actionsList)
    .filter((key) => actionEntries[key])
    .reduce<Record<string, number[]>>((acc, key) => {
      acc[key] = actionEntries[key].levels || [];
      return acc;
    }, {});

  // Get all groups to resolve group_ids to names
  const { getCustomGroups } = await import('@/stores/customGroups');
  const allGroups = await getCustomGroups({});
  const groupIdToName = new Map(allGroups.map((group) => [group.id, group.name]));

  const usedCustomTiles =
    customTiles?.filter((entry) => {
      // Only count tiles that are actually custom (not migrated defaults)
      if (!entry.isCustom) return false;

      // Get group name from group_id
      const groupName = groupIdToName.get(entry.group_id || '');
      if (!groupName) return false;

      return !!selectedLevelsByGroup[groupName]?.includes(Number(entry.intensity));
    }) || [];

  return usedCustomTiles.length;
}

export async function getSettingsMessage(
  settings: Settings,
  customTiles: CustomTilePull[] | null | undefined,
  actionsList: GroupedActions,
  reason?: string
): Promise<string> {
  const { t } = i18next;
  let message = `### ${i18next.t('gameSettingsMessageHeading')}\r\n`;
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
      // Show group name with bulleted list of intensity level names
      message += val?.label;

      let modifier = null;
      if (variation) {
        modifier = t(variation);
      } else if (!usesSoloActions(settings.gameMode, settings.soloPlay)) {
        modifier = groupRoleWording(val, actualRole as string) ?? t(actualRole as string);
      }

      if (modifier) {
        message += `: ${modifier}`;
      }

      message += '\r\n';

      // Level VALUE → label. Never fall back to the position of a key in
      // `actions`: a sparse ladder makes position and level disagree, and the
      // catalog used to prepend a phantom level, which named every selected
      // level one step too low.
      const intensityNames = val?.intensities || {};
      levels.forEach((level: number) => {
        message += `* ${intensityNames[level] || `Level ${level}`}\r\n`;
      });
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

    // One outcome or three, the shape stays label-then-sublist: the reader sees
    // the same layout either way, and a lone 100% outcome doesn't render as a
    // wide inline row next to the pills around it.
    if (activeOptions.length > 0) {
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

  const customTileCount = await getCustomTileCount(settings, customTiles, actionsList);
  if (customTileCount) {
    message += `* ${t('customTilesLabel')}: ${customTileCount} \r\n`;
  }

  return message;
}

export function exportSettings(formData: Settings): Record<string, any> {
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
      // Hands-Free is a personal TTS/auto-roll preference (see CONTEXT.md
      // "Hands-Free"); importing it would silently force auto-roll + TTS on
      // for a recipient who never opted in, and readRollBeforeHandsFree is
      // the private memo behind it.
      'handsFree',
      'handsFreePreset',
      'readRollBeforeHandsFree',
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
  actionsList: GroupedActions;
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
