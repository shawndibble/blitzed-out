import { getBoard } from 'services/firebase';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { upsertBoard } from 'stores/gameBoard';

export default function useUrlImport(settings, setSettings) {
  const [alert, setAlert] = useState(null);
  const [queryParams, setParams] = useSearchParams();
  const importBoard = queryParams.get('importBoard');
  const { t } = useTranslation();

  function clearAlert() {
    setAlert(null);
  }

  function parseGameBoard(gameBoardString) {
    try {
      const gameBoard = JSON.parse(gameBoardString);
      return Array.isArray(gameBoard) ? gameBoard : null;
    } catch {
      return null;
    }
  }

  function parseSettings(settingsString) {
    try {
      return JSON.parse(settingsString);
    } catch {
      return {};
    }
  }

  const importGameBoard = async () => {
    setParams({});
    const board = await getBoard(importBoard);
    if (!board?.gameBoard) return setAlert(t('failedBoardImport'));

    const importedGameBoard = parseGameBoard(board.gameBoard);
    if (!importedGameBoard) return setAlert(t('failedBoardImport'));

    const title =
      board?.title !== t('settingsGenerated')
        ? board.title
        : t('importedBoard');

    upsertBoard({ ...board, title, tiles: importedGameBoard, isActive: 1 });
    const importSettings = parseSettings(board?.settings);

    setSettings({ ...settings, ...importSettings });

    if (alert !== t('updated')) {
      setAlert(t('updated'));
    }
  };

  useEffect(() => {
    if (importBoard) {
      importGameBoard();
    }
  }, [importBoard]);

  return [alert, clearAlert];
}
