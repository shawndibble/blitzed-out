import { Step, StepLabel, Stepper, useMediaQuery, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface DynamicStepperProps {
  currentStep: number;
  isPublicRoom: boolean;
  onStepClick?: (step: number) => void;
}

export default function DynamicStepper({
  currentStep,
  isPublicRoom,
  onStepClick,
}: DynamicStepperProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Public Room: 3 steps (Room → Actions → Finish)
  // Private Room: 5 steps (Room → Local Players → Game Mode → Actions → Finish)
  const steps = isPublicRoom
    ? [
        { label: String(t('roomSelection', 'Room Selection')), wizardStep: 1 },
        { label: String(t('actionsSelection', 'Actions Selection')), wizardStep: 4 },
        { label: String(t('finishSetup', 'Finish Setup')), wizardStep: 5 },
      ]
    : [
        { label: String(t('roomSelection', 'Room Selection')), wizardStep: 1 },
        { label: String(t('localPlayersStep.title', 'Local Players')), wizardStep: 2 },
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
