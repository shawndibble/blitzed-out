import { getBoard } from 'services/firebase';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { upsertBoard, getActiveBoard } from 'stores/gameBoard';
import { useLiveQuery } from 'dexie-react-hooks';

export default function useUrlImport(settings, setSettings) {
  const [alert, setAlert] = useState(null);
  const [hasCompletedImport, setHasCompletedImport] = useState(false);
  const localGameBoard = useLiveQuery(getActiveBoard)?.tiles;
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

  useEffect(() => {
    const importGameBoard = async () => {
      if (!importBoard) return;

      setParams({});
      const board = await getBoard(importBoard);
      if (!board?.gameBoard) return setAlert(t('failedBoardImport'));

      const importedGameBoard = parseGameBoard(board.gameBoard);
      if (!importedGameBoard) return setAlert(t('failedBoardImport'));

      const title =
        board?.title !== t('settingsGenerated')
          ? board.title
          : t('importedBoard');

      console.log(title, board.title);

      upsertBoard({ ...board, title, tiles: importedGameBoard });
      const importSettings = parseSettings(board?.settings);

      setSettings({ ...settings, ...importSettings });
      setHasCompletedImport(true);
    };

    importGameBoard();
  }, [importBoard]);

  useEffect(() => {
    if (hasCompletedImport && alert !== t('updated')) {
      setAlert(t('updated'));
      setHasCompletedImport(false);
    }
  }, [localGameBoard]);

  return [alert, clearAlert];
}
