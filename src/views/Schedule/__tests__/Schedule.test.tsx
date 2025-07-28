import { screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithSchedule } from '@/test-utils';
import Schedule from '../index';

// Mock useBreakpoint hook
vi.mock('@/hooks/useBreakpoint', () => ({
  default: vi.fn(() => false), // default to desktop
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        schedule: 'Schedule',
        upcomingGames: 'Upcoming Games',
        scheduleGame: 'Schedule Game',
        dateTime: 'Date & Time',
        camUrl: 'Camera URL',
        noPlannedGames: 'No Planned Games',
        scheduleFirstGame: 'Schedule your first game',
        optionalLinkHelper: 'Optional link helper text',
      };
      return translations[key] || key;
    },
  }),
  Trans: ({ i18nKey, children }: { i18nKey: string; children?: React.ReactNode }) =>
    children || i18nKey,
}));

// Mock schedule context with empty schedule
const mockScheduleContext = {
  schedule: [],
  addToSchedule: vi.fn(),
  removeFromSchedule: vi.fn(),
  clearSchedule: vi.fn(),
};

vi.mock('@/context/hooks/useSchedule', () => ({
  default: () => mockScheduleContext,
}));

describe('Schedule Component', () => {
  const defaultProps = {
    open: true,
    close: vi.fn(),
    isMobile: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without errors when opened', () => {
    expect(() => {
      renderWithSchedule(<Schedule {...defaultProps} />);
    }).not.toThrow();
  });

  it('displays the schedule dialog when open', () => {
    renderWithSchedule(<Schedule {...defaultProps} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Upcoming Games')).toBeInTheDocument();
    expect(screen.getByText('scheduleGame')).toBeInTheDocument();
  });

  it('displays date time picker without errors', () => {
    renderWithSchedule(<Schedule {...defaultProps} />);

    // The DateTimePicker should be rendered without throwing LocalizationProvider errors
    // Use a more specific selector since DateTimePicker creates complex internal structure
    const dateTimeGroup = screen.getByRole('group');
    expect(dateTimeGroup).toBeInTheDocument();
    expect(dateTimeGroup).toHaveAttribute('aria-labelledby');
  });

  it('shows empty state when no games are scheduled', () => {
    renderWithSchedule(<Schedule {...defaultProps} />);

    expect(screen.getByText('No Planned Games')).toBeInTheDocument();
    expect(screen.getByText('Schedule your first game')).toBeInTheDocument();
  });

  it('displays form fields correctly', () => {
    renderWithSchedule(<Schedule {...defaultProps} />);

    // Check for DateTimePicker by its role
    expect(screen.getByRole('group')).toBeInTheDocument();
    expect(screen.getByLabelText('Camera URL')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /schedule/i })).toBeInTheDocument();
  });

  it('calls close function when close button is clicked', () => {
    const mockClose = vi.fn();
    renderWithSchedule(<Schedule {...defaultProps} close={mockClose} />);

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it('does not render when closed', () => {
    renderWithSchedule(<Schedule {...defaultProps} open={false} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('handles mobile layout correctly', () => {
    renderWithSchedule(<Schedule {...defaultProps} isMobile={true} />);

    // Should still render without errors in mobile mode
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('group')).toBeInTheDocument();
  });
});
