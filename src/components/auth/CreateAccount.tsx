import { logger } from '@/utils/logger';
import { useState, FormEvent, ChangeEvent } from 'react';
import { Box, Button, TextField, Typography, Alert, CircularProgress } from '@mui/material';
import { Trans, useTranslation } from 'react-i18next';
import { getErrorMessage, isAccountExistsError } from '@/types/errors';
import useAuth from '@/hooks/useAuth';
import type { AuthOutcome } from './AuthDialog';

interface CreateAccountProps {
  onSuccess?: (outcome: AuthOutcome) => void;
  onSwitchToLogin: (email?: string) => void;
  isAnonymous?: boolean;
}

export default function CreateAccount({
  onSuccess,
  onSwitchToLogin,
  isAnonymous = false,
}: CreateAccountProps): JSX.Element {
  const { t } = useTranslation();
  const { user, register, convertToRegistered } = useAuth();
  // A guest already has a display name (their in-game name) and it is what
  // public packs are attributed to, so carry it over instead of asking twice.
  const [displayName, setDisplayName] = useState<string>(user?.displayName ?? '');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [takenEmail, setTakenEmail] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setTakenEmail('');

    if (password !== confirmPassword) {
      setError(t('passwordsDoNotMatch'));
      return;
    }

    setLoading(true);

    try {
      if (isAnonymous) {
        // Link, never register: a fresh account would strand everything the
        // guest already published under their old uid.
        await convertToRegistered(email.trim(), password, displayName.trim());
        onSuccess?.('linked');
      } else {
        await register(email.trim(), password, displayName.trim());
        onSuccess?.('signedIn');
      }
    } catch (err: unknown) {
      // Linking cannot succeed against an identity that already belongs to
      // another account — signing into it is the only way forward, and that is
      // an ordinary outcome rather than a failure worth logging.
      if (isAccountExistsError(err)) {
        setTakenEmail(email.trim());
      } else {
        logger.error('Registration error:', err);
        setError(getErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {takenEmail && (
        <Alert
          severity="warning"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={() => onSwitchToLogin(takenEmail)}>
              {t('signInInstead')}
            </Button>
          }
        >
          {t('accountExistsUseSignIn')}
        </Alert>
      )}

      <TextField
        margin="normal"
        required
        fullWidth
        id="displayName"
        label={t('displayName')}
        name="displayName"
        autoComplete="name"
        autoFocus
        value={displayName}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setDisplayName(e.target.value)}
      />

      <TextField
        margin="normal"
        required
        fullWidth
        id="email"
        label={t('email')}
        name="email"
        autoComplete="email"
        value={email}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
      />

      <TextField
        margin="normal"
        required
        fullWidth
        name="password"
        label={t('password')}
        type="password"
        id="password"
        autoComplete="new-password"
        value={password}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
      />

      <TextField
        margin="normal"
        required
        fullWidth
        name="confirmPassword"
        label={t('confirmPassword')}
        type="password"
        id="confirmPassword"
        autoComplete="new-password"
        value={confirmPassword}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
      />

      <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }} disabled={loading}>
        {loading ? (
          <CircularProgress size={24} />
        ) : isAnonymous ? (
          <Trans i18nKey="linkAccount" />
        ) : (
          <Trans i18nKey="createAccount" />
        )}
      </Button>

      <Typography align="center">
        <Button onClick={() => onSwitchToLogin()} variant="text">
          <Trans i18nKey="alreadyHaveAccount" />
        </Button>
      </Typography>
    </Box>
  );
}
