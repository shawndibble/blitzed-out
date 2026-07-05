import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@/test-utils';
import { Timestamp } from 'firebase/firestore';
import Message from './index';
import type { Message as MessageType } from '@/types/Message';

function settingsMessage(boardSize: number): MessageType {
  return {
    id: 'm1',
    type: 'settings',
    uid: 'author-1',
    displayName: 'Author',
    text: 'shared a board',
    timestamp: { toDate: () => new Date(0) } as Timestamp,
    boardSize,
    gameBoardId: 'board-abc',
    gameMode: 'online',
  };
}

// The import / incompatible controls live inside the details popover, which
// opens when the info button is clicked.
function renderAndOpenDetails(message: MessageType, currentGameBoardSize: number, room: string) {
  render(
    <Message
      message={message}
      isOwnMessage={false}
      currentGameBoardSize={currentGameBoardSize}
      room={room}
    />
  );
  fireEvent.click(screen.getByTestId('details-button-m1'));
}

// The import button is an anchor linking to ?importBoard=…; the incompatible
// state renders no such link. (Trans text is empty here — i18n resources are
// not loaded in unit tests — so assert on the link, not the label.)
const importLink = () => document.querySelector('a[href*="importBoard"]');

describe('Message settings import compatibility', () => {
  it('offers import for a mismatched board in a public room', () => {
    renderAndOpenDetails(settingsMessage(40), 60, 'PUBLIC');

    expect(importLink()).toBeTruthy();
  });

  it('rejects a mismatched board in a private room', () => {
    renderAndOpenDetails(settingsMessage(40), 60, 'my-private-room');

    expect(importLink()).toBeNull();
  });

  it('offers import for a matching board in a private room', () => {
    renderAndOpenDetails(settingsMessage(60), 60, 'my-private-room');

    expect(importLink()).toBeTruthy();
  });
});
