import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/stores/gameBoard', () => ({
  getBoards: vi.fn(),
  upsertBoard: vi.fn(),
}));

import { SyncBase } from '../base';
import { GameBoardsSync } from '../gameBoardsSync';
import { getBoards, upsertBoard } from '@/stores/gameBoard';

describe('SyncBase.remoteWins', () => {
  it('applies the newer side when both have timestamps (strict)', () => {
    expect(SyncBase.remoteWins(100, 200)).toBe(true); // remote newer
    expect(SyncBase.remoteWins(200, 100)).toBe(false); // local newer
    expect(SyncBase.remoteWins(100, 100)).toBe(false); // tie keeps local (stops loop)
  });

  it('keeps local when only local has a timestamp (remote is pre-feature)', () => {
    expect(SyncBase.remoteWins(100, undefined)).toBe(false);
  });

  it('applies remote when only remote has a timestamp', () => {
    expect(SyncBase.remoteWins(undefined, 100)).toBe(true);
  });

  it('applies remote when neither has a timestamp (legacy behavior)', () => {
    expect(SyncBase.remoteWins(undefined, undefined)).toBe(true);
  });
});

describe('GameBoardsSync last-writer-wins', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('skips a remote board when the local copy is newer', async () => {
    vi.mocked(getBoards).mockResolvedValue([
      { id: 1, title: 'B', tiles: [], isActive: 0, tags: [], gameMode: 'online', updatedAt: 500 },
    ]);

    await GameBoardsSync.syncFromFirebase([
      { title: 'B', tiles: [], isActive: 0, tags: [], gameMode: 'online', updatedAt: 200 },
    ]);

    expect(upsertBoard).not.toHaveBeenCalled();
  });

  it('applies a remote board when it is newer, preserving its timestamp', async () => {
    vi.mocked(getBoards).mockResolvedValue([
      { id: 1, title: 'B', tiles: [], isActive: 0, tags: [], gameMode: 'online', updatedAt: 100 },
    ]);
    vi.mocked(upsertBoard).mockResolvedValue(1);

    await GameBoardsSync.syncFromFirebase([
      { title: 'B', tiles: [], isActive: 0, tags: [], gameMode: 'online', updatedAt: 900 },
    ]);

    expect(upsertBoard).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'B', updatedAt: 900 })
    );
  });

  it('applies a remote board that does not exist locally', async () => {
    vi.mocked(getBoards).mockResolvedValue([]);
    vi.mocked(upsertBoard).mockResolvedValue(2);

    await GameBoardsSync.syncFromFirebase([
      { title: 'New', tiles: [], isActive: 0, tags: [], gameMode: 'online', updatedAt: 50 },
    ]);

    expect(upsertBoard).toHaveBeenCalledWith(expect.objectContaining({ title: 'New' }));
  });
});
