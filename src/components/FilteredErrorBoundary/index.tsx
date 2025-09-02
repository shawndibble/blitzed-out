import * as Sentry from '@sentry/react';

import { isExpectedDOMError, isMinifiedError } from '@/constants/errorPatterns';

import React from 'react';

interface FilteredErrorBoundaryProps {
  children: React.ReactNode;
  fallback: React.ComponentType<{ error: Error; resetError: () => void }>;
}

interface FilteredErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Custom error boundary that filters out expected React DOM reconciliation errors
 * while still capturing unexpected errors for Sentry
 */
export default class FilteredErrorBoundary extends React.Component<
  FilteredErrorBoundaryProps,
  FilteredErrorBoundaryState
> {
  constructor(props: FilteredErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: unknown) {
    // Check if this is an expected React DOM reconciliation error
    const errorMessage = error instanceof Error ? error.message : String(error ?? '');

    // Only suppress DOM reconciliation errors - minified errors now go through
    if (isExpectedDOMError(errorMessage)) {
      return { hasError: false, error: null };
    }

    // For all other errors (including minified), show the error boundary
    return { hasError: true, error: error instanceof Error ? error : new Error(errorMessage) };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Check if this is an expected React DOM reconciliation error
    const errorMessage = error.message || '';

    if (!isExpectedDOMError(errorMessage)) {
      // Send all other errors to Sentry (including minified with context)
      Sentry.withScope((scope) => {
        scope.setTag('component_error_boundary', true);

        // Add context for minified errors
        if (isMinifiedError(errorMessage)) {
          scope.setTag('minified_error', true);
          scope.setContext('minifiedContext', {
            originalMessage: errorMessage,
            note: 'Minified error - check source maps for original location',
          });
        }

        scope.setContext('errorInfo', {
          componentStack: errorInfo.componentStack,
        });
        Sentry.captureException(error);
      });
    }
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback;
      return (
        <FallbackComponent
          error={this.state.error}
          resetError={() => this.setState({ hasError: false, error: null })}
        />
      );
    }

    return this.props.children;
  }
}
