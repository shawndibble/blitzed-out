import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import Message from '../index';
import { Message as MessageType } from '@/types/Message';
import { Timestamp } from 'firebase/firestore';

// Mock dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      const translations: Record<string, string> = {
        gameSettings: 'Game Settings',
        roomSettings: 'Room Settings',
        updatedGameSettings: 'updated game settings',
        updatedRoomSettings: 'updated room settings',
        updatedMultipleSettings: `updated ${options?.count || 0} settings`,
        importBoard: 'Import Board',
        incompatibleBoard: 'Incompatible board',
        room: 'Room',
        copiedLink: 'Link copied',
        finish: 'finish',
        playAgain: 'Play Again',
      };
      return translations[key] || key;
    },
    i18n: {
      resolvedLanguage: 'en',
    },
  }),
  Trans: ({ i18nKey }: { i18nKey: string }) => <span>{i18nKey}</span>,
}));

vi.mock('@/components/DeleteMessageButton', () => ({
  default: ({ id }: { room: string; id: string }) => (
    <button data-testid={`delete-${id}`}>Delete</button>
  ),
}));

vi.mock('@/components/GameOverDialog', () => ({
  default: ({ isOpen }: { isOpen: boolean; close: () => void }) =>
    isOpen ? <div data-testid="game-over-dialog">Game Over Dialog</div> : null,
}));

vi.mock('@/components/TextAvatar', () => ({
  default: ({ uid, displayName }: { uid: string; displayName: string }) => (
    <div data-testid={`avatar-${uid}`}>{displayName[0]}</div>
  ),
}));

vi.mock('@/components/CopyToClipboard', () => ({
  default: ({ icon }: { text: string; icon: ReactNode }) => (
    <button data-testid="copy-button">{icon}</button>
  ),
}));

vi.mock('../actionText', () => ({
  default: ({ text }: { text: string }) => <span data-testid="action-text">{text}</span>,
}));

vi.mock('@/helpers/timestamp', () => ({
  parseMessageTimestamp: () => new Date(2024, 0, 1, 12, 0, 0),
}));

vi.mock('@/helpers/momentLocale', () => ({
  getDayjsWithLocale: () => ({
    fromNow: () => '2 minutes ago',
    subtract: () => ({
      fromNow: () => '2 minutes ago',
    }),
    diff: () => 120,
  }),
}));

