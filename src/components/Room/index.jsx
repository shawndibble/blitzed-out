import { useParams } from 'react-router-dom';
import { Box, Fab } from '@mui/material';
import { Casino } from '@mui/icons-material';
import { useState } from 'react';
import MessageInput from '../MessageInput';
import MessageList from '../MessageList';
import GameBoard from '../GameBoard';
import './styles.css';
import Navigation from '../Navigation';
import BottomTabs from './BottomTabs';
import useWindowDimensions from '../../hooks/useWindowDimensions';
import usePlayerMove from '../../hooks/usePlayerMove';
import usePresence from '../../hooks/usePresence';

export default function Room() {
  const params = useParams();
  const room = params.id ?? 'public';

  usePresence(room);

  const { isMobile } = useWindowDimensions();
  const [rollValue, setRollValue] = useState([0]);
  const [isDisabled, setDisabled] = useState(false);

  function roll() {
    setRollValue([Math.floor(Math.random() * 4) + 1]);
    setDisabled(true);
    setTimeout(() => setDisabled(false), 4000);
  }

  const { playerList, tile } = usePlayerMove(room, rollValue);

  return (
    <>
      <Navigation room={room} playerList={playerList} />

      <Fab
        variant="extended"
        size="medium"
        aria-label="roll"
        onClick={() => roll()}
        className="dice-roller"
        disabled={isDisabled}
      >
        <Casino />
        {' '}
        {isDisabled ? 'Wait' : 'Roll'}
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
    </>
  );
}
