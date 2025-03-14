import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Link, Alert, CircularProgress } from '@mui/material';
import { useAuth } from '@/hooks/useAuth';

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
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Password reset email sent! Check your inbox.
        </Alert>
      )}
      
      <Typography variant="body1" sx={{ mb: 2 }}>
        Enter your email address and we'll send you a link to reset your password.
      </Typography>
      
      <TextField
        margin="normal"
        required
        fullWidth
        id="email"
        label="Email Address"
        name="email"
        autoComplete="email"
        autoFocus
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      
      <Button
        type="submit"
        fullWidth
        variant="contained"
        sx={{ mt: 3, mb: 2 }}
        disabled={loading}
      >
        {loading ? <CircularProgress size={24} /> : 'Send Reset Link'}
      </Button>
      
      <Box sx={{ textAlign: 'center' }}>
        <Link component="button" variant="body2" onClick={() => onToggleForm('login')}>
          Back to Sign In
        </Link>
      </Box>
    </Box>
  );
}
