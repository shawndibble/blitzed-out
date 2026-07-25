import { describe, expect, it } from 'vitest';
import { insertPlaceholderToken } from './insertPlaceholderToken';

const MAX = 2000;

describe('insertPlaceholderToken', () => {
  it('inserts into empty text', () => {
    expect(insertPlaceholderToken('', 0, 0, '{player}', MAX)).toEqual({
      text: '{player}',
      caret: 8,
      clamped: false,
    });
  });

  it('appends at end when caret is unknown', () => {
    expect(insertPlaceholderToken('Kiss', null, null, '{player}', MAX)).toEqual({
      text: 'Kiss {player}',
      caret: 13,
      clamped: false,
    });
  });

  it('adds a leading space when the previous char is not whitespace', () => {
    const result = insertPlaceholderToken('Kiss', 4, 4, '{player}', MAX);
    expect(result.text).toBe('Kiss {player}');
    expect(result.caret).toBe(13);
  });

  it('does not double the space when one already exists', () => {
    expect(insertPlaceholderToken('Kiss ', 5, 5, '{player}', MAX)).toEqual({
      text: 'Kiss {player}',
      caret: 13,
      clamped: false,
    });
  });

  it('adds a trailing space when inserting before a word', () => {
    const result = insertPlaceholderToken('Kiss hard', 5, 5, '{player}', MAX);
    expect(result.text).toBe('Kiss {player} hard');
    expect(result.caret).toBe(14);
  });

  it('skips the trailing space before punctuation', () => {
    const result = insertPlaceholderToken('Kiss .', 5, 5, '{player}', MAX);
    expect(result.text).toBe('Kiss {player}.');
    expect(result.caret).toBe(13);
  });

  it('skips the leading space right after an opener', () => {
    const result = insertPlaceholderToken('Kiss (', 6, 6, '{player}', MAX);
    expect(result.text).toBe('Kiss ({player}');
    expect(result.caret).toBe(14);
  });

  it('inserts at the start without a leading space', () => {
    const result = insertPlaceholderToken('kisses back', 0, 0, '{dom}', MAX);
    expect(result.text).toBe('{dom} kisses back');
    expect(result.caret).toBe(6);
  });

  it('replaces the current selection', () => {
    const result = insertPlaceholderToken('Kiss Mike hard', 5, 9, '{sub}', MAX);
    expect(result.text).toBe('Kiss {sub} hard');
    expect(result.caret).toBe(10);
  });

  it('is a no-op when the result would exceed maxLength', () => {
    const text = 'a'.repeat(MAX - 3);
    expect(insertPlaceholderToken(text, text.length, text.length, '{player}', MAX)).toEqual({
      text,
      caret: text.length,
      clamped: true,
    });
  });

  it('clamps out-of-range selections', () => {
    const result = insertPlaceholderToken('Kiss', 99, 120, '{player}', MAX);
    expect(result.text).toBe('Kiss {player}');
    expect(result.caret).toBe(13);
  });

  it('normalizes a reversed selection', () => {
    const result = insertPlaceholderToken('Kiss Mike hard', 9, 5, '{sub}', MAX);
    expect(result.text).toBe('Kiss {sub} hard');
    expect(result.caret).toBe(10);
  });
});
