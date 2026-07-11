import { describe, expect, it } from 'vitest';
import { resolveFinishOutcome } from '@/helpers/finishOutcome';

const labels = { cum: 'Normal Orgasm', ruined: 'Ruined Orgasm', noCum: 'No Orgasm' };

describe('resolveFinishOutcome', () => {
  it('resolves each outcome label to its key', () => {
    expect(resolveFinishOutcome('Normal Orgasm', labels)).toBe('cum');
    expect(resolveFinishOutcome('Ruined Orgasm', labels)).toBe('ruined');
    expect(resolveFinishOutcome('No Orgasm', labels)).toBe('noCum');
  });

  it('tolerates whitespace from extractAction and case drift', () => {
    expect(resolveFinishOutcome(' Ruined Orgasm ', labels)).toBe('ruined');
    expect(resolveFinishOutcome('no orgasm', labels)).toBe('noCum');
  });

  it('returns null for unknown or empty text', () => {
    expect(resolveFinishOutcome('Custom finish text', labels)).toBeNull();
    expect(resolveFinishOutcome('', labels)).toBeNull();
    expect(resolveFinishOutcome(undefined, labels)).toBeNull();
  });

  it('resolves localized labels', () => {
    const es = { cum: 'Orgasmo normal', ruined: 'Orgasmo arruinado', noCum: 'Sin orgasmo' };
    expect(resolveFinishOutcome('Orgasmo arruinado', es)).toBe('ruined');
  });
});
