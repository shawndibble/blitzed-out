import { Language, Login } from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField,
  Typography,
  CircularProgress,
} from '@mui/material';
import useAuth from '@/context/hooks/useAuth';
import useBreakpoint from '@/hooks/useBreakpoint';
import { useSettings } from '@/stores/settingsStore';
import usePlayerList from '@/hooks/usePlayerList';
import { languages } from '@/services/i18nHelpers';
import { useState, useCallback, useMemo } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { ensureLanguageMigrated } from '@/services/migrationService';
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

  // Memoize language selection to prevent re-rendering
  const currentLanguage = i18n.resolvedLanguage || 'en';

  const handleLanguageChange = useCallback(
    async (event: SelectChangeEvent<string>): Promise<void> => {
      const newLanguage = event.target.value;
      setLanguageLoading(true);

      try {
        // Ensure the new language is migrated before switching
        await ensureLanguageMigrated(newLanguage);
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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {!isMobile && <Language />}
                  <FormControl size="small" sx={{ minWidth: 160, flexGrow: 1 }}>
                    <InputLabel
                      id="unauth-language-label"
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '0.875rem',
                      }}
                    >
                      {isMobile && <Language sx={{ mr: 0.5, fontSize: '1rem' }} />}
                      <Trans i18nKey="language" />
                    </InputLabel>
                    <Select
                      labelId="unauth-language-label"
                      id="unauth-language-select"
                      value={currentLanguage}
                      disabled={languageLoading}
                      label={
                        <>
                          {isMobile && <Language sx={{ fontSize: '1rem' }} />}
                          <Trans i18nKey="language" />
                        </>
                      }
                      onChange={handleLanguageChange}
                      size="small"
                      inputProps={{
                        endAdornment: languageLoading && <CircularProgress size={16} />,
                      }}
                    >
                      {languageMenuItems}
                    </Select>
                  </FormControl>
                </Box>
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
