import { useParams } from 'react-router-dom';
import {
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  Typography,
} from '@mui/material';
import { Language } from '@mui/icons-material';
import { Trans, useTranslation } from 'react-i18next';
import Navigation from 'components/Navigation';
import GameSettings from 'components/GameSettings';
import usePlayerList from 'hooks/usePlayerList';
import GameGuide from 'components/GameGuide';
import languages from 'locales/languages.json';
import './styles.css';

export default function UnauthenticatedApp() {
  const { i18n } = useTranslation();
  const params = useParams();
  const room = params.id ?? 'public';
  const playerList = usePlayerList(room)[0];

  const languageLinks = Object.entries(languages).map(([key, label]) => (
    <Button
      onClick={() => i18n.changeLanguage(key)}
      disabled={i18n.resolvedLanguage === key}
    >
      {label}
    </Button>
  ));

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
        <Grid container sx={{ mt: 1 }}>
          <Grid item className="language">
            <Card className="unauthenticated-card">
              <CardContent className="translation-card-content">
                <Language sx={{ mr: 1 }} />
                <Typography sx={{ mr: 1 }}>
                  <Trans i18nKey="language" />
                  :
                </Typography>
                {languageLinks}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </>
  );
}
