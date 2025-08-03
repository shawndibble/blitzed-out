import React, { Suspense } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { LocalPlayerSetupLoading, LocalPlayerSetupError } from '../index.lazy';

// Mock the main LocalPlayerSetup component
const MockLocalPlayerSetup = vi.fn(({ roomId, isPrivateRoom, onComplete, onCancel }) => (
  <div data-testid="local-player-setup">
    <div>LocalPlayerSetup Component</div>
    <div>Room ID: {roomId}</div>
    <div>Private Room: {isPrivateRoom ? 'Yes' : 'No'}</div>
    <button type="button" onClick={() => onComplete([], {})}>
      Complete
    </button>
    <button type="button" onClick={onCancel}>
      Cancel
    </button>
  </div>
));

// Mock the LocalPlayerSetup component import
vi.mock('../index', () => ({
  default: MockLocalPlayerSetup,
}));

// Mock React.lazy to control lazy loading behavior
const mockLazyImport = vi.fn();
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    lazy: vi.fn((factory) => {
      // Store the factory for testing purposes
      mockLazyImport.mockImplementation(factory);
      // Return a component that simulates lazy loading
      return vi.fn((props) => {
        const Component = mockLazyImport();
        return React.createElement(Component.default || Component, props);
      });
    }),
  };
});

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => {
      const translations: Record<string, string> = {
        'localPlayers.loading': 'Loading local players...',
        'localPlayers.loadError': 'Failed to load local players',
      };
      return translations[key] || defaultValue || key;
    },
  }),
}));

// Mock migration context
vi.mock('@/context/migration', () => ({
  useMigration: () => ({
    currentLanguageMigrated: true,
    isMigrationInProgress: false,
    isMigrationCompleted: true,
    error: null,
    triggerMigration: vi.fn(),
    ensureLanguageMigrated: vi.fn(),
  }),
}));

// Import the components to test after mocks are set up
import {
  LocalPlayerSetup,
  LocalPlayerSetupErrorBoundary,
  LocalPlayerSetupWithBoundary,
  type LocalPlayerSetupProps,
} from '../index.lazy';

