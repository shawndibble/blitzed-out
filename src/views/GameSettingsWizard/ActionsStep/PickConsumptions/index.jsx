import { Autocomplete, Checkbox, TextField, Typography } from '@mui/material';
import IncrementalSelect from 'components/GameForm/IncrementalSelect';
import YesNoSwitch from 'components/GameForm/YesNoSwitch';
import { useState } from 'react';
import { Trans } from 'react-i18next';
import IntensityTitle from '../IntensityTitle';
import { populateSelections, removeFromFormData } from '../helpers';
import { CheckBox, CheckBoxOutlineBlank } from '@mui/icons-material';

const MAX_CONSUME = 2;

export default function PickConsumptions({ formData, setFormData, options, actionsList }) {
  const optionList = options('consumption');

  const initialConsumptions = populateSelections(formData, optionList, 'consumption');
  const [selectedConsumptions, setSelectedConsumptions] = useState(initialConsumptions);

  function handleConsumption(_, newValue) {
    removeFromFormData(setFormData, selectedConsumptions, newValue);

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
    const updatedFormData = selectedConsumptions.reduce(
      (acc, option) => {
        acc[option.value] = {
          ...acc[option.value],
          type: 'consumption',
          variation: event.target.checked ? 'appendMost' : 'standalone',
        };
        return acc;
      },
      { ...formData, isAppend: event.target.checked }
    );

    setFormData(updatedFormData);
  }

  return (
    <>
      <Typography variant="h6" sx={{ my: 2 }}>
        <Trans i18nKey="pickConsumptions" />
      </Typography>

      <Autocomplete
        disableCloseOnSelect
        multiple
        options={optionList}
        getOptionLabel={(option) => option.label}
        isOptionEqualToValue={(option, value) => option.value === value.value}
        value={selectedConsumptions}
        onChange={handleConsumption}
        renderOption={(props, option, { selected }) => {
          const { key, ...optionProps } = props;
          return (
            <li key={key} {...optionProps}>
              <Checkbox
                icon={<CheckBoxOutlineBlank fontSize="small" />}
                checkedIcon={<CheckBox fontSize="small" />}
                style={{ marginRight: 8 }}
                checked={selected}
              />
              {option.label}
            </li>
          );
        }}
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
              initialValue={1}
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
