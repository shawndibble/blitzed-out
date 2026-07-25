import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import LocalPlayersStep from '../index';
import { useLocalPlayers } from '@/hooks/useLocalPlayers';

vi.mock('@/hooks/useLocalPlayers', () => ({
  useLocalPlayers: vi.fn(),
}));

const mockUseLocalPlayers = vi.mocked(useLocalPlayers);

vi.mock('@/components/LocalPlayerSetup/PlayerCard', () => ({
  default: ({ player }: any) => <div data-testid={`player-card-${player.id}`}>{player.name}</div>,
}));

vi.mock('@/components/LocalPlayerSetup/PlayerForm', () => ({
  default: ({ open, onCancel }: any) =>
    open ? (
      <div data-testid="player-form">
        <button onClick={onCancel}>Cancel Form</button>
      </div>
    ) : null,
}));

vi.mock('@/components/ButtonRow', () => ({
  default: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('react-i18next', () => ({
  Trans: ({ i18nKey }: any) => <span data-testid={i18nKey}>{i18nKey}</span>,
  useTranslation: () => ({
    t: (key: string, opts?: any) => {
      if (opts?.count !== undefined) return `count: ${opts.count}`;
      if (opts?.number !== undefined) return `player_${opts.number}`;
      return key;
    },
  }),
}));

vi.mock('@mui/icons-material', () => ({
  Add: () => <span />,
}));

describe('LocalPlayersStep Navigation and Defaults', () => {
  const mockSetFormData = vi.fn();
  const mockNextStep = vi.fn();
  const mockPrevStep = vi.fn();

  const baseFormData = { room: 'AB12C', gameMode: 'local' };

  const twoPlayers = [
    {
      id: 'p1',
      name: 'Alice',
      role: 'dom',
      gender: 'female',
      order: 0,
      isActive: true,
      deviceId: 'dev',
      location: 0,
      isFinished: false,
    },
    {
      id: 'p2',
      name: 'Bob',
      role: 'sub',
      gender: 'male',
      order: 1,
      isActive: false,
      deviceId: 'dev',
      location: 0,
      isFinished: false,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseLocalPlayers.mockReturnValue({ localPlayers: [], session: null } as any);
  });

  it('uses "previous" i18n key, not "back"', () => {
    render(
      <LocalPlayersStep
        formData={baseFormData}
        setFormData={mockSetFormData}
        nextStep={mockNextStep}
        prevStep={mockPrevStep}
      />
    );
    expect(screen.getByTestId('previous')).toBeInTheDocument();
    expect(screen.queryByTestId('back')).not.toBeInTheDocument();
  });

  it('Previous button calls prevStep', () => {
    render(
      <LocalPlayersStep
        formData={baseFormData}
        setFormData={mockSetFormData}
        nextStep={mockNextStep}
        prevStep={mockPrevStep}
      />
    );
    fireEvent.click(screen.getByTestId('previous'));
    expect(mockPrevStep).toHaveBeenCalledTimes(1);
  });

  it('restores existing players from formData', () => {
    render(
      <LocalPlayersStep
        formData={{ ...baseFormData, localPlayersData: twoPlayers }}
        setFormData={mockSetFormData}
        nextStep={mockNextStep}
        prevStep={mockPrevStep}
      />
    );
    expect(screen.getByTestId('player-card-p1')).toBeInTheDocument();
    expect(screen.getByTestId('player-card-p2')).toBeInTheDocument();
  });

  it('Next saves players and session settings to formData', () => {
    const sessionSettings = {
      showTurnTransitions: true,
      enableTurnSounds: false,
      showPlayerAvatars: true,
    };

    render(
      <LocalPlayersStep
        formData={{
          ...baseFormData,
          localPlayersData: twoPlayers,
          localPlayerSessionSettings: sessionSettings,
        }}
        setFormData={mockSetFormData}
        nextStep={mockNextStep}
        prevStep={mockPrevStep}
      />
    );

    fireEvent.click(screen.getByTestId('next').closest('button')!);

    expect(mockSetFormData).toHaveBeenCalledWith(expect.any(Function));
    const updater = mockSetFormData.mock.calls[0][0];
    const result = updater({
      ...baseFormData,
      localPlayersData: twoPlayers,
      localPlayerSessionSettings: sessionSettings,
    });

    expect(result.hasLocalPlayers).toBe(true);
    expect(result.localPlayersData).toEqual(twoPlayers);
    expect(result.localPlayerSessionSettings).toEqual(sessionSettings);
    expect(mockNextStep).toHaveBeenCalledTimes(1);
  });

  it('gracefully handles null/undefined localPlayersData', () => {
    render(
      <LocalPlayersStep
        formData={{ ...baseFormData, localPlayersData: null, localPlayerSessionSettings: null }}
        setFormData={mockSetFormData}
        nextStep={mockNextStep}
        prevStep={mockPrevStep}
      />
    );
    expect(screen.getByTestId('localPlayersStep.title')).toBeInTheDocument();
  });

  describe('Mid-game reopen — seeding from the live session', () => {
    const liveSettings = {
      showTurnTransitions: false,
      enableTurnSounds: true,
      showPlayerAvatars: true,
    };

    it('seeds players from the live session when formData has no staged players', () => {
      mockUseLocalPlayers.mockReturnValue({
        localPlayers: twoPlayers,
        session: { roomId: 'AB12C', settings: liveSettings },
      } as any);

      render(
        <LocalPlayersStep
          formData={baseFormData}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );

      expect(screen.getByTestId('player-card-p1')).toBeInTheDocument();
      expect(screen.getByTestId('player-card-p2')).toBeInTheDocument();
    });

    it('prefers in-wizard staged formData over the live session (back-navigation within the wizard)', () => {
      mockUseLocalPlayers.mockReturnValue({
        localPlayers: [{ ...twoPlayers[0], name: 'Live Alice' }],
        session: { roomId: 'AB12C', settings: liveSettings },
      } as any);

      render(
        <LocalPlayersStep
          formData={{ ...baseFormData, localPlayersData: twoPlayers }}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );

      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.queryByText('Live Alice')).not.toBeInTheDocument();
    });

    it('ignores a live session belonging to a different room', () => {
      mockUseLocalPlayers.mockReturnValue({
        localPlayers: twoPlayers,
        session: { roomId: 'OTHERROOM', settings: liveSettings },
      } as any);

      render(
        <LocalPlayersStep
          formData={baseFormData}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );

      expect(screen.queryByTestId('player-card-p1')).not.toBeInTheDocument();
      expect(screen.getByTestId('localPlayers.noPlayersYet')).toBeInTheDocument();
    });

    it('carries each existing player through unchanged (id/location survive) on Next', () => {
      const playersWithProgress = [
        { ...twoPlayers[0], location: 6 },
        { ...twoPlayers[1], location: 9, isActive: true },
      ];
      mockUseLocalPlayers.mockReturnValue({
        localPlayers: playersWithProgress,
        session: { roomId: 'AB12C', settings: liveSettings },
      } as any);

      render(
        <LocalPlayersStep
          formData={baseFormData}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );

      fireEvent.click(screen.getByTestId('next').closest('button')!);

      const updater = mockSetFormData.mock.calls[0][0];
      const result = updater(baseFormData);
      expect(result.localPlayersData).toEqual(playersWithProgress);
    });

    it('seeds session settings from the live session, not the hardcoded defaults', () => {
      mockUseLocalPlayers.mockReturnValue({
        localPlayers: twoPlayers,
        session: { roomId: 'AB12C', settings: liveSettings },
      } as any);

      render(
        <LocalPlayersStep
          formData={baseFormData}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );

      fireEvent.click(screen.getByTestId('next').closest('button')!);

      const updater = mockSetFormData.mock.calls[0][0];
      const result = updater(baseFormData);
      expect(result.localPlayerSessionSettings).toEqual(liveSettings);
    });
  });
});
