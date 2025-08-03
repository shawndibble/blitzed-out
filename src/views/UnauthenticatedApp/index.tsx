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

export default function UnauthenticatedApp() {
  const { i18n, t } = useTranslation();
  const { login, user } = useAuth();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authDialogView, setAuthDialogView] = useState<AuthView>('login');
  const [languageLoading, setLanguageLoading] = useState(false);

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
      <Box className="unauthenticated-container gradient-background-vibrant">
        <Container maxWidth="lg" sx={{ pt: 8 }}>
          <Grid container spacing={4} justifyContent="center" alignItems="stretch">
            {/* Main Setup Card */}
            <Grid size={{ xs: 12, md: 6, lg: 4 }}>
              <Card className="unauthenticated-card main-setup-card">
                <CardContent>
                  <h2 className="setup">
                    <Trans i18nKey="setup" />
                  </h2>
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

                    <Button
                      variant="contained"
                      type="submit"
                      fullWidth
                      className="jump-in-button"
                      size="large"
                      startIcon={<PersonAdd />}
                      sx={{ mt: 2, py: 1.25, fontSize: '1.1rem', fontWeight: 600 }}
                    >
                      {hasImport ? <Trans i18nKey="import" /> : <Trans i18nKey="anonymousLogin" />}
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
        <Box className="footer-language-container">
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
        </Box>
      </Box>

      <AuthDialog
        open={authDialogOpen}
        close={() => setAuthDialogOpen(false)}
        initialView={authDialogView}
      />
    </>
  );
}
