import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import LocalPlayersStep from '../index';

vi.mock('@/components/LocalPlayerSetup/PlayerCard', () => ({
  default: ({ player, onEdit, onDelete }: any) => (
    <div data-testid={`player-card-${player.id}`}>
      <span>{player.name}</span>
      <button onClick={() => onEdit(player)}>Edit</button>
      <button onClick={() => onDelete(player.id)}>Delete</button>
    </div>
  ),
}));

vi.mock('@/components/LocalPlayerSetup/PlayerForm', () => ({
  default: ({ open, onSubmit, onCancel }: any) =>
    open ? (
      <div data-testid="player-form">
        <button
          onClick={() => onSubmit({ name: 'New Player', role: 'vers', gender: 'non-binary' })}
        >
          Submit
        </button>
        <button onClick={onCancel}>Cancel Form</button>
      </div>
    ) : null,
}));

vi.mock('@/components/ButtonRow', () => ({
  default: ({ children }: any) => <div data-testid="button-row">{children}</div>,
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
  Add: () => <span data-testid="add-icon" />,
}));

describe('LocalPlayersStep', () => {
  const mockSetFormData = vi.fn();
  const mockNextStep = vi.fn();
  const mockPrevStep = vi.fn();

  const defaultProps = {
    formData: { room: 'AB12C', gameMode: 'local' },
    setFormData: mockSetFormData,
    nextStep: mockNextStep,
    prevStep: mockPrevStep,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('shows title and subtitle', () => {
      render(<LocalPlayersStep {...defaultProps} />);
      expect(screen.getByTestId('localPlayersStep.title')).toBeInTheDocument();
      expect(screen.getByTestId('localPlayersStep.subtitle')).toBeInTheDocument();
    });

    it('shows empty state when no players', () => {
      render(<LocalPlayersStep {...defaultProps} />);
      expect(screen.getByTestId('localPlayers.noPlayersYet')).toBeInTheDocument();
      expect(screen.getByTestId('localPlayers.addFirstPlayer')).toBeInTheDocument();
    });

    it('shows player cards when initial players provided', () => {
      const formData = {
        ...defaultProps.formData,
        localPlayersData: [
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
        ],
      };
      render(<LocalPlayersStep {...defaultProps} formData={formData} />);
      expect(screen.getByTestId('player-card-p1')).toBeInTheDocument();
      expect(screen.getByTestId('player-card-p2')).toBeInTheDocument();
    });

    it('has Prev and Next buttons', () => {
      render(<LocalPlayersStep {...defaultProps} />);
      expect(screen.getByTestId('previous')).toBeInTheDocument();
      expect(screen.getByTestId('next')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('calls prevStep on Previous click', () => {
      render(<LocalPlayersStep {...defaultProps} />);
      fireEvent.click(screen.getByTestId('previous'));
      expect(mockPrevStep).toHaveBeenCalledTimes(1);
    });

    it('Next is disabled with 0 players', () => {
      render(<LocalPlayersStep {...defaultProps} />);
      expect(screen.getByTestId('next').closest('button')).toBeDisabled();
    });

    it('Next is disabled with 1 player', () => {
      const formData = {
        ...defaultProps.formData,
        localPlayersData: [
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
        ],
      };
      render(<LocalPlayersStep {...defaultProps} formData={formData} />);
      expect(screen.getByTestId('next').closest('button')).toBeDisabled();
    });

    it('Next is enabled with 2 players', () => {
      const formData = {
        ...defaultProps.formData,
        localPlayersData: [
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
        ],
      };
      render(<LocalPlayersStep {...defaultProps} formData={formData} />);
      expect(screen.getByTestId('next').closest('button')).not.toBeDisabled();
    });

    it('clicking Next with valid players calls setFormData and nextStep', () => {
      const formData = {
        ...defaultProps.formData,
        localPlayersData: [
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
        ],
      };
      render(<LocalPlayersStep {...defaultProps} formData={formData} />);
      fireEvent.click(screen.getByTestId('next').closest('button')!);
      expect(mockSetFormData).toHaveBeenCalled();
      expect(mockNextStep).toHaveBeenCalledTimes(1);
    });
  });

  describe('Add Player', () => {
    it('opens PlayerForm when Add First Player is clicked', () => {
      render(<LocalPlayersStep {...defaultProps} />);
      fireEvent.click(screen.getByTestId('localPlayers.addFirstPlayer'));
      expect(screen.getByTestId('player-form')).toBeInTheDocument();
    });

    it('adds a player after form submit', () => {
      render(<LocalPlayersStep {...defaultProps} />);
      fireEvent.click(screen.getByTestId('localPlayers.addFirstPlayer'));
      fireEvent.click(screen.getByText('Submit'));
      expect(screen.queryByTestId('player-form')).not.toBeInTheDocument();
      expect(screen.getByText('New Player')).toBeInTheDocument();
    });

    it('closes form on cancel without adding player', () => {
      render(<LocalPlayersStep {...defaultProps} />);
      fireEvent.click(screen.getByTestId('localPlayers.addFirstPlayer'));
      fireEvent.click(screen.getByText('Cancel Form'));
      expect(screen.queryByTestId('player-form')).not.toBeInTheDocument();
      expect(screen.queryByText('New Player')).not.toBeInTheDocument();
    });
  });
});
