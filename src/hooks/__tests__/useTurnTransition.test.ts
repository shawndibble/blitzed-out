import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { LocalPlayer, LocalSessionSettings } from '@/types';
import type { Player } from '@/types/player';
import { getSoundById, playSound } from '@/utils/gameSounds';
import latestMessageByType from '@/helpers/messages';
import useTurnIndicator from '@/hooks/useTurnIndicator';
import useMessages from '@/context/hooks/useMessages';
import { useTurnTransition } from '../useTurnTransition';

vi.mock('@/context/hooks/useMessages');
vi.mock('@/hooks/useTurnIndicator');
vi.mock('@/helpers/messages');
vi.mock('@/utils/gameSounds');

const makeLocalPlayer = (name: string, sound?: string): LocalPlayer =>
  ({ id: name, name, sound: sound ?? '', isActive: true }) as LocalPlayer;

const makeNextPlayer = (isSelf: boolean, displayName = 'Alice'): Player =>
  ({ uid: 'u1', isSelf, displayName, isFinished: false }) as Player;

const makeMessage = (id = 'msg1') => ({ uid: 'u1', type: 'actions', id }) as any;

const baseInput = {
  localPlayers: [] as LocalPlayer[],
  sessionSettings: null as LocalSessionSettings | null,
  currentPlayerIndex: 0 as number | null | undefined,
  isLocalPlayerRoom: false,
  playerDialog: false,
  othersDialog: false,
};

