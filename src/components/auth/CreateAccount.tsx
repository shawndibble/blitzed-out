import { logger } from '@/utils/logger';
import { useState, FormEvent, ChangeEvent } from 'react';
import { Box, Button, TextField, Typography, Alert, CircularProgress } from '@mui/material';
import { Trans, useTranslation } from 'react-i18next';
import { getErrorMessage } from '@/types/errors';
import useAuth from '@/hooks/useAuth';
import type { User } from '@/types';
import SignInFallbackAlert, { signInFallbackFor, type SignInFallback } from './SignInFallbackAlert';

interface CreateAccountProps {
  onSuccess?: (user: User) => void;
  onSwitchToLogin: (email?: string) => void;
  isAnonymous?: boolean;
}

export default function CreateAccount({
  onSuccess,
  onSwitchToLogin,
  isAnonymous = false,
}: CreateAccountProps): JSX.Element {
  const { t } = useTranslation();
  const { user, hasPermanentProvider, register, convertToRegistered } = useAuth();
  // A guest already has a display name (their in-game name) and it is what
  // public packs are attributed to, so carry it over instead of asking twice.
  const [displayName, setDisplayName] = useState<string>(user?.displayName ?? '');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [fallback, setFallback] = useState<SignInFallback | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setFallback(null);

    if (password !== confirmPassword) {
      setError(t('passwordsDoNotMatch'));
      return;
    }

    // A link that landed without its re-auth leaves a permanent account on this
    // uid while `isAnonymous` reads false. Registering again from here would
    // mint a second account and abandon the one just linked.
    if (user && !isAnonymous && !hasPermanentProvider) {
      setFallback('linked');
      return;
    }

    setLoading(true);

    try {
      // Link, never register, while there is a guest account to keep: a fresh
      // account would strand everything they already published.
      // Awaited on its own line: `onSuccess?.(await …)` would skip the call
      // entirely whenever no handler is passed, since an optional call does not
      // evaluate its arguments.
      const authedUser = isAnonymous
        ? await convertToRegistered(email.trim(), password, displayName.trim())
        : await register(email.trim(), password, displayName.trim());
      onSuccess?.(authedUser);
    } catch (err: unknown) {
      // A collision or an unfinished session is an ordinary branch the UI
      // recovers from, not a failure worth logging.
      const reason = signInFallbackFor(err);
      if (reason) {
        setFallback(reason);
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

      {fallback && (
        <SignInFallbackAlert
          fallback={fallback}
          existsMessageKey="accountExistsUseSignIn"
          onSignIn={() => onSwitchToLogin(email.trim())}
        />
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
        // firestore.rules caps a pack's authorName at 100 chars; an over-long
        // name here would reject every publish with permission-denied.
        slotProps={{ htmlInput: { maxLength: 100 } }}
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
