import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import MessageList from '../index';
import { Message, MessageType } from '@/types/Message';
import { Timestamp } from 'firebase/firestore';
import useMessages from '@/context/hooks/useMessages';

// Mock dependencies
vi.mock('@/context/hooks/useAuth', () => ({
  default: () => ({
    user: {
      uid: 'current-user-id',
      displayName: 'Current User',
    },
  }),
}));

vi.mock('@/context/hooks/useMessages', () => ({
  default: vi.fn(() => ({
    messages: [],
    isLoading: false,
  })),
}));

vi.mock('@/hooks/useSendSettings', () => ({
  default: vi.fn(),
}));

vi.mock('../Message', () => ({
  default: ({
    message,
    isOwnMessage,
    room,
  }: {
    message: Message;
    isOwnMessage: boolean;
    room: string;
  }) => (
    <div data-testid={`message-${message.id}`} data-own={isOwnMessage} data-room={room}>
      <span data-testid="message-type">{message.type}</span>
      <span data-testid="message-text">{message.text}</span>
      <span data-testid="message-user">{message.displayName}</span>
    </div>
  ),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        all: 'All',
        setting: 'Settings',
        chat: 'Chat',
        actions: 'Actions',
      };
      return translations[key] || key;
    },
    i18n: {
      resolvedLanguage: 'en',
    },
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
  type = 'chat' as MessageType,
  uid = 'user1',
  displayName = 'Test User',
  timestamp: Date = new Date()
): Message => {
  const baseMessage = {
    id,
    text,
    uid,
    displayName,
    timestamp: {
      toDate: () => timestamp,
    } as Timestamp,
  };

  if (type === 'media') {
    return {
      ...baseMessage,
      type,
      image: 'mock-image-url',
    };
  }

  return {
    ...baseMessage,
    type,
  } as Message;
};

