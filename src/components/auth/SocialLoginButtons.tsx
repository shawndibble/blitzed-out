import { useState } from 'react';
import { Box, Button, Divider, Typography, Alert, CircularProgress } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import { loginWithGoogle } from '@/services/firebase';
import { Trans } from 'react-i18next';
import { t } from 'i18next';

interface SocialLoginButtonsProps {
  onSuccess?: () => void;
  isLinking?: boolean;
}

export default function SocialLoginButtons({
  onSuccess,
  isLinking = false,
}: SocialLoginButtonsProps): JSX.Element {
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      await loginWithGoogle();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ mt: 2, mb: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

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
        aria-busy={loading}
        aria-live="polite"
      >
        {loading ? (
          <CircularProgress size={24} />
        ) : isLinking ? (
          t('linkWithGoogle', 'Link with Google')
        ) : (
          t('signInWithGoogle', 'Sign in with Google')
        )}
      </Button>
    </Box>
  );
}
