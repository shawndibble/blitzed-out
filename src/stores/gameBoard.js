import db from './store';

const { gameBoard } = db;

export const getBoards = () => {
  return gameBoard.orderBy('title').toArray();
};

export const getActiveBoard = async () => {
  return (await gameBoard.where('isActive').equals(1).first()) || {};
};

export const getBoard = (id) => {
  return gameBoard.get(id);
};

export const addBoard = async (record) => {
  return await gameBoard.add(record);
};

export const updateBoard = async (board, record) => {
  return await gameBoard.update(board.id, { ...board, ...record });
};

export const upsertBoard = async (record) => {
  const newData = {
    title: record.title === undefined ? '' : record.title,
    tiles: record.tiles,
    isActive: record.isActive === undefined ? 1 : record.isActive,
    tags: record.tags || [],
    gameMode: record.gameMode || 'online',
  };

  // if we have tiles, we should have a title to go with it.
  if (!newData.tiles && newData.tiles.length !== 0) {
    return;
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

export const activateBoard = async (id) => {
  const allBoards = await gameBoard.toArray();

  const updatedBoards = allBoards.map((board) => ({
    ...board,
    isActive: board.id === id ? 1 : 0,
  }));

  await gameBoard.bulkPut(updatedBoards);
};

export const deleteBoard = async (id) => {
  return await gameBoard.delete(id);
};

const deactivateAllBoards = async () => {
  await gameBoard.where('isActive').equals(1).modify({ isActive: 0 });
};
