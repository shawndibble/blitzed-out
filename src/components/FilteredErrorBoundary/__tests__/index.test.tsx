import { describe, it, expect, vi, beforeEach } from 'vitest';
import type React from 'react';
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
  isMinifiedError: vi.fn(),
}));

import { isExpectedDOMError, isMinifiedError } from '@/constants/errorPatterns';

describe('FilteredErrorBoundary', () => {
  const DummyFallback: React.FC<{ error: Error; resetError: () => void }> = () => null;

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

    it('returns error state for minified errors (no longer suppressed)', () => {
      const minifiedError = new Error('bb');

      // Mock to show minified errors are no longer suppressed
      vi.mocked(isExpectedDOMError).mockReturnValue(false);

      const result = FilteredErrorBoundary.getDerivedStateFromError(minifiedError);

      expect(result.hasError).toBe(true);
      expect(result.error).toBe(minifiedError);
      expect(isExpectedDOMError).toHaveBeenCalledWith('bb');
    });

    it('returns error state for unexpected errors', () => {
      const unexpectedError = new Error('Unexpected error occurred');

      // Mock to return false for expected DOM errors
      vi.mocked(isExpectedDOMError).mockReturnValue(false);

      const result = FilteredErrorBoundary.getDerivedStateFromError(unexpectedError);

      expect(result.hasError).toBe(true);
      expect(result.error).toBe(unexpectedError);
      expect(isExpectedDOMError).toHaveBeenCalledWith('Unexpected error occurred');
    });

    it('handles errors with empty messages', () => {
      const errorWithoutMessage = new Error();
      errorWithoutMessage.message = '';

      vi.mocked(isExpectedDOMError).mockReturnValue(false);

      const result = FilteredErrorBoundary.getDerivedStateFromError(errorWithoutMessage);

      expect(result.hasError).toBe(true);
      expect(result.error).toBe(errorWithoutMessage);
      expect(isExpectedDOMError).toHaveBeenCalledWith('');
    });
  });

  describe('componentDidCatch', () => {
    it('does not send expected DOM errors to Sentry', () => {
      const domError = new Error('DOM reconciliation error');
      const errorInfo = { componentStack: 'test stack' } as React.ErrorInfo;

      vi.mocked(isExpectedDOMError).mockReturnValue(true);

      const instance = new FilteredErrorBoundary({ children: null, fallback: DummyFallback });
      instance.componentDidCatch(domError, errorInfo);

      expect(Sentry.captureException).not.toHaveBeenCalled();
      expect(isExpectedDOMError).toHaveBeenCalledWith('DOM reconciliation error');
    });

    it('sends minified errors to Sentry with enhanced context', () => {
      const minifiedError = new Error('bb');
      const errorInfo = { componentStack: 'test stack' } as React.ErrorInfo;

      vi.mocked(isExpectedDOMError).mockReturnValue(false);
      vi.mocked(isMinifiedError).mockReturnValue(true);

      const instance = new FilteredErrorBoundary({ children: null, fallback: DummyFallback });
      instance.componentDidCatch(minifiedError, errorInfo);

      expect(Sentry.captureException).toHaveBeenCalledWith(minifiedError);
      expect(isExpectedDOMError).toHaveBeenCalledWith('bb');
      expect(isMinifiedError).toHaveBeenCalledWith('bb');

      // Verify Sentry scope includes minified error context
      expect(Sentry.withScope).toHaveBeenCalled();
      const withScopeMock = vi.mocked(Sentry.withScope);
      const callback = withScopeMock.mock.calls[0][0] as any;
      const fakeScope = { setTag: vi.fn(), setContext: vi.fn() };
      callback(fakeScope);

      expect(fakeScope.setTag).toHaveBeenCalledWith('minified_error', true);
      expect(fakeScope.setContext).toHaveBeenCalledWith('minifiedContext', {
        originalMessage: 'bb',
        note: 'Minified error - check source maps for original location',
      });
    });

    it('sends unexpected errors to Sentry with correct context', () => {
      const unexpectedError = new Error('Unexpected error');
      const errorInfo = { componentStack: 'test stack' } as React.ErrorInfo;

      vi.mocked(isExpectedDOMError).mockReturnValue(false);
      vi.mocked(isMinifiedError).mockReturnValue(false);

      const instance = new FilteredErrorBoundary({ children: null, fallback: DummyFallback });
      instance.componentDidCatch(unexpectedError, errorInfo);

      expect(Sentry.captureException).toHaveBeenCalledWith(unexpectedError);
      expect(isExpectedDOMError).toHaveBeenCalledWith('Unexpected error');
      expect(isMinifiedError).toHaveBeenCalledWith('Unexpected error');

      // Verify Sentry scope configuration was called
      expect(Sentry.withScope).toHaveBeenCalled();

      // Verify the scope callback sets the correct tags and context
      const withScopeMock = vi.mocked(Sentry.withScope);
      expect(withScopeMock).toHaveBeenCalled();
      const lastCall = withScopeMock.mock.calls[withScopeMock.mock.calls.length - 1];
      const callback = lastCall[0] as any;
      const fakeScope = { setTag: vi.fn(), setContext: vi.fn() };
      callback(fakeScope);

      expect(fakeScope.setTag).toHaveBeenCalledWith('component_error_boundary', true);
      expect(fakeScope.setContext).toHaveBeenCalledWith('errorInfo', {
        componentStack: 'test stack',
      });
    });

    it('correctly identifies the exact error from Sentry report', () => {
      const sentryError = new Error(
        "Failed to execute 'insertBefore' on 'Node': The node before which the new node is to be inserted is not a child of this node."
      );
      const errorInfo = { componentStack: 'test stack' } as React.ErrorInfo;

      vi.mocked(isExpectedDOMError).mockReturnValue(true);
      vi.mocked(isMinifiedError).mockReturnValue(false);

      const instance = new FilteredErrorBoundary({ children: null, fallback: DummyFallback });
      instance.componentDidCatch(sentryError, errorInfo);

      expect(isExpectedDOMError).toHaveBeenCalledWith(sentryError.message);
      // isMinifiedError won't be called due to short-circuit evaluation
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
        // Note: isMinifiedError is only called in componentDidCatch for Sentry context
      });
    });
  });
});
