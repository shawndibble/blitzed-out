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
  Grid,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField,
  Typography,
} from '@mui/material';
import { Language, Login, PersonAdd } from '@mui/icons-material';
import { Trans, useTranslation } from 'react-i18next';
import { useCallback, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

import GameGuide from '@/views/GameGuide';
import Navigation from '@/views/Navigation';
import { languages } from '@/services/i18nHelpers';
import useAuth from '@/context/hooks/useAuth';
import usePlayerList from '@/hooks/usePlayerList';
import { useSettings } from '@/stores/settingsStore';
import { reportFirefoxMobileAuthError } from '@/utils/firefoxMobileReporting';

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

  // Memoize handlers to prevent unnecessary re-renders
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

        // Update settings first, then login
        await updateSettings({ ...settings, displayName, room });
        await login(displayName);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

        // Report to Sentry for Firefox mobile users with detailed context
        reportFirefoxMobileAuthError('unauthenticated_app_submit', error as Error, {
          authentication: {
            step: 'unauthenticated_app_submit',
            displayName,
            room,
          },
        });

        // Check for network/auth errors that could be caused by ad blockers
        const isNetworkError =
          errorMessage.includes('network') ||
          errorMessage.includes('blocked') ||
          errorMessage.includes('CORS') ||
          errorMessage.includes('Failed to fetch') ||
          (error instanceof Error &&
            (error.message.includes('auth/network-request-failed') ||
              error.message.includes('identitytoolkit')));

        const userAgent = navigator.userAgent.toLowerCase();
        const isFirefox = userAgent.includes('firefox');
        const isMobile =
          userAgent.includes('mobile') ||
          userAgent.includes('fennec') ||
          userAgent.includes('fxios') ||
          userAgent.includes('android') ||
          userAgent.includes('iphone');

        if (isNetworkError) {
          setLoginError(
            `${errorMessage}. This may be caused by an ad blocker (like uBlock Origin). Please disable your ad blocker for this site or whitelist identitytoolkit.googleapis.com, then refresh and try again.`
          );
        } else if (isFirefox && isMobile) {
          setLoginError(
            `${errorMessage}. If you're using a mobile browser, try refreshing the page or temporarily disabling uBlock Origin.`
          );
        } else {
          setLoginError(errorMessage);
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

  // Memoize language selection to prevent re-rendering
  const currentLanguage = i18n.resolvedLanguage || 'en';

  const handleLanguageChange = useCallback(
    async (event: SelectChangeEvent<string>): Promise<void> => {
      const newLanguage = event.target.value;
      setLanguageLoading(true);

      try {
        // Language change will automatically trigger migration via MigrationContext
        await i18n.changeLanguage(newLanguage);
      } catch (error) {
        console.error('Error changing language:', error);
        // Still attempt to change language even if migration fails
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
        <Container maxWidth="lg" sx={{ pt: 8 }} component="section">
          <Grid container spacing={4} justifyContent="center" alignItems="stretch">
            {/* Main Setup Card */}
            <Grid size={{ xs: 12, md: 6, lg: 4 }}>
              <Card className="unauthenticated-card main-setup-card">
                <CardContent>
                  <h1 className="setup">
                    <Trans i18nKey="setup" />
                  </h1>
                  <Typography className="setup-subtitle" variant="body1">
                    <Trans i18nKey="setupSubtitle" />
                  </Typography>
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

                    {/* Error Display */}
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
                        {navigator.userAgent.toLowerCase().includes('firefox') && (
                          <Button
                            size="small"
                            variant="text"
                            sx={{ mt: 1, color: 'inherit' }}
                            onClick={() => {
                              const diagnostics = {
                                userAgent: navigator.userAgent,
                                url: window.location.href,
                                timestamp: new Date().toISOString(),
                                cookiesEnabled: navigator.cookieEnabled,
                                localStorageAvailable: typeof Storage !== 'undefined',
                                error: loginError || authError,
                              };
                              navigator.clipboard?.writeText(JSON.stringify(diagnostics, null, 2));
                              alert(t('debugInfoCopied'));
                            }}
                          >
                            <Trans i18nKey="copyDebugInfo" />
                          </Button>
                        )}
                      </Box>
                    )}

                    <Button
                      variant="contained"
                      type="submit"
                      fullWidth
                      className="jump-in-button"
                      size="large"
                      disabled={loginLoading}
                      startIcon={loginLoading ? <CircularProgress size={20} /> : <PersonAdd />}
                      sx={{
                        mt: 2,
                        py: 1.25,
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        // Firefox mobile touch handling
                        touchAction: 'manipulation',
                        // Ensure button is clickable on all browsers
                        cursor: loginLoading ? 'default' : 'pointer',
                        // Prevent double-tap zoom on mobile
                        userSelect: 'none',
                        // Firefox-specific button styles
                        '&:focus': {
                          outline: '2px solid',
                          outlineColor: 'primary.main',
                          outlineOffset: '2px',
                        },
                      }}
                      onClick={async (e) => {
                        // Explicit click handler for better Firefox mobile support
                        await handleSubmit(e);
                      }}
                    >
                      {loginLoading ? (
                        <Trans i18nKey="loadingEllipsis" />
                      ) : hasImport ? (
                        <Trans i18nKey="import" />
                      ) : (
                        <Trans i18nKey="anonymousLogin" />
                      )}
                    </Button>
                    <Divider sx={{ my: 3 }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontSize: '0.9rem' }}
                      >
                        <Trans i18nKey="or" />
                      </Typography>
                    </Divider>
                    <Box className="auth-button-container">
                      <Button
                        variant="outlined"
                        startIcon={<Login />}
                        onClick={handleOpenLogin}
                        size="medium"
                      >
                        <Trans i18nKey="signIn" />
                      </Button>
                      <Button variant="outlined" onClick={handleOpenRegister} size="medium">
                        <Trans i18nKey="createAccount" />
                      </Button>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Secondary Content Area for Desktop */}
            <Grid size={{ md: 12, lg: 8 }}>
              {/* Game Guide */}
              <Card className="unauthenticated-card">
                <CardContent>
                  <GameGuide />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
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
