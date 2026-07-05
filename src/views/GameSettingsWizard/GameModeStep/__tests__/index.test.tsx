import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GameModeStep from '../index';

vi.mock('react-i18next', () => ({
  Trans: ({ i18nKey }: any) => <span data-testid={i18nKey}>{i18nKey}</span>,
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        dominantRoleDesc: 'Dominant role description',
        switchRoleDesc: 'Switch role description',
        submissiveRoleDesc: 'Submissive role description',
        foreplayClothedDesc: 'Clothed description',
        intimateNudityDesc: 'Naked description',
        dom: 'Dominant',
        vers: 'Switch',
        sub: 'Submissive',
        noNaked: 'Clothed',
        yesNaked: 'Naked',
        selected: 'Selected',
        'localPlayers.gender.male': 'Male',
        'localPlayers.gender.female': 'Female',
        'localPlayers.gender.nonBinary': 'Non-binary',
        'participationStyle.title': 'How are you participating?',
        'participationStyle.subtitle': 'Choose whether you are playing solo or with others.',
        'participationStyle.solo.title': 'Solo-Sexual',
        'participationStyle.solo.description': 'Actions are just for you.',
        'participationStyle.group.title': 'With Others',
        'participationStyle.group.description': 'Actions involve partners.',
      };
      return map[key] || key;
    },
  }),
}));

vi.mock('@/components/ButtonRow', () => ({
  default: ({ children }: any) => <div data-testid="button-row">{children}</div>,
}));