describe('useTurnTransition', () => {
  beforeEach(() => {
    vi.mocked(useMessages).mockReturnValue({ messages: [] } as any);
    vi.mocked(latestMessageByType).mockReturnValue(undefined);
    vi.mocked(useTurnIndicator).mockReturnValue(null);
    vi.mocked(getSoundById).mockReturnValue(null);
    vi.mocked(playSound).mockResolvedValue(undefined as any);
  });

  it('starts with showTransition=false', () => {
    const { result } = renderHook(() => useTurnTransition(baseInput));
    expect(result.current.showTransition).toBe(false);
    expect(result.current.transitionPlayerName).toBe('');
    expect(result.current.isTransitionForCurrentUser).toBe(false);
  });

  it('handleTransitionComplete sets showTransition to false', async () => {
    // Set up multi-device transition to get showTransition=true
    const msg1 = makeMessage('msg1');
    vi.mocked(latestMessageByType).mockReturnValue(msg1);
    vi.mocked(useTurnIndicator).mockReturnValue(makeNextPlayer(false)); // initially not self

    const { result, rerender } = renderHook((p) => useTurnTransition(p), {
      initialProps: { ...baseInput },
    });

    // New message + now self
    const msg2 = makeMessage('msg2');
    vi.mocked(latestMessageByType).mockReturnValue(msg2);
    vi.mocked(useTurnIndicator).mockReturnValue(makeNextPlayer(true));
    rerender({ ...baseInput });
    await act(async () => {});

    expect(result.current.showTransition).toBe(true);

    act(() => result.current.handleTransitionComplete());
    expect(result.current.showTransition).toBe(false);
  });

  describe('local player path', () => {
    const players = [makeLocalPlayer('Alice'), makeLocalPlayer('Bob')];
    const session: LocalSessionSettings = {
      showTurnTransitions: true,
      enableTurnSounds: false,
      showPlayerAvatars: false,
    };
    const localInput = {
      ...baseInput,
      isLocalPlayerRoom: true,
      localPlayers: players,
      sessionSettings: session,
      currentPlayerIndex: 0,
    };

    it('no transition on first render (previousIndex === currentIndex)', () => {
      const { result } = renderHook(() => useTurnTransition(localInput));
      expect(result.current.showTransition).toBe(false);
    });

    it('shows transition when turn changes with showTurnTransitions=true and playerDialog=false', async () => {
      const { result, rerender } = renderHook((p) => useTurnTransition(p), {
        initialProps: { ...localInput, currentPlayerIndex: 0 },
      });
      rerender({ ...localInput, currentPlayerIndex: 1 });
      await act(async () => {});

      expect(result.current.showTransition).toBe(true);
      expect(result.current.transitionPlayerName).toBe('Bob');
      expect(result.current.isTransitionForCurrentUser).toBe(false);
    });

    it('does not show transition when playerDialog=true', async () => {
      const { result, rerender } = renderHook((p) => useTurnTransition(p), {
        initialProps: { ...localInput, currentPlayerIndex: 0, playerDialog: true },
      });
      rerender({ ...localInput, currentPlayerIndex: 1, playerDialog: true });
      await act(async () => {});

      expect(result.current.showTransition).toBe(false);
    });

    it('does not show transition when showTurnTransitions=false', async () => {
      const input = {
        ...localInput,
        sessionSettings: { ...session, showTurnTransitions: false },
      };
      const { result, rerender } = renderHook((p) => useTurnTransition(p), {
        initialProps: { ...input, currentPlayerIndex: 0 },
      });
      rerender({ ...input, currentPlayerIndex: 1 });
      await act(async () => {});

      expect(result.current.showTransition).toBe(false);
    });

    it('does not trigger when isLocalPlayerRoom=false', async () => {
      const { result, rerender } = renderHook((p) => useTurnTransition(p), {
        initialProps: { ...localInput, isLocalPlayerRoom: false, currentPlayerIndex: 0 },
      });
      rerender({ ...localInput, isLocalPlayerRoom: false, currentPlayerIndex: 1 });
      await act(async () => {});

      expect(result.current.showTransition).toBe(false);
    });

    it('does not trigger when localPlayers is empty', async () => {
      const { result, rerender } = renderHook((p) => useTurnTransition(p), {
        initialProps: { ...localInput, localPlayers: [], currentPlayerIndex: 0 },
      });
      rerender({ ...localInput, localPlayers: [], currentPlayerIndex: 1 });
      await act(async () => {});

      expect(result.current.showTransition).toBe(false);
    });

    it('plays sound on turn change when enableTurnSounds=true and player has sound', async () => {
      const mockSound = { id: 'chime', src: 'chime.mp3' } as any;
      vi.mocked(getSoundById).mockReturnValue(mockSound);

      const input = {
        ...localInput,
        localPlayers: [makeLocalPlayer('Alice'), makeLocalPlayer('Bob', 'chime')],
        sessionSettings: { ...session, enableTurnSounds: true },
      };
      const { rerender } = renderHook((p) => useTurnTransition(p), {
        initialProps: { ...input, currentPlayerIndex: 0 },
      });
      rerender({ ...input, currentPlayerIndex: 1 });
      await act(async () => {});

      expect(getSoundById).toHaveBeenCalledWith('chime');
      expect(playSound).toHaveBeenCalledWith(mockSound);
    });

    it('does not call playSound when player has no sound even if enableTurnSounds=true', async () => {
      const input = {
        ...localInput,
        localPlayers: [makeLocalPlayer('Alice'), makeLocalPlayer('Bob')], // no sound
        sessionSettings: { ...session, enableTurnSounds: true },
      };
      const { rerender } = renderHook((p) => useTurnTransition(p), {
        initialProps: { ...input, currentPlayerIndex: 0 },
      });
      rerender({ ...input, currentPlayerIndex: 1 });
      await act(async () => {});

      expect(playSound).not.toHaveBeenCalled();
    });

    it('does not call playSound when getSoundById returns null', async () => {
      vi.mocked(getSoundById).mockReturnValue(null);
      const input = {
        ...localInput,
        localPlayers: [makeLocalPlayer('Alice'), makeLocalPlayer('Bob', 'chime')],
        sessionSettings: { ...session, enableTurnSounds: true },
      };
      const { rerender } = renderHook((p) => useTurnTransition(p), {
        initialProps: { ...input, currentPlayerIndex: 0 },
      });
      rerender({ ...input, currentPlayerIndex: 1 });
      await act(async () => {});

      expect(playSound).not.toHaveBeenCalled();
    });
  });

  describe('multi-device path', () => {
    it('shows transition: new msg + nextPlayer.isSelf + prev not self + !othersDialog', async () => {
      const msg1 = makeMessage('msg1');
      vi.mocked(latestMessageByType).mockReturnValue(msg1);
      vi.mocked(useTurnIndicator).mockReturnValue(makeNextPlayer(false)); // initially not self

      const { result, rerender } = renderHook((p) => useTurnTransition(p), {
        initialProps: { ...baseInput },
      });

      // New message + now it's our turn
      const msg2 = makeMessage('msg2');
      vi.mocked(latestMessageByType).mockReturnValue(msg2);
      vi.mocked(useTurnIndicator).mockReturnValue(makeNextPlayer(true, 'Alice'));
      rerender({ ...baseInput });
      await act(async () => {});

      expect(result.current.showTransition).toBe(true);
      expect(result.current.isTransitionForCurrentUser).toBe(true);
      expect(result.current.transitionPlayerName).toBe('Alice');
    });

    it('does not show transition when othersDialog=true', async () => {
      const msg1 = makeMessage('msg1');
      vi.mocked(latestMessageByType).mockReturnValue(msg1);
      vi.mocked(useTurnIndicator).mockReturnValue(makeNextPlayer(false));

      const { result, rerender } = renderHook((p) => useTurnTransition(p), {
        initialProps: { ...baseInput, othersDialog: true },
      });

      const msg2 = makeMessage('msg2');
      vi.mocked(latestMessageByType).mockReturnValue(msg2);
      vi.mocked(useTurnIndicator).mockReturnValue(makeNextPlayer(true));
      rerender({ ...baseInput, othersDialog: true });
      await act(async () => {});

      expect(result.current.showTransition).toBe(false);
    });

    it('does not show transition when isLocalPlayerRoom=true', async () => {
      const msg1 = makeMessage('msg1');
      vi.mocked(latestMessageByType).mockReturnValue(msg1);
      vi.mocked(useTurnIndicator).mockReturnValue(makeNextPlayer(false));

      const { result, rerender } = renderHook((p) => useTurnTransition(p), {
        initialProps: { ...baseInput, isLocalPlayerRoom: true },
      });

      const msg2 = makeMessage('msg2');
      vi.mocked(latestMessageByType).mockReturnValue(msg2);
      vi.mocked(useTurnIndicator).mockReturnValue(makeNextPlayer(true));
      rerender({ ...baseInput, isLocalPlayerRoom: true });
      await act(async () => {});

      expect(result.current.showTransition).toBe(false);
    });

    it('does not show transition when nextPlayer.isSelf stays false', async () => {
      const msg1 = makeMessage('msg1');
      vi.mocked(latestMessageByType).mockReturnValue(msg1);
      vi.mocked(useTurnIndicator).mockReturnValue(makeNextPlayer(false));

      const { result, rerender } = renderHook((p) => useTurnTransition(p), {
        initialProps: { ...baseInput },
      });

      const msg2 = makeMessage('msg2');
      vi.mocked(latestMessageByType).mockReturnValue(msg2);
      vi.mocked(useTurnIndicator).mockReturnValue(makeNextPlayer(false)); // still not self
      rerender({ ...baseInput });
      await act(async () => {});

      expect(result.current.showTransition).toBe(false);
    });

    it('does not show transition when previous was already self (no change)', async () => {
      const msg1 = makeMessage('msg1');
      vi.mocked(latestMessageByType).mockReturnValue(msg1);
      vi.mocked(useTurnIndicator).mockReturnValue(makeNextPlayer(true)); // already self at start

      const { result, rerender } = renderHook((p) => useTurnTransition(p), {
        initialProps: { ...baseInput },
      });

      const msg2 = makeMessage('msg2');
      vi.mocked(latestMessageByType).mockReturnValue(msg2);
      vi.mocked(useTurnIndicator).mockReturnValue(makeNextPlayer(true)); // still self
      rerender({ ...baseInput });
      await act(async () => {});

      expect(result.current.showTransition).toBe(false);
    });
  });
});
