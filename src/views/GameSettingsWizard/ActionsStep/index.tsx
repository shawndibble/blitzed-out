import { Box, Button, CircularProgress, Divider, Typography } from '@mui/material';
import { ActionEntry, FormData, VALID_GROUP_TYPES } from '@/types';
import { Trans, useTranslation } from 'react-i18next';
import { handleLevelsChange, hasValidSelections, purgedFormData } from './helpers';
import useBrokenActionsState from '@/hooks/useBrokenActionsState';
import { usesSoloActions } from '@/helpers/strings';
import { GroupType } from '@/types';
import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import type { GroupedActions } from '@/types/customTiles';

import ButtonRow from '@/components/ButtonRow';
import BrokenActionsState from '@/components/BrokenActionsState';
import YesNoSwitch from '@/components/GameForm/YesNoSwitch';
import { PresetConfig } from '@/types/presets';
import PresetSelector from './PresetSelector';
import SpiceDial, { SpiceLevel, spiceBand } from './SpiceDial';
import GroupChips from './GroupChips';
import LevelSheet from './LevelSheet';
import { Settings } from '@/types/Settings';

const MAX_ACTIONS = 4;
const MAX_CONSUME = 2;

interface ActionsStepProps {
  formData: FormData & Partial<Settings>;
  setFormData: React.Dispatch<React.SetStateAction<FormData & Partial<Settings>>>;
  nextStep: () => void;
  prevStep: (count?: number) => void;
  actionsList: GroupedActions;
  isActionsLoading?: boolean;
  isMigrationInProgress?: boolean;
}

