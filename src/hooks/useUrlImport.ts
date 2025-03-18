import { getBoard } from '@/services/firebase';
import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { upsertBoard } from '@/stores/gameBoard';

interface Settings {
  [key: string]: any;
}

interface Board {
  gameBoard?: string;
  title?: string;
  settings?: string;
  [key: string]: any;
}

type UrlImportResult = [string | null, () => void];

export default function useUrlImport(
  settings: Settings, 
  setSettings: (settings: Settings) => void
): UrlImportResult {
  const [alert, setAlert] = useState<string | null>(null);
  const [queryParams, setParams] = useSearchParams();
  const importBoard = queryParams.get('importBoard');
  const { t } = useTranslation();

  const clearAlert = useCallback((): void => {
    setAlert(null);
  }, []);

  const parseGameBoard = useCallback((gameBoardString: string): any[] | null => {
    try {
      const gameBoard = JSON.parse(gameBoardString);
      return Array.isArray(gameBoard) ? gameBoard : null;
    } catch {
      return null;
    }
  }, []);

  const parseSettings = useCallback((settingsString?: string): Settings => {
    try {
      return settingsString ? JSON.parse(settingsString) : {};
    } catch {
      return {};
    }
  }, []);

  const importGameBoard = useCallback(async (): Promise<void> => {
    setParams({});
    if (!importBoard) return;
    
    const board = await getBoard(importBoard) as Board | null;
    if (!board?.gameBoard) return setAlert(t('failedBoardImport'));

    const importedGameBoard = parseGameBoard(board.gameBoard);
    if (!importedGameBoard) return setAlert(t('failedBoardImport'));

    const title = board?.title !== t('settingsGenerated') ? board.title : t('importedBoard');

    upsertBoard({ ...board, title, tiles: importedGameBoard, isActive: 1 });
    const importSettings = parseSettings(board?.settings);

    setSettings({ ...settings, ...importSettings });

    if (alert !== t('updated')) {
      setAlert(t('updated'));
    }
  }, [importBoard, parseGameBoard, parseSettings, settings, setSettings, t, alert, setParams]);

  useEffect(() => {
    if (importBoard) {
      importGameBoard();
    }
  }, [importBoard, importGameBoard]);

  return [alert, clearAlert];
}
