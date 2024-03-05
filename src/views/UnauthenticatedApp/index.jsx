import { useParams } from 'react-router-dom';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  Typography,
} from '@mui/material';
import { ExpandMore, Language } from '@mui/icons-material';
import { Trans, useTranslation } from 'react-i18next';
import Navigation from 'views/Navigation';
import GameSettings from 'views/GameSettings';
import usePlayerList from 'hooks/usePlayerList';
import GameGuide from 'views/GameGuide';
import languages from 'locales/languages.json';
import './styles.css';
import useBreakpoint from 'hooks/useBreakpoint';

export default function UnauthenticatedApp() {
  const { i18n } = useTranslation();
  const params = useParams();
  const room = params.id ?? 'PUBLIC';
  const playerList = usePlayerList(room);
  const isMobile = useBreakpoint('sm');

  const languageLinks = Object.entries(languages).map(([key, obj]) => (
    <Button
      key={key}
      onClick={() => i18n.changeLanguage(key)}
      disabled={i18n.resolvedLanguage === key}
    >
      {obj.label}
    </Button>
  ));

  return (
    <>
      <Navigation room={room} playerList={playerList} />
      <Container maxWidth='lg' sx={{ mt: 8 }}>
        <Grid container>
          <Grid item xs={12} sm={6} md={4} sx={{ mx: isMobile && 0.5 }}>
            {isMobile ? (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />} >
                  <Typography variant='h6'>Game Guide:</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <GameGuide />
                </AccordionDetails>
              </Accordion>
            ) : (
              <Card className='unauthenticated-card'>
                <CardContent>
                  <GameGuide />
                </CardContent>
              </Card>
            )}
          </Grid>
          <Grid item xs={12} sm={6} md={8}>
            <Card className='unauthenticated-card'>
              <CardContent>
                <h2 className='setup'>
                  <Trans i18nKey='setup' />
                </h2>
                <GameSettings submitText={<Trans i18nKey='access' />} />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        <Grid container sx={{ mt: 1 }}>
          <Grid item className='language'>
            <Card className='unauthenticated-card'>
              <CardContent className='translation-card-content'>
                {!isMobile && <Language sx={{ mr: 1 }} />}
                <Typography sx={{ mr: 1 }}>
                  <Trans i18nKey='language' />:
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
