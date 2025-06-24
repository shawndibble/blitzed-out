import db from './store';
import { DBGameBoard } from '@/types/gameBoard';

const { gameBoard } = db;

export const getBoards = (): Promise<DBGameBoard[]> => {
  return gameBoard.orderBy('title').toArray();
};

export const getActiveBoard = async (): Promise<{}> => {
  return (await gameBoard.where('isActive').equals(1)?.first()) || {};
};

export const getBoard = (id: number): Promise<DBGameBoard | undefined> => {
  return gameBoard.get(id);
};

export const addBoard = async (record: Partial<DBGameBoard>): Promise<number | undefined> => {
  return gameBoard.add(record as DBGameBoard);
};

export const updateBoard = async (
  board: DBGameBoard,
  record?: Partial<DBGameBoard>
): Promise<number> => {
  return gameBoard.update(board.id as number, { ...board, ...record });
};

export const upsertBoard = async (record: Partial<DBGameBoard>): Promise<number | undefined> => {
  const newData: DBGameBoard = {
    title: record.title === undefined ? '' : record.title,
    tiles: record.tiles || [],
    isActive: record.isActive === undefined ? 1 : record.isActive,
    tags: record.tags || [],
    gameMode: record.gameMode || 'online',
  };

  // if we have tiles, we should have a title to go with it.
  if (!newData?.title?.length && newData?.tiles?.length) {
    return undefined;
  }

  const board = await gameBoard.where('title').equals(newData.title).first();

  return db.transaction('rw', db.gameBoard, async () => {
    if (newData.isActive) {
      await deactivateAllBoards();
    }

    if (board) {
      await updateBoard(board, record);
      return board.id;
    }

    return await addBoard(newData);
  });
};

export const activateBoard = async (id: number): Promise<void> => {
  const allBoards = await gameBoard.toArray();

  const updatedBoards = allBoards.map((board) => ({
    ...board,
    isActive: board.id === id ? 1 : 0,
  }));

  await gameBoard.bulkPut(updatedBoards);
};

export const deleteBoard = async (id: number): Promise<void> => {
  await gameBoard.delete(id);
};

const deactivateAllBoards = async (): Promise<void> => {
  await gameBoard.where('isActive').equals(1).modify({ isActive: 0 });
};
