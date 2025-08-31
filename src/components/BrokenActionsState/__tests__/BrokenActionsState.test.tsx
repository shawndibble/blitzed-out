import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BrokenActionsState from '../index';

// Mock window.location.reload
Object.defineProperty(window, 'location', {
  value: {
    reload: vi.fn(),
  },
  writable: true,
});

// Mock the necessary modules
const mockWipeAllData = vi.fn().mockImplementation(() => {
  // Simulate successful completion without actually reloading
  return Promise.resolve();
});

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    wipeAllData: mockWipeAllData,
  }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        noActionsAvailable: 'No actions available',
        noActionsAvailableDescription:
          "We couldn't find any available actions for your game configuration.",
        errorPersistsCheckBack: 'If the problem persists, please check back in 24 hours.',
        resetApp: 'Reset App',
        previous: 'Previous',
        next: 'Next',
      };
      return translations[key] || key;
    },
  }),
  Trans: ({ i18nKey }: { i18nKey: string }) => i18nKey,
}));

describe('BrokenActionsState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render error message and reset button', () => {
    render(<BrokenActionsState />);

    expect(screen.getByText('No actions available')).toBeInTheDocument();
    expect(
      screen.getByText("We couldn't find any available actions for your game configuration.")
    ).toBeInTheDocument();
    expect(
      screen.getByText('If the problem persists, please check back in 24 hours.')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset app/i })).toBeInTheDocument();
  });

  it('should render custom title and description when provided', () => {
    const customTitle = 'Custom Error Title';
    const customDescription = 'Custom error description';

    render(<BrokenActionsState title={customTitle} description={customDescription} />);

    expect(screen.getByText(customTitle)).toBeInTheDocument();
    expect(screen.getByText(customDescription)).toBeInTheDocument();
  });

  it('should show navigation buttons by default', () => {
    render(<BrokenActionsState />);

    expect(screen.getByText('previous')).toBeInTheDocument();
    expect(screen.getByText('next')).toBeInTheDocument();
  });

  it('should hide navigation buttons when showNavigation is false', () => {
    render(<BrokenActionsState showNavigation={false} />);

    expect(screen.queryByText('previous')).not.toBeInTheDocument();
    expect(screen.queryByText('next')).not.toBeInTheDocument();
  });

  it.skip('should show loading state when reset button is clicked', () => {
    render(<BrokenActionsState />);

    const resetButton = screen.getByRole('button', { name: /reset app/i });

    // Button should initially be enabled
    expect(resetButton).not.toBeDisabled();

    fireEvent.click(resetButton);

    // Should show loading state immediately after click
    expect(resetButton).toBeDisabled();

    // Verify wipeAllData was called
    expect(mockWipeAllData).toHaveBeenCalledTimes(1);
  });

  it('should have disabled navigation buttons', () => {
    render(<BrokenActionsState />);

    const previousButton = screen.getByRole('button', { name: /previous/i });
    const nextButton = screen.getByRole('button', { name: /next/i });

    expect(previousButton).toBeDisabled();
    expect(nextButton).toBeDisabled();
  });
});
