import React, { useEffect } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { Trans } from 'react-i18next';
import ButtonRow from 'components/ButtonRow';
import PickConsumptions from './PickConsumptions/index';
import PickActions from './PickActions';
import { purgedFormData } from './helpers';
import { isPublicRoom } from 'helpers/strings';

export default function ActionsStep({ formData, setFormData, nextStep, prevStep, actionsList }) {
  function settingSelectLists(type) {
    return Object.keys(actionsList).filter((option) => actionsList[option]?.type === type);
  }

  // on load, purge invalid actions.
  useEffect(() => {
    // purge actions that we shouldn't be able to access.
    const newFormData = purgedFormData(formData);
    setFormData(newFormData);
  }, []);

  console.log(formData);

  const options = (key) =>
    settingSelectLists(key).map((option) => ({
      value: option,
      label: actionsList[option]?.label,
    }));

  const isNextDisabled = !Object.keys(formData).some(
    (key) => formData[key].level > 0 && formData[key].variation !== 'appendMost'
  );

  return (
    <Box>
      <Typography variant="body" sx={{ my: 2 }}>
        <Trans i18nKey="actionsDisclaimer" />
      </Typography>

      <PickActions
        formData={formData}
        setFormData={setFormData}
        options={options}
        actionsList={actionsList}
      />

      <PickConsumptions
        formData={formData}
        setFormData={setFormData}
        options={options}
        actionsList={actionsList}
      />

      <ButtonRow>
        <Button onClick={() => prevStep(isPublicRoom(formData.room) ? 2 : 1)}>
          <Trans i18nKey="previous" />
        </Button>
        <Button variant="contained" disabled={isNextDisabled} onClick={nextStep}>
          <Trans i18nKey="next" />
        </Button>
      </ButtonRow>
    </Box>
  );
}
