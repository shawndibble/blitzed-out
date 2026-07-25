import { describe, expect, it } from 'vitest';
import { CAST_NAMESPACE, buildCastUrl, buildLoadMessage, detectCastEnvironment } from '../cast';

describe('buildCastUrl', () => {
  it('joins origin and room into the cast route', () => {
    expect(buildCastUrl('https://blitzedout.com', 'ABCDE')).toBe(
      'https://blitzedout.com/ABCDE/cast'
    );
  });

  it('does not duplicate slashes when origin has a trailing slash', () => {
    expect(buildCastUrl('https://blitzedout.com/', 'ABCDE')).toBe(
      'https://blitzedout.com/ABCDE/cast'
    );
  });
});

describe('buildLoadMessage', () => {
  it('produces a LOAD payload carrying the cast url', () => {
    expect(buildLoadMessage('https://blitzedout.com/ABCDE/cast')).toEqual({
      type: 'LOAD',
      url: 'https://blitzedout.com/ABCDE/cast',
    });
  });

  it('exposes the app cast namespace', () => {
    expect(CAST_NAMESPACE).toBe('urn:x-cast:com.blitzedout.app');
  });
});

describe('detectCastEnvironment', () => {
  it('is true when a Cast receiver context is present', () => {
    expect(
      detectCastEnvironment({ userAgent: 'Mozilla', search: '', hasReceiverContext: true })
    ).toBe(true);
  });

  it('is true for a Chromecast user agent (CrKey)', () => {
    expect(
      detectCastEnvironment({
        userAgent: 'Mozilla CrKey/1.0',
        search: '',
        hasReceiverContext: false,
      })
    ).toBe(true);
  });

  it('is true when the query string flags a receiver', () => {
    expect(
      detectCastEnvironment({
        userAgent: 'Mozilla',
        search: '?receiver=1',
        hasReceiverContext: false,
      })
    ).toBe(true);
  });

  it('is false for an ordinary browser', () => {
    expect(
      detectCastEnvironment({ userAgent: 'Mozilla', search: '', hasReceiverContext: false })
    ).toBe(false);
  });
});
