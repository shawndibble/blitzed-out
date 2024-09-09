import { Autocomplete, TextField, Typography } from '@mui/material';
import IncrementalSelect from 'components/GameForm/IncrementalSelect';
import YesNoSwitch from 'components/GameForm/YesNoSwitch';
import { useState } from 'react';
import { Trans } from 'react-i18next';
import IntensityTitle from '../IntensityTitle';

const MAX_CONSUME = 2;

export default function PickConsumptions({ formData, setFormData, options, actionsList }) {
  const [selectedConsumptions, setSelectedConsumptions] = useState([]);

  function handleConsumption(_, newValue) {
    // if we have actions that shouldn't be here, drop them.
    const removed = selectedConsumptions.filter((x) => !newValue.includes(x));
    if (removed) {
      setFormData((prevData) => {
        const newFormData = { ...prevData };
        removed.foreach((option) => delete newFormData[option.value]);
        return newFormData;
      });
    }

    if (newValue.length <= MAX_CONSUME) {
      setSelectedConsumptions(newValue);
    }
  }

  function handleChange(event, key, nestedKey, variation) {
    setFormData((prevData) => ({
      ...prevData,
      [key]: {
        ...prevData[key],
        type: 'consumption',
        [nestedKey]: event?.target?.value,
        variation,
      },
    }));
  }

  function variationChange(event) {
    selectedConsumptions.forEach((option) => {
      setFormData((prevData) => ({
        ...prevData,
        isAppend: event.target.checked,
        [option.value]: {
          ...prevData[option.value],
          type: 'consumption',
          variation: event.target.checked ? 'appendMost' : 'standalone',
        },
      }));
    });
  }

  return (
    <>
      <Typography variant="h6" sx={{ my: 2 }}>
        <Trans i18nKey="pickConsumptions" />
      </Typography>

      <Autocomplete
        multiple
        options={options('consumption')}
        getOptionLabel={(option) => option.label}
        isOptionEqualToValue={(option, value) => option.value === value.value}
        value={selectedConsumptions}
        onChange={handleConsumption}
        renderInput={(params) => (
          <TextField {...params} variant="outlined" label={<Trans i18nKey="consumables" />} />
        )}
      />

      {!!selectedConsumptions.length && (
        <>
          <IntensityTitle />

          {selectedConsumptions.map((option) => (
            <IncrementalSelect
              key={option.value}
              actionsFolder={actionsList}
              settings={formData}
              option={option.value}
              onChange={(event) =>
                handleChange(
                  event,
                  option.value,
                  'level',
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
            onChange={variationChange}
            yesLabel="combineWithActions"
            noLabel="standaloneConsumables"
          />
        </>
      )}
    </>
  );
}