describe('MessageList Component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render with default props', () => {
      render(
        <TestWrapper>
          <MessageList room="test-room" />
        </TestWrapper>
      );

      // Check for filter FAB instead of tabs
      expect(screen.getByLabelText('filter messages')).toBeInTheDocument();
    });

    it('should render with transparent prop', () => {
      render(
        <TestWrapper>
          <MessageList room="test-room" isTransparent={true} />
        </TestWrapper>
      );

      expect(screen.getByLabelText('filter messages')).toBeInTheDocument();
    });

    it('should render with custom game board size', () => {
      render(
        <TestWrapper>
          <MessageList room="test-room" currentGameBoardSize={60} />
        </TestWrapper>
      );

      expect(screen.getByLabelText('filter messages')).toBeInTheDocument();
    });
  });

  describe('Message Filtering', () => {
    beforeEach(() => {
      // Mock useMessages to return test messages
      const mockMessages = [
        createMockMessage('1', 'Chat message', 'chat'),
        createMockMessage('2', 'Action message', 'actions'),
        createMockMessage('3', 'Settings message', 'settings'),
        createMockMessage('4', 'Room message', 'room'),
        createMockMessage('5', 'Media message', 'media'),
      ];

      vi.mocked(useMessages).mockReturnValue({
        messages: mockMessages,
        isLoading: false,
      });
    });

    it('should show all messages by default', () => {
      render(
        <TestWrapper>
          <MessageList room="test-room" />
        </TestWrapper>
      );

      expect(screen.getByTestId('message-1')).toBeInTheDocument();
      expect(screen.getByTestId('message-2')).toBeInTheDocument();
      expect(screen.getByTestId('message-3')).toBeInTheDocument();
      expect(screen.getByTestId('message-4')).toBeInTheDocument();
      expect(screen.getByTestId('message-5')).toBeInTheDocument();
    });

    it('should filter to settings and room messages when settings filter is selected', async () => {
      render(
        <TestWrapper>
          <MessageList room="test-room" />
        </TestWrapper>
      );

      // Click filter FAB
      fireEvent.click(screen.getByLabelText('filter messages'));

      // Select Settings filter
      fireEvent.click(screen.getByText('Settings'));

      await waitFor(() => {
        expect(screen.queryByTestId('message-1')).not.toBeInTheDocument(); // chat
        expect(screen.queryByTestId('message-2')).not.toBeInTheDocument(); // actions
        expect(screen.getByTestId('message-3')).toBeInTheDocument(); // settings
        expect(screen.getByTestId('message-4')).toBeInTheDocument(); // room
        expect(screen.queryByTestId('message-5')).not.toBeInTheDocument(); // media
      });
    });

    it('should filter to chat and media messages when chat filter is selected', async () => {
      render(
        <TestWrapper>
          <MessageList room="test-room" />
        </TestWrapper>
      );

      // Click filter FAB
      fireEvent.click(screen.getByLabelText('filter messages'));

      // Select Chat filter
      fireEvent.click(screen.getByText('Chat'));

      await waitFor(() => {
        expect(screen.getByTestId('message-1')).toBeInTheDocument(); // chat
        expect(screen.queryByTestId('message-2')).not.toBeInTheDocument(); // actions
        expect(screen.queryByTestId('message-3')).not.toBeInTheDocument(); // settings
        expect(screen.queryByTestId('message-4')).not.toBeInTheDocument(); // room
        expect(screen.getByTestId('message-5')).toBeInTheDocument(); // media
      });
    });

    it('should filter to actions messages when actions filter is selected', async () => {
      render(
        <TestWrapper>
          <MessageList room="test-room" />
        </TestWrapper>
      );

      // Click filter FAB
      fireEvent.click(screen.getByLabelText('filter messages'));

      // Select Actions filter
      fireEvent.click(screen.getByText('Actions'));

      await waitFor(() => {
        expect(screen.queryByTestId('message-1')).not.toBeInTheDocument(); // chat
        expect(screen.getByTestId('message-2')).toBeInTheDocument(); // actions
        expect(screen.queryByTestId('message-3')).not.toBeInTheDocument(); // settings
        expect(screen.queryByTestId('message-4')).not.toBeInTheDocument(); // room
        expect(screen.queryByTestId('message-5')).not.toBeInTheDocument(); // media
      });
    });
  });

  describe('Message Ownership', () => {
    beforeEach(() => {
      const mockMessages = [
        createMockMessage('1', 'My message', 'chat', 'current-user-id', 'Current User'),
        createMockMessage('2', 'Other message', 'chat', 'other-user-id', 'Other User'),
      ];

      vi.mocked(useMessages).mockReturnValue({
        messages: mockMessages,
        isLoading: false,
      });
    });

    it('should correctly identify own messages', () => {
      render(
        <TestWrapper>
          <MessageList room="test-room" />
        </TestWrapper>
      );

      expect(screen.getByTestId('message-1')).toHaveAttribute('data-own', 'true');
      expect(screen.getByTestId('message-2')).toHaveAttribute('data-own', 'false');
    });
  });

  describe('Real-time Updates', () => {
    it('should update when new messages arrive', async () => {
      const initialMessages = [createMockMessage('1', 'Initial message', 'chat')];

      const mockUseMessages = vi.mocked(useMessages);
      mockUseMessages.mockReturnValue({
        messages: initialMessages,
        isLoading: false,
      });

      const { rerender } = render(
        <TestWrapper>
          <MessageList room="test-room" />
        </TestWrapper>
      );

      expect(screen.getByTestId('message-1')).toBeInTheDocument();

      // Simulate new message arriving
      const updatedMessages = [...initialMessages, createMockMessage('2', 'New message', 'chat')];

      mockUseMessages.mockReturnValue({
        messages: updatedMessages,
        isLoading: false,
      });

      rerender(
        <TestWrapper>
          <MessageList room="test-room" />
        </TestWrapper>
      );

      expect(screen.getByTestId('message-1')).toBeInTheDocument();
      expect(screen.getByTestId('message-2')).toBeInTheDocument();
    });

    it('should handle message deletion', async () => {
      const initialMessages = [
        createMockMessage('1', 'Message 1', 'chat'),
        createMockMessage('2', 'Message 2', 'chat'),
      ];

      const mockUseMessages = vi.mocked(useMessages);
      mockUseMessages.mockReturnValue({
        messages: initialMessages,
        isLoading: false,
      });

      const { rerender } = render(
        <TestWrapper>
          <MessageList room="test-room" />
        </TestWrapper>
      );

      expect(screen.getByTestId('message-1')).toBeInTheDocument();
      expect(screen.getByTestId('message-2')).toBeInTheDocument();

      // Simulate message deletion
      const updatedMessages = [createMockMessage('1', 'Message 1', 'chat')];

      mockUseMessages.mockReturnValue({
        messages: updatedMessages,
        isLoading: false,
      });

      rerender(
        <TestWrapper>
          <MessageList room="test-room" />
        </TestWrapper>
      );

      expect(screen.getByTestId('message-1')).toBeInTheDocument();
      expect(screen.queryByTestId('message-2')).not.toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should handle loading state', () => {
      vi.mocked(useMessages).mockReturnValue({
        messages: [],
        isLoading: true,
      });

      render(
        <TestWrapper>
          <MessageList room="test-room" />
        </TestWrapper>
      );

      // Component should still render the filter button
      expect(screen.getByLabelText('filter messages')).toBeInTheDocument();
    });

    it('should render messages even while loading', () => {
      const mockMessages = [createMockMessage('1', 'Test message', 'chat')];

      vi.mocked(useMessages).mockReturnValue({
        messages: mockMessages,
        isLoading: true,
      });

      render(
        <TestWrapper>
          <MessageList room="test-room" />
        </TestWrapper>
      );

      // Component renders messages even during loading
      expect(screen.getByTestId('message-1')).toBeInTheDocument();
    });
  });

  describe('Multiple Message Types', () => {
    beforeEach(() => {
      const mockMessages = [
        createMockMessage('chat1', 'Hello everyone!', 'chat'),
        createMockMessage('action1', 'Player rolled a 6', 'actions'),
        createMockMessage('settings1', 'Game settings updated', 'settings'),
        createMockMessage('room1', 'Room created', 'room'),
        createMockMessage('media1', 'Image shared', 'media'),
      ];

      vi.mocked(useMessages).mockReturnValue({
        messages: mockMessages,
        isLoading: false,
      });
    });

    it('should display all message types correctly', () => {
      render(
        <TestWrapper>
          <MessageList room="test-room" />
        </TestWrapper>
      );

      expect(screen.getByTestId('message-chat1')).toBeInTheDocument();
      expect(screen.getByTestId('message-action1')).toBeInTheDocument();
      expect(screen.getByTestId('message-settings1')).toBeInTheDocument();
      expect(screen.getByTestId('message-room1')).toBeInTheDocument();
      expect(screen.getByTestId('message-media1')).toBeInTheDocument();
    });
  });

  describe('Turn Order and Multiplayer', () => {
    beforeEach(() => {
      const mockMessages = [
        createMockMessage('1', 'Player 1 joined', 'actions', 'player1', 'Player 1'),
        createMockMessage('2', 'Player 2 joined', 'actions', 'player2', 'Player 2'),
        createMockMessage('3', 'Player 3 joined', 'actions', 'player3', 'Player 3'),
        createMockMessage('4', 'Player 1 rolled dice', 'actions', 'player1', 'Player 1'),
        createMockMessage('5', 'Player 2 rolled dice', 'actions', 'player2', 'Player 2'),
      ];

      vi.mocked(useMessages).mockReturnValue({
        messages: mockMessages,
        isLoading: false,
      });
    });

    it('should display multiplayer actions in chronological order', async () => {
      render(
        <TestWrapper>
          <MessageList room="test-room" />
        </TestWrapper>
      );

      // Switch to actions filter to see turn order
      fireEvent.click(screen.getByLabelText('filter messages'));
      fireEvent.click(screen.getByText('Actions'));

      await waitFor(() => {
        expect(screen.getByTestId('message-1')).toBeInTheDocument();
        expect(screen.getByTestId('message-2')).toBeInTheDocument();
        expect(screen.getByTestId('message-3')).toBeInTheDocument();
        expect(screen.getByTestId('message-4')).toBeInTheDocument();
        expect(screen.getByTestId('message-5')).toBeInTheDocument();
      });
    });
  });

  describe('Chat Functionality', () => {
    beforeEach(() => {
      const mockMessages = [
        createMockMessage('1', 'Hello!', 'chat', 'user1', 'Alice'),
        createMockMessage('2', 'How are you?', 'chat', 'user2', 'Bob'),
        createMockMessage('3', 'Great game!', 'chat', 'user3', 'Charlie'),
        createMockMessage('4', 'Thanks for playing', 'chat', 'user1', 'Alice'),
      ];

      vi.mocked(useMessages).mockReturnValue({
        messages: mockMessages,
        isLoading: false,
      });
    });

    it('should display chat messages', async () => {
      render(
        <TestWrapper>
          <MessageList room="test-room" />
        </TestWrapper>
      );

      // Switch to chat filter
      fireEvent.click(screen.getByLabelText('filter messages'));
      fireEvent.click(screen.getByText('Chat'));

      await waitFor(() => {
        expect(screen.getByTestId('message-1')).toBeInTheDocument();
        expect(screen.getByTestId('message-2')).toBeInTheDocument();
        expect(screen.getByTestId('message-3')).toBeInTheDocument();
        expect(screen.getByTestId('message-4')).toBeInTheDocument();
      });
    });

    it('should show chat messages with correct user attribution', async () => {
      render(
        <TestWrapper>
          <MessageList room="test-room" />
        </TestWrapper>
      );

      // Switch to chat filter
      fireEvent.click(screen.getByLabelText('filter messages'));
      fireEvent.click(screen.getByText('Chat'));

      await waitFor(() => {
        const message1 = screen.getByTestId('message-1');
        const message2 = screen.getByTestId('message-2');

        expect(message1.querySelector('[data-testid="message-user"]')).toHaveTextContent('Alice');
        expect(message2.querySelector('[data-testid="message-user"]')).toHaveTextContent('Bob');
      });
    });
  });

  describe('Media Messages', () => {
    beforeEach(() => {
      const mockMessages = [
        createMockMessage('1', 'Check out this image!', 'media', 'user1', 'Alice'),
        createMockMessage('2', 'Another photo', 'media', 'user2', 'Bob'),
      ];

      vi.mocked(useMessages).mockReturnValue({
        messages: mockMessages,
        isLoading: false,
      });
    });

    it('should display media messages in chat tab', async () => {
      render(
        <TestWrapper>
          <MessageList room="test-room" />
        </TestWrapper>
      );

      // Switch to chat filter (media messages appear in chat)
      fireEvent.click(screen.getByLabelText('filter messages'));
      fireEvent.click(screen.getByText('Chat'));

      await waitFor(() => {
        expect(screen.getByTestId('message-1')).toBeInTheDocument();
        expect(screen.getByTestId('message-2')).toBeInTheDocument();
      });
    });
  });

  describe('Filter Navigation', () => {
    it('should switch between filters correctly', async () => {
      render(
        <TestWrapper>
          <MessageList room="test-room" />
        </TestWrapper>
      );

      const filterButton = screen.getByLabelText('filter messages');
      expect(filterButton).toBeInTheDocument();

      // Open filter menu
      fireEvent.click(filterButton);

      // Check filter options are available
      expect(screen.getByText('All')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('Chat')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();

      // Select Settings filter
      fireEvent.click(screen.getByText('Settings'));

      // Menu should close after selection
      await waitFor(() => {
        expect(screen.queryByText('All')).not.toBeInTheDocument();
      });

      // Reopen menu to test another filter
      fireEvent.click(filterButton);
      fireEvent.click(screen.getByText('Chat'));

      await waitFor(() => {
        expect(screen.queryByText('All')).not.toBeInTheDocument();
      });
    });
  });

  describe('Room Management', () => {
    it('should pass room prop to messages', () => {
      const mockMessages = [createMockMessage('1', 'Test message', 'chat')];

      vi.mocked(useMessages).mockReturnValue({
        messages: mockMessages,
        isLoading: false,
      });

      render(
        <TestWrapper>
          <MessageList room="custom-room" />
        </TestWrapper>
      );

      expect(screen.getByTestId('message-1')).toHaveAttribute('data-room', 'custom-room');
    });
  });

  describe('Empty State', () => {
    it('should handle empty message list', () => {
      vi.mocked(useMessages).mockReturnValue({
        messages: [],
        isLoading: false,
      });

      render(
        <TestWrapper>
          <MessageList room="test-room" />
        </TestWrapper>
      );

      expect(screen.getByLabelText('filter messages')).toBeInTheDocument();
      // No messages should be displayed
      expect(screen.queryByTestId(/^message-/)).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(
        <TestWrapper>
          <MessageList room="test-room" />
        </TestWrapper>
      );

      expect(screen.getByLabelText('filter messages')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should handle large numbers of messages', () => {
      const manyMessages = Array.from({ length: 100 }, (_, i) =>
        createMockMessage(`msg-${i}`, `Message ${i}`, 'chat')
      );

      vi.mocked(useMessages).mockReturnValue({
        messages: manyMessages,
        isLoading: false,
      });

      render(
        <TestWrapper>
          <MessageList room="test-room" />
        </TestWrapper>
      );

      // Should render all messages (each message gets rendered 4 times for each tab filter view)
      const messageElements = screen.getAllByTestId(/^message-/);
      expect(messageElements.length).toBeGreaterThanOrEqual(100);
    });
  });

  describe('Scroll Behavior', () => {
    beforeEach(() => {
      // Mock scrollTo and scrollHeight/scrollTop properties
      Object.defineProperty(HTMLElement.prototype, 'scrollTop', {
        writable: true,
        value: 0,
      });
      Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
        writable: true,
        value: 1000,
      });
    });

    it('should scroll to bottom when new messages are added', async () => {
      const initialMessages = [
        createMockMessage('1', 'First message', 'chat'),
        createMockMessage('2', 'Second message', 'chat'),
      ];

      const mockUseMessages = vi.mocked(useMessages);
      mockUseMessages.mockReturnValue({
        messages: initialMessages,
        isLoading: false,
      });

      const { rerender } = render(
        <TestWrapper>
          <MessageList room="test-room" />
        </TestWrapper>
      );

      // Get the scroll container
      const scrollContainer = document.querySelector('.message-list-scroll');
      expect(scrollContainer).toBeInTheDocument();

      // Simulate adding a new message with different ID
      const newMessages = [...initialMessages, createMockMessage('3', 'New message', 'chat')];

      mockUseMessages.mockReturnValue({
        messages: newMessages,
        isLoading: false,
      });

      rerender(
        <TestWrapper>
          <MessageList room="test-room" />
        </TestWrapper>
      );

      // Check that scroll was triggered (scrollTop should equal scrollHeight)
      // Add a longer wait time to account for multiple scroll attempts
      await waitFor(
        () => {
          expect(scrollContainer?.scrollTop).toBe(1000);
        },
        { timeout: 100 }
      );
    });

    it('should scroll to bottom when messages are added regardless of filter', async () => {
      const initialMessages = [
        createMockMessage('1', 'Chat message', 'chat'),
        createMockMessage('2', 'Action message', 'actions'),
      ];

      const mockUseMessages = vi.mocked(useMessages);
      mockUseMessages.mockReturnValue({
        messages: initialMessages,
        isLoading: false,
      });

      const { rerender } = render(
        <TestWrapper>
          <MessageList room="test-room" />
        </TestWrapper>
      );

      // Switch to actions filter
      fireEvent.click(screen.getByLabelText('filter messages'));
      fireEvent.click(screen.getByText('Actions'));

      // Add a new chat message (which won't be visible in actions filter)
      const newMessages = [...initialMessages, createMockMessage('3', 'New chat message', 'chat')];

      mockUseMessages.mockReturnValue({
        messages: newMessages,
        isLoading: false,
      });

      rerender(
        <TestWrapper>
          <MessageList room="test-room" />
        </TestWrapper>
      );

      // Should still scroll to bottom even though new message isn't visible
      const scrollContainer = document.querySelector('.message-list-scroll');
      await waitFor(() => {
        expect(scrollContainer?.scrollTop).toBe(1000);
      });
    });
  });
});
