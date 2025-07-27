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

interface ActionsStepProps {
  formData: FormData & Partial<Settings>;
  setFormData: React.Dispatch<React.SetStateAction<FormData & Partial<Settings>>>;
  nextStep: () => void;
  prevStep: (count?: number) => void;
  actionsList: Record<string, any>;
}

interface PresetConfig {
  id: string;
  name: string;
  description: string;
  actions: string[];
  consumptions: string[];
  sampleTiles: string[];
  intensities?: Record<string, number>;
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

  const options = (key: string) =>
    settingSelectLists(key).map((option) => ({
      value: option,
      label: actionsList[option]?.label,
    }));

  // Determine game mode for preset selection
  const gameMode =
    formData.gameMode === 'online'
      ? 'solo'
      : formData.gameMode === 'local' && !formData.isNaked
        ? 'foreplay'
        : 'sex';

  // Handle preset selection
  const handlePresetSelect = (preset: PresetConfig) => {
    setSelectedPreset(preset.id);

    // Apply preset to form data
    const newSelectedActions: Record<string, ActionEntry> = {};

    // Map preset actions to form data structure
    preset.actions.forEach((action) => {
      if (actionsList[action]) {
        // Use preset intensity if available, otherwise default to level 2
        const presetIntensity = preset.intensities?.[action] || 2;
        // Get max available intensity level (exclude 'None' option)
        const availableIntensities = Object.keys(actionsList[action].intensities || {}).filter(
          (key) => key !== 'None'
        );
        const maxLevel = availableIntensities.length;
        newSelectedActions[action] = {
          type: actionsList[action].type,
          level: Math.min(presetIntensity, maxLevel),
        };
      }
    });

    // Handle consumptions - merge with actions since consumptions are also actions
    preset.consumptions.forEach((consumption) => {
      if (actionsList[consumption]) {
        // Use preset intensity if available, otherwise default to level 1
        const presetIntensity = preset.intensities?.[consumption] || 1;
        // Get max available intensity level (exclude 'None' option)
        const availableIntensities = Object.keys(actionsList[consumption].intensities || {}).filter(
          (key) => key !== 'None'
        );
        const maxLevel = availableIntensities.length;
        newSelectedActions[consumption] = {
          type: actionsList[consumption].type,
          level: Math.min(presetIntensity, maxLevel),
        };
      }
    });
    setFormData({
      ...formData,
      selectedActions: newSelectedActions,
    });
  };

  // Check if user has made selections
  const isNextDisabled = !hasValidSelections(formData.selectedActions);

  // Check if user has any selections to show customization

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
              Users can fine-tune their action selection and intensity levels below.
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
