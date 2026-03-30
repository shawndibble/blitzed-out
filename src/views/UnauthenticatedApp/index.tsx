import './styles.css';

import AuthDialog, { AuthView } from '@/components/auth/AuthDialog';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Divider,
  FormControl,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField,
  Typography,
} from '@mui/material';
import { Language } from '@mui/icons-material';
import { Trans, useTranslation } from 'react-i18next';
import { useCallback, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

import GameGuide from '@/views/GameGuide';
import Navigation from '@/views/Navigation';
import { languages } from '@/services/i18nHelpers';
import { reportFirefoxMobileAuthError } from '@/utils/firefoxMobileReporting';
import useAuth from '@/context/hooks/useAuth';
import usePlayerList from '@/hooks/usePlayerList';
import { useSettings } from '@/stores/settingsStore';

export default function UnauthenticatedApp() {
  const { i18n, t } = useTranslation();
  const { login, user, error: authError } = useAuth();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authDialogView, setAuthDialogView] = useState<AuthView>('login');
  const [languageLoading, setLanguageLoading] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

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
  const [displayName, setDisplayName] = useState(user?.displayName || '');

  const [settings, updateSettings] = useSettings();

  const handleSubmit = useCallback(
    async (
      event:
        | React.FormEvent<HTMLFormElement>
        | React.KeyboardEvent<HTMLDivElement>
        | React.MouseEvent<HTMLButtonElement>
    ) => {
      event.preventDefault();

      try {
        setLoginLoading(true);
        setLoginError(null);

        await updateSettings({ ...settings, displayName, room });
        await login(displayName);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

        reportFirefoxMobileAuthError('unauthenticated_app_submit', error as Error, {
          authentication: {
            step: 'unauthenticated_app_submit',
            displayName,
            room,
          },
        });

        setLoginError(errorMessage);
        const userAgent = navigator.userAgent.toLowerCase();
        const isFirefox = userAgent.includes('firefox');
        const isMobile =
          userAgent.includes('mobile') ||
          userAgent.includes('fennec') ||
          userAgent.includes('fxios') ||
          userAgent.includes('android') ||
          userAgent.includes('iphone');

        if (isFirefox && isMobile) {
          setLoginError(
            `${errorMessage}. If you're using a mobile browser, try refreshing the page or temporarily disabling uBlock Origin.`
          );
        }
      } finally {
        setLoginLoading(false);
      }
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

  const currentLanguage = i18n.resolvedLanguage || 'en';

  const handleLanguageChange = useCallback(
    async (event: SelectChangeEvent<string>): Promise<void> => {
      const newLanguage = event.target.value;
      setLanguageLoading(true);

      try {
        await i18n.changeLanguage(newLanguage);
      } catch {
        await i18n.changeLanguage(newLanguage);
      } finally {
        setLanguageLoading(false);
      }
    },
    [i18n]
  );

  const languageMenuItems = useMemo(
    () =>
      Object.entries(languages).map(([key, obj]) => (
        <MenuItem value={key} key={key}>
          {obj.label}
        </MenuItem>
      )),
    []
  );

  return (
    <>
      <Navigation room={room} playerList={playerList} />
      <main className="unauthenticated-container gradient-background-vibrant">
        <section className="hero-section">
          <Box className="hero-content">
            <Typography component="h1" variant="h3" className="hero-headline">
              {t('heroHeadline')}
            </Typography>
            <Typography variant="h6" className="hero-subheadline">
              {t('heroSubheadline')}
            </Typography>

            <Card className="main-setup-card">
              <CardContent>
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

                  {(loginError || authError) && (
                    <Box
                      sx={{
                        mt: 2,
                        p: 2,
                        borderRadius: 1,
                        backgroundColor: 'error.main',
                        color: 'error.contrastText',
                      }}
                    >
                      <Typography variant="body2">
                        <strong>Error:</strong> {loginError || authError}
                      </Typography>
                    </Box>
                  )}

                  <Button
                    variant="contained"
                    type="submit"
                    fullWidth
                    className="jump-in-button"
                    size="large"
                    disabled={loginLoading}
                    startIcon={loginLoading ? <CircularProgress size={20} /> : undefined}
                    sx={{
                      mt: 2,
                      py: 1.25,
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      touchAction: 'manipulation',
                      cursor: loginLoading ? 'default' : 'pointer',
                      userSelect: 'none',
                      '&:focus': {
                        outline: '2px solid',
                        outlineColor: 'primary.main',
                        outlineOffset: '2px',
                      },
                    }}
                    onClick={async (e) => {
                      await handleSubmit(e);
                    }}
                  >
                    {loginLoading ? (
                      <Trans i18nKey="loadingEllipsis" />
                    ) : hasImport ? (
                      <Trans i18nKey="import" />
                    ) : (
                      <Trans i18nKey="playNow" />
                    )}
                  </Button>
                </Box>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1, textAlign: 'center' }}
                >
                  {t('noAccountRequired')}
                </Typography>

                <Divider sx={{ my: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    <Trans i18nKey="or" />
                  </Typography>
                </Divider>

                <Box className="auth-button-container">
                  <Button variant="text" onClick={handleOpenLogin} size="medium">
                    <Trans i18nKey="signIn" />
                  </Button>
                  <Button variant="text" onClick={handleOpenRegister} size="medium">
                    <Trans i18nKey="createAccount" />
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </section>

        <Container maxWidth="lg" component="section" sx={{ mt: 6 }}>
          <Card className="unauthenticated-card">
            <CardContent>
              <GameGuide />
            </CardContent>
          </Card>
        </Container>

        {/* Footer Language Selector */}
        <footer className="footer-language-container">
          <Box className="footer-language-selector">
            <Language sx={{ fontSize: '1rem', color: 'rgba(255, 255, 255, 0.5)' }} />
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select
                value={currentLanguage}
                disabled={languageLoading}
                onChange={handleLanguageChange}
                size="small"
                variant="standard"
                sx={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '0.875rem',
                  '& .MuiSelect-icon': {
                    color: 'rgba(255, 255, 255, 0.5)',
                  },
                  '&:before': {
                    borderBottomColor: 'rgba(255, 255, 255, 0.3)',
                  },
                  '&:hover:before': {
                    borderBottomColor: 'rgba(255, 255, 255, 0.5)',
                  },
                }}
                endAdornment={languageLoading && <CircularProgress size={14} />}
              >
                {languageMenuItems}
              </Select>
            </FormControl>
          </Box>
        </footer>
      </main>

      <AuthDialog
        open={authDialogOpen}
        close={() => setAuthDialogOpen(false)}
        initialView={authDialogView}
      />
    </>
  );
}
