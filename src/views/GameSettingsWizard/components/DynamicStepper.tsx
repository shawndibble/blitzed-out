import { Step, StepLabel, Stepper, useMediaQuery, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { GameMode } from '@/types/Settings';

interface DynamicStepperProps {
  currentStep: number;
  gameMode?: GameMode;
  onStepClick?: (step: number) => void;
}

export default function DynamicStepper({
  currentStep,
  gameMode,
  onStepClick,
}: DynamicStepperProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const resolvedGameMode = gameMode ?? 'solo';

  const playerDetailsStep =
    resolvedGameMode === 'local'
      ? { label: String(t('localPlayersStep.title', 'Local Players')), wizardStep: 2 }
      : { label: String(t('roomSelection', 'Room Selection')), wizardStep: 2 };

  const steps = [
    { label: String(t('playerTopology.stepLabel', 'Player Setup')), wizardStep: 1 },
    ...(resolvedGameMode === 'solo' ? [] : [playerDetailsStep]),
    { label: String(t('gameModeSelection', 'Game Mode Selection')), wizardStep: 3 },
    { label: String(t('actionsSelection', 'Actions Selection')), wizardStep: 4 },
    { label: String(t('finishSetup', 'Finish Setup')), wizardStep: 5 },
  ];

  // Find which stepper step corresponds to current wizard step
  const activeStep = steps.findIndex((step) => step.wizardStep === currentStep);

  const handleStepClick = (stepperIndex: number) => {
    if (onStepClick) {
      const wizardStep = steps[stepperIndex].wizardStep;
      onStepClick(wizardStep);
    }
  };

  return (
    <Stepper
      activeStep={activeStep}
      alternativeLabel={!isMobile}
      orientation="horizontal"
      sx={{
        ...(isMobile && {
          '& .MuiStepLabel-label': {
            display: 'none',
          },
        }),
      }}
    >
      {steps.map((step, index) => (
        <Step key={index}>
          <StepLabel
            onClick={() => handleStepClick(index)}
            sx={{
              cursor: onStepClick ? 'pointer' : 'default',
              '&:hover': onStepClick
                ? {
                    '& .MuiStepLabel-label': {
                      color: 'primary.main',
                    },
                  }
                : {},
            }}
          >
            {!isMobile ? step.label : null}
          </StepLabel>
        </Step>
      ))}
    </Stepper>
  );
}
