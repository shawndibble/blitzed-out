import React, { useEffect, useState } from 'react';
import { Box, Button, Divider, Step, StepLabel, Stepper } from '@mui/material';
import { Trans, useTranslation } from 'react-i18next';
import RoomStep from './RoomStep';
import GameModeStep from './GameModeStep';
import ActionsStep from './ActionsStep';
import FinishStep from './FinishStep';
import GameSettings from 'views/GameSettings';
import { useParams } from 'react-router-dom';
import useSettingsToFormData from 'hooks/useSettingsToFormData';
import { importActions } from 'services/importLocales';
import { isPublicRoom } from 'helpers/strings';

export default function GameSettingsWizard({ close }) {
  const { id: room } = useParams();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useSettingsToFormData({
    room,
    gameMode: 'online',
    roomRealtime: true,
    actions: [],
    consumption: [],
    role: 'sub',
  });
  const { i18n } = useTranslation();
  const [actionsList, setActionList] = useState({});

  // on load, we want to guess what page we should be on.
  useEffect(() => {
    if (formData.advancedSettings) return goToAdvanced();

    // if we do not have a close() then this dialog opened b/c we need to set up a game.
    // this also means we need to do all steps.
    if (typeof close !== 'function') return;

    // If we are in the public room, then we can skip to step 3.
    if (isPublicRoom(room)) return setStep(3);

    setStep(2);
  }, [formData]);

  useEffect(() => {
    if (!formData?.gameMode) return;
    setActionList(importActions(i18n.resolvedLanguage, formData.gameMode));
  }, [i18n.resolvedLanguage, formData?.gameMode]);

  const nextStep = (count) => {
    if (!Number.isInteger(count)) return setStep(step + 1);
    setStep(step + count);
  };

  const prevStep = (count) => {
    if (!Number.isInteger(count)) return setStep(step - 1);
    setStep(step - count);
  };

  const goToAdvanced = () => setStep('advanced');

  const renderStep = () => {
    switch (step) {
      case 1:
        return <RoomStep formData={formData} setFormData={setFormData} nextStep={nextStep} />;
      case 2:
        return (
          <GameModeStep
            formData={formData}
            setFormData={setFormData}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        );
      case 3:
        return (
          <ActionsStep
            formData={formData}
            setFormData={setFormData}
            nextStep={nextStep}
            prevStep={prevStep}
            actionsList={actionsList}
          />
        );
      case 4:
        return (
          <FinishStep
            formData={formData}
            setFormData={setFormData}
            prevStep={prevStep}
            actionsList={actionsList}
            close={close}
          />
        );
      default:
        return null;
    }
  };

  if (step === 'advanced') return <GameSettings closeDialog={close} />;

  return (
    <Box>
      <Box sx={{ width: '100%', mt: 2, mb: 4 }}>
        <Stepper activeStep={step - 1} alternativeLabel>
          {[1, 2, 3, 4].map((label) => (
            <Step key={label}>
              <StepLabel />
            </Step>
          ))}
        </Stepper>
      </Box>
      {renderStep()}

      <Divider sx={{ mt: 3 }} />

      <Button onClick={goToAdvanced}>
        <Trans i18nKey="advancedSetup" />
      </Button>
    </Box>
  );
}
