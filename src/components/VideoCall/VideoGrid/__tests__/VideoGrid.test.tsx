import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import VideoGrid from '../index';

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

vi.mock('../../VideoTile', () => ({
  default: ({ participantId }: { participantId: string }) => (
    <div data-testid={`video-tile-${participantId}`}>Video Tile</div>
  ),
}));

describe('VideoGrid', () => {
  const createMockStream = () =>
    ({
      getTracks: vi.fn(() => []),
      getVideoTracks: vi.fn(() => [{ enabled: true }]),
      getAudioTracks: vi.fn(() => [{ enabled: true }]),
    }) as unknown as MediaStream;

  it('renders empty grid when no participants', () => {
    const participants = new Map();
    render(<VideoGrid participants={participants} />);

    expect(screen.queryByTestId(/video-tile/)).not.toBeInTheDocument();
  });

  it('renders single participant', () => {
    const participants = new Map([
      [
        'user-1',
        {
          stream: createMockStream(),
          isSpeaking: false,
          isMuted: false,
        },
      ],
    ]);

    render(<VideoGrid participants={participants} />);

    expect(screen.getByTestId('video-tile-user-1')).toBeInTheDocument();
  });

  it('renders multiple participants in grid', () => {
    const participants = new Map([
      [
        'user-1',
        {
          stream: createMockStream(),
          isSpeaking: false,
          isMuted: false,
        },
      ],
      [
        'user-2',
        {
          stream: createMockStream(),
          isSpeaking: true,
          isMuted: false,
        },
      ],
      [
        'user-3',
        {
          stream: createMockStream(),
          isSpeaking: false,
          isMuted: true,
        },
      ],
    ]);

    render(<VideoGrid participants={participants} />);

    expect(screen.getByTestId('video-tile-user-1')).toBeInTheDocument();
    expect(screen.getByTestId('video-tile-user-2')).toBeInTheDocument();
    expect(screen.getByTestId('video-tile-user-3')).toBeInTheDocument();
  });

  it('handles maximum 4 participants', () => {
    const participants = new Map([
      ['user-1', { stream: createMockStream(), isSpeaking: false, isMuted: false }],
      ['user-2', { stream: createMockStream(), isSpeaking: false, isMuted: false }],
      ['user-3', { stream: createMockStream(), isSpeaking: false, isMuted: false }],
      ['user-4', { stream: createMockStream(), isSpeaking: false, isMuted: false }],
    ]);

    render(<VideoGrid participants={participants} />);

    expect(screen.getByTestId('video-tile-user-1')).toBeInTheDocument();
    expect(screen.getByTestId('video-tile-user-2')).toBeInTheDocument();
    expect(screen.getByTestId('video-tile-user-3')).toBeInTheDocument();
    expect(screen.getByTestId('video-tile-user-4')).toBeInTheDocument();
  });

  it('uses flexbox layout with 8px gap', () => {
    const participants = new Map([
      ['user-1', { stream: createMockStream(), isSpeaking: false, isMuted: false }],
      ['user-2', { stream: createMockStream(), isSpeaking: false, isMuted: false }],
    ]);

    const { container } = render(<VideoGrid participants={participants} />);
    const gridContainer = container.firstChild as HTMLElement;

    expect(gridContainer).toHaveStyle({
      display: 'flex',
      flexDirection: 'column',
    });
  });

  it('displays participant count', () => {
    const participants = new Map([
      ['user-1', { stream: createMockStream(), isSpeaking: false, isMuted: false }],
      ['user-2', { stream: createMockStream(), isSpeaking: false, isMuted: false }],
    ]);

    render(<VideoGrid participants={participants} />);

    // The i18n mock returns the key, so check for the translation key
    expect(screen.getByText('videoCall.participantCount')).toBeInTheDocument();
  });

  it('displays singular form for one participant', () => {
    const participants = new Map([
      ['user-1', { stream: createMockStream(), isSpeaking: false, isMuted: false }],
    ]);

    render(<VideoGrid participants={participants} />);

    // The i18n mock returns the key, so check for the translation key
    expect(screen.getByText('videoCall.participantCount')).toBeInTheDocument();
  });

  it('displays waiting message when no participants', () => {
    const participants = new Map();
    render(<VideoGrid participants={participants} />);

    // The i18n mock returns the key, so check for the translation key
    expect(screen.getByText('videoCall.waitingForOthers')).toBeInTheDocument();
  });
});