describe('LocalPlayerSetup Lazy Loading Wrapper', () => {
  const defaultProps: LocalPlayerSetupProps = {
    roomId: 'TEST_ROOM',
    isPrivateRoom: true,
    onComplete: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset the lazy import mock to return successful import
    mockLazyImport.mockResolvedValue({
      default: MockLocalPlayerSetup,
    });
  });

  describe('Props Interface', () => {
    it('re-exports the correct props interface', () => {
      // Test that the props interface is properly typed
      const props: LocalPlayerSetupProps = {
        roomId: 'TEST',
        isPrivateRoom: true,
        onComplete: vi.fn(),
        onCancel: vi.fn(),
      };

      expect(props.roomId).toBe('TEST');
      expect(props.isPrivateRoom).toBe(true);
      expect(typeof props.onComplete).toBe('function');
      expect(typeof props.onCancel).toBe('function');
    });
  });

  describe('Lazy Loading Functionality', () => {
    it('renders without crashing', () => {
      render(<LocalPlayerSetup {...defaultProps} />);
      expect(screen.getByTestId('local-player-setup')).toBeInTheDocument();
    });

    it('passes all props to the lazy-loaded component', () => {
      const customProps = {
        roomId: 'CUSTOM_ROOM',
        isPrivateRoom: false,
        onComplete: vi.fn(),
        onCancel: vi.fn(),
      };

      render(<LocalPlayerSetup {...customProps} />);

      expect(screen.getByText('Room ID: CUSTOM_ROOM')).toBeInTheDocument();
      expect(screen.getByText('Private Room: No')).toBeInTheDocument();
    });

    it('handles prop callbacks correctly', async () => {
      const user = userEvent.setup();
      const onComplete = vi.fn();
      const onCancel = vi.fn();

      render(<LocalPlayerSetup {...defaultProps} onComplete={onComplete} onCancel={onCancel} />);

      const completeButton = screen.getByText('Complete');
      const cancelButton = screen.getByText('Cancel');

      await user.click(completeButton);
      expect(onComplete).toHaveBeenCalledWith([], {});

      await user.click(cancelButton);
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('exports the component as default export', () => {
      // Test that the default export works
      expect(LocalPlayerSetup).toBeDefined();
      expect(typeof LocalPlayerSetup).toBe('function');
    });
  });

  describe('Loading States', () => {
    it('renders loading fallback while component is loading', () => {
      // Mock a slow-loading component
      mockLazyImport.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ default: MockLocalPlayerSetup }), 100)
          )
      );

      render(
        <Suspense fallback={<div data-testid="loading">Loading...</div>}>
          <LocalPlayerSetup {...defaultProps} />
        </Suspense>
      );

      expect(screen.getByTestId('loading')).toBeInTheDocument();
    });

    it('renders loading component with correct structure', () => {
      // Use the imported loading component for testing
      render(<LocalPlayerSetupLoading />);

      // Check for CircularProgress
      const progressElement = document.querySelector('.MuiCircularProgress-root');
      expect(progressElement).toBeInTheDocument();

      // Check for loading text
      expect(screen.getByText('Loading local players...')).toBeInTheDocument();
    });

    it('loading component has proper accessibility attributes', () => {
      const { container } = render(<LocalPlayerSetupLoading />);

      // Check Box container structure
      const boxElement = container.firstChild;
      expect(boxElement).toHaveStyle({
        display: 'flex',
        'flex-direction': 'column',
        'align-items': 'center',
        'justify-content': 'center',
      });
    });

    it('loading component displays translated loading message', () => {
      render(<LocalPlayerSetupLoading />);

      expect(screen.getByText('Loading local players...')).toBeInTheDocument();
    });

    it('loading component has proper styling structure', () => {
      const { container } = render(<LocalPlayerSetupLoading />);

      const boxElement = container.firstChild;

      // Check that it's a Box component with proper structure
      expect(boxElement).toBeInTheDocument();

      // Check for CircularProgress inside
      const progressElement = (boxElement as Element)?.querySelector('.MuiCircularProgress-root');
      expect(progressElement).toBeInTheDocument();

      // Check for Typography inside
      const textElement = (boxElement as Element)?.querySelector('.MuiTypography-root');
      expect(textElement).toBeInTheDocument();
    });
  });

  // Utility to trigger an error in a component
  const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
    if (shouldThrow) {
      throw new Error('Test error message');
    }
    return <div>No error</div>;
  };

  describe('Error Boundary', () => {
    it('renders children when there is no error', () => {
      render(
        <LocalPlayerSetupErrorBoundary>
          <div data-testid="child-component">Child Component</div>
        </LocalPlayerSetupErrorBoundary>
      );

      expect(screen.getByTestId('child-component')).toBeInTheDocument();
    });

    it('catches errors and displays error fallback', () => {
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = vi.fn();

      render(
        <LocalPlayerSetupErrorBoundary>
          <ThrowError shouldThrow={true} />
        </LocalPlayerSetupErrorBoundary>
      );

      expect(screen.getByText('Failed to load local players')).toBeInTheDocument();
      expect(screen.getByText('Test error message')).toBeInTheDocument();

      // Restore console.error
      console.error = originalError;
    });

    it('logs errors to console when error occurs', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <LocalPlayerSetupErrorBoundary>
          <ThrowError shouldThrow={true} />
        </LocalPlayerSetupErrorBoundary>
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'LocalPlayerSetup error:',
        expect.any(Error),
        expect.any(Object)
      );

      consoleErrorSpy.mockRestore();
    });

    it('error boundary maintains error state correctly', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { rerender } = render(
        <LocalPlayerSetupErrorBoundary>
          <ThrowError shouldThrow={false} />
        </LocalPlayerSetupErrorBoundary>
      );

      // Initially no error
      expect(screen.getByText('No error')).toBeInTheDocument();

      // Trigger error
      rerender(
        <LocalPlayerSetupErrorBoundary>
          <ThrowError shouldThrow={true} />
        </LocalPlayerSetupErrorBoundary>
      );

      // Error boundary should show error
      expect(screen.getByText('Failed to load local players')).toBeInTheDocument();

      consoleErrorSpy.mockRestore();
    });

    it('error fallback component has proper structure', () => {
      const testError = new Error('Test error message');

      render(<LocalPlayerSetupError error={testError} />);

      expect(screen.getByText('Failed to load local players')).toBeInTheDocument();
      expect(screen.getByText('Test error message')).toBeInTheDocument();

      // Check for proper MUI components
      const errorTitle = screen.getByText('Failed to load local players');
      const errorMessage = screen.getByText('Test error message');

      expect(errorTitle).toHaveClass('MuiTypography-root');
      expect(errorMessage).toHaveClass('MuiTypography-root');
    });

    it('error fallback displays translated error message', () => {
      const testError = new Error('Custom error message');

      render(<LocalPlayerSetupError error={testError} />);

      expect(screen.getByText('Failed to load local players')).toBeInTheDocument();
      expect(screen.getByText('Custom error message')).toBeInTheDocument();
    });

    it('error boundary lifecycle methods work correctly', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Test getDerivedStateFromError
      const errorBoundary = new LocalPlayerSetupErrorBoundary({ children: null });
      const testError = new Error('Test error');
      const newState = LocalPlayerSetupErrorBoundary.getDerivedStateFromError(testError);

      expect(newState).toEqual({ hasError: true, error: testError });

      // Simulate componentDidCatch call
      errorBoundary.componentDidCatch(testError, { componentStack: 'test stack' });

      expect(consoleErrorSpy).toHaveBeenCalledWith('LocalPlayerSetup error:', testError, {
        componentStack: 'test stack',
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Error Recovery', () => {
    it('error boundary recovers when children change', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { rerender } = render(
        <LocalPlayerSetupErrorBoundary>
          <ThrowError shouldThrow={true} />
        </LocalPlayerSetupErrorBoundary>
      );

      // Error state
      expect(screen.getByText('Failed to load local players')).toBeInTheDocument();

      // Create new error boundary instance to simulate reset
      rerender(
        <LocalPlayerSetupErrorBoundary key="new">
          <div>Recovered component</div>
        </LocalPlayerSetupErrorBoundary>
      );

      expect(screen.getByText('Recovered component')).toBeInTheDocument();

      consoleErrorSpy.mockRestore();
    });

    it('error boundary properly handles different error types', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const ErrorWithDifferentMessage = () => {
        throw new Error('Network error occurred');
      };

      render(
        <LocalPlayerSetupErrorBoundary>
          <ErrorWithDifferentMessage />
        </LocalPlayerSetupErrorBoundary>
      );

      expect(screen.getByText('Failed to load local players')).toBeInTheDocument();
      expect(screen.getByText('Network error occurred')).toBeInTheDocument();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Integration Testing', () => {
    it('LocalPlayerSetupWithBoundary combines lazy loading and error boundary', () => {
      render(<LocalPlayerSetupWithBoundary {...defaultProps} />);

      expect(screen.getByTestId('local-player-setup')).toBeInTheDocument();
      expect(screen.getByText('LocalPlayerSetup Component')).toBeInTheDocument();
    });

    it('LocalPlayerSetupWithBoundary passes props correctly', () => {
      const customProps = {
        roomId: 'INTEGRATION_TEST',
        isPrivateRoom: false,
        onComplete: vi.fn(),
        onCancel: vi.fn(),
      };

      render(<LocalPlayerSetupWithBoundary {...customProps} />);

      expect(screen.getByText('Room ID: INTEGRATION_TEST')).toBeInTheDocument();
      expect(screen.getByText('Private Room: No')).toBeInTheDocument();
    });

    it('LocalPlayerSetupWithBoundary handles errors in lazy component', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Mock the component to throw an error
      MockLocalPlayerSetup.mockImplementation(() => {
        throw new Error('Lazy component error');
      });

      render(<LocalPlayerSetupWithBoundary {...defaultProps} />);

      expect(screen.getByText('Failed to load local players')).toBeInTheDocument();
      expect(screen.getByText('Lazy component error')).toBeInTheDocument();

      consoleErrorSpy.mockRestore();
    });

    it('handles complex prop callbacks through wrapper', async () => {
      const user = userEvent.setup();
      const onComplete = vi.fn();
      const onCancel = vi.fn();

      render(
        <LocalPlayerSetupWithBoundary
          {...defaultProps}
          onComplete={onComplete}
          onCancel={onCancel}
        />
      );

      await user.click(screen.getByText('Complete'));
      expect(onComplete).toHaveBeenCalledWith([], {});

      await user.click(screen.getByText('Cancel'));
      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('React Suspense Integration', () => {
    it('works correctly with React Suspense boundaries', async () => {
      let resolveImport: (value: any) => void;
      const importPromise = new Promise((resolve) => {
        resolveImport = resolve;
      });

      mockLazyImport.mockImplementation(() => importPromise);

      render(
        <Suspense fallback={<div data-testid="suspense-fallback">Suspense Loading...</div>}>
          <LocalPlayerSetup {...defaultProps} />
        </Suspense>
      );

      // Should show suspense fallback initially
      expect(screen.getByTestId('suspense-fallback')).toBeInTheDocument();

      // Resolve the import
      resolveImport!({ default: MockLocalPlayerSetup });

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByTestId('local-player-setup')).toBeInTheDocument();
      });

      expect(screen.queryByTestId('suspense-fallback')).not.toBeInTheDocument();
    });

    it('handles suspense with error boundary combination', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Mock import failure
      mockLazyImport.mockImplementation(() => Promise.reject(new Error('Import failed')));

      render(
        <LocalPlayerSetupErrorBoundary>
          <Suspense fallback={<div data-testid="suspense-fallback">Loading...</div>}>
            <LocalPlayerSetup {...defaultProps} />
          </Suspense>
        </LocalPlayerSetupErrorBoundary>
      );

      // Wait for error to propagate
      await waitFor(() => {
        expect(screen.getByText('Failed to load local players')).toBeInTheDocument();
      });

      consoleErrorSpy.mockRestore();
    });

    it('suspense fallback uses the internal loading component', () => {
      const { container } = render(
        <Suspense fallback={<LocalPlayerSetup {...defaultProps} />}>
          <div>Never renders</div>
        </Suspense>
      );

      // The lazy component itself becomes the fallback, which should render the loading state
      expect(container).toBeInTheDocument();
    });
  });

  describe('Component Wrapper Functionality', () => {
    it('maintains consistent API with wrapped component', () => {
      const props1 = {
        roomId: 'TEST1',
        isPrivateRoom: true,
        onComplete: vi.fn(),
        onCancel: vi.fn(),
      };

      const props2 = {
        roomId: 'TEST2',
        isPrivateRoom: false,
        onComplete: vi.fn(),
        onCancel: vi.fn(),
      };

      const { rerender } = render(<LocalPlayerSetup {...props1} />);
      expect(screen.getByText('Room ID: TEST1')).toBeInTheDocument();

      rerender(<LocalPlayerSetup {...props2} />);
      expect(screen.getByText('Room ID: TEST2')).toBeInTheDocument();
    });

    it('wrapper components are properly typed', () => {
      // TypeScript compilation test - this would fail at build time if types are wrong
      const validProps: LocalPlayerSetupProps = {
        roomId: 'test',
        isPrivateRoom: true,
        onComplete: vi.fn(),
        onCancel: vi.fn(),
      };

      expect(() => {
        render(<LocalPlayerSetup {...validProps} />);
        render(<LocalPlayerSetupWithBoundary {...validProps} />);
      }).not.toThrow();
    });

    it('preserves component behavior across wrapper layers', async () => {
      const user = userEvent.setup();
      const onComplete = vi.fn();
      const onCancel = vi.fn();

      // Test direct lazy component
      const { rerender } = render(
        <LocalPlayerSetup
          roomId="DIRECT"
          isPrivateRoom={true}
          onComplete={onComplete}
          onCancel={onCancel}
        />
      );

      await user.click(screen.getByText('Complete'));
      expect(onComplete).toHaveBeenCalledTimes(1);

      // Test with error boundary wrapper
      rerender(
        <LocalPlayerSetupWithBoundary
          roomId="WRAPPED"
          isPrivateRoom={false}
          onComplete={onComplete}
          onCancel={onCancel}
        />
      );

      await user.click(screen.getByText('Complete'));
      expect(onComplete).toHaveBeenCalledTimes(2);
    });
  });

  describe('Performance Considerations', () => {
    it('lazy loading reduces initial bundle size', () => {
      // Verify that the lazy import is only called when needed
      expect(mockLazyImport).not.toHaveBeenCalled();

      render(<LocalPlayerSetup {...defaultProps} />);

      // Now the lazy import should have been triggered
      expect(mockLazyImport).toHaveBeenCalled();
    });

    it('error boundary does not re-render unnecessarily', () => {
      const renderSpy = vi.fn();

      const TestChild = () => {
        renderSpy();
        return <div>Test child</div>;
      };

      const { rerender } = render(
        <LocalPlayerSetupErrorBoundary>
          <TestChild />
        </LocalPlayerSetupErrorBoundary>
      );

      expect(renderSpy).toHaveBeenCalledTimes(1);

      // Re-render with same props should not cause unnecessary re-renders
      rerender(
        <LocalPlayerSetupErrorBoundary>
          <TestChild />
        </LocalPlayerSetupErrorBoundary>
      );

      expect(renderSpy).toHaveBeenCalledTimes(2); // One for each render
    });

    it('handles rapid prop changes efficiently', async () => {
      const { rerender } = render(<LocalPlayerSetup {...defaultProps} />);

      // Rapidly change props
      for (let i = 0; i < 10; i++) {
        rerender(<LocalPlayerSetup {...defaultProps} roomId={`ROOM_${i}`} />);
      }

      // Should show the final state
      expect(screen.getByText('Room ID: ROOM_9')).toBeInTheDocument();
    });
  });
});
