import { Box, Button, Divider } from '@mui/material';
import { useEffect, useState } from 'react';

import ActionsStep from './ActionsStep';
import DynamicStepper from './components/DynamicStepper';
import FinishStep from './FinishStep';
import { FormData } from '@/types';
import GameModeStep from './GameModeStep';
import GameSettings from '@/views/GameSettings';
import LocalPlayersStep from './LocalPlayersStep';
import RoomStep from './RoomStep';
import { Settings } from '@/types/Settings';
import { Trans } from 'react-i18next';
import { isPublicRoom } from '@/helpers/strings';
import { useParams } from 'react-router-dom';
import useSettingsToFormData from '@/hooks/useSettingsToFormData';
import useUnifiedActionList from '@/hooks/useUnifiedActionList';
import { useMigration } from '@/context/migration';

interface GameSettingsWizardProps {
  close?: () => void;
}

export default function GameSettingsWizard({ close }: GameSettingsWizardProps) {
  const { id: room } = useParams<{ id: string }>();
  const [step, setStep] = useState<number>(1);
  const { isMigrationInProgress, currentLanguageMigrated } = useMigration();

  // Simple toggle to force useUnifiedActionList to reload when migration completes
  const [reloadToggle, setReloadToggle] = useState(false);

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

  // Toggle when migration completes to force reload
  useEffect(() => {
    if (!isMigrationInProgress && currentLanguageMigrated) {
      setReloadToggle((prev) => !prev);
    }
  }, [isMigrationInProgress, currentLanguageMigrated]);

  const { actionsList, isLoading: isActionsLoading } = useUnifiedActionList(
    formData.gameMode,
    true,
    reloadToggle // This will force reload when migration completes
  );

  // Include migration state in loading condition
  const isActionsLoadingWithMigration = isActionsLoading || isMigrationInProgress;

  // Compute isPublic once per render
  const isPublic = isPublicRoom(formData.room);

  // Handle step redirects for public rooms without causing DOM insertion errors
  useEffect(() => {
    // Only redirect if we're on a step that's invalid for public rooms
    if (isPublic && (step === 2 || step === 3)) {
      setStep(4);
    }
  }, [step, isPublic]);

  // Note: Removed the useEffect that was syncing URL to formData as it was interfering
  // with wizard selections. The wizard should be independent until form submission.

  const nextStep = (count?: number): void => {
    if (!Number.isInteger(count)) return setStep(step + 1);
    setStep(step + (count || 1));
  };

  // Guarded step click handler to prevent navigation to invalid steps for public rooms
  const handleStepClick = (targetStep: number): void => {
    // Prevent advancing to steps 2 or 3 when in public room
    if (isPublic && (targetStep === 2 || targetStep === 3)) {
      return;
    }
    setStep(targetStep);
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
    const isPublic = isPublicRoom(formData.room);

    switch (step) {
      case 1:
        return <RoomStep formData={formData} setFormData={setFormData} nextStep={nextStep} />;
      case 2:
        // Never render steps 2 or 3 for public rooms
        // The useEffect above handles the redirect
        if (isPublic) {
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
        // Never render steps 2 or 3 for public rooms
        // The useEffect above handles the redirect
        if (isPublic) {
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
            isActionsLoading={isActionsLoadingWithMigration}
            isMigrationInProgress={isMigrationInProgress}
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
        <DynamicStepper currentStep={step} isPublicRoom={isPublic} onStepClick={handleStepClick} />
      </Box>
      {renderStep()}

      <Divider sx={{ mt: 3 }} />

      <Button onClick={goToAdvanced}>
        <Trans i18nKey="advancedSetup" />
      </Button>
    </Box>
  );
}
