import { describe, expect, it } from 'vitest';
import { parseFinishLines, pickFinishResult } from '../finishResult';
import { randomOf, sequenceSource, setRandomSource } from '@/services/random';

const TILE = ['Nothing 20', 'Something 30', 'Everything 50'];

describe('parseFinishLines', () => {
  it('reads a trailing weight separated by a space', () => {
    expect(parseFinishLines(TILE)).toEqual([
      ['Nothing', '20'],
      ['Something', '30'],
      ['Everything', '50'],
    ]);
  });

  it('reads a colon-separated weight too, and drops blank lines', () => {
    expect(parseFinishLines(['Kiss: 40', '', 'Tell 60'])).toEqual([
      ['Kiss', '40'],
      ['Tell', '60'],
    ]);
  });

  it('weights an unparseable line 0 rather than dropping its label', () => {
    expect(parseFinishLines(['Just a label'])).toEqual([['Just a label', '0']]);
  });
});

describe('pickFinishResult', () => {
  it('weights each label by its percentage', () => {
    // 100 slots: 0-19 Nothing, 20-49 Something, 50-99 Everything.
    const at = (slot: number) => pickFinishResult(TILE, (items) => items[slot]);

    expect(at(0)).toBe('Nothing');
    expect(at(19)).toBe('Nothing');
    expect(at(20)).toBe('Something');
    expect(at(49)).toBe('Something');
    expect(at(50)).toBe('Everything');
    expect(at(99)).toBe('Everything');
  });

  it('never picks a zero-weight line', () => {
    const results = new Set<string>();
    for (let slot = 0; slot < 100; slot++) {
      results.add(pickFinishResult(['Never 0', 'Always 100'], (items) => items[slot]));
    }
    expect([...results]).toEqual(['Always']);
  });

  it('yields nothing when every line is weightless', () => {
    expect(pickFinishResult(['A 0', 'B 0'])).toBe('');
    expect(pickFinishResult([])).toBe('');
  });

  it('runs off the injected random source, not the global', () => {
    const restore = setRandomSource(sequenceSource([0.9]));
    try {
      // 0.9 of 100 weighted slots → index 90 → the 50%-weighted label.
      expect(pickFinishResult(TILE, randomOf)).toBe('Everything');
    } finally {
      restore();
    }
  });
});