// Test wrapper component
const TestWrapper = ({ children }: { children: ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

// Helper function to create mock messages
const createMockMessage = (
  id: string,
  text: string,
  type: 'chat' | 'settings' | 'room' | 'actions' | 'media' = 'chat',
  uid = 'user1',
  displayName = 'Test User',
  _timestamp: Date = new Date(),
  additionalProps: Partial<MessageType> = {}
): MessageType => {
  const baseMessage = {
    id,
    text,
    uid,
    displayName,
    timestamp: {
      toDate: () => new Date(2024, 0, 1, 12, 0, 0),
    } as Timestamp,
    type,
    ...additionalProps,
  };

  if (type === 'settings') {
    return {
      ...baseMessage,
      boardSize: 40,
      gameBoardId: 'test-board-id',
    } as MessageType;
  }

  if (type === 'room') {
    return {
      ...baseMessage,
      settings: JSON.stringify({ room: 'TEST-ROOM' }),
    } as MessageType;
  }

  return baseMessage as MessageType;
};

describe('System Message Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Settings Message Rendering', () => {
    it('should render compact system notification for settings message', () => {
      const settingsMessage = createMockMessage(
        'settings1',
        '### Room Settings\r\n* gameMode: online\r\n* boardSize: 40\r\n* difficulty: medium',
        'settings',
        'user1',
        'John'
      );

      render(
        <TestWrapper>
          <Message
            message={settingsMessage}
            isOwnMessage={false}
            room="TEST-ROOM"
            currentGameBoardSize={40}
          />
        </TestWrapper>
      );

      // Check system message structure
      expect(screen.getByTestId('message-settings1')).toHaveClass('system-message');
      expect(screen.getByText('John updated game settings')).toBeInTheDocument();
      expect(screen.getByTestId('details-button-settings1')).toBeInTheDocument();

      // Check system icon
      expect(screen.getByTestId('SettingsIcon')).toBeInTheDocument();
    });

    it('should render compact system notification for room message', () => {
      const roomMessage = createMockMessage(
        'room1',
        '### Room Settings\r\n* roomName: TEST-ROOM\r\n* privacy: public',
        'room',
        'user2',
        'Alice'
      );

      render(
        <TestWrapper>
          <Message
            message={roomMessage}
            isOwnMessage={false}
            room="TEST-ROOM"
            currentGameBoardSize={40}
          />
        </TestWrapper>
      );

      // Check system message structure
      expect(screen.getByTestId('message-room1')).toHaveClass('system-message');
      expect(screen.getByText('Alice updated room settings')).toBeInTheDocument();
      expect(screen.getByTestId('details-button-room1')).toBeInTheDocument();

      // Check system icon
      expect(screen.getByTestId('HomeIcon')).toBeInTheDocument();
    });

    it('should generate smart summary for multiple settings', () => {
      const multipleSettingsMessage = createMockMessage(
        'settings2',
        '### Room Settings\r\n* gameMode: online\r\n* boardSize: 40\r\n* difficulty: medium\r\n* theme: dark\r\n* autoRoll: true',
        'settings',
        'user3',
        'Bob'
      );

      render(
        <TestWrapper>
          <Message
            message={multipleSettingsMessage}
            isOwnMessage={false}
            room="TEST-ROOM"
            currentGameBoardSize={40}
          />
        </TestWrapper>
      );

      // Should show count-based summary for multiple settings
      expect(screen.getByText('Bob updated 5 settings')).toBeInTheDocument();
    });

    it('should display timestamp in system message', () => {
      const settingsMessage = createMockMessage('settings3', 'Settings updated', 'settings');

      render(
        <TestWrapper>
          <Message
            message={settingsMessage}
            isOwnMessage={false}
            room="TEST-ROOM"
            currentGameBoardSize={40}
          />
        </TestWrapper>
      );

      // Check for timestamp text rather than chip
      expect(screen.getByText('2 minutes ago')).toBeInTheDocument();
    });
  });

  describe('Details Popover Functionality', () => {
    it('should open details popover when info button is clicked', async () => {
      const settingsMessage = createMockMessage(
        'settings4',
        '### Room Settings\r\n* gameMode: online\r\n* boardSize: 40',
        'settings'
      );

      render(
        <TestWrapper>
          <Message
            message={settingsMessage}
            isOwnMessage={false}
            room="TEST-ROOM"
            currentGameBoardSize={40}
          />
        </TestWrapper>
      );

      // Click details button
      fireEvent.click(screen.getByTestId('details-button-settings4'));

      // Check popover opens
      await waitFor(() => {
        expect(screen.getByTestId('details-popover-settings4')).toBeInTheDocument();
      });
    });

    it('should close details popover when clicked outside', async () => {
      const settingsMessage = createMockMessage('settings5', 'Settings updated', 'settings');

      render(
        <TestWrapper>
          <Message
            message={settingsMessage}
            isOwnMessage={false}
            room="TEST-ROOM"
            currentGameBoardSize={40}
          />
        </TestWrapper>
      );

      // Open popover
      fireEvent.click(screen.getByTestId('details-button-settings5'));

      await waitFor(() => {
        expect(screen.getByTestId('details-popover-settings5')).toBeInTheDocument();
      });

      // Click outside (simulate)
      fireEvent.keyDown(document, { key: 'Escape' });

      await waitFor(() => {
        expect(screen.queryByTestId('details-popover-settings5')).not.toBeInTheDocument();
      });
    });

    it('should show import board functionality in settings popover', async () => {
      const importableMessage = createMockMessage(
        'settings6',
        'Settings updated',
        'settings',
        'user1',
        'John',
        new Date(),
        { boardSize: 40, gameBoardId: 'importable-board' }
      );

      render(
        <TestWrapper>
          <Message
            message={importableMessage}
            isOwnMessage={false}
            room="TEST-ROOM"
            currentGameBoardSize={40}
          />
        </TestWrapper>
      );

      // Open popover
      fireEvent.click(screen.getByTestId('details-button-settings6'));

      await waitFor(() => {
        const importButton = screen.getByRole('button', { name: 'importBoard' });
        expect(importButton).toBeInTheDocument();
        expect(screen.getByTestId('copy-button')).toBeInTheDocument();
      });
    });

    it('should show incompatible board message when sizes do not match', async () => {
      const incompatibleMessage = createMockMessage(
        'settings7',
        'Settings updated',
        'settings',
        'user1',
        'John',
        new Date(),
        { boardSize: 60, gameBoardId: 'incompatible-board' }
      );

      render(
        <TestWrapper>
          <Message
            message={incompatibleMessage}
            isOwnMessage={false}
            room="TEST-ROOM"
            currentGameBoardSize={40}
          />
        </TestWrapper>
      );

      // Open popover
      fireEvent.click(screen.getByTestId('details-button-settings7'));

      await waitFor(() => {
        expect(screen.getByText('incompatibleBoard')).toBeInTheDocument();
      });
    });

    it('should show room link in room settings popover', async () => {
      const roomMessage = createMockMessage('room2', 'Room updated', 'room');

      render(
        <TestWrapper>
          <Message
            message={roomMessage}
            isOwnMessage={false}
            room="TEST-ROOM"
            currentGameBoardSize={40}
          />
        </TestWrapper>
      );

      // Open popover
      fireEvent.click(screen.getByTestId('details-button-room2'));

      await waitFor(() => {
        expect(screen.getByTestId('copy-button')).toBeInTheDocument();
      });
    });
  });

  describe('Visual Distinction', () => {
    it('should apply different styling to system messages vs regular messages', () => {
      const settingsMessage = createMockMessage('settings8', 'Settings', 'settings');
      const chatMessage = createMockMessage('chat1', 'Hello', 'chat');

      const { rerender } = render(
        <TestWrapper>
          <Message
            message={settingsMessage}
            isOwnMessage={false}
            room="TEST-ROOM"
            currentGameBoardSize={40}
          />
        </TestWrapper>
      );

      // System message should have system-message class
      expect(screen.getByTestId('message-settings8')).toHaveClass('system-message');

      rerender(
        <TestWrapper>
          <Message
            message={chatMessage}
            isOwnMessage={false}
            room="TEST-ROOM"
            currentGameBoardSize={40}
          />
        </TestWrapper>
      );

      // Regular message should NOT have system-message class
      expect(screen.getByTestId('message-chat1')).not.toHaveClass('system-message');
    });

    it('should apply transparent styling when isTransparent prop is true', () => {
      const settingsMessage = createMockMessage('settings9', 'Settings', 'settings');

      render(
        <TestWrapper>
          <Message
            message={settingsMessage}
            isOwnMessage={false}
            isTransparent={true}
            room="TEST-ROOM"
            currentGameBoardSize={40}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('message-settings9')).toHaveClass('transparent');
    });

    it('should center system messages regardless of ownership', () => {
      const ownSettingsMessage = createMockMessage(
        'settings10',
        'Settings',
        'settings',
        'current-user'
      );

      render(
        <TestWrapper>
          <Message
            message={ownSettingsMessage}
            isOwnMessage={true}
            room="TEST-ROOM"
            currentGameBoardSize={40}
          />
        </TestWrapper>
      );

      // System messages should be centered, not aligned to right like own messages
      expect(screen.getByTestId('message-settings10')).toHaveClass('system-message');
      expect(screen.getByTestId('message-settings10')).not.toHaveClass('own-message');
    });
  });

  describe('Regular Message Backwards Compatibility', () => {
    it('should render chat messages with original layout', () => {
      const chatMessage = createMockMessage('chat2', 'Hello world!', 'chat', 'user1', 'Alice');

      render(
        <TestWrapper>
          <Message
            message={chatMessage}
            isOwnMessage={false}
            room="TEST-ROOM"
            currentGameBoardSize={40}
          />
        </TestWrapper>
      );

      // Should use regular message layout
      expect(screen.getByTestId('avatar-user1')).toBeInTheDocument();
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Hello world!')).toBeInTheDocument();
      expect(screen.queryByTestId('details-button-chat2')).not.toBeInTheDocument();
    });

    it('should render action messages with ActionText component', () => {
      const actionMessage = createMockMessage('action1', 'Player rolled a 6', 'actions');

      render(
        <TestWrapper>
          <Message
            message={actionMessage}
            isOwnMessage={false}
            room="TEST-ROOM"
            currentGameBoardSize={40}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('action-text')).toBeInTheDocument();
      expect(screen.getByTestId('action-text')).toHaveTextContent('Player rolled a 6');
    });

    it('should render media messages with images', () => {
      const mediaMessage = createMockMessage(
        'media1',
        'Check this out!',
        'media',
        'user1',
        'Bob',
        new Date(),
        { image: 'data:image/png;base64,test-image-data' }
      );

      render(
        <TestWrapper>
          <Message
            message={mediaMessage}
            isOwnMessage={false}
            room="TEST-ROOM"
            currentGameBoardSize={40}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Check this out!')).toBeInTheDocument();
      expect(screen.getByAltText('uploaded by user')).toBeInTheDocument();
    });

    it('should show play again button for finish messages', () => {
      const finishMessage = createMockMessage('finish1', 'Game finish congratulations!', 'chat');

      render(
        <TestWrapper>
          <Message
            message={finishMessage}
            isOwnMessage={true}
            room="TEST-ROOM"
            currentGameBoardSize={40}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Play Again')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for details button', () => {
      const settingsMessage = createMockMessage('settings11', 'Settings', 'settings');

      render(
        <TestWrapper>
          <Message
            message={settingsMessage}
            isOwnMessage={false}
            room="TEST-ROOM"
            currentGameBoardSize={40}
          />
        </TestWrapper>
      );

      const detailsButton = screen.getByTestId('details-button-settings11');
      expect(detailsButton).toHaveAttribute('aria-label', 'View details');
    });

    it('should have proper test IDs for testing', () => {
      const settingsMessage = createMockMessage('settings12', 'Settings', 'settings');

      render(
        <TestWrapper>
          <Message
            message={settingsMessage}
            isOwnMessage={false}
            room="TEST-ROOM"
            currentGameBoardSize={40}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('message-settings12')).toBeInTheDocument();
      expect(screen.getByTestId('details-button-settings12')).toBeInTheDocument();

      // Open popover to test its ID
      fireEvent.click(screen.getByTestId('details-button-settings12'));
      expect(screen.getByTestId('details-popover-settings12')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty settings text gracefully', () => {
      const emptyMessage = createMockMessage('settings13', '', 'settings');

      render(
        <TestWrapper>
          <Message
            message={emptyMessage}
            isOwnMessage={false}
            room="TEST-ROOM"
            currentGameBoardSize={40}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Test User updated game settings')).toBeInTheDocument();
    });

    it('should handle missing boardSize gracefully', () => {
      const messageWithoutBoardSize = createMockMessage(
        'settings14',
        'Settings',
        'settings',
        'user1',
        'Test User',
        new Date(),
        { gameBoardId: 'test-board' }
      );

      render(
        <TestWrapper>
          <Message
            message={messageWithoutBoardSize}
            isOwnMessage={false}
            room="TEST-ROOM"
            currentGameBoardSize={40}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('message-settings14')).toBeInTheDocument();
    });

    it('should handle long user names in system messages', () => {
      const longNameMessage = createMockMessage(
        'settings15',
        'Settings',
        'settings',
        'user1',
        'Very Long User Name That Might Overflow'
      );

      render(
        <TestWrapper>
          <Message
            message={longNameMessage}
            isOwnMessage={false}
            room="TEST-ROOM"
            currentGameBoardSize={40}
          />
        </TestWrapper>
      );

      expect(
        screen.getByText('Very Long User Name That Might Overflow updated game settings')
      ).toBeInTheDocument();
    });
  });
});
