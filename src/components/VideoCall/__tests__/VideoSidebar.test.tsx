import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import VideoSidebar from '../VideoSidebar';

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

const mockInitialize = vi.fn();
const mockCleanup = vi.fn();

vi.mock('@/stores/videoCallStore', () => ({
  useVideoCallStore: () => ({
    initialize: mockInitialize,
    cleanup: mockCleanup,
    isInitialized: false,
  }),
}));

vi.mock('../VideoCallPanel', () => ({
  default: () => <div data-testid="video-call-panel">Video Call Panel</div>,
}));

describe('VideoSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders toggle button', () => {
    render(<VideoSidebar roomId="test-room" />);

    expect(screen.getByLabelText(/open video sidebar/i)).toBeInTheDocument();
  });

  it('opens sidebar when toggle button is clicked', () => {
    render(<VideoSidebar roomId="test-room" />);

    const toggleButton = screen.getByLabelText(/open video sidebar/i);
    fireEvent.click(toggleButton);

    expect(screen.getByTestId('video-call-panel')).toBeInTheDocument();
    expect(mockInitialize).toHaveBeenCalledWith('test-room');
  });

  it('calls onToggle callback when sidebar is opened', () => {
    const onToggle = vi.fn();
    render(<VideoSidebar roomId="test-room" onToggle={onToggle} />);

    const toggleButton = screen.getByLabelText(/open video sidebar/i);
    fireEvent.click(toggleButton);

    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it('closes sidebar when toggle button is clicked again', () => {
    render(<VideoSidebar roomId="test-room" />);

    const toggleButton = screen.getByLabelText(/open video sidebar/i);

    // Open sidebar
    fireEvent.click(toggleButton);
    expect(screen.getByTestId('video-call-panel')).toBeInTheDocument();

    // Close sidebar
    const closeButton = screen.getByLabelText(/close video sidebar/i);
    fireEvent.click(closeButton);

    expect(mockCleanup).toHaveBeenCalled();
  });

  it('cleans up on unmount', () => {
    const { unmount } = render(<VideoSidebar roomId="test-room" />);

    unmount();

    expect(mockCleanup).toHaveBeenCalled();
  });
});
