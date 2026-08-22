import type { TFunction } from 'i18next';

/**
 * Append the participant count to a control's accessible name.
 *
 * The count is drawn by a `Badge`, and an `aria-label` on the control replaces
 * everything inside it — so without this the only rendered copy of the number is
 * invisible to screen readers.
 */
export function withParticipantCount(label: string, count: number, t: TFunction): string {
  if (count <= 0) return label;
  return `${label}, ${t('videoCall.onCall', { count })}`;
}
