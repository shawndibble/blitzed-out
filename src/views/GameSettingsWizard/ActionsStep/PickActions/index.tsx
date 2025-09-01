import { Typography, SelectChangeEvent } from '@mui/material';
import { Trans } from 'react-i18next';
import IntensityTitle from '../IntensityTitle';
import { isOnlineMode } from '@/helpers/strings';
import MultiSelect from '@/components/MultiSelect';
import MultiSelectIntensity from '@/components/MultiSelectIntensity';
import { handleLevelsChange, populateSelections, updateFormDataWithDefaults } from '../helpers';
import { Settings } from '@/types/Settings';
import { Option } from '@/types/index';
import { t } from 'i18next';

const MAX_ACTIONS = 4;

interface ActionData {
  label?: string;
  intensities?: Record<number, string>;
  actions?: Record<string, any>;
}

interface PickActionsProps {
  formData: Settings;
  setFormData: React.Dispatch<React.SetStateAction<Settings>>;
  options: (action: string) => Option[];
  actionsList: Record<string, ActionData>;
}

const getAction = (formData: Settings): 'sex' | 'foreplay' | 'consumption' | 'solo' => {
  if (isOnlineMode(formData?.gameMode)) {
    return 'solo';
  }

  if (formData.isNaked) {
    return 'sex';
  }

  return 'foreplay';
};

export default function PickActions({
  formData,
  setFormData,
  options,
  actionsList,
}: PickActionsProps): JSX.Element {
  const action = getAction(formData);
  const actionOptions = options(action);

  // Get current selections from formData
  const currentSelections = populateSelections(formData, actionOptions, action);
  const selectedActions = currentSelections || [];

  const handleActionChange = (event: SelectChangeEvent<string[]>): void => {
    const { value } = event.target;
    const selectedValues = typeof value === 'string' ? value.split(',') : value;

    if (selectedValues.length <= MAX_ACTIONS) {
      updateFormDataWithDefaults(selectedValues, action, setFormData);
    }
  };

  return (
    <>
      <Typography variant="h6" sx={{ my: 2 }}>
        <Trans i18nKey="pickActions" />
      </Typography>

      <MultiSelect
        onChange={handleActionChange}
        values={selectedActions}
        options={actionOptions}
        label={t('actionsLabel')}
      />

      {selectedActions.length > 0 && (
        <>
          <IntensityTitle />

          {/* All Actions Intensity Controls (now includes custom groups seamlessly) */}
          {selectedActions.map((option) => {
            const actionData = actionsList[option];
            // Get available levels from the intensities mapping
            const availableLevels = actionData?.intensities
              ? Object.keys(actionData.intensities)
                  .map(Number)
                  .sort((a, b) => a - b)
              : [1, 2, 3, 4]; // Default levels if no specific intensities defined

            const currentLevels = formData.selectedActions?.[option]?.levels || [];

            return (
              <MultiSelectIntensity
                key={option}
                actionName={option}
                actionLabel={actionData?.label || option}
                selectedLevels={currentLevels}
                availableLevels={availableLevels}
                intensityNames={actionData?.intensities || {}}
                onChange={(levels) => handleLevelsChange(levels, option, action, setFormData)}
              />
            );
          })}
        </>
      )}
    </>
  );
}
