import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Link, Alert, CircularProgress } from '@mui/material';
import { useAuth } from '@/hooks/useAuth';

export default function RegisterForm({ onToggleForm, onSuccess, isAnonymous = false }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register, convertToRegistered } = useAuth();

  const validateForm = () => {
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      if (isAnonymous) {
        await convertToRegistered(email, password);
      } else {
        await register(email, password, displayName);
      }
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      {!isAnonymous && (
        <TextField
          margin="normal"
          required
          fullWidth
          id="displayName"
          label="Display Name"
          name="displayName"
          autoFocus
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
      )}
      
      <TextField
        margin="normal"
        required
        fullWidth
        id="email"
        label="Email Address"
        name="email"
        autoComplete="email"
        autoFocus={isAnonymous}
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
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      
      <TextField
        margin="normal"
        required
        fullWidth
        name="confirmPassword"
        label="Confirm Password"
        type="password"
        id="confirmPassword"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />
      
      <Button
        type="submit"
        fullWidth
        variant="contained"
        sx={{ mt: 3, mb: 2 }}
        disabled={loading}
      >
        {loading ? <CircularProgress size={24} /> : isAnonymous ? 'Convert Account' : 'Sign Up'}
      </Button>
      
      {!isAnonymous && (
        <Box sx={{ textAlign: 'center' }}>
          <Link component="button" variant="body2" onClick={() => onToggleForm('login')}>
            Already have an account? Sign In
          </Link>
        </Box>
      )}
    </Box>
  );
}
