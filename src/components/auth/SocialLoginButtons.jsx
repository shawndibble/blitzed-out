import React, { useState } from 'react';
import { Box, Button, Divider, Typography, Alert, CircularProgress } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import { loginWithGoogle } from '@/services/firebase';
import { Trans } from 'react-i18next';

export default function SocialLoginButtons({ onSuccess, isLinking = false }) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    
    try {
      await loginWithGoogle();
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
          <Trans i18nKey="or">OR</Trans>
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
        {loading ? <CircularProgress size={24} /> : 
          isLinking ? <Trans i18nKey="linkWithGoogle">Link with Google</Trans> : 
                     <Trans i18nKey="signInWithGoogle">Sign in with Google</Trans>
        }
      </Button>
    </Box>
  );
}
