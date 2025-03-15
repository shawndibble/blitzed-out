import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Alert, CircularProgress } from '@mui/material';
import { Trans, useTranslation } from 'react-i18next';
import { loginWithEmail } from '@/services/firebase';

export default function Login({
  onSuccess,
  onSwitchToRegister,
  onSwitchToForgotPassword,
  isLinking = false,
}) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await loginWithEmail(email, password);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to sign in');
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
        onChange={(e) => setEmail(e.target.value)}
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
        onChange={(e) => setPassword(e.target.value)}
      />

      <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }} disabled={loading}>
        {loading ? (
          <CircularProgress size={24} />
        ) : isLinking ? (
          <Trans i18nKey="linkAccount">Link Account</Trans>
        ) : (
          <Trans i18nKey="signIn" />
        )}
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
