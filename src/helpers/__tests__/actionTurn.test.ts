import { describe, expect, it } from 'vitest';
import { decodeLegacyActionText, getTurnFields } from '../actionTurn';
import { ActionsMessage } from '@/types/Message';

const T = { finishWord: 'FINISH', startWord: 'START' };

describe('decodeLegacyActionText', () => {
  it('recovers the full description even when it contains a colon (defect 1)', () => {
    // Real shipped hi/online-style tile: "Roll: N\n#N: title\nAction: बात करो: कुछ बोलो"
    const text = 'Roll: 3\n#5: शीर्षक\nAction: बात करो: कुछ बोलो';
    const fields = decodeLegacyActionText(text, T);

    expect(fields.description).toBe('बात करो: कुछ बोलो');
  });

  it('parses the 0-indexed location and title from the #N: line', () => {
    const text = 'Roll: 2\n#7: Spanking\nAction: 10 swats';
    const fields = decodeLegacyActionText(text, T);

    expect(fields.location).toBe(6);
    expect(fields.title).toBe('Spanking');
    expect(fields.description).toBe('10 swats');
  });

  it('marks finished via the finish word, matching old substring behavior', () => {
    const text = '#40: FINISH\nAction: cum';
    expect(decodeLegacyActionText(text, T).finished).toBe(true);
    expect(decodeLegacyActionText('#3: Spanking\nAction: spank', T).finished).toBe(false);
  });

  it('marks restart via the start word', () => {
    const text = 'Returning to start\n#1: START\nAction: START';
    expect(decodeLegacyActionText(text, T).kind).toBe('restart');
  });

  it('handles a 4-line already-finished message without misreading roll as title (defect 2)', () => {
    const text = 'You already finished. Starting over.\nRoll: 5\n#40: FINISH\nAction: cum';
    const fields = decodeLegacyActionText(text, T);

    expect(fields.location).toBe(39);
    expect(fields.title).toBe('FINISH');
    expect(fields.description).toBe('cum');
    expect(fields.finished).toBe(true);
  });

  it('tolerates a message missing the action line entirely', () => {
    const fields = decodeLegacyActionText('Roll: 3', T);
    expect(fields.location).toBe(0);
    expect(fields.title).toBe('');
  });
});

describe('getTurnFields', () => {
  const baseMessage = {
    text: '#3: Spanking\nAction: spank',
  } as Pick<ActionsMessage, 'text' | 'turn'>;

  it('prefers carried turn fields over decoding text', () => {
    const withTurn: Pick<ActionsMessage, 'text' | 'turn'> = {
      ...baseMessage,
      turn: {
        kind: 'normal',
        roll: 2,
        location: 99,
        title: 'Carried Title',
        description: 'Carried Description',
        finished: true,
      },
    };

    expect(getTurnFields(withTurn, T)).toEqual(withTurn.turn);
  });

  it('falls back to legacy decoding when turn is absent', () => {
    expect(getTurnFields(baseMessage, T)).toEqual({
      kind: 'normal',
      roll: null,
      location: 2,
      title: 'Spanking',
      description: 'spank',
      finished: false,
    });
  });
});
