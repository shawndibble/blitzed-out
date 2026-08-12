/**
 * Which candidate types actually carried a connection.
 *
 * `relay` on either end means TURN did the work — the one measurement that says
 * whether relay capacity is the reason a user cannot see anyone.
 */
export interface CandidateTypes {
  local?: RTCIceCandidateType;
  remote?: RTCIceCandidateType;
}

interface StatsLike {
  forEach: (callback: (report: Record<string, unknown>) => void) => void;
  get: (id: string) => Record<string, unknown> | undefined;
}

/**
 * Pick the nominated candidate pair out of a stats report and name both ends.
 *
 * Several pairs can sit at `succeeded` while only one is nominated, and
 * `selected` is legacy Firefox. Taking the first match reports `host` for calls
 * that are actually relaying — inverting the one measurement worth having.
 */
export function selectCandidateTypes(stats: StatsLike): CandidateTypes | null {
  let transportPairId: string | undefined;
  let nominated: Record<string, unknown> | undefined;
  let fallback: Record<string, unknown> | undefined;

  stats.forEach((report) => {
    if (report.type === 'transport' && typeof report.selectedCandidatePairId === 'string') {
      transportPairId = report.selectedCandidatePairId;
    } else if (report.type === 'candidate-pair' && report.state === 'succeeded') {
      if (report.nominated || report.selected) nominated ??= report;
      fallback ??= report;
    }
  });

  const selected = (transportPairId && stats.get(transportPairId)) || nominated || fallback;
  if (!selected) return null;

  const localId = selected.localCandidateId;
  const remoteId = selected.remoteCandidateId;

  return {
    local:
      typeof localId === 'string'
        ? (stats.get(localId)?.candidateType as RTCIceCandidateType | undefined)
        : undefined,
    remote:
      typeof remoteId === 'string'
        ? (stats.get(remoteId)?.candidateType as RTCIceCandidateType | undefined)
        : undefined,
  };
}
