import { getBoard } from '@/services/firebase';
import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { upsertBoard } from '@/stores/gameBoard';
import { logger } from '@/utils/logger';

interface Settings {
  [key: string]: any;
}

interface Board {
  gameBoard?: string;
  title?: string;
  settings?: string;
  [key: string]: any;
}

type UrlImportResult = [string | null, () => void, boolean];

export default function useUrlImport(
  settings: Settings,
  setSettings: (settings: Settings) => void
): UrlImportResult {
  const [alert, setAlert] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState<boolean>(false);
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
    } catch (error) {
      logger.warn('Failed to parse game board JSON:', false, error);
      return null;
    }
  }, []);

  const parseSettings = useCallback((settingsString?: string): Settings => {
    try {
      return settingsString ? JSON.parse(settingsString) : {};
    } catch (error) {
      logger.warn('Failed to parse settings JSON:', false, error);
      return {};
    }
  }, []);

  const importGameBoard = useCallback(async (): Promise<void> => {
    setParams({});
    if (!importBoard) return;

    setIsImporting(true);
    try {
      const board = (await getBoard(importBoard)) as Board | null;
      if (!board?.gameBoard) {
        setAlert(t('failedBoardImport'));
        return;
      }

      const importedGameBoard = parseGameBoard(board.gameBoard);
      if (!importedGameBoard) {
        setAlert(t('failedBoardImport'));
        return;
      }

      const title = board?.title !== t('settingsGenerated') ? board.title : t('importedBoard');

      upsertBoard({ ...board, title, tiles: importedGameBoard, isActive: 1 });

      const importSettings = parseSettings(board?.settings);

      // For public rooms, ensure gameMode is online to prevent setup dialog
      const currentUrl = new URL(window.location.href);
      const roomId = currentUrl.pathname.split('/').pop() || '';
      const finalSettings = { ...settings, ...importSettings };

      if (roomId.toUpperCase() === 'PUBLIC' && importSettings.gameMode === 'local') {
        finalSettings.gameMode = 'online';
      }

      setSettings(finalSettings);

      if (alert !== t('updated')) {
        setAlert(t('updated'));
      }
    } finally {
      setIsImporting(false);
    }
  }, [importBoard, parseGameBoard, parseSettings, settings, setSettings, t, alert, setParams]);

  useEffect(() => {
    if (importBoard) {
      importGameBoard();
    }
  }, [importBoard, importGameBoard]);

  return [alert, clearAlert, isImporting || !!importBoard];
}
