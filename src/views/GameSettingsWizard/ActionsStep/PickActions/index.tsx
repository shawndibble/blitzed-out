import { Typography, SelectChangeEvent } from '@mui/material';
import IncrementalSelect from '@/components/GameForm/IncrementalSelect';
import { Trans } from 'react-i18next';
import IntensityTitle from '../IntensityTitle';
import { isOnlineMode } from '@/helpers/strings';
import MultiSelect from '@/components/MultiSelect';
import { handleChange, populateSelections, updateFormDataWithDefaults } from '../helpers';
import { Settings } from '@/types/Settings';
import { Option } from '@/types/index';
import { t } from 'i18next';

const MAX_ACTIONS = 4;

interface PickActionsProps {
  formData: Settings;
  setFormData: React.Dispatch<React.SetStateAction<Settings>>;
  options: (action: string) => Option[];
  actionsList: Record<string, any>;
}

const getAction = (formData: Settings): string => {
  const action = !isOnlineMode(formData?.gameMode)
    ? formData.isNaked
      ? 'sex'
      : 'foreplay'
    : 'solo';
  return action;
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
          {selectedActions.map((option) => (
            <IncrementalSelect
              key={option}
              actionsFolder={actionsList}
              settings={formData}
              option={option}
              initValue={1}
              onChange={(event) => handleChange(event, option, action, setFormData, () => {})}
            />
          ))}
        </>
      )}
    </>
  );
}
