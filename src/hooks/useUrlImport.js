import useLocalStorage from 'hooks/useLocalStorage';
import useMessages from 'hooks/useMessages';
import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';

export default function useUrlImport(room, settings, setSettings) {
  const [alert, setAlert] = useState(null);
  const [hasCompletedImport, setHasCompletedImport] = useState(false);
  const [localGameBoard, setLocalGameBoard] = useLocalStorage('customBoard');
  const [queryParams, setParams] = useSearchParams();
  const importBoard = queryParams.get('importBoard');
  const messages = useMessages(room || 'public');
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

  const importGameBoard = useCallback(() => {
    if (!importBoard) return;

    setParams({});
    const importMessage = messages.find((m) => m.id === importBoard);
    if (!importMessage?.gameBoard) return;

    const importedGameBoard = parseGameBoard(importMessage.gameBoard);
    if (!importedGameBoard) return;

    setLocalGameBoard(importedGameBoard);
    const importSettings = parseSettings(importMessage?.settings);
    setSettings({ ...settings, ...importSettings });
    setHasCompletedImport(true);
  }, [importBoard, messages, settings, setSettings]);

  useEffect(() => importGameBoard(), [importGameBoard]);

  useEffect(() => {
    if (hasCompletedImport && alert !== t('updated')) {
      setAlert(t('updated'));
      setHasCompletedImport(false);
    }
  }, [localGameBoard]);

  return [alert, clearAlert];
}
