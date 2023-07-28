import { useParams } from 'react-router-dom';
import { Box, Fab } from '@mui/material';
import { Casino } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import MessageInput from 'components/MessageInput';
import MessageList from 'components/MessageList';
import GameBoard from 'components/GameBoard';
import Navigation from 'components/Navigation';
import useWindowDimensions from 'hooks/useWindowDimensions';
import usePlayerMove from 'hooks/usePlayerMove';
import usePresence from 'hooks/usePresence';
import TransitionModal from 'components/TransitionModal';
import useSoundAndDialog from 'hooks/useSoundAndDialog';
import BottomTabs from './BottomTabs';
import './styles.css';

export default function Room() {
  const { t } = useTranslation();
  const params = useParams();
  const room = params.id ?? 'public';

  usePresence(room);
  const [popupMessage, setPopupMessage] = useSoundAndDialog(room);
  const { isMobile } = useWindowDimensions();
  const [rollValue, setRollValue] = useState([0]);
  const [isDisabled, setDisabled] = useState(false);

  function roll() {
    setRollValue([Math.floor(Math.random() * 4) + 1]);
    setDisabled(true);
    setTimeout(() => setDisabled(false), 4000);
  }

  const { playerList, tile } = usePlayerMove(room, rollValue);

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

      <Fab
        variant="extended"
        size="medium"
        aria-label={t('roll')}
        onClick={() => roll()}
        className="dice-roller"
        disabled={isDisabled}
      >
        <Casino />
        {' '}
        {isDisabled ? t('wait') : t('roll')}
      </Fab>

      {!isMobile ? (
        <Box className="desktop-container">
          <GameBoard playerList={playerList} tile={tile} />

          <div className="messages-container">
            <MessageList room={room} />
            <MessageInput room={room} />
          </div>
        </Box>
      ) : (
        <Box className="mobile-container">
          <BottomTabs
            tab1={(
              <GameBoard playerList={playerList} tile={tile} />
            )}
            tab2={(
              <div className="messages-container">
                <MessageList room={room} />
                <MessageInput room={room} />
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
