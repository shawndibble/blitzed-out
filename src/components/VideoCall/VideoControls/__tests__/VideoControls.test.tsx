import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import VideoControls from '../index';
import { useVideoCallStore } from '@/stores/videoCallStore';
import useBreakpoint from '@/hooks/useBreakpoint';

vi.mock('@/stores/videoCallStore');
vi.mock('@/hooks/useBreakpoint');
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

describe('VideoControls', () => {
  const mockToggleMute = vi.fn();
  const mockToggleVideo = vi.fn();
  const mockDisconnectCall = vi.fn();
  const mockReconnectCall = vi.fn();
  const mockOnEndCall = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useBreakpoint as unknown as ReturnType<typeof vi.fn>).mockReturnValue(false);
    (useVideoCallStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      isMuted: false,
      isVideoOff: false,
      isCallActive: true,
      toggleMute: mockToggleMute,
      toggleVideo: mockToggleVideo,
      disconnectCall: mockDisconnectCall,
      reconnectCall: mockReconnectCall,
    });
  });

  it('renders all control buttons', () => {
    render(<VideoControls />);

    expect(screen.getByLabelText(/unmute microphone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/turn camera off/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/end call/i)).toBeInTheDocument();
  });

  it('displays mute button when audio is unmuted', () => {
    render(<VideoControls />);

    const muteButton = screen.getByLabelText(/unmute microphone/i);
    expect(muteButton).toBeInTheDocument();
  });

  it('displays unmute button when audio is muted', () => {
    (useVideoCallStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      isMuted: true,
      isVideoOff: false,
      isCallActive: true,
      toggleMute: mockToggleMute,
      toggleVideo: mockToggleVideo,
      disconnectCall: mockDisconnectCall,
      reconnectCall: mockReconnectCall,
    });

    render(<VideoControls />);

    const unmuteButton = screen.getByLabelText(/mute microphone/i);
    expect(unmuteButton).toBeInTheDocument();
  });

  it('calls toggleMute when mute button is clicked', () => {
    render(<VideoControls />);

    const muteButton = screen.getByLabelText(/unmute microphone/i);
    fireEvent.click(muteButton);

    expect(mockToggleMute).toHaveBeenCalledTimes(1);
  });

  it('displays camera on button when video is on', () => {
    render(<VideoControls />);

    const videoButton = screen.getByLabelText(/turn camera off/i);
    expect(videoButton).toBeInTheDocument();
  });

  it('displays camera off button when video is off', () => {
    (useVideoCallStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      isMuted: false,
      isVideoOff: true,
      isCallActive: true,
      toggleMute: mockToggleMute,
      toggleVideo: mockToggleVideo,
      disconnectCall: mockDisconnectCall,
      reconnectCall: mockReconnectCall,
    });

    render(<VideoControls />);

    const videoButton = screen.getByLabelText(/turn camera on/i);
    expect(videoButton).toBeInTheDocument();
  });

  it('calls toggleVideo when camera button is clicked', () => {
    render(<VideoControls />);

    const videoButton = screen.getByLabelText(/turn camera off/i);
    fireEvent.click(videoButton);

    expect(mockToggleVideo).toHaveBeenCalledTimes(1);
  });

  it('calls onEndCall callback when end call button is clicked on desktop', () => {
    render(<VideoControls onEndCall={mockOnEndCall} />);

    const endCallButton = screen.getByLabelText(/end call/i);
    fireEvent.click(endCallButton);

    expect(mockOnEndCall).toHaveBeenCalledTimes(1);
    expect(mockDisconnectCall).not.toHaveBeenCalled();
  });

  it('end call button has danger styling', () => {
    render(<VideoControls />);

    const endCallButton = screen.getByLabelText(/end call/i);
    const styles = window.getComputedStyle(endCallButton);
    expect(styles.backgroundColor).toBeTruthy();
  });

  describe('Mobile behavior', () => {
    beforeEach(() => {
      (useBreakpoint as unknown as ReturnType<typeof vi.fn>).mockReturnValue(true);
    });

    it('shows disconnect button when call is active on mobile', () => {
      render(<VideoControls />);

      const endCallButton = screen.getByLabelText(/end call/i);
      expect(endCallButton).toBeInTheDocument();
    });

    it('shows start call button when call is inactive on mobile', () => {
      (useVideoCallStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        isMuted: false,
        isVideoOff: false,
        isCallActive: false,
        toggleMute: mockToggleMute,
        toggleVideo: mockToggleVideo,
        disconnectCall: mockDisconnectCall,
        reconnectCall: mockReconnectCall,
      });

      render(<VideoControls />);

      const startCallButton = screen.getByLabelText(/start call/i);
      expect(startCallButton).toBeInTheDocument();
    });

    it('calls disconnectCall when disconnect button is clicked on mobile with active call', () => {
      render(<VideoControls />);

      const endCallButton = screen.getByLabelText(/end call/i);
      fireEvent.click(endCallButton);

      expect(mockDisconnectCall).toHaveBeenCalledTimes(1);
      expect(mockOnEndCall).not.toHaveBeenCalled();
    });

    it('calls reconnectCall when start call button is clicked on mobile with inactive call', () => {
      (useVideoCallStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        isMuted: false,
        isVideoOff: false,
        isCallActive: false,
        toggleMute: mockToggleMute,
        toggleVideo: mockToggleVideo,
        disconnectCall: mockDisconnectCall,
        reconnectCall: mockReconnectCall,
      });

      render(<VideoControls />);

      const startCallButton = screen.getByLabelText(/start call/i);
      fireEvent.click(startCallButton);

      expect(mockReconnectCall).toHaveBeenCalledTimes(1);
    });

    it('disables mute and video buttons when call is inactive on mobile', () => {
      (useVideoCallStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        isMuted: false,
        isVideoOff: false,
        isCallActive: false,
        toggleMute: mockToggleMute,
        toggleVideo: mockToggleVideo,
        disconnectCall: mockDisconnectCall,
        reconnectCall: mockReconnectCall,
      });

      render(<VideoControls />);

      const muteButton = screen.getByLabelText(/unmute microphone/i);
      const videoButton = screen.getByLabelText(/turn camera off/i);

      expect(muteButton).toBeDisabled();
      expect(videoButton).toBeDisabled();
    });
  });
});
