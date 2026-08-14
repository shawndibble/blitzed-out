import { describe, expect, it } from 'vitest';

import { isExpectedDOMError } from '@/constants/errorPatterns';

describe('isExpectedDOMError', () => {
  describe('WebKit NotFoundError', () => {
    // WebKit's message names no DOM method; the evidence lives only in the stack. Missing it
    // both reported to Sentry and put the user on the crash screen.
    it('recognises the standalone message with no method name', () => {
      expect(isExpectedDOMError('The object can not be found here.')).toBe(true);
    });

    it('recognises it without the trailing period', () => {
      expect(isExpectedDOMError('The object can not be found here')).toBe(true);
    });

    it('recognises it when prefixed by the exception name', () => {
      expect(isExpectedDOMError('NotFoundError: The object can not be found here.')).toBe(true);
    });
  });

  describe('reconciliation errors that were already recognised', () => {
    it.each([
      "Failed to execute 'insertBefore' on 'Node': The node before which the new node is to be inserted is not a child of this node.",
      "Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.",
      "NotFoundError: Failed to execute 'insertBefore' on 'Node': The object can not be found here.",
    ])('recognises %s', (message) => {
      expect(isExpectedDOMError(message)).toBe(true);
    });
  });

  describe('unrelated errors', () => {
    it.each([
      'Cannot read properties of undefined',
      'Maximum call stack size exceeded.',
      'Unable to preload CSS for https://blitzedout.com/assets/GameGuide-ClokBUqd.css',
      'The board could not be found here in the database',
      '',
    ])('does not match %s', (message) => {
      expect(isExpectedDOMError(message)).toBe(false);
    });

    it('ignores non-string input', () => {
      expect(isExpectedDOMError(undefined)).toBe(false);
      expect(isExpectedDOMError(null)).toBe(false);
      expect(isExpectedDOMError({ message: 'The object can not be found here.' })).toBe(false);
    });
  });
});
