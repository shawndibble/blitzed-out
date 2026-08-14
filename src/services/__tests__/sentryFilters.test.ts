import { describe, expect, it } from 'vitest';

import { isInjectedScriptStackOverflow, isOpaqueStacklessError } from '@/services/sentryFilters';

/** Minimal stand-in for the slice of Sentry.ErrorEvent these predicates read. */
function event(type: string, value: string, filenames?: (string | undefined)[]) {
  return {
    exception: {
      values: [
        {
          type,
          value,
          ...(filenames
            ? { stacktrace: { frames: filenames.map((filename) => ({ filename })) } }
            : {}),
        },
      ],
    },
  };
}

describe('isOpaqueStacklessError', () => {
  // Every `new Error()` in src/ takes an English string literal, so a stackless two-character
  // message cannot have come from our code.
  it('drops a two-character message with no frames', () => {
    expect(isOpaqueStacklessError(event('Error', 'Ba'))).toBe(true);
  });

  it.each(['A', 'Ba', 'Gk1'])('drops the short token %s', (value) => {
    expect(isOpaqueStacklessError(event('Error', value))).toBe(true);
  });

  it('keeps a token longer than three characters', () => {
    expect(isOpaqueStacklessError(event('Error', 'Boom'))).toBe(false);
  });

  it('keeps a short message that has frames to investigate', () => {
    expect(isOpaqueStacklessError(event('Error', 'Ba', ['/js/index.tsx-abc.js']))).toBe(false);
  });

  it('drops a short message whose frame list is empty', () => {
    // An empty `frames` array carries no more information than no stacktrace at all.
    expect(isOpaqueStacklessError(event('Error', 'Ba', []))).toBe(true);
  });

  it('keeps a named exception type, which is already identifiable', () => {
    expect(isOpaqueStacklessError(event('FirebaseError', 'Ba'))).toBe(false);
  });

  it("keeps the minified 'bb' error the boundary tags for context", () => {
    // errorPatterns tags 'bb' for debugging context rather than suppressing it. That decision
    // survives: the boundary reports through captureException, so those events carry frames.
    expect(isOpaqueStacklessError(event('Error', 'bb', ['/js/index.tsx-abc.js']))).toBe(false);
  });

  it.each(['', 'Ba ', 'B a', 'B.', '4xx'])('keeps the non-token value %j', (value) => {
    expect(isOpaqueStacklessError(event('Error', value))).toBe(false);
  });

  it('ignores an event with no exception', () => {
    expect(isOpaqueStacklessError({})).toBe(false);
  });
});

describe('isInjectedScriptStackOverflow', () => {
  // Our chunks live under /assets/ and /js/; frames attributed to the document (or to nothing)
  // come from script the browser injected, e.g. Google Translate.
  it('drops an overflow whose frames are attributed to the document', () => {
    expect(
      isInjectedScriptStackOverflow(
        event('RangeError', 'Maximum call stack size exceeded.', ['/PUBLIC', '/PUBLIC'])
      )
    ).toBe(true);
  });

  it('drops an overflow with an unattributed frame', () => {
    expect(
      isInjectedScriptStackOverflow(
        event('RangeError', 'Maximum call stack size exceeded.', [undefined])
      )
    ).toBe(true);
  });

  it('keeps an overflow with no stacktrace at all', () => {
    // Absence of frames is not evidence of foreign origin.
    expect(
      isInjectedScriptStackOverflow(event('RangeError', 'Maximum call stack size exceeded.'))
    ).toBe(false);
  });

  it.each(['/assets/index-C4WnDTlG.js', '/js/chunk-7ySIje9z.js'])(
    'keeps an overflow with a frame in our own bundle (%s)',
    (filename) => {
      expect(
        isInjectedScriptStackOverflow(
          event('RangeError', 'Maximum call stack size exceeded.', ['/PUBLIC', filename])
        )
      ).toBe(false);
    }
  );

  it('keeps a non-overflow RangeError', () => {
    expect(
      isInjectedScriptStackOverflow(event('RangeError', 'Invalid array length', ['/PUBLIC']))
    ).toBe(false);
  });

  it('keeps a different error type with the same message', () => {
    expect(
      isInjectedScriptStackOverflow(
        event('Error', 'Maximum call stack size exceeded.', ['/PUBLIC'])
      )
    ).toBe(false);
  });

  it('ignores an event with no exception', () => {
    expect(isInjectedScriptStackOverflow({})).toBe(false);
  });
});
