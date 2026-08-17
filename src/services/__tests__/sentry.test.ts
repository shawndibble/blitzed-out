import * as Sentry from '@sentry/react';
import { describe, expect, it } from 'vitest';

import { AUDIO_DEVICE_START_ERROR } from '@/constants/errorPatterns';
import { buildSentryOptions } from '@/services/sentry';

const filter = Sentry.eventFiltersIntegration({
  ignoreErrors: buildSentryOptions().ignoreErrors,
  // Isolates our own patterns: a "keeps" assertion proves we don't drop the event, not that
  // production keeps it — the SDK merges its own defaults in on top.
  disableErrorDefaults: true,
});

// `ignoreErrors` is passed above, so the only client method reached is `getOptions`.
const client = { getOptions: () => ({}) } as NonNullable<ReturnType<typeof Sentry.getClient>>;

/**
 * Driven through the SDK's own filter over the options production passes: which candidate strings
 * a pattern is tested against, and which exception in a chain supplies them, are both easy to get
 * wrong and impossible to observe from a reimplementation.
 */
function sentryWouldIgnore(event: Sentry.ErrorEvent): boolean {
  return filter.processEvent?.(event, {}, client) === null;
}

function errorEvent(...values: { type: string; value: string }[]): Sentry.ErrorEvent {
  return { type: undefined, exception: { values } };
}

describe('the ignored error patterns Sentry is initialized with', () => {
  describe("Firefox's messageless NS_ERROR_FAILURE", () => {
    it('drops it at the placeholder `extractMessage` substitutes for a blank message', () => {
      expect(
        sentryWouldIgnore(errorEvent({ type: 'NS_ERROR_FAILURE', value: 'No error message' }))
      ).toBe(true);
    });

    it('keeps an NS_ERROR_FAILURE that says what failed', () => {
      expect(
        sentryWouldIgnore(
          errorEvent({ type: 'NS_ERROR_FAILURE', value: 'Component returned failure code' })
        )
      ).toBe(false);
    });

    it('keeps a messageless error of another type', () => {
      expect(
        sentryWouldIgnore(errorEvent({ type: 'NS_ERROR_NOT_AVAILABLE', value: 'No error message' }))
      ).toBe(false);
    });
  });

  // `linkedErrorsIntegration` prepends causes, so `values[0]` is the innermost cause.
  describe('a chained exception', () => {
    it('is judged on the thrown error, not on its cause', () => {
      expect(
        sentryWouldIgnore(
          errorEvent(
            { type: 'NS_ERROR_FAILURE', value: 'No error message' },
            { type: 'Error', value: 'Failed to create local player session' }
          )
        )
      ).toBe(false);
    });

    it('drops the event when the nsresult is what was thrown', () => {
      expect(
        sentryWouldIgnore(
          errorEvent(
            { type: 'Error', value: 'Failed to create local player session' },
            { type: 'NS_ERROR_FAILURE', value: 'No error message' }
          )
        )
      ).toBe(true);
    });
  });

  // The pattern is built from `AUDIO_DEVICE_START_ERROR`, so this asserts the derived regex still
  // reaches `ignoreErrors`. It cannot catch WebKit rewording the message — nothing can.
  describe("iOS Safari's audio-session refusal", () => {
    it('drops it, though real bugs share the type', () => {
      expect(
        sentryWouldIgnore(
          errorEvent({ type: 'InvalidStateError', value: AUDIO_DEVICE_START_ERROR })
        )
      ).toBe(true);
      expect(
        sentryWouldIgnore(errorEvent({ type: 'InvalidStateError', value: 'Called in wrong state' }))
      ).toBe(false);
    });
  });

  describe('IndexedDB closed under a live consumer', () => {
    it.each([
      "Failed to execute 'transaction' on 'IDBDatabase': The database connection is closing.",
      "Failed to execute 'objectStore' on 'IDBTransaction': The database connection is closing.",
    ])('drops it: %s', (value) => {
      expect(sentryWouldIgnore(errorEvent({ type: 'InvalidStateError', value }))).toBe(true);
    });

    it.each([
      'The transaction is inactive or finished.',
      'A mutation operation was attempted on a database that did not allow mutations.',
    ])('keeps an InvalidStateError from real IndexedDB misuse: %s', (value) => {
      expect(sentryWouldIgnore(errorEvent({ type: 'InvalidStateError', value }))).toBe(false);
    });
  });
});
