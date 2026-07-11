export type FinishOutcome = 'cum' | 'ruined' | 'noCum';

export interface FinishOutcomeLabels {
  cum: string;
  ruined: string;
  noCum: string;
}

/**
 * Maps the rolled finish-tile action text back to its outcome key by comparing
 * against the localized labels the roll was generated from. Returns null for
 * unrecognized text (e.g. imported boards with custom finish tiles).
 */
export function resolveFinishOutcome(
  actionText: string | undefined,
  labels: FinishOutcomeLabels
): FinishOutcome | null {
  const text = actionText?.trim().toLowerCase();
  if (!text) return null;

  const entries: [FinishOutcome, string][] = [
    ['cum', labels.cum],
    ['ruined', labels.ruined],
    ['noCum', labels.noCum],
  ];

  for (const [outcome, label] of entries) {
    if (text === label.trim().toLowerCase()) return outcome;
  }
  return null;
}
