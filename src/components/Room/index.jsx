import { useParams } from 'react-router-dom';
import { Box } from '@mui/material';
import { useEffect, useState } from 'react';
import MessageInput from 'components/MessageInput';
import MessageList from 'components/MessageList';
import GameBoard from 'components/GameBoard';
import Navigation from 'components/Navigation';
import TransitionModal from 'components/TransitionModal';
import useWindowDimensions from 'hooks/useWindowDimensions';
import usePlayerMove from 'hooks/usePlayerMove';
import usePresence from 'hooks/usePresence';
import useSoundAndDialog from 'hooks/useSoundAndDialog';
import useLocalStorage from 'hooks/useLocalStorage';
import useMessages from 'hooks/useMessages';
import latestMessageByType from 'helpers/messages';
import { getExtention, getURLPath, isVideo } from 'helpers/strings';
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
  const messages = useMessages(room);
  const [roomBgUrl, setRoomBackground] = useState('');

  // handle timeout of TransitionModal
  let timeoutId;
  useEffect(() => {
    if (popupMessage) timeoutId = setTimeout(() => setPopupMessage(false), 8000);
    return () => clearTimeout(timeoutId);
  }, [popupMessage]);

  const closeTransitionModal = () => {
    clearTimeout(timeoutId);
    setPopupMessage(false);
  };
  // end handle timeout of TransitionModal.

  useEffect(() => {
    const roomMessage = latestMessageByType(messages, 'room');
    if (roomMessage) {
      const messageSettings = JSON.parse(roomMessage.settings);
      return setRoomBackground(messageSettings.roomBackgroundURL);
    }
    if (settings?.roomBackgroundURL?.length) {
      return setRoomBackground(settings.roomBackgroundURL);
    }
    return null;
  }, [messages, settings]);

  const {
    background, backgroundURL, roomBackground,
  } = settings;
  const backgroundSource = background !== 'custom' ? background : backgroundURL;
  const roomBackgroundSource = roomBackground !== 'custom' ? roomBackground : roomBgUrl;
  const bgSource = room !== 'public' && roomBackground === 'custom' ? roomBackgroundSource : backgroundSource;
  const isVideoFile = isVideo(bgSource);
  const bgExtension = getExtention(bgSource);
  const sourcePath = getURLPath(bgSource);

  return (
    <>
      <Navigation room={room} playerList={playerList} />

      <RollButton setRollValue={setRollValue} playerTile={tile} />
      <Box className="main-container" sx={{ backgroundImage: !!bgExtension && !isVideoFile && `url(${sourcePath})` }}>
        {!!isVideoFile && (
          <video autoPlay loop muted>
            <source src={sourcePath} type={`video/${bgExtension}`} />
          </video>
        )}
      </Box>
      {!isMobile ? (
        <Box className="desktop-container">
          <GameBoard
            playerList={playerList}
            tile={tile}
            settings={settings}
            setSettings={setSettings}
          />

          <div className="messages-container">
            <MessageList room={room} isTransparent={background !== 'color'} />
            <MessageInput room={room} isTransparent={background !== 'color'} />
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
                <MessageList room={room} isTransparent={background !== 'color'} />
                <MessageInput room={room} isTransparent={background !== 'color'} />
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
