import { Typography } from '@mui/material';
import IncrementalSelect from '@/components/GameForm/IncrementalSelect';
import YesNoSwitch from '@/components/GameForm/YesNoSwitch';
import { useState } from 'react';
import { Trans } from 'react-i18next';
import IntensityTitle from '../IntensityTitle';
import { populateSelections, handleChange, updateFormDataWithDefaults } from '../helpers';
import MultiSelect from '@/components/MultiSelect';

const MAX_CONSUME = 2;

export default function PickConsumptions({ formData, setFormData, options, actionsList }) {
  const action = 'consumption';
  const optionList = options(action);

  const initialConsumptions = populateSelections(formData, optionList, action);
  const [selectedConsumptions, setSelectedConsumptions] = useState(initialConsumptions);

  const handleConsumptionChange = (event) => {
    const { value } = event.target;

    if (value.length <= MAX_CONSUME) {
      setSelectedConsumptions(value);
      updateFormDataWithDefaults(value, action, setFormData);
    }
  };

  const variationChange = (event, selectedItems) => {
    const updatedFormData = selectedItems.reduce(
      (acc, option) => {
        acc[option] = {
          ...acc[option],
          type: action,
          variation: event.target.checked ? 'appendMost' : 'standalone',
        };
        return acc;
      },
      { ...formData, isAppend: event.target.checked }
    );

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
        label={<Trans i18nKey="consumables" />}
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
                  setSelectedConsumptions,
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
            noLabel="standaloneConsumables"
          />
        </>
      )}
    </>
  );
}
