import { Autocomplete, TextField, Typography } from '@mui/material';
import IncrementalSelect from 'components/GameForm/IncrementalSelect';
import { useState } from 'react';
import { Trans } from 'react-i18next';
import IntensityTitle from '../IntensityTitle';

const MAX_ACTIONS = 4;

const getAction = (formData) => {
  if (formData?.gameMode === 'local') {
    return formData.isNaked ? 'sex' : 'foreplay';
  }
  return 'solo';
};

const populateAction = (formData, optionList, action) => {
  return Object.entries(formData)
    .map(([key, entry]) => {
      if (entry.type !== action) return null;
      return { value: key, label: optionList.find((x) => x.value === key).label };
    })
    .filter((x) => x);
};

export default function PickActions({ formData, setFormData, options, actionsList }) {
  const action = getAction(formData);
  const optionList = options(action);

  const initialActions = populateAction(formData, optionList, action);
  // remove empty objects from array
  const [selectedActions, setSelectedActions] = useState(initialActions);

  function handleActions(_, newValue) {
    // if we remove an action from our autocomplete, drop intensity too.
    const removed = selectedActions.filter((x) => !newValue.includes(x));
    if (removed) {
      setFormData((prevData) => {
        const newFormData = { ...prevData };
        removed.foreach((option) => delete newFormData[option.value]);
        return newFormData;
      });
    }

    if (newValue.length <= MAX_ACTIONS) {
      setSelectedActions(newValue);
    }
  }

  function handleChange(event, key, nestedKey) {
    setFormData((prevData) => ({
      ...prevData,
      [key]: {
        ...prevData[key],
        type: action,
        [nestedKey]: event?.target?.value,
      },
    }));
  }

  return (
    <>
      <Typography variant="h6" sx={{ my: 2 }}>
        <Trans i18nKey="pickActions" />
      </Typography>

      <Autocomplete
        multiple
        options={optionList}
        getOptionLabel={(option) => option.label}
        isOptionEqualToValue={(option, value) => option.value === value.value}
        value={selectedActions}
        onChange={handleActions}
        renderInput={(params) => (
          <TextField {...params} variant="outlined" label={<Trans i18nKey="actionsLabel" />} />
        )}
      />

      {!!selectedActions.length && (
        <>
          <IntensityTitle />

          {selectedActions.map((option) => (
            <IncrementalSelect
              key={option.value}
              actionsFolder={actionsList}
              settings={formData}
              option={option.value}
              onChange={(event) => handleChange(event, option.value, 'level')}
            />
          ))}
        </>
      )}
    </>
  );
}
