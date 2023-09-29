import useLocalStorage from 'hooks/useLocalStorage';
import useMessages from 'hooks/useMessages';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';

export default function useUrlImport(room, settings, setSettings) {
  const [alert, setAlert] = useState(null);
  const [localGameBoard, setLocalGameBoard] = useLocalStorage('customBoard');
  const [queryParams, setParams] = useSearchParams();
  const importBoard = queryParams.get('importBoard');
  const [gameBoard, setGameBoard] = useState(localGameBoard);
  const messages = useMessages(room || 'public');
  const { t } = useTranslation();

  function clearAlert() {
    setAlert(null);
  }

  function importGameBoard() {
    // if we aren't importing, then just load the local game board.
    if (!importBoard) {
      setGameBoard(localGameBoard);
      return;
    }

    // remove the import from the URL
    setParams({});
    // grab the message by its id (import board value)
    const importMessage = messages.find((m) => m.id === importBoard);
    // no game board? we are done.
    if (!importMessage?.gameBoard) return;
    // convert that string to JSON (array of objects)
    const importedGameBoard = JSON.parse(importMessage.gameBoard);
    // not an array of objects? we are done.
    if (!Array.isArray(importedGameBoard)) return;
    // ensure when we roll, we get the right board tile.
    setLocalGameBoard(importedGameBoard);
    // When we import the board, also import the game board settings (not application settings).
    const importSettings = JSON.parse(importMessage?.settings);
    // update the settings with the imported settings.
    setSettings({ ...settings, ...importSettings });
  }

  useEffect(() => importGameBoard(), [importBoard]);

  useEffect(() => {
    if (gameBoard !== localGameBoard) {
      setGameBoard(localGameBoard);
      setAlert(t('updated'));
    }
  }, [localGameBoard]);

  return [alert, clearAlert];
}