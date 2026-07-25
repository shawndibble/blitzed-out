/**
 * Room URL for the back button. Carries resumeStep back if Advanced was
 * reached via the wizard's "Advanced Setup" link, so the wizard reopens at
 * the step the user left instead of restarting at step 1.
 */
export function buildReturnToRoomUrl(room: string, resumeStep: string | null): string {
  return resumeStep ? `/${room}?resumeStep=${resumeStep}` : `/${room}`;
}
