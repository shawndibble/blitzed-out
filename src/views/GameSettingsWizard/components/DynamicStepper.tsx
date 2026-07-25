import { Step, StepLabel, Stepper, useMediaQuery, useTheme } from '@mui/material';

export interface DynamicStepperStep {
  label: string;
  wizardStep: number;
}

interface DynamicStepperProps {
  steps: DynamicStepperStep[];
  activeStep: number;
  onStepClick?: (wizardStep: number) => void;
}

/**
 * Purely presentational: draws a stepper for whatever step list and active
 * index it's given. Which steps exist for a topology, and which one is
 * active, are the caller's concern (see wizardFlow.ts) — this component owns
 * no flow-graph knowledge.
 */
export default function DynamicStepper({ steps, activeStep, onStepClick }: DynamicStepperProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleStepClick = (stepperIndex: number) => {
    onStepClick?.(steps[stepperIndex].wizardStep);
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
        <Step key={step.wizardStep}>
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
