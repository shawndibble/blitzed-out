import { Language, Login } from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  Grid,
  TextField,
  Typography,
} from '@mui/material';
import useAuth from '@/context/hooks/useAuth';
import useBreakpoint from '@/hooks/useBreakpoint';
import { useSettings } from '@/stores/settingsStore';
import usePlayerList from '@/hooks/usePlayerList';
import { languages } from '@/services/importLocales';
import { useState, useCallback, useMemo } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useParams, useSearchParams } from 'react-router-dom';
import Navigation from '@/views/Navigation';
import './styles.css';
import GameGuide from '@/views/GameGuide';
import AuthDialog, { AuthView } from '@/components/auth/AuthDialog';

export default function UnauthenticatedApp() {
  const { i18n, t } = useTranslation();
  const { login, user } = useAuth();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authDialogView, setAuthDialogView] = useState<AuthView>('login');

  const handleOpenLogin = () => {
    setAuthDialogView('login');
    setAuthDialogOpen(true);
  };

  const handleOpenRegister = () => {
    setAuthDialogView('register');
    setAuthDialogOpen(true);
  };

  const params = useParams();
  const [queryParams] = useSearchParams();
  const hasImport = !!queryParams.get('importBoard');
  const room = params.id ?? 'PUBLIC';
  const playerList = usePlayerList();
  const isMobile = useBreakpoint('sm');
  const [displayName, setDisplayName] = useState(user?.displayName || '');

  const [settings, updateSettings] = useSettings();

  // Memoize handlers to prevent unnecessary re-renders
  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement> | React.KeyboardEvent<HTMLDivElement>) => {
      event.preventDefault();
      await updateSettings({ ...settings, displayName, room });
      await login(displayName);
    },
    [displayName, login, room, settings, updateSettings]
  );

  const onEnterKey = useCallback(
    async (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Enter') {
        await handleSubmit(event);
      }
    },
    [handleSubmit]
  );

  // Memoize language links to prevent re-rendering
  const languageLinks = useMemo(
    () =>
      Object.entries(languages).map(([key, obj]) => (
        <Button
          key={key}
          onClick={() => i18n.changeLanguage(key)}
          disabled={i18n.resolvedLanguage === key}
        >
          {obj.label}
        </Button>
      )),
    [i18n]
  );

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

                <Button variant="contained" type="submit" sx={{ mr: 1 }} fullWidth>
                  {hasImport ? <Trans i18nKey="import" /> : <Trans i18nKey="anonymousLogin" />}
                </Button>
                <Divider sx={{ my: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    <Trans i18nKey="or">OR</Trans>
                  </Typography>
                </Divider>
                <Box sx={{ display: 'flex', justifyContent: 'space-evenly' }}>
                  <Button
                    variant="outlined"
                    startIcon={<Login />}
                    onClick={handleOpenLogin}
                    sx={{ mr: 1 }}
                  >
                    <Trans i18nKey="signIn" />
                  </Button>
                  <Button variant="outlined" onClick={handleOpenRegister}>
                    <Trans i18nKey="createAccount" />
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid container sx={{ mt: 1 }}>
          <Grid className="language">
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
        <Grid container sx={{ mt: 1 }}>
          <Grid className="language">
            <Card className="unauthenticated-card">
              <CardContent>
                <GameGuide />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      <AuthDialog
        open={authDialogOpen}
        close={() => setAuthDialogOpen(false)}
        initialView={authDialogView}
      />
    </>
  );
}
