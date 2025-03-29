import { useState, FormEvent, ChangeEvent } from 'react';
import { Box, Button, TextField, Typography, Alert, CircularProgress } from '@mui/material';
import { Trans, useTranslation } from 'react-i18next';
import { registerWithEmail } from '@/services/firebase';

interface CreateAccountProps {
  onSuccess?: () => void;
  onSwitchToLogin: () => void;
  isAnonymous?: boolean;
}

export default function CreateAccount({
  onSuccess,
  onSwitchToLogin,
  isAnonymous = false,
}: CreateAccountProps): JSX.Element {
  const { t } = useTranslation();
  const [displayName, setDisplayName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (password !== confirmPassword) {
      setError(t('passwordsDoNotMatch') || 'Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await registerWithEmail(email?.trim(), password, displayName?.trim());
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to create account');
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
        <Button onClick={onSwitchToLogin} variant="text">
          <Trans i18nKey="alreadyHaveAccount" />
        </Button>
      </Typography>
    </Box>
  );
}
