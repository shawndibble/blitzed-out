import { describe, expect, test } from 'vitest';
import { selectCandidateTypes } from '@/services/candidatePair';

function report(entries: Record<string, Record<string, unknown>>) {
  const map = new Map(Object.entries(entries));
  return {
    forEach: (callback: (value: Record<string, unknown>) => void) => map.forEach(callback),
    get: (id: string) => map.get(id),
  };
}

describe('selectCandidateTypes', () => {
  test('follows the transport report to the pair the connection is using', () => {
    const types = selectCandidateTypes(
      report({
        transport: { type: 'transport', selectedCandidatePairId: 'chosen' },
        other: {
          type: 'candidate-pair',
          state: 'succeeded',
          localCandidateId: 'host-local',
          remoteCandidateId: 'host-remote',
        },
        chosen: {
          type: 'candidate-pair',
          state: 'succeeded',
          localCandidateId: 'relay-local',
          remoteCandidateId: 'relay-remote',
        },
        'host-local': { candidateType: 'host' },
        'host-remote': { candidateType: 'host' },
        'relay-local': { candidateType: 'relay' },
        'relay-remote': { candidateType: 'srflx' },
      })
    );

    expect(types).toEqual({ local: 'relay', remote: 'srflx' });
  });

  // Several pairs sit at `succeeded` while only one is nominated. Reporting the
  // first would say `host` for a call that is actually relaying — inverting the
  // one measurement worth having.
  test('prefers the nominated pair over any other succeeded pair', () => {
    const types = selectCandidateTypes(
      report({
        first: {
          type: 'candidate-pair',
          state: 'succeeded',
          localCandidateId: 'a',
          remoteCandidateId: 'a',
        },
        second: {
          type: 'candidate-pair',
          state: 'succeeded',
          nominated: true,
          localCandidateId: 'b',
          remoteCandidateId: 'b',
        },
        a: { candidateType: 'host' },
        b: { candidateType: 'relay' },
      })
    );

    expect(types).toEqual({ local: 'relay', remote: 'relay' });
  });

  // `selected` is legacy Firefox for the same thing.
  test('accepts the legacy selected flag', () => {
    const types = selectCandidateTypes(
      report({
        first: {
          type: 'candidate-pair',
          state: 'succeeded',
          localCandidateId: 'a',
          remoteCandidateId: 'a',
        },
        second: {
          type: 'candidate-pair',
          state: 'succeeded',
          selected: true,
          localCandidateId: 'b',
          remoteCandidateId: 'b',
        },
        a: { candidateType: 'host' },
        b: { candidateType: 'relay' },
      })
    );

    expect(types).toEqual({ local: 'relay', remote: 'relay' });
  });

  test('falls back to a succeeded pair when nothing is nominated', () => {
    const types = selectCandidateTypes(
      report({
        only: {
          type: 'candidate-pair',
          state: 'succeeded',
          localCandidateId: 'a',
          remoteCandidateId: 'a',
        },
        a: { candidateType: 'prflx' },
      })
    );

    expect(types).toEqual({ local: 'prflx', remote: 'prflx' });
  });

  test('ignores pairs that never succeeded', () => {
    expect(
      selectCandidateTypes(
        report({
          failed: { type: 'candidate-pair', state: 'failed', localCandidateId: 'a' },
          a: { candidateType: 'relay' },
        })
      )
    ).toBeNull();
  });

  test('reports nothing for an empty report', () => {
    expect(selectCandidateTypes(report({}))).toBeNull();
  });
});
