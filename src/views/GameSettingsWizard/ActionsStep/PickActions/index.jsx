import { Typography } from '@mui/material';
import IncrementalSelect from 'components/GameForm/IncrementalSelect';
import { useState } from 'react';
import { Trans } from 'react-i18next';
import IntensityTitle from '../IntensityTitle';
import { isOnlineMode } from 'helpers/strings';
import MultiSelect from 'components/MultiSelect';
import { handleChange, populateSelections, updateFormDataWithDefaults } from '../helpers';

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

  const handleActionChange = (event) => {
    const { value } = event.target;

    if (value.length <= MAX_ACTIONS) {
      setSelectedActions(value);
      updateFormDataWithDefaults(value, action, setFormData);
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
        options={optionList}
        label={<Trans i18nKey="actionsLabel" />}
      />

      {!!selectedActions.length && (
        <>
          <IntensityTitle />

          {selectedActions.map((option) => (
            <IncrementalSelect
              key={option}
              actionsFolder={actionsList}
              settings={formData}
              option={option}
              initValue={1}
              onChange={(event) =>
                handleChange(event, option, action, setFormData, setSelectedActions)
              }
            />
          ))}
        </>
      )}
    </>
  );
}
