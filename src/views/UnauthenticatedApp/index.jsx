import { Language } from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  TextField,
  Typography,
} from '@mui/material';
import useAuth from 'context/hooks/useAuth';
import useBreakpoint from 'hooks/useBreakpoint';
import useLocalStorage from 'hooks/useLocalStorage';
import usePlayerList from 'hooks/usePlayerList';
import languages from 'locales/languages.json';
import React, { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import Navigation from 'views/Navigation';
import './styles.css';

export default function UnauthenticatedApp() {
  const { i18n, t } = useTranslation();
  const { login, user } = useAuth();
  const params = useParams();
  const room = params.id ?? 'PUBLIC';
  const playerList = usePlayerList();
  const isMobile = useBreakpoint('sm');
  const [displayName, setDisplayName] = useState(user?.displayName || '');

  const [settings, updateSettings] = useLocalStorage('gameSettings', {
    boardUpdated: false,
    roomUpdated: false,
    playerDialog: true,
    othersDialog: false,
    mySound: true,
    chatSound: true,
    locale: 'en',
    gameMode: 'online',
    background: 'color',
    finishRange: [30, 70],
    roomTileCount: 40,
    roomDice: '1d6',
  });

  const handleSubmit = async (event) => {
    event.preventDefault();

    await updateSettings({ ...settings, displayName, room });
    await login(displayName);
  };

  const onEnterKey = async (event) => {
    if (event.key === 'Enter') {
      await handleSubmit(event);
    }
  };

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
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Grid container flexDirection="column">
          <Card className="unauthenticated-card">
            <CardContent>
              <h2 className="setup">
                <Trans i18nKey="setup" />
              </h2>
              <Box
                component="form"
                method="post"
                onSubmit={handleSubmit}
                className="settings-box"
              >
                <TextField
                  fullWidth
                  id="displayName"
                  label={t('displayName')}
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  required
                  autoFocus
                  onKeyDown={(event) => onEnterKey(event)}
                  margin="normal"
                />
                <div className="flex-buttons">
                  <Button variant="contained" type="submit">
                    <Trans i18nKey="access" />
                  </Button>
                </div>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid container sx={{ mt: 1 }}>
          <Grid item className="language">
            <Card className="unauthenticated-card">
              <CardContent className="translation-card-content">
                {!isMobile && <Language sx={{ mr: 1 }} />}
                <Typography sx={{ mr: 1 }}>
                  <Trans i18nKey="language" />:
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
