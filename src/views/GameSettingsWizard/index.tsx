import { useEffect, useRef, useState } from 'react';

import ActionsStep from './ActionsStep';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import DynamicStepper from './components/DynamicStepper';
import FinishStep from './FinishStep';
import { FormData } from '@/types';
import GameModeStep from './GameModeStep';
import GameSettings from '@/views/GameSettings';
import LocalPlayersStep from './LocalPlayersStep';
import PlayerTopologyStep from './PlayerTopologyStep';
import RoomStep from './RoomStep';
import { Settings } from '@/types/Settings';
import { Trans } from 'react-i18next';
import { isPublicRoom, usesSoloActions } from '@/helpers/strings';
import { useMigration } from '@/context/migration';
import { useParams, useSearchParams } from 'react-router-dom';
import useSettingsToFormData from '@/hooks/useSettingsToFormData';
import useUnifiedActionList from '@/hooks/useUnifiedActionList';
import { useWizardAnalytics } from '@/hooks/useWizardAnalytics';

interface GameSettingsWizardProps {
  close?: () => void;
}

export default function GameSettingsWizard({ close }: GameSettingsWizardProps) {
  const { id: room } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const joinAtStep = searchParams.get('step') === '2';
  const [step, setStep] = useState<number>(joinAtStep ? 2 : 1);
  const { isMigrationInProgress, currentLanguageMigrated } = useMigration();

  // Simple toggle to force useUnifiedActionList to reload when migration completes
  const [reloadToggle, setReloadToggle] = useState(false);

  // One-shot guard to prevent multiple reload triggers
  const hasReloadedRef = useRef(false);
  // Track previous migration state to detect transitions
  const prevIsMigrationInProgressRef = useRef(isMigrationInProgress);

  const overrideSettings: Record<string, any> = {
    room: room || 'PUBLIC',
    ...(joinAtStep && { gameMode: 'online' }),
  };

  const [formData, setFormData] = useSettingsToFormData<FormData & Partial<Settings>>(
    {
      gameMode: 'solo',
      roomRealtime: true,
      actions: [],
      consumption: [],
      role: 'sub',
      gender: 'non-binary',
      boardUpdated: false,
      room: room || 'PUBLIC',
      selectedActions: {},
    },
    overrideSettings
  );

  // Toggle when migration completes to force reload (with one-shot guard)
  useEffect(() => {
    const prevIsMigrationInProgress = prevIsMigrationInProgressRef.current;

    if (prevIsMigrationInProgress !== isMigrationInProgress) {
      // Only trigger reload on transition from migration in-progress → finished
      if (
        prevIsMigrationInProgress === true &&
        isMigrationInProgress === false &&
        currentLanguageMigrated &&
        !hasReloadedRef.current
      ) {
        queueMicrotask(() => {
          setReloadToggle((prev) => !prev);
        });
        hasReloadedRef.current = true;
      }

      // Reset the guard when a new migration starts so reload can happen again
      if (isMigrationInProgress && hasReloadedRef.current) {
        hasReloadedRef.current = false;
      }

      // Update previous state for next render
      prevIsMigrationInProgressRef.current = isMigrationInProgress;
    }
  }, [isMigrationInProgress, currentLanguageMigrated]);

  const isSoloPlay = usesSoloActions(formData.gameMode, formData.soloPlay);
  const contentGameMode = isSoloPlay ? 'online' : 'local';

  // Clear selected actions when the play context changes (different content becomes available)
  const prevContentGameMode = useRef(contentGameMode);
  const prevIsSoloPlay = useRef(isSoloPlay);
  const prevIsNaked = useRef(formData.isNaked);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const modeChanged =
      prevContentGameMode.current !== contentGameMode ||
      prevIsSoloPlay.current !== isSoloPlay ||
      (contentGameMode === 'local' && prevIsNaked.current !== formData.isNaked);

    if (modeChanged && Object.keys(formData.selectedActions || {}).length > 0) {
      setFormData((prev) => ({ ...prev, selectedActions: {} }));
    }
    prevContentGameMode.current = contentGameMode;
    prevIsSoloPlay.current = isSoloPlay;
    prevIsNaked.current = formData.isNaked;
  }, [contentGameMode, isSoloPlay, formData.isNaked]);

  const { actionsList, isLoading: isActionsLoading } = useUnifiedActionList(
    contentGameMode,
    true,
    reloadToggle // This will force reload when migration completes
  );

  // Include migration state in loading condition
  const isActionsLoadingWithMigration = isActionsLoading || isMigrationInProgress;

  // Analytics tracking for wizard funnel
  const { trackScreenView } = useWizardAnalytics({
    gameMode: formData.gameMode,
    isPublicRoom: isPublicRoom(formData.room || 'PUBLIC'),
  });

  // One screen-view per step entered (including the initial screen)
  useEffect(() => {
    if (step > 0) {
      trackScreenView(step);
    }
  }, [step, trackScreenView]);

  const nextStep = (count?: number): void => {
    const newStep = !Number.isInteger(count) ? step + 1 : step + (count || 1);
    setStep(newStep);
  };

  const handleStepClick = (targetStep: number): void => {
    const normalizedTargetStep = formData.gameMode === 'solo' && targetStep === 2 ? 3 : targetStep;
    setStep(normalizedTargetStep);
  };

  const prevStep = (count?: number): void => {
    if (!Number.isInteger(count)) return setStep(step - 1);
    setStep(step - (count || 1));
  };

  const goToAdvanced = (): void => setStep(0);

  const goToSetupWizard = (): void => {
    setStep(1);
  };

  const renderStep = (): JSX.Element | null => {
    switch (step) {
      case 1:
        return (
          <PlayerTopologyStep formData={formData} setFormData={setFormData} nextStep={nextStep} />
        );
      case 2:
        if (formData.gameMode === 'online') {
          return (
            <RoomStep
              formData={formData}
              setFormData={setFormData}
              nextStep={nextStep}
              prevStep={prevStep}
            />
          );
        }

        if (formData.gameMode === 'local') {
          return (
            <LocalPlayersStep
              formData={formData}
              setFormData={setFormData}
              nextStep={nextStep}
              prevStep={prevStep}
            />
          );
        }

        return null;
      case 3:
        return (
          <GameModeStep
            formData={formData}
            setFormData={setFormData}
            nextStep={nextStep}
            prevStep={formData.gameMode === 'solo' ? () => prevStep(2) : prevStep}
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
        <DynamicStepper
          currentStep={step}
          gameMode={formData.gameMode}
          onStepClick={handleStepClick}
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
