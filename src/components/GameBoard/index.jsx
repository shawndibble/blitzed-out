import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import useLocalStorage from 'hooks/useLocalStorage';
import useMessages from 'hooks/useMessages';
import ToastAlert from 'components/ToastAlert';
import { importActions } from 'services/importLocales';
import { useTranslation } from 'react-i18next';
import GameTile from './GameTile';
import './styles.css';

export default function GameBoard({ playerList, settings, setSettings }) {
  const { id: room } = useParams();
  const [queryParams, setParams] = useSearchParams();
  const [localGameBoard, setLocalGameBoard] = useLocalStorage('customBoard');
  const [gameBoard, setGameBoard] = useState(localGameBoard);
  const messages = useMessages(room || 'public');
  const importBoard = queryParams.get('importBoard');
  const { i18n } = useTranslation();
  const [alert, setAlert] = useState('');

  function importGameBoard() {
    // if we aren't importing, then just load the local gameboard.
    if (!importBoard) setGameBoard(localGameBoard);
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
    // When we import the board, also import the gameboard settings (not application settings).
    const importSettings = JSON.parse(importMessage?.settings);
    const dataFolder = importActions(i18n.resolvedLanguage, importMessage?.settings?.gameMode);
    Object.keys(importSettings).forEach((setting) => {
      if (!dataFolder[setting] && !setting.endsWith('Variation')) {
        delete importSettings[setting];
      }
    });
    setSettings({ ...settings, ...importSettings });
    // remove the import from the URL
    setParams({});
  }

  useEffect(() => importGameBoard(), [messages, importBoard]);

  useEffect(() => {
    if (gameBoard !== localGameBoard) {
      setGameBoard(localGameBoard);
      setAlert('Import Complete');
    }
  }, [localGameBoard]);

  if (!Array.isArray(gameBoard)) return null;

  return (
    <div className="gameboard">
      <ol>
        {gameBoard.map((entry, index) => (
          <GameTile
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            id={`tile-${index}`}
            title={`#${index + 1}: ${entry.title}`}
            description={entry.description}
            players={playerList.filter((player) => player.location === index)}
            current={playerList
              .find((player) => player.isSelf && player.location === index && index !== 0)}
            background={settings.background}
          />
        ))}
      </ol>
      <ToastAlert type="success" open={!!alert} setOpen={setAlert} close={() => setAlert(null)}>
        {alert}
      </ToastAlert>
    </div>
  );
}
