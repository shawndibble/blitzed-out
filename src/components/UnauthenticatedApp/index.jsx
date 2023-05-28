import './styles.css';
import Navigation from '../Navigation';
import { Container} from '@mui/material';
import GameSettings from '../GameSettings';

export default function UnauthenticatedApp() {
    return (
        <>
            <Navigation />
            <Container maxWidth={'xs'}>
                <h2 className="setup">Game Setup</h2>
                <GameSettings submitText="Access Game" />
            </Container>
        </>
    );
}