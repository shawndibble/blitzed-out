import { Autocomplete, TextField, Typography } from '@mui/material';
import IncrementalSelect from 'components/GameForm/IncrementalSelect';
import { useState } from 'react';
import { Trans } from 'react-i18next';
import IntensityTitle from '../IntensityTitle';

const MAX_ACTIONS = 4;

export default function PickActions({ formData, setFormData, options, actionsList }) {
  const [selectedActions, setSelectedActions] = useState([]);

  // Determine the action type we are going to allow.
  // Solo for online only. Sex requires being naked.
  let action = 'solo';
  if (formData?.gameMode === 'local') {
    action = formData.isNaked ? 'sex' : 'foreplay';
  }

  function handleActions(_, newValue) {
    // if we remove an action from our autocomplete, drop intensity too.
    const removed = selectedActions.filter((x) => !newValue.includes(x))[0];
    if (removed) {
      setFormData((prevData) => {
        const newFormData = { ...prevData };
        delete newFormData[removed.value];
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
        options={options(action)}
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
