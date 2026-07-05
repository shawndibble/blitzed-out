import {
  activateBoard,
  addBoard,
  deleteBoard,
  getActiveBoard,
  getBoard,
  getBoards,
  updateBoard,
  upsertBoard,
} from '../gameBoard';
import { beforeEach, describe, expect, it } from 'vitest';

import { DBGameBoard } from '@/types/gameBoard';
import db from '../store';

const board = (overrides: Partial<DBGameBoard> = {}): DBGameBoard => ({
  title: 'Test Board',
  tiles: [
    { title: 'Start', description: 'Game start' },
    { title: 'Action 1', description: 'Test action 1' },
    { title: 'Finish', description: 'Game finish' },
  ],
  isActive: 0,
  tags: [],
  gameMode: 'online',
  ...overrides,
});

describe('gameBoard store', () => {
  beforeEach(async () => {
    await db.gameBoard.clear();
  });

  describe('getBoards', () => {
    it('returns all boards ordered by title', async () => {
      await db.gameBoard.bulkAdd([
        board({ title: 'Charlie' }),
        board({ title: 'Alpha' }),
        board({ title: 'Bravo' }),
      ]);

      const result = await getBoards();

      expect(result.map((b) => b.title)).toEqual(['Alpha', 'Bravo', 'Charlie']);
    });

    it('returns an empty array when there are no boards', async () => {
      await expect(getBoards()).resolves.toEqual([]);
    });
  });

  describe('getActiveBoard', () => {
    it('returns the board with isActive set', async () => {
      await db.gameBoard.bulkAdd([
        board({ title: 'Inactive' }),
        board({ title: 'Active', isActive: 1 }),
      ]);

      const result = await getActiveBoard();

      expect(result?.title).toBe('Active');
      expect(result?.isActive).toBe(1);
    });

    it('returns undefined when no board is active', async () => {
      await db.gameBoard.add(board({ title: 'Inactive' }));

      await expect(getActiveBoard()).resolves.toBeUndefined();
    });
  });

  describe('getBoard', () => {
    it('returns a board by id', async () => {
      const id = (await db.gameBoard.add(board({ title: 'Lookup' }))) as number;

      const result = await getBoard(id);

      expect(result?.id).toBe(id);
      expect(result?.title).toBe('Lookup');
    });

    it('returns undefined for a non-existent id', async () => {
      await expect(getBoard(999)).resolves.toBeUndefined();
    });
  });

  describe('addBoard', () => {
    it('adds a board, returns its id, and stamps updatedAt', async () => {
      const before = Date.now();
      const id = await addBoard(board({ title: 'New Board' }));
      const after = Date.now();

      expect(id).toEqual(expect.any(Number));
      const saved = await db.gameBoard.get(id as number);
      expect(saved?.title).toBe('New Board');
      expect(saved?.updatedAt).toBeGreaterThanOrEqual(before);
      expect(saved?.updatedAt).toBeLessThanOrEqual(after);
    });

    it('preserves a caller-supplied updatedAt', async () => {
      const id = await addBoard(board({ title: 'Synced Board', updatedAt: 12345 }));

      const saved = await db.gameBoard.get(id as number);
      expect(saved?.updatedAt).toBe(12345);
    });
  });

  describe('updateBoard', () => {
    it('applies updated fields and stamps a fresh updatedAt', async () => {
      const id = (await db.gameBoard.add(board({ title: 'Original', updatedAt: 1 }))) as number;
      const existing = (await db.gameBoard.get(id)) as DBGameBoard;

      const before = Date.now();
      const updatedRows = await updateBoard(existing, { title: 'Updated Title' });
      const after = Date.now();

      expect(updatedRows).toBe(1);
      const saved = await db.gameBoard.get(id);
      expect(saved?.title).toBe('Updated Title');
      expect(saved?.updatedAt).toBeGreaterThanOrEqual(before);
      expect(saved?.updatedAt).toBeLessThanOrEqual(after);
    });

    it('stamps updatedAt even without an updated-fields record', async () => {
      const id = (await db.gameBoard.add(board({ title: 'Original', updatedAt: 1 }))) as number;
      const existing = (await db.gameBoard.get(id)) as DBGameBoard;

      const before = Date.now();
      await updateBoard(existing);

      const saved = await db.gameBoard.get(id);
      expect(saved?.updatedAt).toBeGreaterThanOrEqual(before);
    });

    it('preserves a caller-supplied updatedAt', async () => {
      const id = (await db.gameBoard.add(board({ title: 'Original', updatedAt: 1 }))) as number;
      const existing = (await db.gameBoard.get(id)) as DBGameBoard;

      await updateBoard(existing, { title: 'Remote Title', updatedAt: 999 });

      const saved = await db.gameBoard.get(id);
      expect(saved?.title).toBe('Remote Title');
      expect(saved?.updatedAt).toBe(999);
    });
  });

  describe('upsertBoard', () => {
    it('creates a new board when the title does not exist', async () => {
      const id = await upsertBoard({
        title: 'Brand New',
        tiles: [{ title: 'Start', description: 'Go' }],
        isActive: 0,
        tags: ['fresh'],
        gameMode: 'offline',
      });

      expect(id).toEqual(expect.any(Number));
      const saved = await db.gameBoard.get(id as number);
      expect(saved?.title).toBe('Brand New');
      expect(saved?.tiles).toHaveLength(1);
      expect(saved?.tags).toEqual(['fresh']);
      expect(saved?.gameMode).toBe('offline');
      expect(saved?.updatedAt).toEqual(expect.any(Number));
    });

    it('updates the existing board when the title already exists', async () => {
      const existingId = (await db.gameBoard.add(board({ title: 'Test Board' }))) as number;

      const id = await upsertBoard({
        title: 'Test Board',
        isActive: 0,
        tiles: [{ title: 'New Tile', description: 'New description' }],
      });

      expect(id).toBe(existingId);
      const boards = await db.gameBoard.toArray();
      expect(boards).toHaveLength(1);
      expect(boards[0].tiles).toEqual([{ title: 'New Tile', description: 'New description' }]);
    });

    it('deactivates all other boards when the upserted board is active', async () => {
      await db.gameBoard.bulkAdd([
        board({ title: 'Old Active', isActive: 1 }),
        board({ title: 'Old Inactive' }),
      ]);

      const id = await upsertBoard({ title: 'New Active', isActive: 1 });

      const boards = await db.gameBoard.toArray();
      const active = boards.filter((b) => b.isActive === 1);
      expect(active).toHaveLength(1);
      expect(active[0].id).toBe(id);
      expect(active[0].title).toBe('New Active');
    });

    it('keeps a single active board when upserting over an existing title as active', async () => {
      await db.gameBoard.bulkAdd([
        board({ title: 'Old Active', isActive: 1 }),
        board({ title: 'Target' }),
      ]);

      await upsertBoard({ title: 'Target', isActive: 1 });

      const boards = await db.gameBoard.toArray();
      const active = boards.filter((b) => b.isActive === 1);
      expect(active).toHaveLength(1);
      expect(active[0].title).toBe('Target');
    });

    it('rejects tiles without a title and stores nothing', async () => {
      const result = await upsertBoard({
        tiles: [{ title: 'Orphan', description: 'No board title' }],
      });

      expect(result).toBeUndefined();
      await expect(db.gameBoard.count()).resolves.toBe(0);
    });

    it('rejects an empty title when tiles are present', async () => {
      const result = await upsertBoard({
        title: '',
        tiles: [{ title: 'Orphan', description: 'No board title' }],
      });

      expect(result).toBeUndefined();
      await expect(db.gameBoard.count()).resolves.toBe(0);
    });
  });

  describe('activateBoard', () => {
    it('activates the target board and deactivates all others', async () => {
      const ids = (await db.gameBoard.bulkAdd(
        [
          board({ title: 'First', isActive: 1 }),
          board({ title: 'Second' }),
          board({ title: 'Third', isActive: 1 }),
        ],
        { allKeys: true }
      )) as number[];

      await activateBoard(ids[1]);

      const boards = await getBoards();
      expect(boards.find((b) => b.id === ids[1])?.isActive).toBe(1);
      expect(boards.filter((b) => b.isActive === 1)).toHaveLength(1);
    });

    it('does nothing when there are no boards', async () => {
      await activateBoard(1);

      await expect(db.gameBoard.count()).resolves.toBe(0);
    });
  });

  describe('deleteBoard', () => {
    it('removes the board with the given id', async () => {
      const ids = (await db.gameBoard.bulkAdd(
        [board({ title: 'Keep' }), board({ title: 'Remove' })],
        { allKeys: true }
      )) as number[];

      await deleteBoard(ids[1]);

      const boards = await getBoards();
      expect(boards.map((b) => b.title)).toEqual(['Keep']);
    });
  });
});
