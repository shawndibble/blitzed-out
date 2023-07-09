import { useParams } from 'react-router-dom';
import {
  Card,
  CardContent,
  Container,
  Grid,
} from '@mui/material';
import Navigation from 'components/Navigation';
import GameSettings from 'components/GameSettings';
import usePlayerList from 'hooks/usePlayerList';
import GameGuide from 'components/GameGuide';
import './styles.css';
import { Trans } from 'react-i18next';

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
                <h2 className="setup"><Trans i18nKey="setup" /></h2>
                <GameSettings submitText={(<Trans i18nKey="access" />)} />
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
