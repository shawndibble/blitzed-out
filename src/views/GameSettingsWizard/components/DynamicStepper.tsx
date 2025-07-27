import { Step, StepLabel, Stepper, useMediaQuery, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface DynamicStepperProps {
  currentStep: number;
  isPublicRoom: boolean;
}

export default function DynamicStepper({ currentStep, isPublicRoom }: DynamicStepperProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Public Room: 3 steps (Room → Actions → Finish)
  // Private Room: 4 steps (Room → Game Mode → Actions → Finish)
  const steps = isPublicRoom
    ? [
        t('roomSelection', 'Room Selection'),
        t('actionsSelection', 'Actions Selection'),
        t('finishSetup', 'Finish Setup'),
      ]
    : [
        t('roomSelection', 'Room Selection'),
        t('gameModeSelection', 'Game Mode Selection'),
        t('actionsSelection', 'Actions Selection'),
        t('finishSetup', 'Finish Setup'),
      ];

  // Adjust current step for public rooms
  // For public rooms, step 2 (GameMode) is skipped, so:
  // Wizard step 3 (Actions) becomes stepper step 2
  // Wizard step 4 (Finish) becomes stepper step 3
  const getStepperStep = (wizardStep: number): number => {
    if (isPublicRoom) {
      switch (wizardStep) {
        case 1:
          return 0; // Room step
        case 3:
          return 1; // Actions step (skipping GameMode)
        case 4:
          return 2; // Finish step
        default:
          return 0;
      }
    }
    return wizardStep - 1; // Default 1-based to 0-based conversion
  };

  const activeStep = getStepperStep(currentStep);

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
      {steps.map((label, index) => (
        <Step key={index}>
          <StepLabel>{!isMobile ? label : ''}</StepLabel>
        </Step>
      ))}
    </Stepper>
  );
}
