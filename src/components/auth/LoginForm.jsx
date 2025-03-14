import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Link, Alert, CircularProgress } from '@mui/material';
import { useAuth } from '@/hooks/useAuth';

export default function LoginForm({ onToggleForm, onSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginEmail } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await loginEmail(email, password);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to log in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
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
      
      <TextField
        margin="normal"
        required
        fullWidth
        name="password"
        label="Password"
        type="password"
        id="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      
      <Button
        type="submit"
        fullWidth
        variant="contained"
        sx={{ mt: 3, mb: 2 }}
        disabled={loading}
      >
        {loading ? <CircularProgress size={24} /> : 'Sign In'}
      </Button>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Link component="button" variant="body2" onClick={() => onToggleForm('register')}>
          Don't have an account? Sign Up
        </Link>
        <Link component="button" variant="body2" onClick={() => onToggleForm('reset')}>
          Forgot password?
        </Link>
      </Box>
    </Box>
  );
}
