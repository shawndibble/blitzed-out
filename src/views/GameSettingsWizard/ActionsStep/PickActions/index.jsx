import { Autocomplete, TextField, Typography } from '@mui/material';
import IncrementalSelect from 'components/GameForm/IncrementalSelect';
import { useState } from 'react';
import { Trans } from 'react-i18next';
import IntensityTitle from '../IntensityTitle';
import { populateSelections, removeFromFormData } from '../helpers';
import { isOnlineMode } from 'helpers/strings';

const MAX_ACTIONS = 4;

const getAction = (formData) => {
  if (!isOnlineMode(formData?.gameMode)) {
    return formData.isNaked ? 'sex' : 'foreplay';
  }
  return 'solo';
};

export default function PickActions({ formData, setFormData, options, actionsList }) {
  const action = getAction(formData);
  const optionList = options(action);

  const initialActions = populateSelections(formData, optionList, action);
  const [selectedActions, setSelectedActions] = useState(initialActions);

  function handleActions(_, newValue) {
    removeFromFormData(setFormData, selectedActions, newValue);

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
        disableCloseOnSelect
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
