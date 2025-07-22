import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  SxProps,
  Theme,
} from '@mui/material';
import { Trans, useTranslation } from 'react-i18next';
import { useState, useEffect, useMemo, useCallback } from 'react';
import groupActionsFolder from '@/helpers/actionsFolder';
import { AllGameModeActions, MappedGroup, ProcessedGroups } from '@/types/customTiles';
import { GameMode } from '@/types/Settings';
import { CustomGroupPull } from '@/types/customGroups';

interface TileCategorySelectionProps {
  gameMode: GameMode | string;
  groupFilter: string;
  intensityFilter: number | string;
  groups: ProcessedGroups;
  mappedGroups: AllGameModeActions;
  dexieGroups?: Record<string, CustomGroupPull>;
  onGameModeChange: (value: string) => void;
  onGroupChange: (value: string) => void;
  onIntensityChange: (value: string | number) => void;
  hideAll?: boolean;
  sx?: SxProps<Theme>;
}

export default function TileCategorySelection({
  gameMode,
  groupFilter,
  intensityFilter,
  groups,
  mappedGroups,
  dexieGroups,
  onGameModeChange,
  onGroupChange,
  onIntensityChange,
  hideAll = false,
  sx = {},
}: TileCategorySelectionProps): JSX.Element | null {
  const { t } = useTranslation();
  const [uniqueGroups, setUniqueGroups] = useState<string[]>([]);
  const defaultIntensityFilter = hideAll ? 1 : 'all';

  // Memoize the mapped groups folder to avoid repeated calls
  const mappedGroupsFolder = useMemo(() => {
    if (!mappedGroups?.[gameMode as GameMode]) return [];
    const folder = groupActionsFolder(mappedGroups[gameMode as GameMode]);
    return Array.isArray(folder) ? (folder as MappedGroup[]) : [];
  }, [mappedGroups, gameMode]);

  // Helper function to get group label
  const getGroupLabel = useCallback(
    (group: string): string => {
      // First try to get label from Dexie groups
      if (dexieGroups?.[group]) {
        return dexieGroups[group].label || group;
      }

      // Fallback to mappedGroups for default groups
      const folderGroup = mappedGroupsFolder.find((g) => g.value === group);
      if (folderGroup?.groupLabel) {
        return folderGroup.groupLabel;
      }

      // Final fallback to raw group name
      return group;
    },
    [dexieGroups, mappedGroupsFolder]
  );

  // Helper function to get intensity label
  const getIntensityLabel = useCallback(
    (validGroupFilter: string, intensity: string): string => {
      // First try to get intensity label from Dexie groups
      if (dexieGroups?.[validGroupFilter]) {
        const intensityData = dexieGroups[validGroupFilter].intensities.find(
          (i) => i.value === Number(intensity)
        );
        if (intensityData?.label) {
          return intensityData.label;
        }
      }

      // Fallback to mappedGroups for default groups
      const folderGroup = mappedGroupsFolder.find(
        (g) => g.value === validGroupFilter && g.intensity === Number(intensity)
      );
      if (folderGroup?.translatedIntensity) {
        return folderGroup.translatedIntensity;
      }

      // Final fallback
      return `Level ${Number(intensity) + 1}`;
    },
    [dexieGroups, mappedGroupsFolder]
  );

  // Extract unique groups whenever groups or gameMode changes
  useEffect(() => {
    if (groups) {
      const groupNames = Object.keys(groups);
      setUniqueGroups(groupNames);
    }
  }, [groups, gameMode]);

  function handleGroupFilterChange(event: SelectChangeEvent<string>) {
    const newGroup = event.target.value;

    // Call the parent handlers
    onGroupChange(newGroup);
    onIntensityChange(defaultIntensityFilter);
  }

  if (!uniqueGroups?.length) return null;

  // Ensure groupFilter is in the list of uniqueGroups or empty
  // If uniqueGroups is empty, don't validate to allow for initial values
  const validGroupFilter =
    uniqueGroups.length === 0 || uniqueGroups.includes(groupFilter) ? groupFilter : '';

  // for the intensity filter, grab the first intensity for the selected group if available
  const validIntensityFilter = intensityFilter === 'all' ? 'all' : intensityFilter;

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, ...sx }}>
      <FormControl sx={{ width: 125, flexShrink: 0 }}>
        <InputLabel id="game-mode-filter-label">
          <Trans i18nKey="customTiles.gameMode" />
        </InputLabel>
        <Select
          labelId="game-mode-filter-label"
          id="game-mode-filter"
          value={gameMode}
          label={t('customTiles.gameMode', 'Game Mode')}
          onChange={(e) => {
            onGameModeChange(e.target.value);
          }}
          slotProps={{
            input: { 'aria-label': t('customTiles.gameMode', 'Game Mode') },
          }}
        >
          <MenuItem value="online">
            <Trans i18nKey="online" />
          </MenuItem>
          <MenuItem value="local">
            <Trans i18nKey="local" />
          </MenuItem>
        </Select>
      </FormControl>

      <FormControl sx={{ minWidth: 150, flex: 1 }}>
        <InputLabel id="group-filter-label">
          <Trans i18nKey="group" />
        </InputLabel>
        <Select
          labelId="group-filter-label"
          id="group-filter"
          value={validGroupFilter}
          label={t('group')}
          onChange={handleGroupFilterChange}
          slotProps={{
            input: { 'aria-label': t('group') },
          }}
        >
          {uniqueGroups.map((group) => (
            <MenuItem key={group} value={group}>
              {getGroupLabel(group)}
              {!hideAll && groups[group] && ` (${groups[group].count})`}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl sx={{ minWidth: 200, flex: 1 }} disabled={!validGroupFilter}>
        <InputLabel id="intensity-filter-label">
          <Trans i18nKey="customTiles.intensityLevel">Intensity Level</Trans>
        </InputLabel>
        <Select
          labelId="intensity-filter-label"
          id="intensity-filter"
          value={validIntensityFilter}
          label={t('customTiles.intensityLevel', 'Intensity Level')}
          onChange={(e) => onIntensityChange(e.target.value)}
          slotProps={{
            input: { 'aria-label': t('customTiles.intensityLevel', 'Intensity Level') },
          }}
        >
          {!hideAll && (
            <MenuItem key="all" value="all">
              <Trans i18nKey="all">All</Trans>
            </MenuItem>
          )}
          {validGroupFilter &&
            groups &&
            groups[validGroupFilter] &&
            Object.entries(groups[validGroupFilter].intensities || {})
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([intensity, count]) => (
                <MenuItem key={intensity} value={Number(intensity)}>
                  {getIntensityLabel(validGroupFilter, intensity)}
                  {!hideAll && count !== undefined ? ` (${count})` : ''}
                </MenuItem>
              ))}
        </Select>
      </FormControl>
    </Box>
  );
}
