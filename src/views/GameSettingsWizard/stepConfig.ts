/**
 * Shared wizard step configuration
 * This ensures analytics and UI use the same step names and ordering
 */
export const WIZARD_STEPS = {
  0: 'advanced_settings',
  1: 'room_setup',
  2: 'local_players',
  3: 'game_mode',
  4: 'actions',
  5: 'finish',
} as const;

export type WizardStep = keyof typeof WIZARD_STEPS;
export type WizardStepName = (typeof WIZARD_STEPS)[WizardStep];

/**
 * Get the step name for analytics tracking
 */
export function getWizardStepName(stepNumber: number): string {
  return WIZARD_STEPS[stepNumber as WizardStep] || `step_${stepNumber}`;
}
