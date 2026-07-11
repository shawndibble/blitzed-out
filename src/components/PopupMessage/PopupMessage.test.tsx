import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import PopupMessage from './index';
import { Message } from '@/types/Message';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}));

const dialogState: { message: Message | false; isMyMessage: boolean } = {
  message: false,
  isMyMessage: false,
};

vi.mock('@/hooks/useSoundAndDialog', () => ({
  default: () => ({
    message: dialogState.message,
    setMessage: vi.fn(),
    isMyMessage: dialogState.isMyMessage,
  }),
}));

vi.mock('@/hooks/useTurnIndicator', () => ({
  default: () => null,
}));

vi.mock('@/hooks/useLocalPlayers', () => ({
  useLocalPlayers: () => ({ hasLocalPlayers: false, isLocalPlayerRoom: false }),
}));

const lastCardProps: { text?: string; isMyMessage?: boolean; open?: boolean } = {};
vi.mock('@/components/ActionCard', () => ({
  default: (props: { text?: string; isMyMessage?: boolean; open?: boolean }) => {
    Object.assign(lastCardProps, props);
    return <div data-testid="action-card" />;
  },
}));

function makeMessage(text: string): Message {
  return {
    id: `msg-${text}`,
    uid: 'u1',
    displayName: 'Player',
    text,
    type: 'actions',
    timestamp: { toDate: () => new Date() } as Message['timestamp'],
  } as Message;
}

describe('PopupMessage game-over latch', () => {
  beforeEach(() => {
    dialogState.message = false;
    dialogState.isMyMessage = false;
  });

  it('keeps my finish (game over) card open when another player rolls', () => {
    dialogState.message = makeMessage('#40: finish\naction: cum');
    dialogState.isMyMessage = true;
    const { rerender } = render(<PopupMessage />);
    expect(lastCardProps.text).toContain('finish');
    expect(lastCardProps.isMyMessage).toBe(true);

    dialogState.message = makeMessage('#12: Spanking\naction: spank yourself');
    dialogState.isMyMessage = false;
    rerender(<PopupMessage />);

    expect(lastCardProps.text).toContain('finish');
    expect(lastCardProps.isMyMessage).toBe(true);
    expect(lastCardProps.open).toBe(true);
  });

  it('replaces a normal card when a new message arrives', () => {
    dialogState.message = makeMessage('#12: Spanking\naction: spank yourself');
    dialogState.isMyMessage = true;
    const { rerender } = render(<PopupMessage />);

    dialogState.message = makeMessage('#13: Bating\naction: edge');
    dialogState.isMyMessage = false;
    rerender(<PopupMessage />);

    expect(lastCardProps.text).toContain('Bating');
    expect(lastCardProps.isMyMessage).toBe(false);
  });

  it("does not latch another player's finish card", () => {
    dialogState.message = makeMessage('#40: finish\naction: cum');
    dialogState.isMyMessage = false;
    const { rerender } = render(<PopupMessage />);

    dialogState.message = makeMessage('#12: Spanking\naction: spank yourself');
    dialogState.isMyMessage = false;
    rerender(<PopupMessage />);

    expect(lastCardProps.text).toContain('Spanking');
  });
});
