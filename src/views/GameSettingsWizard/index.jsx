import React, { useState } from 'react';
import { Box, Button, Divider, Step, StepLabel, Stepper } from '@mui/material';
import { Trans } from 'react-i18next';
import RoomStep from './RoomStep';
import GameModeStep from './GameModeStep';
import ActionsStep from './ActionsStep';
import FinishStep from './FinishStep';
import GameSettings from 'views/GameSettings';
import { useParams } from 'react-router-dom';
import useSettingsToFormData from 'hooks/useSettingsToFormData';

export default function GameSettingsWizard() {
  const { id: room } = useParams();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useSettingsToFormData({
    room,
    roomRealtime: true,
    actions: [],
    consumption: [],
    role: 'sub',
  });

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
          />
        );
      case 4:
        return <FinishStep formData={formData} setFormData={setFormData} prevStep={prevStep} />;
      default:
        return null;
    }
  };

  if (step === 'advanced') return <GameSettings />;

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
