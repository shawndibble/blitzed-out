import { AllGameModeActions, MappedGroup, ProcessedGroups } from '@/types/customTiles';
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
import { useCallback, useEffect, useMemo, useState } from 'react';

import { CustomGroupPull } from '@/types/customGroups';
import { GameMode } from '@/types/Settings';
import groupActionsFolder from '@/helpers/actionsFolder';

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

  // Extract unique groups whenever groups or gameMode changes
  useEffect(() => {
    // Get group names from groups data (with counts) or fall back to dexieGroups (all available)
    let groupNames: string[] = [];

    // Always use dexieGroups (all available groups) instead of groups (only groups with tiles)
    // This ensures users can select any valid group, even if it doesn't have tiles yet
    if (dexieGroups && Object.keys(dexieGroups).length > 0) {
      groupNames = Object.keys(dexieGroups);
    } else if (groups && Object.keys(groups).length > 0) {
      groupNames = Object.keys(groups);
    }

    setUniqueGroups(groupNames);
  }, [groups, dexieGroups, gameMode]);

  function handleGroupFilterChange(event: SelectChangeEvent<string>) {
    const newGroup = event.target.value;

    // Only call onGroupChange - let it handle setting the default intensity
    // Don't call onIntensityChange here as it uses stale closure of sharedFilters
    onGroupChange(newGroup);
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
            <Trans i18nKey="gameMode.online" />
          </MenuItem>
          <MenuItem value="local">
            <Trans i18nKey="gameMode.local" />
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
              {!hideAll && groups && groups[group] && ` (${groups[group].count})`}
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
            dexieGroups &&
            dexieGroups[validGroupFilter] &&
            dexieGroups[validGroupFilter].intensities
              .sort((a, b) => a.value - b.value)
              .map((intensityObj) => {
                const count =
                  groups && groups[validGroupFilter] && groups[validGroupFilter].intensities
                    ? groups[validGroupFilter].intensities[intensityObj.value] || 0
                    : 0;
                return (
                  <MenuItem key={intensityObj.value} value={intensityObj.value}>
                    {intensityObj.label}
                    {!hideAll ? ` (${count})` : ''}
                  </MenuItem>
                );
              })}
        </Select>
      </FormControl>
    </Box>
  );
}
