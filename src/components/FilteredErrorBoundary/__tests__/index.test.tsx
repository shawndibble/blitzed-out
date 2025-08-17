import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as Sentry from '@sentry/react';
import FilteredErrorBoundary from '../index';

// Mock Sentry
vi.mock('@sentry/react', () => ({
  withScope: vi.fn((callback) => {
    const mockScope = {
      setTag: vi.fn(),
      setContext: vi.fn(),
    };
    callback(mockScope);
  }),
  captureException: vi.fn(),
}));

// Mock the error patterns
vi.mock('@/constants/errorPatterns', () => ({
  isExpectedDOMError: vi.fn(),
}));

import { isExpectedDOMError } from '@/constants/errorPatterns';

describe('FilteredErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDerivedStateFromError', () => {
    it('returns null error state for expected DOM errors', () => {
      const domError = new Error(
        "Failed to execute 'insertBefore' on 'Node': The node before which the new node is to be inserted is not a child of this node."
      );

      // Mock the function to return true for expected DOM errors
      vi.mocked(isExpectedDOMError).mockReturnValue(true);

      const result = FilteredErrorBoundary.getDerivedStateFromError(domError);

      expect(result).toEqual({ hasError: false, error: null });
      expect(isExpectedDOMError).toHaveBeenCalledWith(domError.message);
    });

    it('returns error state for unexpected errors', () => {
      const unexpectedError = new Error('Unexpected error occurred');

      // Mock the function to return false for unexpected errors
      vi.mocked(isExpectedDOMError).mockReturnValue(false);

      const result = FilteredErrorBoundary.getDerivedStateFromError(unexpectedError);

      expect(result).toEqual({ hasError: true, error: unexpectedError });
      expect(isExpectedDOMError).toHaveBeenCalledWith('Unexpected error occurred');
    });

    it('handles errors with empty messages', () => {
      const errorWithoutMessage = new Error();
      errorWithoutMessage.message = '';

      vi.mocked(isExpectedDOMError).mockReturnValue(false);

      const result = FilteredErrorBoundary.getDerivedStateFromError(errorWithoutMessage);

      expect(result).toEqual({ hasError: true, error: errorWithoutMessage });
      expect(isExpectedDOMError).toHaveBeenCalledWith('');
    });
  });

  describe('componentDidCatch', () => {
    it('does not send expected DOM errors to Sentry', () => {
      const domError = new Error('DOM reconciliation error');
      const errorInfo = { componentStack: 'test stack' } as React.ErrorInfo;

      vi.mocked(isExpectedDOMError).mockReturnValue(true);

      const instance = new FilteredErrorBoundary({ children: null, fallback: vi.fn() });
      instance.componentDidCatch(domError, errorInfo);

      expect(Sentry.captureException).not.toHaveBeenCalled();
      expect(isExpectedDOMError).toHaveBeenCalledWith('DOM reconciliation error');
    });

    it('sends unexpected errors to Sentry with correct context', () => {
      const unexpectedError = new Error('Unexpected error');
      const errorInfo = { componentStack: 'test stack' } as React.ErrorInfo;

      vi.mocked(isExpectedDOMError).mockReturnValue(false);

      const instance = new FilteredErrorBoundary({ children: null, fallback: vi.fn() });
      instance.componentDidCatch(unexpectedError, errorInfo);

      expect(Sentry.captureException).toHaveBeenCalledWith(unexpectedError);
      expect(isExpectedDOMError).toHaveBeenCalledWith('Unexpected error');

      // Verify Sentry scope configuration was called
      expect(Sentry.withScope).toHaveBeenCalled();
    });

    it('correctly identifies the exact error from Sentry report', () => {
      const sentryError = new Error(
        "Failed to execute 'insertBefore' on 'Node': The node before which the new node is to be inserted is not a child of this node."
      );
      const errorInfo = { componentStack: 'test stack' } as React.ErrorInfo;

      vi.mocked(isExpectedDOMError).mockReturnValue(true);

      const instance = new FilteredErrorBoundary({ children: null, fallback: vi.fn() });
      instance.componentDidCatch(sentryError, errorInfo);

      expect(isExpectedDOMError).toHaveBeenCalledWith(sentryError.message);
      expect(Sentry.captureException).not.toHaveBeenCalled();
    });
  });

  describe('Error pattern integration', () => {
    it('correctly passes error messages to isExpectedDOMError function', () => {
      const testMessages = [
        "Failed to execute 'insertBefore' on 'Node': The node before which the new node is to be inserted is not a child of this node.",
        "TypeError: Cannot read property 'foo' of undefined",
        'ReferenceError: variable is not defined',
        '',
      ];

      testMessages.forEach((message) => {
        const error = new Error(message);
        vi.mocked(isExpectedDOMError).mockReturnValue(false);

        FilteredErrorBoundary.getDerivedStateFromError(error);

        expect(isExpectedDOMError).toHaveBeenCalledWith(message);
      });
    });
  });
});
