import React, { useState } from 'react';
import { Box, Button, TextField, Alert, CircularProgress } from '@mui/material';
import { useAuth } from '@/hooks/useAuth';
import { Trans } from 'react-i18next';

export default function ResetPasswordForm({ onToggleForm }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { forgotPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      await forgotPassword(email);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to send reset email');
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
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          <Trans i18nKey="resetEmailSent" />
        </Alert>
      )}

      <TextField
        margin="normal"
        required
        fullWidth
        id="email"
        label={<Trans i18nKey="email" />}
        name="email"
        autoComplete="email"
        autoFocus
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }} disabled={loading}>
        {loading ? <CircularProgress size={24} /> : <Trans i18nKey="sendResetLink" />}
      </Button>

      <Box sx={{ textAlign: 'center' }}>
        <Button variant="text" onClick={() => onToggleForm('login')}>
          <Trans i18nKey="backToLogin" />
        </Button>
      </Box>
    </Box>
  );
}
