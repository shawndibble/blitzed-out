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
import { ActionEntry, FormData } from '@/types';
import { ExpandMore, PlayArrow, Tune } from '@mui/icons-material';
import { Trans, useTranslation } from 'react-i18next';
import { hasValidSelections, purgedFormData } from './helpers';
import { useEffect, useState } from 'react';

import ButtonRow from '@/components/ButtonRow';
import PickActions from './PickActions';
import PickConsumptions from './PickConsumptions/index';
import { PresetConfig } from '@/types/presets';
import PresetSelector from './PresetSelector';
import { Settings } from '@/types/Settings';
import { isPublicRoom } from '@/helpers/strings';

interface ActionsStepProps {
  formData: FormData & Partial<Settings>;
  setFormData: React.Dispatch<React.SetStateAction<FormData & Partial<Settings>>>;
  nextStep: () => void;
  prevStep: (count?: number) => void;
  actionsList: Record<string, any>;
  isActionsLoading?: boolean;
}

export default function ActionsStep({
  formData,
  setFormData,
  nextStep,
  prevStep,
  actionsList,
  isActionsLoading = false,
}: ActionsStepProps): JSX.Element {
  const { t } = useTranslation();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- This should only run once on mount to clean initial data
  }, []);

  // Auto-open accordion if there are selected actions on mount
  useEffect(() => {
    const hasSelectedActions =
      formData.selectedActions && Object.keys(formData.selectedActions).length > 0;
    if (hasSelectedActions) {
      setShowCustomization(true);
      setShowQuickStart(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Only run on mount
  }, []);

  const options = (key: string) =>
    settingSelectLists(key).map((option) => ({
      value: option,
      label: actionsList[option]?.label,
    }));

  // Determine game mode for preset selection
  let gameMode: string;
  if (formData.gameMode === 'online') {
    gameMode = 'solo';
  } else if (formData.gameMode === 'local' && !formData.isNaked) {
    gameMode = 'foreplay';
  } else {
    gameMode = 'sex';
  }

  // Extract common logic for mapping preset items to selected actions
  const mapPresetItems = (
    items: string[],
    defaultIntensity: number,
    preset: PresetConfig,
    targetActions: Record<string, ActionEntry>
  ) => {
    items.forEach((item) => {
      if (actionsList[item]) {
        // Use preset intensity if available, otherwise use default
        const presetIntensity = preset.intensities?.[item] || defaultIntensity;
        // Get max available intensity level (exclude 'None' option)
        const availableIntensities = Object.keys(actionsList[item].intensities || {}).filter(
          (key) => key !== 'None'
        );
        const maxLevel = availableIntensities.length;
        targetActions[item] = {
          type: actionsList[item].type,
          level: Math.min(presetIntensity, maxLevel),
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

  // Show loading state when actions are still being loaded from migration
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
          <Typography variant="h6" color="text.secondary">
            {t('loadingAvailableActions')}
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
          <Stack direction="row" alignItems="center" spacing={1}>
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
          <Stack direction="row" alignItems="center" spacing={1}>
            <Tune />
            <Typography variant="h6">{t('customizeActions')}</Typography>
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
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
          <Button onClick={() => prevStep(isPublicRoom(formData.room) ? 3 : 1)}>
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
