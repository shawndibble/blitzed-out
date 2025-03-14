import React, { useState } from 'react';
import { Box, Button, Divider, Typography, Alert, CircularProgress } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import { useAuth } from '@/hooks/useAuth';

export default function SocialLoginButtons({ onSuccess }) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginGoogle } = useAuth();

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    
    try {
      await loginGoogle();
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ mt: 2, mb: 2 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      <Divider sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          OR
        </Typography>
      </Divider>
      
      <Button
        fullWidth
        variant="outlined"
        startIcon={<GoogleIcon />}
        onClick={handleGoogleLogin}
        disabled={loading}
        sx={{ mb: 1 }}
      >
        {loading ? <CircularProgress size={24} /> : 'Sign in with Google'}
      </Button>
    </Box>
  );
}
