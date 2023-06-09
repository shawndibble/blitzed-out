import './styles.css';
import {
  Card,
  CardContent,
  Container,
  Grid,
} from '@mui/material';
import { useParams } from 'react-router-dom';
import Navigation from '../Navigation';
import GameSettings from '../GameSettings';
import usePlayerList from '../../hooks/usePlayerList';
import GameGuide from '../GameGuide';

export default function UnauthenticatedApp() {
  const params = useParams();
  const room = params.id ?? 'public';
  const playerList = usePlayerList(room)[0];

  return (
    <>
      <Navigation room={room} playerList={playerList} />
      <Container maxWidth="md" sx={{ mt: 8 }}>
        <Grid container>
          <Grid item xs={12} sm={6}>
            <Card className="unauthenticated-card">
              <CardContent>
                <h2 className="setup">Game Setup</h2>
                <GameSettings submitText="Access Game" />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Card className="unauthenticated-card">
              <CardContent>
                <GameGuide />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </>
  );
}
