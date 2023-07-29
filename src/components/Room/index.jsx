import { useParams } from 'react-router-dom';
import { Box } from '@mui/material';
import { useEffect, useState } from 'react';
import MessageInput from 'components/MessageInput';
import MessageList from 'components/MessageList';
import GameBoard from 'components/GameBoard';
import Navigation from 'components/Navigation';
import useWindowDimensions from 'hooks/useWindowDimensions';
import usePlayerMove from 'hooks/usePlayerMove';
import usePresence from 'hooks/usePresence';
import TransitionModal from 'components/TransitionModal';
import useSoundAndDialog from 'hooks/useSoundAndDialog';
import useLocalStorage from 'hooks/useLocalStorage';
import BottomTabs from './BottomTabs';
import RollButton from './RollButton';
import './styles.css';

export default function Room() {
  const params = useParams();
  const room = params.id ?? 'public';

  usePresence(room);
  const [popupMessage, setPopupMessage] = useSoundAndDialog(room);
  const { isMobile } = useWindowDimensions();
  const [rollValue, setRollValue] = useState([0]);
  const { playerList, tile } = usePlayerMove(room, rollValue);
  const [settings, setSettings] = useLocalStorage('gameSettings');

  // handle timeout of dialog
  let timeoutId;
  useEffect(() => {
    if (popupMessage) timeoutId = setTimeout(() => setPopupMessage(false), 8000);
    return () => clearTimeout(timeoutId);
  }, [popupMessage]);

  const closeTransitionModal = () => {
    clearTimeout(timeoutId);
    setPopupMessage(false);
  };
  // end handle timeout of dialog.

  return (
    <>
      <Navigation room={room} playerList={playerList} />

      <RollButton setRollValue={setRollValue} playerTile={tile} />

      <div className={`main-container ${settings.background}`} />
      {!isMobile ? (
        <Box className="desktop-container">
          <GameBoard
            playerList={playerList}
            tile={tile}
            settings={settings}
            setSettings={setSettings}
          />

          <div className="messages-container">
            <MessageList room={room} isTransparent={settings.background !== 'color'} />
            <MessageInput room={room} isTransparent={settings.background !== 'color'} />
          </div>
        </Box>
      ) : (
        <Box className="mobile-container">
          <BottomTabs
            tab1={(
              <GameBoard
                playerList={playerList}
                tile={tile}
                settings={settings}
                setSettings={setSettings}
              />
            )}
            tab2={(
              <div className="messages-container">
                <MessageList room={room} isTransparent={settings.background !== 'color'} />
                <MessageInput room={room} isTransparent={settings.background !== 'color'} />
              </div>
            )}
          />
        </Box>
      )}
      {popupMessage?.text && (
        <TransitionModal
          text={popupMessage?.text}
          displayName={popupMessage?.displayName}
          setOpen={setPopupMessage}
          open={!!popupMessage || !!popupMessage?.text}
          handleClose={closeTransitionModal}
        />
      )}
    </>
  );
}
