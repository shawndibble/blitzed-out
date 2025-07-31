import { Typography } from '@mui/material';
import IncrementalSelect from '@/components/GameForm/IncrementalSelect';
import YesNoSwitch from '@/components/GameForm/YesNoSwitch';
import { ChangeEvent } from 'react';
import { Trans } from 'react-i18next';
import IntensityTitle from '../IntensityTitle';
import { populateSelections, handleChange, updateFormDataWithDefaults } from '../helpers';
import MultiSelect from '@/components/MultiSelect';
import { FormData } from '@/types';
import { SelectChangeEvent } from '@mui/material/Select';
import { t } from 'i18next';

interface PickConsumptionsProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  options: (actionType: string) => Array<{ value: string; label: string }>;
  actionsList: Record<string, any>;
}

const MAX_CONSUME = 2;

export default function PickConsumptions({
  formData,
  setFormData,
  options,
  actionsList,
}: PickConsumptionsProps): JSX.Element {
  const action = 'consumption';
  const optionList = options(action);

  // Always get current selections from formData instead of maintaining separate state
  const currentSelections = populateSelections(formData, optionList, action);
  const selectedConsumptions = currentSelections || [];

  const handleConsumptionChange = (event: SelectChangeEvent<string[]>) => {
    const { value } = event.target;
    const valueArray = typeof value === 'string' ? value.split(',') : value;

    if (valueArray.length <= MAX_CONSUME) {
      updateFormDataWithDefaults(valueArray, action, setFormData);
    }
  };

  const variationChange = (event: ChangeEvent<HTMLInputElement>, selectedItems: string[]) => {
    const newVariation = event.target.checked ? 'appendMost' : 'standalone';
    const newIsAppend = event.target.checked;

    // Update selectedActions for each consumption item
    const updatedSelectedActions = { ...(formData.selectedActions as Record<string, any>) };
    selectedItems.forEach((option) => {
      if (updatedSelectedActions[option]) {
        updatedSelectedActions[option] = {
          ...updatedSelectedActions[option],
          variation: newVariation,
        };
      }
    });

    const updatedFormData = {
      ...formData,
      isAppend: newIsAppend,
      selectedActions: updatedSelectedActions,
    };

    setFormData(updatedFormData);
  };

  return (
    <>
      <Typography variant="h6" sx={{ my: 2 }}>
        <Trans i18nKey="pickConsumptions" />
      </Typography>

      <MultiSelect
        onChange={handleConsumptionChange}
        values={selectedConsumptions}
        options={optionList}
        label={t('consumables')}
      />

      {!!selectedConsumptions.length && (
        <>
          <IntensityTitle />

          {selectedConsumptions.map((option) => (
            <IncrementalSelect
              key={option}
              actionsFolder={actionsList}
              settings={formData}
              option={option}
              initValue={1}
              onChange={(event) =>
                handleChange(
                  event,
                  option,
                  action,
                  setFormData,
                  () => {},
                  formData.isAppend ? 'appendMost' : 'standalone'
                )
              }
            />
          ))}

          <Typography variant="h6" sx={{ mt: 2 }}>
            <Trans i18nKey="standaloneOrCombine" />
          </Typography>

          <YesNoSwitch
            trueCondition={formData.isAppend}
            onChange={(event) => variationChange(event, selectedConsumptions)}
            yesLabel="combineWithActions"
          />
        </>
      )}
    </>
  );
}
