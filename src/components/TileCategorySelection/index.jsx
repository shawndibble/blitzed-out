import { Box, FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { Trans, useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import groupActionsFolder from '@/helpers/actionsFolder';

export default function TileCategorySelection({
  gameMode,
  groupFilter,
  intensityFilter,
  groups,
  mappedGroups,
  onGameModeChange,
  onGroupChange,
  onIntensityChange,
  sx = {},
}) {
  const { t } = useTranslation();
  const [uniqueGroups, setUniqueGroups] = useState([]);

  // Extract unique groups whenever groups or gameMode changes
  useEffect(() => {
    if (groups) {
      const groupNames = Object.keys(groups);
      setUniqueGroups(groupNames);
    }
  }, [groups, gameMode]);

  function handleGroupFilterChange(event) {
    const newGroup = event.target.value;
    
    // Reset intensity filter when group changes
    let newIntensity = '';
    
    // If a group is selected, set intensity to the first available intensity for that group
    if (newGroup && groups && groups[newGroup]) {
      const intensities = Object.keys(groups[newGroup].intensities || {});
      if (intensities.length > 0) {
        newIntensity = Number(intensities[0]);
      }
    }
    
    // Call the parent handlers
    onGroupChange(newGroup);
    if (onIntensityChange) {
      onIntensityChange(newIntensity);
    }
  }

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
          value={groupFilter}
          label={t('group')}
          onChange={handleGroupFilterChange}
        >
          {uniqueGroups.map((group) => (
            <MenuItem key={group} value={group}>
              {groupActionsFolder(mappedGroups[gameMode] || {})?.find(
                (g) => g.value === group
              )?.groupLabel || group}
              {groups[group] && ` (${groups[group].count})`}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {onIntensityChange && (
        <FormControl sx={{ minWidth: 200, flex: 1 }} disabled={!groupFilter}>
          <InputLabel id="intensity-filter-label">
            <Trans i18nKey="customTiles.intensityLevel">Intensity Level</Trans>
          </InputLabel>
          <Select
            labelId="intensity-filter-label"
            id="intensity-filter"
            value={intensityFilter}
            label={t('customTiles.intensityLevel', 'Intensity Level')}
            onChange={(e) => onIntensityChange(e.target.value)}
          >
            {groupFilter &&
              groups &&
              groups[groupFilter] &&
              Object.entries(groups[groupFilter].intensities || {})
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([intensity, count]) => (
                  <MenuItem key={intensity} value={Number(intensity)}>
                    {groupActionsFolder(mappedGroups[gameMode] || {})?.find(
                      (g) => g.value === groupFilter && g.intensity === Number(intensity)
                    )?.translatedIntensity || `Level ${intensity}`}
                    {count !== undefined ? ` (${count})` : ''}
                  </MenuItem>
                ))}
          </Select>
        </FormControl>
      )}
    </Box>
  );
}
