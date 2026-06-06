import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from '@mui/material';
import { ActionEntry, FormData, VALID_GROUP_TYPES } from '@/types';
import { ExpandMore, PlayArrow, Tune } from '@mui/icons-material';
import { Trans, useTranslation } from 'react-i18next';
import { hasValidSelections, purgedFormData } from './helpers';
import useBrokenActionsState from '@/hooks/useBrokenActionsState';
import { usesSoloActions } from '@/helpers/strings';
import { GroupType } from '@/types';
import { useEffect, useState } from 'react';
import type { GroupedActions } from '@/types/customTiles';

import ButtonRow from '@/components/ButtonRow';
import BrokenActionsState from '@/components/BrokenActionsState';
import PickActions from './PickActions';
import PickConsumptions from './PickConsumptions/index';
import { PresetConfig } from '@/types/presets';
import PresetSelector from './PresetSelector';
import { Settings } from '@/types/Settings';

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
  const [showCustomization, setShowCustomization] = useState(false);
  const [showQuickStart, setShowQuickStart] = useState(true);
  function settingSelectLists(type: string): string[] {
    return Object.keys(actionsList).filter((option) => actionsList[option]?.type === type);
  }

  // on load, purge invalid actions.
  useEffect(() => {
    // purge actions that we shouldn't be able to access.
    const newFormData = purgedFormData(formData);
    setFormData(newFormData);
  }, []);

  // Auto-open accordion if there are selected actions on mount
  useEffect(() => {
    const hasSelectedActions =
      formData.selectedActions && Object.keys(formData.selectedActions).length > 0;
    if (hasSelectedActions) {
      setShowCustomization(true);
      setShowQuickStart(false);
    }
  }, []);

  const options = (key: string) =>
    settingSelectLists(key).map((option) => ({
      value: option,
      label: actionsList[option]?.label,
    }));

  const gameMode = usesSoloActions(formData.gameMode, formData.soloPlay)
    ? 'solo'
    : formData.isNaked
      ? 'sex'
      : 'foreplay';

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

  // Handle preset selection
  const handlePresetSelect = (preset: PresetConfig) => {
    setSelectedPreset(preset.id);

    // Apply preset to form data
    const newSelectedActions: Record<string, ActionEntry> = {};

    // Map preset actions to form data structure (default intensity: 2)
    mapPresetItems(preset.actions, 2, preset, newSelectedActions);

    // Handle consumptions - merge with actions since consumptions are also actions (default intensity: 1)
    mapPresetItems(preset.consumptions, 1, preset, newSelectedActions);

    setFormData({
      ...formData,
      selectedActions: newSelectedActions,
    });

    // After selecting a preset, switch to customization view
    setShowQuickStart(false);
    setShowCustomization(true);
  };

  // Handle accordion mutual exclusivity
  const handleQuickStartChange = (_: React.SyntheticEvent, isExpanded: boolean) => {
    setShowQuickStart(isExpanded);
    if (isExpanded) {
      setShowCustomization(false);
    }
  };

  const handleCustomizationChange = (_: React.SyntheticEvent, isExpanded: boolean) => {
    setShowCustomization(isExpanded);
    if (isExpanded) {
      setShowQuickStart(false);
    }
  };

  // Check if user has made selections
  const isNextDisabled = !hasValidSelections(formData.selectedActions);

  // Show loading state when actions are being loaded (now includes migration awareness)
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
          <Typography
            variant="h6"
            sx={{
              color: 'text.secondary',
            }}
          >
            {isMigrationInProgress ? t('migratingDefaultActions') : t('loadingAvailableActions')}
          </Typography>
        </Box>
        {/* Navigation buttons - disabled during loading */}
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

  // Show broken state when no actions are available after loading completes
  if (isBroken) {
    return <BrokenActionsState />;
  }

  return (
    <Box>
      {/* Quick Start Accordion */}
      <Accordion
        expanded={showQuickStart}
        onChange={handleQuickStartChange}
        sx={{
          backgroundColor: 'background.default',
          borderTop: 1,
          borderBottom: 1,
          borderColor: 'divider',
          borderLeft: 'none',
          borderRight: 'none',
          borderRadius: 0,
          '&:before': {
            display: 'none',
          },
          boxShadow: 'none',
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMore />}
          aria-controls="quickstart-content"
          id="quickstart-header"
          sx={{
            backgroundColor: 'background.default',
          }}
        >
          <Stack
            direction="row"
            spacing={1}
            sx={{
              alignItems: 'center',
            }}
          >
            <PlayArrow />
            <Typography variant="h6">{t('quickStart')}</Typography>
          </Stack>
        </AccordionSummary>
        <AccordionDetails sx={{ pb: 1 }}>
          <PresetSelector
            gameMode={gameMode}
            onPresetSelect={handlePresetSelect}
            selectedPreset={selectedPreset}
            actionsList={actionsList}
            showTitle={false}
          />
        </AccordionDetails>
      </Accordion>
      {/* Custom Selection Accordion */}
      <Accordion
        expanded={showCustomization}
        onChange={handleCustomizationChange}
        sx={{
          backgroundColor: 'background.default',
          borderTop: showQuickStart ? 'none' : 1,
          borderBottom: 1,
          borderColor: 'divider',
          borderLeft: 'none',
          borderRight: 'none',
          borderRadius: 0,
          marginTop: showQuickStart ? -1 : 0,
          '&:before': {
            display: 'none',
          },
          boxShadow: 'none',
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMore />}
          aria-controls="customization-content"
          id="customization-header"
          sx={{
            backgroundColor: 'background.default',
          }}
        >
          <Stack
            direction="row"
            spacing={1}
            sx={{
              alignItems: 'center',
            }}
          >
            <Tune />
            <Typography variant="h6">{t('customizeActions')}</Typography>
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              mb: 2,
            }}
          >
            {t('customizeActionsDesc')}
          </Typography>

          <PickActions
            formData={formData}
            setFormData={setFormData}
            options={options}
            actionsList={actionsList}
          />

          <Divider sx={{ my: 3 }} />

          <PickConsumptions
            formData={formData}
            setFormData={setFormData}
            options={options}
            actionsList={actionsList}
          />
        </AccordionDetails>
      </Accordion>
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
