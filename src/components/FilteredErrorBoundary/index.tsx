import React from 'react';
import * as Sentry from '@sentry/react';
import { isExpectedDOMError } from '@/constants/errorPatterns';

interface FilteredErrorBoundaryProps {
  children: React.ReactNode;
  fallback: React.ComponentType<any>;
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

  static getDerivedStateFromError(error: Error) {
    // Check if this is an expected React DOM reconciliation error
    const errorMessage = error.message || '';

    // If it's an expected DOM reconciliation error, don't show error boundary UI
    if (isExpectedDOMError(errorMessage)) {
      return { hasError: false, error: null };
    }

    // For other errors, show the error boundary
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Check if this is an expected React DOM reconciliation error
    const errorMessage = error.message || '';

    if (!isExpectedDOMError(errorMessage)) {
      // Only send unexpected errors to Sentry
      Sentry.withScope((scope) => {
        scope.setTag('component_error_boundary', true);
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