describe('GameModeStep', () => {
  const mockSetFormData = vi.fn();
  const mockNextStep = vi.fn();
  const mockPrevStep = vi.fn();
  const user = userEvent.setup();

  const baseFormData = {
    gameMode: 'solo' as const,
    role: 'sub' as const,
    gender: 'non-binary' as const,
    isNaked: false,
    room: 'PUBLIC',
    boardUpdated: false,
    soloPlay: true as boolean | undefined,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders title and buttons', () => {
      render(
        <GameModeStep
          formData={baseFormData}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );
      expect(screen.getByTestId('gameModeSelection')).toBeInTheDocument();
      expect(screen.getByTestId('previous')).toBeInTheDocument();
      expect(screen.getByTestId('next')).toBeInTheDocument();
    });
  });

  describe('Solo mode', () => {
    it('shows only anatomy section', () => {
      render(
        <GameModeStep
          formData={{ ...baseFormData, gameMode: 'solo' }}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );
      expect(screen.getByTestId('yourGender')).toBeInTheDocument();
      expect(screen.getByText('Male')).toBeInTheDocument();
      expect(screen.getByText('Female')).toBeInTheDocument();
    });

    it('hides role selection for solo mode', () => {
      render(
        <GameModeStep
          formData={{ ...baseFormData, gameMode: 'solo' }}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );
      expect(screen.queryByTestId('yourRole')).not.toBeInTheDocument();
    });

    it('hides naked/clothed section for solo mode', () => {
      render(
        <GameModeStep
          formData={{ ...baseFormData, gameMode: 'solo' }}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );
      expect(screen.queryByTestId('areYouNaked')).not.toBeInTheDocument();
    });

    it('hides participation style for solo mode', () => {
      render(
        <GameModeStep
          formData={{ ...baseFormData, gameMode: 'solo' }}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );
      expect(screen.queryByTestId('participation-solo')).not.toBeInTheDocument();
      expect(screen.queryByTestId('participation-group')).not.toBeInTheDocument();
    });
  });

  describe('Online mode — participation style', () => {
    const onlineBase = {
      ...baseFormData,
      gameMode: 'online' as const,
      soloPlay: true as boolean | undefined,
    };

    it('shows participation style selector', () => {
      render(
        <GameModeStep
          formData={onlineBase}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );
      expect(screen.getByTestId('participation-solo')).toBeInTheDocument();
      expect(screen.getByTestId('participation-group')).toBeInTheDocument();
    });

    it('soloPlay=true: shows only anatomy, hides role and naked', () => {
      render(
        <GameModeStep
          formData={{ ...onlineBase, soloPlay: true }}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );
      expect(screen.getByTestId('yourGender')).toBeInTheDocument();
      expect(screen.queryByTestId('yourRole')).not.toBeInTheDocument();
      expect(screen.queryByTestId('areYouNaked')).not.toBeInTheDocument();
    });

    it('soloPlay=false: shows anatomy, role, and naked', () => {
      render(
        <GameModeStep
          formData={{ ...onlineBase, soloPlay: false }}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );
      expect(screen.getByTestId('yourGender')).toBeInTheDocument();
      expect(screen.getByTestId('yourRole')).toBeInTheDocument();
      expect(screen.getByTestId('areYouNaked')).toBeInTheDocument();
    });

    it('clicking With Others sets soloPlay=false', async () => {
      render(
        <GameModeStep
          formData={{ ...onlineBase, soloPlay: true }}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );
      const groupCard = screen.getByTestId('participation-group');
      await user.click(groupCard);
      expect(mockSetFormData).toHaveBeenCalledWith(expect.objectContaining({ soloPlay: false }));
    });

    it('clicking Solo-Sexual sets soloPlay=true', async () => {
      render(
        <GameModeStep
          formData={{ ...onlineBase, soloPlay: false }}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );
      const soloCard = screen.getByTestId('participation-solo');
      await user.click(soloCard);
      expect(mockSetFormData).toHaveBeenCalledWith(expect.objectContaining({ soloPlay: true }));
    });
  });

  describe('Local mode', () => {
    it('hides gender picker', () => {
      render(
        <GameModeStep
          formData={{ ...baseFormData, gameMode: 'local' }}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );
      expect(screen.queryByTestId('yourGender')).not.toBeInTheDocument();
    });

    it('hides role selection', () => {
      render(
        <GameModeStep
          formData={{ ...baseFormData, gameMode: 'local' }}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );
      expect(screen.queryByTestId('yourRole')).not.toBeInTheDocument();
    });

    it('shows naked/clothed section', () => {
      render(
        <GameModeStep
          formData={{ ...baseFormData, gameMode: 'local' }}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );
      expect(screen.getByTestId('areYouNaked')).toBeInTheDocument();
      expect(screen.getByText('Clothed')).toBeInTheDocument();
      expect(screen.getByText('Naked')).toBeInTheDocument();
    });

    it('hides participation style', () => {
      render(
        <GameModeStep
          formData={{ ...baseFormData, gameMode: 'local' }}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );
      expect(screen.queryByTestId('participation-solo')).not.toBeInTheDocument();
    });
  });

  describe('Intensity selection (local mode)', () => {
    it('updates formData when naked is selected', async () => {
      render(
        <GameModeStep
          formData={{ ...baseFormData, gameMode: 'local', isNaked: false }}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );
      const nakedCard = screen.getByText('Naked').closest('[role="button"]')!;
      await user.click(nakedCard);
      expect(mockSetFormData).toHaveBeenCalledWith(expect.objectContaining({ isNaked: true }));
    });

    it('updates formData when clothed is selected', async () => {
      render(
        <GameModeStep
          formData={{ ...baseFormData, gameMode: 'local', isNaked: true }}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );
      const clothedCard = screen.getByText('Clothed').closest('[role="button"]')!;
      await user.click(clothedCard);
      expect(mockSetFormData).toHaveBeenCalledWith(expect.objectContaining({ isNaked: false }));
    });
  });

  describe('Role selection (online group play)', () => {
    it('updates formData when role is clicked', async () => {
      render(
        <GameModeStep
          formData={{ ...baseFormData, gameMode: 'online', soloPlay: false }}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );
      const domCard = screen.getByText('Dominant').closest('[role="button"]')!;
      await user.click(domCard);
      expect(mockSetFormData).toHaveBeenCalledWith(expect.objectContaining({ role: 'dom' }));
    });
  });

  describe('Navigation', () => {
    it('calls prevStep when Previous is clicked', async () => {
      render(
        <GameModeStep
          formData={baseFormData}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );
      await user.click(screen.getByTestId('previous'));
      expect(mockPrevStep).toHaveBeenCalledTimes(1);
    });

    it('calls nextStep when Next is clicked', async () => {
      render(
        <GameModeStep
          formData={baseFormData}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );
      await user.click(screen.getByTestId('next'));
      expect(mockNextStep).toHaveBeenCalledTimes(1);
    });
  });

  describe('Backward compatibility', () => {
    it('treats soloPlay=undefined as solo-sexual for online mode', () => {
      render(
        <GameModeStep
          formData={{ ...baseFormData, gameMode: 'online', soloPlay: undefined }}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );
      // soloPlay undefined → treated as true → only anatomy, no role or naked
      expect(screen.getByTestId('yourGender')).toBeInTheDocument();
      expect(screen.queryByTestId('yourRole')).not.toBeInTheDocument();
      expect(screen.queryByTestId('areYouNaked')).not.toBeInTheDocument();
    });
  });

  describe('Legacy test — does NOT show playingWithPeople toggle', () => {
    it('does NOT show Local/Online mode toggle (removed)', () => {
      render(
        <GameModeStep
          formData={baseFormData}
          setFormData={mockSetFormData}
          nextStep={mockNextStep}
          prevStep={mockPrevStep}
        />
      );
      expect(screen.queryByTestId('playingWithPeople')).not.toBeInTheDocument();
    });
  });
});
