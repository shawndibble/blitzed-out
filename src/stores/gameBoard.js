import db from './store';

const { gameBoard } = db;

export const importBoard = async (record) => {
  const recordData = record.map((tile) => ({ ...tile, isActive: 1 }));
  return await gameBoard.bulkAdd(recordData);
};

export const getBoards = () => {
  return gameBoard.toArray();
};

export const getBoard = (id) => {
  return gameBoard.get(id);
};

export const addBoard = async (record) => {
  return await gameBoard.add({
    ...record,
    isActive: 1,
  });
};

export const updateBoard = async (id, record) => {
  return await gameBoard.update(id, record);
};

export const deleteBoard = async (id) => {
  return await gameBoard.delete(id);
};
