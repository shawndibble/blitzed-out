import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';
import { useSettingsStore } from '@/stores/settingsStore';
import OnboardingWrapper from '../OnboardingWrapper';

// Mock the settings store
vi.mock('@/stores/settingsStore', () => ({
  useSettingsStore: vi.fn(),
}));

// Mock Material-UI breakpoints
vi.mock('@mui/material', async () => {
  const actual = await vi.importActual('@mui/material');
  return {
    ...actual,
    useMediaQuery: vi.fn(() => true), // Always return true for desktop
    useTheme: vi.fn(() => ({
      breakpoints: {
        up: () => 'md',
      },
    })),
  };
});

const mockUpdateSettings = vi.fn();

describe('OnboardingWrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show onboarding for first-time desktop users', async () => {
    (useSettingsStore as any).mockReturnValue({
      settings: { hasSeenRollButton: false },
      updateSettings: mockUpdateSettings,
    });

    render(
      <OnboardingWrapper>
        <button>Roll Button</button>
      </OnboardingWrapper>
    );

    // Wait for overlay to appear and verify onboarding is active
    await waitFor(
      () => {
        expect(screen.getByText('Roll Button')).toBeInTheDocument();
        // Check that the button has the pulsing animation styles
        const button = screen.getByText('Roll Button').closest('div');
        expect(button).toHaveStyle('position: relative');
      },
      { timeout: 4000 }
    );
  });

  it('should not show onboarding for users who have seen the roll button', () => {
    (useSettingsStore as any).mockReturnValue({
      settings: { hasSeenRollButton: true },
      updateSettings: mockUpdateSettings,
    });

    render(
      <OnboardingWrapper>
        <button>Roll Button</button>
      </OnboardingWrapper>
    );

    // Button should not have animated styles for users who have already seen it
    const button = screen.getByText('Roll Button').closest('div');
    expect(button).not.toHaveStyle('z-index: 9999');
  });

  it('should mark user as having seen roll button when clicked', async () => {
    (useSettingsStore as any).mockReturnValue({
      settings: { hasSeenRollButton: false },
      updateSettings: mockUpdateSettings,
    });

    render(
      <OnboardingWrapper>
        <button>Roll Button</button>
      </OnboardingWrapper>
    );

    // Click the wrapper
    const wrapper = screen.getByText('Roll Button').closest('div');
    fireEvent.click(wrapper!);

    // Should update settings
    expect(mockUpdateSettings).toHaveBeenCalledWith({ hasSeenRollButton: true });
  });

  it('should render children correctly', () => {
    (useSettingsStore as any).mockReturnValue({
      settings: { hasSeenRollButton: true },
      updateSettings: mockUpdateSettings,
    });

    render(
      <OnboardingWrapper>
        <button>Test Button</button>
      </OnboardingWrapper>
    );

    expect(screen.getByText('Test Button')).toBeInTheDocument();
  });
});