export default function ActionsStep({
  formData,
  setFormData,
  nextStep,
  prevStep,
  actionsList,
  isActionsLoading = false,
  isMigrationInProgress = false,
}: ActionsStepProps): JSX.Element {
  const { t } = useTranslation();
  const { isBroken } = useBrokenActionsState(actionsList, isActionsLoading);
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [spice, setSpice] = useState<SpiceLevel>('medium');
  // Groups the user hand-edited (sheet or preset) — the dial never overwrites these.
  const [customized, setCustomized] = useState<Set<string>>(new Set());
  const [sheetGroup, setSheetGroup] = useState<string | null>(null);

  const actionType = usesSoloActions(formData.gameMode, formData.soloPlay)
    ? 'solo'
    : formData.isNaked
      ? 'sex'
      : 'foreplay';

  // on load, purge invalid actions and protect pre-existing picks from the dial.
  useEffect(() => {
    const newFormData = purgedFormData(formData);
    setFormData(newFormData);
    setCustomized(new Set(Object.keys(newFormData.selectedActions || {})));
  }, []);

  const optionsOf = (type: string) =>
    Object.keys(actionsList)
      .filter((option) => actionsList[option]?.type === type)
      .map((option) => ({ value: option, label: actionsList[option]?.label || option }));

  const actionOptions = useMemo(() => optionsOf(actionType), [actionsList, actionType]);
  const consumptionOptions = useMemo(() => optionsOf('consumption'), [actionsList]);

  const ladderOf = (group: string): number[] => {
    const intensities = actionsList[group]?.intensities;
    return intensities
      ? Object.keys(intensities)
          .map(Number)
          .sort((a, b) => a - b)
      : [1, 2, 3, 4];
  };

  const selectedOf = (type: string): Record<string, number[]> => {
    const result: Record<string, number[]> = {};
    Object.entries(formData.selectedActions || {}).forEach(([key, entry]) => {
      if ((entry as ActionEntry).type === type) {
        result[key] = (entry as ActionEntry).levels || [];
      }
    });
    return result;
  };

  const selectedActionGroups = selectedOf(actionType);
  const selectedConsumptions = selectedOf('consumption');

  const markCustomized = (group: string) => setCustomized((prev) => new Set(prev).add(group));

  const selectGroup = (group: string, type: 'action' | 'consumption') => {
    const groupType = type === 'consumption' ? 'consumption' : actionType;
    const max = type === 'consumption' ? MAX_CONSUME : MAX_ACTIONS;
    const current = type === 'consumption' ? selectedConsumptions : selectedActionGroups;
    if (Object.keys(current).length >= max) return;

    const band = spiceBand(spice, ladderOf(group).length);
    handleLevelsChange(
      band,
      group,
      groupType,
      setFormData,
      type === 'consumption' ? (formData.isAppend ? 'appendMost' : 'standalone') : null
    );
  };

  const removeGroup = (group: string) => {
    const entry = formData.selectedActions?.[group] as ActionEntry | undefined;
    handleLevelsChange([], group, (entry?.type || actionType) as any, setFormData);
    setCustomized((prev) => {
      const next = new Set(prev);
      next.delete(group);
      return next;
    });
  };

  const editLevels = (group: string, levels: number[]) => {
    const entry = formData.selectedActions?.[group] as ActionEntry | undefined;
    markCustomized(group);
    handleLevelsChange(
      levels,
      group,
      (entry?.type || actionType) as any,
      setFormData,
      entry?.variation || null
    );
  };

  // The dial reseeds every selected group the user hasn't touched.
  const handleSpiceChange = (newSpice: SpiceLevel) => {
    setSpice(newSpice);
    Object.entries(formData.selectedActions || {}).forEach(([group, entry]) => {
      if (customized.has(group)) return;
      const typedEntry = entry as ActionEntry;
      handleLevelsChange(
        spiceBand(newSpice, ladderOf(group).length),
        group,
        typedEntry.type as any,
        setFormData,
        typedEntry.variation || null
      );
    });
  };

  const mapPresetItems = (
    items: string[],
    defaultIntensity: number,
    preset: PresetConfig,
    targetActions: Record<string, ActionEntry>
  ) => {
    items.forEach((item) => {
      if (actionsList[item]) {
        const srcType = actionsList[item].type;
        if (!srcType || !(VALID_GROUP_TYPES as readonly string[]).includes(srcType)) return;
        const presetIntensity = preset.intensities?.[item] || defaultIntensity;
        const availableIntensities = Object.keys(actionsList[item].intensities || {});
        const maxLevel = availableIntensities.length;
        targetActions[item] = {
          type: srcType as GroupType,
          levels: Array.from({ length: Math.min(presetIntensity, maxLevel) }, (_, i) => i + 1),
        };
      }
    });
  };

  // Presets are curated combos — applying one replaces the selection and the
  // dial keeps its hands off those groups afterward.
  const handlePresetSelect = (preset: PresetConfig) => {
    setSelectedPreset(preset.id);
    const newSelectedActions: Record<string, ActionEntry> = {};
    mapPresetItems(preset.actions, 2, preset, newSelectedActions);
    mapPresetItems(preset.consumptions, 1, preset, newSelectedActions);
    setFormData({
      ...formData,
      selectedActions: newSelectedActions,
    });
    setCustomized(new Set(Object.keys(newSelectedActions)));
  };

  const variationChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newIsAppend = event.target.checked;
    const newVariation = newIsAppend ? 'appendMost' : 'standalone';
    const updatedSelectedActions = { ...(formData.selectedActions as Record<string, ActionEntry>) };
    Object.keys(selectedConsumptions).forEach((option) => {
      if (updatedSelectedActions[option]) {
        updatedSelectedActions[option] = {
          ...updatedSelectedActions[option],
          variation: newVariation,
        };
      }
    });
    setFormData({ ...formData, isAppend: newIsAppend, selectedActions: updatedSelectedActions });
  };

  const isNextDisabled = !hasValidSelections(formData.selectedActions);

  if (isActionsLoading) {
    return (
      <Box>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 300,
            gap: 2,
          }}
        >
          <CircularProgress size={48} />
          <Typography variant="h6" sx={{ color: 'text.secondary' }}>
            {isMigrationInProgress ? t('migratingDefaultActions') : t('loadingAvailableActions')}
          </Typography>
        </Box>
        <Box sx={{ mt: 4 }}>
          <ButtonRow>
            <Button disabled>
              <Trans i18nKey="previous" />
            </Button>
            <Button variant="contained" disabled size="large">
              <Trans i18nKey="next" />
            </Button>
          </ButtonRow>
        </Box>
      </Box>
    );
  }

  if (isBroken) {
    return <BrokenActionsState />;
  }

  const sheetEntry = sheetGroup ? (formData.selectedActions?.[sheetGroup] as ActionEntry) : null;

  return (
    <Box>
      {/* Starters: curated combos in a horizontally scrollable shelf */}
      <Typography variant="h6" sx={{ mb: 1 }}>
        {t('starters', 'Starters')}
      </Typography>
      <PresetSelector
        gameMode={actionType}
        onPresetSelect={handlePresetSelect}
        selectedPreset={selectedPreset}
        actionsList={actionsList}
        showTitle={false}
        horizontal
      />

      <Divider sx={{ my: 2 }} />

      <SpiceDial value={spice} onChange={handleSpiceChange} />

      <Box sx={{ mt: 2 }}>
        <GroupChips
          title={t('pickActions')}
          options={actionOptions}
          selected={selectedActionGroups}
          customized={customized}
          max={MAX_ACTIONS}
          onSelect={(group) => selectGroup(group, 'action')}
          onEdit={setSheetGroup}
          onRemove={removeGroup}
        />
      </Box>

      {consumptionOptions.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <GroupChips
            title={t('pickConsumptions')}
            options={consumptionOptions}
            selected={selectedConsumptions}
            customized={customized}
            max={MAX_CONSUME}
            onSelect={(group) => selectGroup(group, 'consumption')}
            onEdit={setSheetGroup}
            onRemove={removeGroup}
          />
          {Object.keys(selectedConsumptions).length > 0 && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                <Trans i18nKey="standaloneOrCombine" />
              </Typography>
              <YesNoSwitch
                trueCondition={formData.isAppend}
                onChange={variationChange}
                yesLabel="combineWithActions"
              />
            </Box>
          )}
        </Box>
      )}

      <LevelSheet
        open={!!sheetGroup}
        groupLabel={sheetGroup ? actionsList[sheetGroup]?.label || sheetGroup : ''}
        availableLevels={sheetGroup ? ladderOf(sheetGroup) : []}
        intensityNames={(sheetGroup && actionsList[sheetGroup]?.intensities) || {}}
        selectedLevels={sheetEntry?.levels || []}
        onChange={(levels) => sheetGroup && editLevels(sheetGroup, levels)}
        onRemove={() => {
          if (sheetGroup) removeGroup(sheetGroup);
          setSheetGroup(null);
        }}
        onClose={() => setSheetGroup(null)}
      />

      <Box sx={{ mt: 4 }}>
        <ButtonRow>
          <Button onClick={() => prevStep()}>
            <Trans i18nKey="previous" />
          </Button>
          <Button variant="contained" disabled={isNextDisabled} onClick={nextStep} size="large">
            <Trans i18nKey="next" />
          </Button>
        </ButtonRow>
      </Box>
    </Box>
  );
}
