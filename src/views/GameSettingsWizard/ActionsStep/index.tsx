import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
} from '@mui/material';
import { ExpandMore, Tune } from '@mui/icons-material';
import { Trans, useTranslation } from 'react-i18next';
import ButtonRow from '@/components/ButtonRow';
import PresetSelector from './PresetSelector';
import PickConsumptions from './PickConsumptions/index';
import PickActions from './PickActions';
import { purgedFormData, hasValidSelections } from './helpers';
import { isPublicRoom } from '@/helpers/strings';
import { FormData, ActionEntry } from '@/types';
import { Settings } from '@/types/Settings';
import { PresetConfig } from '@/types/presets';

interface ActionsStepProps {
  formData: FormData & Partial<Settings>;
  setFormData: React.Dispatch<React.SetStateAction<FormData & Partial<Settings>>>;
  nextStep: () => void;
  prevStep: (count?: number) => void;
  actionsList: Record<string, any>;
}

export default function ActionsStep({
  formData,
  setFormData,
  nextStep,
  prevStep,
  actionsList,
}: ActionsStepProps): JSX.Element {
  const { t } = useTranslation();
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [showCustomization, setShowCustomization] = useState(false);

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
  };

  // Check if user has made selections
  const isNextDisabled = !hasValidSelections(formData.selectedActions);

  return (
    <Box>
      {/* Preset Selection */}
      <PresetSelector
        gameMode={gameMode}
        onPresetSelect={handlePresetSelect}
        selectedPreset={selectedPreset}
        actionsList={actionsList}
      />

      {/* Custom Selection Accordion */}
      <Box sx={{ mt: 4 }}>
        <Accordion
          expanded={showCustomization}
          onChange={(_, isExpanded) => setShowCustomization(isExpanded)}
        >
          <AccordionSummary
            expandIcon={<ExpandMore />}
            aria-controls="customization-content"
            id="customization-header"
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
      </Box>

      <Box sx={{ mt: 4 }}>
        <ButtonRow>
          <Button onClick={() => prevStep(isPublicRoom(formData.room) ? 2 : 1)}>
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
