import { act, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithoutProviders } from '@/test-utils';
import MessageList from './index';

let messages: Array<{ id: string; uid: string; text: string; type: string }> = [];

vi.mock('@/context/hooks/useAuth', () => ({
  default: () => ({
    user: { uid: 'owner-1' },
  }),
}));

vi.mock('@/context/hooks/useMessages', () => ({
  default: () => ({
    messages,
    isLoading: false,
  }),
}));

vi.mock('@/hooks/useSendSettings', () => ({
  default: vi.fn(),
}));

vi.mock('./Message', () => ({
  default: ({ message }: { message: { text: string } }) => <li>{message.text}</li>,
}));

vi.mock('./MessageSkeleton', () => ({
  default: () => <li>loading</li>,
}));

describe('MessageList', () => {
  beforeEach(() => {
    messages = [
      { id: '1', uid: 'owner-1', text: 'First', type: 'chat' },
      { id: '2', uid: 'owner-1', text: 'Second', type: 'chat' },
    ];
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('scrolls to the bottom when a new message arrives and the reader is already near the bottom', () => {
    const { container, rerender } = renderWithoutProviders(
      <MessageList room="PUBLIC" currentGameBoardSize={40} />
    );

    const scrollContainer = container.querySelector('.message-list-scroll') as HTMLDivElement;
    Object.defineProperty(scrollContainer, 'clientHeight', { value: 200, configurable: true });
    Object.defineProperty(scrollContainer, 'scrollHeight', { value: 1000, configurable: true });
    Object.defineProperty(scrollContainer, 'scrollTop', {
      value: 800,
      writable: true,
      configurable: true,
    });

    act(() => {
      messages = [...messages, { id: '3', uid: 'owner-1', text: 'Third', type: 'chat' }];
      rerender(<MessageList room="PUBLIC" currentGameBoardSize={40} />);
    });

    expect(scrollContainer.scrollTop).toBe(1000);
  });

  it('lands on the latest message when the list first loads', () => {
    messages = [];

    const { container, rerender } = renderWithoutProviders(
      <MessageList room="PUBLIC" currentGameBoardSize={40} />
    );

    const scrollContainer = container.querySelector('.message-list-scroll') as HTMLDivElement;
    Object.defineProperty(scrollContainer, 'clientHeight', { value: 200, configurable: true });
    Object.defineProperty(scrollContainer, 'scrollHeight', { value: 1000, configurable: true });
    Object.defineProperty(scrollContainer, 'scrollTop', {
      value: 0,
      writable: true,
      configurable: true,
    });

    act(() => {
      messages = [
        { id: '1', uid: 'owner-1', text: 'First', type: 'chat' },
        { id: '2', uid: 'owner-1', text: 'Second', type: 'chat' },
      ];
      rerender(<MessageList room="PUBLIC" currentGameBoardSize={40} />);
    });

    expect(scrollContainer.scrollTop).toBe(1000);
  });

  it('shows a new messages affordance when the reader is scrolled up', () => {
    const { container, rerender } = renderWithoutProviders(
      <MessageList room="PUBLIC" currentGameBoardSize={40} />
    );

    const scrollContainer = container.querySelector('.message-list-scroll') as HTMLDivElement;
    Object.defineProperty(scrollContainer, 'clientHeight', { value: 200, configurable: true });
    Object.defineProperty(scrollContainer, 'scrollHeight', { value: 1000, configurable: true });
    Object.defineProperty(scrollContainer, 'scrollTop', {
      value: 200,
      writable: true,
      configurable: true,
    });

    act(() => {
      fireEvent.scroll(scrollContainer);
    });

    act(() => {
      messages = [...messages, { id: '3', uid: 'owner-1', text: 'Third', type: 'chat' }];
      rerender(<MessageList room="PUBLIC" currentGameBoardSize={40} />);
    });

    expect(screen.getByRole('button', { name: /newMessages/i })).toBeInTheDocument();
  });

  it('ignores hidden message types while a filter tab is active', () => {
    const { container, rerender } = renderWithoutProviders(
      <MessageList room="PUBLIC" currentGameBoardSize={40} />
    );

    const scrollContainer = container.querySelector('.message-list-scroll') as HTMLDivElement;
    Object.defineProperty(scrollContainer, 'clientHeight', { value: 200, configurable: true });
    Object.defineProperty(scrollContainer, 'scrollHeight', { value: 1000, configurable: true });
    Object.defineProperty(scrollContainer, 'scrollTop', {
      value: 800,
      writable: true,
      configurable: true,
    });

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /filter messages/i }));
    });

    act(() => {
      fireEvent.click(screen.getByRole('menuitem', { name: /chat/i }));
    });

    act(() => {
      messages = [
        { id: '1', uid: 'owner-1', text: 'First', type: 'chat' },
        { id: '2', uid: 'owner-1', text: 'Second', type: 'chat' },
        { id: '3', uid: 'owner-1', text: 'Room update', type: 'settings' },
      ];
      rerender(<MessageList room="PUBLIC" currentGameBoardSize={40} />);
    });

    expect(screen.queryByRole('button', { name: /newMessages/i })).not.toBeInTheDocument();
  });
});
