import { useState } from 'react';
import { Box, Button, Divider } from '@mui/material';
import { Trans } from 'react-i18next';
import RoomStep from './RoomStep';
import LocalPlayersStep from './LocalPlayersStep';
import GameModeStep from './GameModeStep';
import ActionsStep from './ActionsStep';
import FinishStep from './FinishStep';
import DynamicStepper from './components/DynamicStepper';
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

  const overrideSettings: Record<string, any> = { room: room || 'PUBLIC' };

  const [formData, setFormData] = useSettingsToFormData<FormData & Partial<Settings>>(
    {
      gameMode: 'online',
      roomRealtime: true,
      actions: [],
      consumption: [],
      role: 'sub',
      boardUpdated: false,
      room: room || 'PUBLIC',
      selectedActions: {},
    },
    overrideSettings
  );

  const { actionsList, isLoading: isActionsLoading } = useUnifiedActionList(formData.gameMode);

  // Note: Removed the useEffect that was syncing URL to formData as it was interfering
  // with wizard selections. The wizard should be independent until form submission.

  const nextStep = (count?: number): void => {
    if (!Number.isInteger(count)) return setStep(step + 1);
    setStep(step + (count || 1));
  };

  const prevStep = (count?: number): void => {
    if (!Number.isInteger(count)) return setStep(step - 1);
    setStep(step - (count || 1));
  };

  const goToAdvanced = (): void => setStep(0);

  const goToSetupWizard = (): void => {
    if (isPublicRoom(formData.room)) {
      setStep(4);
    } else if (formData.gameMode === 'online') {
      setStep(4);
    } else {
      setStep(1);
    }
  };

  const renderStep = (): JSX.Element | null => {
    switch (step) {
      case 1:
        return <RoomStep formData={formData} setFormData={setFormData} nextStep={nextStep} />;
      case 2:
        if (isPublicRoom(formData.room)) {
          setStep(4);
          return null;
        }
        return (
          <LocalPlayersStep
            formData={formData}
            setFormData={setFormData}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        );
      case 3:
        if (isPublicRoom(formData.room)) {
          setStep(4);
          return null;
        }
        return (
          <GameModeStep
            formData={formData}
            setFormData={setFormData}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        );
      case 4:
        return (
          <ActionsStep
            formData={formData}
            setFormData={setFormData}
            nextStep={nextStep}
            prevStep={prevStep}
            actionsList={actionsList}
            isActionsLoading={isActionsLoading}
          />
        );
      case 5:
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

  if (step === 0) return <GameSettings closeDialog={close} onOpenSetupWizard={goToSetupWizard} />;

  return (
    <Box>
      <Box sx={{ width: '100%', mt: 2, mb: 4 }}>
        <DynamicStepper
          currentStep={step}
          isPublicRoom={isPublicRoom(formData.room)}
          onStepClick={setStep}
        />
      </Box>
      {renderStep()}

      <Divider sx={{ mt: 3 }} />

      <Button onClick={goToAdvanced}>
        <Trans i18nKey="advancedSetup" />
      </Button>
    </Box>
  );
}
