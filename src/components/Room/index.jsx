import { useParams } from 'react-router-dom';
import MessageInput from '../MessageInput';
import MessageList from '../MessageList';
import GameBoard from '../GameBoard';
import './styles.css';
import Navigation from '../Navigation';
import TransitionModal from '../TransitionModal';
import { Box, Fab } from '@mui/material';
import { Casino } from '@mui/icons-material';
import FullWidthTabs from '../FullWidthTabs';
import useWindowDimensions from '../../hooks/useWindowDimensions';
import usePlayerMove from '../../hooks/usePlayerMove';
import { useState } from 'react';
import usePresence from '../../hooks/usePresence';

export default function Room() {
    const params = useParams();
    const room = params.id ?? 'public';

    usePresence(room);

    const { width } = useWindowDimensions();
    const [isModalOpen, setModalOpen] = useState(false);
    const [rollValue, setRollValue] = useState([0])

    function roll() {
        setRollValue([Math.floor(Math.random() * 4) + 1]);
    }

    const {playerList, tile} = usePlayerMove(room, setModalOpen, rollValue);

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
                    <FullWidthTabs
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

            <TransitionModal
                title={tile?.title}
                description={tile?.description}
                setOpen={setModalOpen}
                open={isModalOpen}
            />
        </>
    );
}