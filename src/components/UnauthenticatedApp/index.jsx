import './styles.css';
import Navigation from '../Navigation';
import { Container} from '@mui/material';
import GameSettings from '../GameSettings';
import { useParams } from 'react-router-dom';
import usePlayerList from '../../hooks/usePlayerList';

export default function UnauthenticatedApp() {
    const params = useParams();
    const room = params.id ?? 'public';
    const playerList = usePlayerList(room)[0];

    return (
        <>
            <Navigation room={room} playerList={playerList} />
            <Container maxWidth={'xs'}>
                <h2 className="setup">Game Setup</h2>
                <GameSettings submitText="Access Game" />
            </Container>
        </>
    );
}