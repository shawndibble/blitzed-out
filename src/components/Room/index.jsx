import { useParams } from 'react-router-dom';
import MessageInput from '../MessageInput';
import MessageList from '../MessageList';
import GameBoard from '../GameBoard';
import './styles.css';
import Navigation from '../Navigation';
import { Box, Fab } from '@mui/material';
import { Casino } from '@mui/icons-material';
import BottomTabs from './BottomTabs';
import useWindowDimensions from '../../hooks/useWindowDimensions';
import usePlayerMove from '../../hooks/usePlayerMove';
import { useState } from 'react';
import usePresence from '../../hooks/usePresence';

export default function Room() {
    const params = useParams();
    const room = params.id ?? 'public';

    usePresence(room);

    const { width } = useWindowDimensions();
    const [rollValue, setRollValue] = useState([0])

    function roll() {
        setRollValue([Math.floor(Math.random() * 4) + 1]);
    }

    const {playerList, tile} = usePlayerMove(room, rollValue);

    return (
        <>
            <Navigation room={room} playerList={playerList} />

            <Fab
                variant="extended"
                size="medium"
                aria-label="roll"
                onClick={roll} 
                className="dice-roller"
            >
                <Casino /> Roll
            </Fab>
            
            {width > 600 ? (
                <Box className="desktop-container">
                    <GameBoard playerList={playerList} tile={tile} />
                
                    <div className="messages-container">
                        <MessageList roomId={room} />
                        <MessageInput roomId={room} />
                    </div>
                </Box>
            ): (
                <Box className="mobile-container">
                    <BottomTabs
                        tab1={<>
                            <GameBoard playerList={playerList} tile={tile} />
                        </>}
                        tab2={
                            <div className="messages-container">
                                <MessageList roomId={room} />
                                <MessageInput roomId={room} />
                            </div>
                        }
                    />
                </Box>
            )}
        </>
    );
}