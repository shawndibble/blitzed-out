import { Language, Login } from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid2,
  TextField,
  Typography,
} from '@mui/material';
import useAuth from '@/context/hooks/useAuth';
import useBreakpoint from '@/hooks/useBreakpoint';
import useLocalStorage from '@/hooks/useLocalStorage';
import usePlayerList from '@/hooks/usePlayerList';
import { languages } from '@/services/importLocales';
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useParams, useSearchParams } from 'react-router-dom';
import Navigation from '@/views/Navigation';
import './styles.css';
import GameGuide from '@/views/GameGuide';
import AuthDialog from '@/components/auth/AuthDialog';
import AuthDialog from '@/components/auth/AuthDialog';

export default function UnauthenticatedApp() {
  const { i18n, t } = useTranslation();
  const { login, user, isAnonymous } = useAuth();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authDialogView, setAuthDialogView] = useState('login');
  const params = useParams();
  const [queryParams] = useSearchParams();
  const hasImport = !!queryParams.get('importBoard');
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
    hideBoardActions: false,
    locale: 'en',
    gameMode: 'online',
    background: 'color',
    finishRange: [30, 70],
    roomTileCount: 40,
    roomDice: '1d6',
  });

  // Memoize handlers to prevent unnecessary re-renders
  const handleSubmit = useCallback(async (event) => {
    event.preventDefault();
    await updateSettings({ ...settings, displayName, room });
    await login(displayName);
  }, [displayName, login, room, settings, updateSettings]);

  const onEnterKey = useCallback(async (event) => {
    if (event.key === 'Enter') {
      await handleSubmit(event);
    }
  }, [handleSubmit]);

  // Memoize language links to prevent re-rendering
  const languageLinks = useMemo(() => Object.entries(languages).map(([key, obj]) => (
    <Button
      key={key}
      onClick={() => i18n.changeLanguage(key)}
      disabled={i18n.resolvedLanguage === key}
    >
      {obj.label}
    </Button>
  )), [i18n]);

  return (
    <>
      <Navigation room={room} playerList={playerList} />
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Grid2 container flexDirection="column">
          <Card className="unauthenticated-card">
            <CardContent>
              <h2 className="setup">
                <Trans i18nKey="setup" />
              </h2>
              <Box component="form" method="post" onSubmit={handleSubmit} className="settings-box">
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
                  <Button 
                    variant="contained" 
                    type="submit"
                    sx={{ mr: 1 }}
                  >
                    {hasImport ? <Trans i18nKey="import" /> : <Trans i18nKey="access" />}
                  </Button>
                  <Button 
                    variant="outlined"
                    startIcon={<Login />}
                    onClick={() => setAuthDialogOpen(true)}
                  >
                    <Trans i18nKey="signIn" />
                  </Button>
                </div>
              </Box>
            </CardContent>
          </Card>
        </Grid2>
        <Grid2 container sx={{ mt: 1 }}>
          <Grid2 className="language">
            <Card className="unauthenticated-card">
              <CardContent className="translation-card-content">
                {!isMobile && <Language sx={{ mr: 1 }} />}
                <Typography sx={{ mr: 1 }}>
                  <Trans i18nKey="language" />:
                </Typography>
                {languageLinks}
              </CardContent>
            </Card>
          </Grid2>
        </Grid2>
        <Grid2 container sx={{ mt: 1 }}>
          <Grid2 className="language">
            <Card className="unauthenticated-card">
              <CardContent>
                <GameGuide />
              </CardContent>
            </Card>
          </Grid2>
        </Grid2>
      </Container>
      
      <AuthDialog 
        open={authDialogOpen} 
        onClose={() => setAuthDialogOpen(false)} 
        initialView={authDialogView} 
      />
    </>
  );
}
