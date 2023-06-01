import { useParams } from 'react-router-dom';
import MessageInput from '../MessageInput';
import MessageList from '../MessageList';
import GameBoard from '../GameBoard';
import './styles.css';
import Navigation from '../Navigation';
import { Box, Fab } from '@mui/material';
import { Casino } from '@mui/icons-material';
import { useState } from 'react';
import FullWidthTabs from '../FullWidthTabs';

export default function Room() {
    const params = useParams();
    const room = params.id ?? 'public';

    // use an array so that when we roll the same number twice, we still move the user.
    const [rollValue, setRollValue] = useState([0])
    const roll = () => setRollValue([Math.floor(Math.random() * 4) + 1]);

    return (
        <>
            <Navigation room={room} />

            <Fab
                variant="extended"
                size="medium"
                aria-label="roll"
                onClick={roll} 
                className="dice-roller"
            >
                <Casino /> Roll
            </Fab>
            
            <Box sx={{ display: { xs: 'none', sm: 'flex' } }} className="desktop-container">
                <GameBoard roll={rollValue} roomId={room} />
            
                <div className="messages-container">
                    <MessageList roomId={room} />
                    <MessageInput roomId={room} />
                </div>
            </Box>

            <Box sx={{ display: { xs: 'block', sm: 'none' } }} className="mobile-container">
                <FullWidthTabs
                    tab1={<>
                        <GameBoard roll={rollValue} roomId={room} />
                    </>}
                    tab2={
                        <div className="messages-container">
                            <MessageList roomId={room} />
                            <MessageInput roomId={room} />
                        </div>
                    }
                />
            </Box>
        </>
    );
}