import { useEffect, useRef, useState } from 'react';
import { Box, Button, Divider, Step, StepLabel, Stepper } from '@mui/material';
import { Trans } from 'react-i18next';
import RoomStep from './RoomStep';
import GameModeStep from './GameModeStep';
import ActionsStep from './ActionsStep';
import FinishStep from './FinishStep';
import GameSettings from '@/views/GameSettings';
import { useParams } from 'react-router-dom';
import useSettingsToFormData from '@/hooks/useSettingsToFormData';
import { isPublicRoom } from '@/helpers/strings';
import useUnifiedActionList from '@/hooks/useUnifiedActionList';
import { FormData } from '@/types';
import { Settings } from '@/types/Settings';

interface GameSettingsWizardProps {
  close?: () => void;
}

export default function GameSettingsWizard({ close }: GameSettingsWizardProps) {
  const { id: room } = useParams<{ id: string }>();
  const [step, setStep] = useState<number>(1);

  const overrideSettings: Record<string, any> = { room };

  if (isPublicRoom(room)) {
    // if we are in the public room, some settings are forced.
    overrideSettings.gameMode = 'online';
    overrideSettings.roomRealtime = true;
  }

  const [formData, setFormData] = useSettingsToFormData<FormData & Partial<Settings>>(
    {
      gameMode: 'online',
      roomRealtime: true,
      actions: [],
      consumption: [],
      role: 'sub',
      boardUpdated: false,
      room: room || 'PUBLIC',
    },
    overrideSettings
  );

  const initialLoad = useRef(true);
  const { actionsList } = useUnifiedActionList(formData.gameMode);

  // on load, we want to guess what page we should be on.
  useEffect(() => {
    if (!initialLoad.current) return;
    initialLoad.current = false;

    if (formData.advancedSettings) {
      goToAdvanced();
      return;
    }

    // if we do not have a close() then this dialog opened b/c we need to set up a game.
    // this also means we need to do all steps.
    if (typeof close !== 'function') return;

    // If we are in the public room, then we can skip to step 3.
    if (isPublicRoom(room)) {
      setStep(3);
      return;
    }

    // If the game mode is already set to 'online,' the game mode step can be skipped because the user has already selected this mode and doesn't need to choose again.
    if (formData.gameMode === 'online') {
      setStep(3);
      return;
    }

    setStep(2);
  }, [formData, close, room]);

  const nextStep = (count?: number): void => {
    if (!Number.isInteger(count)) return setStep(step + 1);
    setStep(step + (count || 1));
  };

  const prevStep = (count?: number): void => {
    if (!Number.isInteger(count)) return setStep(step - 1);
    setStep(step - (count || 1));
  };

  const goToAdvanced = (): void => setStep(0); // Use 0 to represent 'advanced'

  const renderStep = (): JSX.Element | null => {
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

  if (step === 0) return <GameSettings closeDialog={close} />;

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
