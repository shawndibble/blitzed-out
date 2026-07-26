import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import GameSettings from '../index';

const navigateMock = vi.fn();
const submitMock = vi.fn().mockResolvedValue(undefined);

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
  useParams: () => ({ id: 'ABCDE' }),
  useSearchParams: () => [new URLSearchParams('resumeStep=3'), vi.fn()],
}));

vi.mock('react-i18next', () => ({
  Trans: ({ i18nKey }: any) => <span>{i18nKey}</span>,
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@mui/icons-material/ArrowBack', () => ({ default: () => <span /> }));
vi.mock('@mui/icons-material/Add', () => ({ default: () => <span /> }));

vi.mock('@/hooks/useAuth', () => ({
  default: () => ({ user: { displayName: 'Tester' } }),
}));
vi.mock('@/hooks/useBreakpoint', () => ({ default: () => false }));
vi.mock('@/hooks/useLocalPlayers', () => ({
  useLocalPlayers: () => ({ hasLocalPlayers: false }),
}));
vi.mock('@/stores/settingsStore', () => ({
  useSettings: () => [{}, vi.fn()],
}));
vi.mock('@/hooks/useSettingsToFormData', () => ({
  default: () => [
    {
      room: 'ABCDE',
      gameMode: 'online',
      soloPlay: true,
      selectedActions: {},
      finishRange: [30, 70],
    },
    vi.fn(),
  ],
}));
vi.mock('@/hooks/useSubmitGameSettings', () => ({
  default: () => ({ submit: submitMock, isSubmitting: false, error: null }),
}));
vi.mock('@/hooks/useUnifiedActionList', () => ({
  default: () => ({ actionsList: {}, isLoading: false }),
}));
vi.mock('../validateForm', () => ({ default: () => null }));

vi.mock('@/views/CustomTileDialog', () => ({ default: () => null }));
vi.mock('../sections/ActionsSection', () => ({ default: () => null }));
vi.mock('../sections/DisplaySection', () => ({ default: () => null }));
vi.mock('../sections/PlayingCard', () => ({ default: () => null }));
vi.mock('../sections/RoomSection', () => ({ default: () => null }));
vi.mock('../sections/SizePaceSection', () => ({ default: () => null }));
vi.mock('../sections/SoundSection', () => ({ default: () => null }));
vi.mock('../components/JumpNav', () => ({ default: () => null }));
vi.mock('../components/SettingsSection', () => ({
  default: ({ children }: any) => <div>{children}</div>,
}));
vi.mock('@/components/ToastAlert', () => ({
  default: ({ children }: any) => <div>{children}</div>,
}));

describe('GameSettings Update button', () => {
  it('navigates straight to the room, dropping resumeStep, even when Advanced was reached from the wizard', async () => {
    render(<GameSettings />);

    fireEvent.click(screen.getAllByText('update')[0]);

    await vi.waitFor(() => expect(submitMock).toHaveBeenCalled());
    expect(navigateMock).toHaveBeenCalledWith('/ABCDE');
    expect(navigateMock).not.toHaveBeenCalledWith(expect.stringContaining('resumeStep'));
  });
});
