import { describe, expect, it } from 'vitest';

import {
  isInjectedScriptStackOverflow,
  isOpaqueInjectedScriptError,
  isProxyRewrittenHostCall,
} from '@/services/sentryFilters';

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

describe('isOpaqueInjectedScriptError', () => {
  // Every `new Error()` in src/ takes an English string literal, so a stackless two-character
  // message cannot have come from our code.
  it('drops a two-character message with no frames', () => {
    expect(isOpaqueInjectedScriptError(event('Error', 'Ba'))).toBe(true);
  });

  it.each(['A', 'Ba', 'Gk1'])('drops the short token %s', (value) => {
    expect(isOpaqueInjectedScriptError(event('Error', value))).toBe(true);
  });

  it('keeps a token longer than three characters', () => {
    expect(isOpaqueInjectedScriptError(event('Error', 'Boom'))).toBe(false);
  });

  it.each(['/js/index.tsx-abc.js', '/assets/index-C4WnDTlG.js'])(
    'keeps a short message with a frame in our own bundle (%s)',
    (filename) => {
      expect(isOpaqueInjectedScriptError(event('Error', 'Ba', [filename]))).toBe(false);
    }
  );

  it('keeps a short message with a mix of foreign and own-bundle frames', () => {
    // The realistic shape of a genuine app error that also picked up an injected-script frame.
    expect(
      isOpaqueInjectedScriptError(event('Error', 'Ba', ['/3MA91/settings', '/js/chunk-abc.js']))
    ).toBe(false);
  });

  it('drops a short message whose frame list is empty', () => {
    // An empty `frames` array carries no more information than no stacktrace at all.
    expect(isOpaqueInjectedScriptError(event('Error', 'Ba', []))).toBe(true);
  });

  // `La`/`/3MA91/settings` x3 is the live-observed shape (Google's in-app browser, 2026-09).
  it('drops a short message whose frames are attributed to the current route', () => {
    expect(
      isOpaqueInjectedScriptError(
        event('Error', 'La', ['/3MA91/settings', '/3MA91/settings', '/3MA91/settings'])
      )
    ).toBe(true);
  });

  it('keeps a named exception type, which is already identifiable', () => {
    expect(isOpaqueInjectedScriptError(event('FirebaseError', 'Ba'))).toBe(false);
  });

  it("keeps the minified 'bb' error the boundary tags for context", () => {
    // errorPatterns tags 'bb' for debugging context rather than suppressing it. That decision
    // survives: the boundary reports through captureException, so those events carry frames.
    expect(isOpaqueInjectedScriptError(event('Error', 'bb', ['/js/index.tsx-abc.js']))).toBe(false);
  });

  it.each(['', 'Ba ', 'B a', 'B.', '4xx'])('keeps the non-token value %j', (value) => {
    expect(isOpaqueInjectedScriptError(event('Error', value))).toBe(false);
  });

  it('ignores an event with no exception', () => {
    expect(isOpaqueInjectedScriptError({})).toBe(false);
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

/** Both came from one session, so they share a prefix; the base64 tail is the original URL. */
const PROXIED_GAPI = '/__av/AWqXWKQcJqVqwPNOxJUudo-oW0k8aHR0cHM6Ly9hcGlzLmdvb2dsZS5jb20';
const PROXIED_GTAG = '/__av/AWqXWKSd9nMtGSRMocrda35FI9UoaHR0cHM6Ly93d3cuZ29vZ2xldGFn';

describe('isProxyRewrittenHostCall', () => {
  // Firebase Auth's gapi iframe loader.
  it('drops a Window.setTimeout call with a proxy frame beside one of ours', () => {
    expect(
      isProxyRewrittenHostCall(
        event('TypeError', 'Can only call Window.setTimeout on instances of Window', [
          undefined,
          PROXIED_GAPI,
          '/js/chunk-C9D6FGur.js',
        ])
      )
    ).toBe(true);
  });

  it('drops a Window.setInterval call raised entirely inside the proxy', () => {
    expect(
      isProxyRewrittenHostCall(
        event('TypeError', 'Can only call Window.setInterval on instances of Window', [
          PROXIED_GTAG,
        ])
      )
    ).toBe(true);
  });

  it('keeps the identical message when no proxy rewrote the script', () => {
    expect(
      isProxyRewrittenHostCall(
        event('TypeError', 'Can only call Window.matchMedia on instances of Window', [
          '/js/chunk-C9D6FGur.js',
        ])
      )
    ).toBe(false);
  });

  it('keeps the same wording on another interface, where a detached `this` could be ours', () => {
    expect(
      isProxyRewrittenHostCall(
        event('TypeError', 'Can only call IDBDatabase.transaction on instances of IDBDatabase', [
          PROXIED_GTAG,
        ])
      )
    ).toBe(false);
  });

  it('keeps the message when there are no frames to attribute it to', () => {
    expect(
      isProxyRewrittenHostCall(
        event('TypeError', 'Can only call Window.setTimeout on instances of Window')
      )
    ).toBe(false);
  });

  it('ignores an event with no exception', () => {
    expect(isProxyRewrittenHostCall({})).toBe(false);
  });
});
