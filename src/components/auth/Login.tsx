import { logger } from '@/utils/logger';
import { useState, FormEvent, ChangeEvent } from 'react';
import { Box, Button, TextField, Typography, Alert, CircularProgress } from '@mui/material';
import { Trans, useTranslation } from 'react-i18next';
import { getErrorMessage } from '@/types/errors';
import useAuth from '@/hooks/useAuth';
import type { User } from '@/types';

interface LoginProps {
  onSuccess?: (user: User) => void;
  onSwitchToRegister: () => void;
  onSwitchToForgotPassword: () => void;
  /** Anonymous session: signing in moves to that account rather than linking. */
  isLinking?: boolean;
  initialEmail?: string;
}

export default function Login({
  onSuccess,
  onSwitchToRegister,
  onSwitchToForgotPassword,
  isLinking = false,
  initialEmail = '',
}: LoginProps): JSX.Element {
  const { t } = useTranslation();
  const { loginEmail } = useAuth();
  const [email, setEmail] = useState<string>(initialEmail);
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Awaited separately: an optional call skips its arguments when no
      // handler is passed, which would silently skip the sign-in itself.
      const authedUser = await loginEmail(email, password);
      onSuccess?.(authedUser);
    } catch (err: unknown) {
      logger.error('Login error:', err);
      setError(getErrorMessage(err));
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

      <TextField
        margin="normal"
        required
        fullWidth
        id="email"
        label={t('email')}
        name="email"
        autoComplete="email"
        autoFocus
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
        autoComplete="current-password"
        value={password}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
      />

      {isLinking && (
        <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
          {t('signInSwitchesAccount')}
        </Typography>
      )}

      <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }} disabled={loading}>
        {loading ? <CircularProgress size={24} /> : <Trans i18nKey="signIn" />}
      </Button>

      <Typography align="center">
        <Button onClick={onSwitchToRegister} variant="text">
          <Trans i18nKey="needAccount" />
        </Button>
        {' | '}
        <Button onClick={onSwitchToForgotPassword} variant="text">
          <Trans i18nKey="forgotPassword" />
        </Button>
      </Typography>
    </Box>
  );
}
