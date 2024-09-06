import React, { useEffect, useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { Trans, useTranslation } from 'react-i18next';
import ButtonRow from 'components/ButtonRow';
import { importActions } from 'services/importLocales';
import PickConsumptions from './PickConsumptions/index';
import PickActions from './PickActions';

export default function ActionsStep({ formData, setFormData, nextStep, prevStep }) {
  const { i18n } = useTranslation();
  const [actionsList, setActionList] = useState({});

  useEffect(() => {
    setActionList(importActions(i18n.resolvedLanguage, formData?.gameMode));
  }, []);

  function settingSelectLists(type) {
    return Object.keys(actionsList).filter((option) => actionsList[option]?.type === type);
  }

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
        <Button onClick={() => prevStep(formData.room === 'PUBLIC' ? 2 : 1)}>
          <Trans i18nKey="previous" />
        </Button>
        <Button variant="contained" disabled={isNextDisabled} onClick={nextStep}>
          <Trans i18nKey="next" />
        </Button>
      </ButtonRow>
    </Box>
  );
}
