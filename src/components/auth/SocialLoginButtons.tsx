import { useState } from 'react';
import { Box, Button, Divider, Typography, Alert, CircularProgress } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import { Trans, useTranslation } from 'react-i18next';
import { getErrorMessage } from '@/types/errors';
import useAuth from '@/hooks/useAuth';
import type { User } from '@/types';
import SignInFallbackAlert, { signInFallbackFor, type SignInFallback } from './SignInFallbackAlert';

interface SocialLoginButtonsProps {
  onSuccess?: (user: User) => void;
  isLinking?: boolean;
}

export default function SocialLoginButtons({
  onSuccess,
  isLinking = false,
}: SocialLoginButtonsProps): JSX.Element {
  const { t } = useTranslation();
  const { loginGoogle, linkGoogle } = useAuth();
  const [error, setError] = useState<string>('');
  const [fallback, setFallback] = useState<SignInFallback | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Once a fallback is set, linking is off the table and this button becomes a
  // plain sign-in — which is also what the fallback Alert's action triggers.
  const linkable = isLinking && fallback === null;

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      // Awaited separately: an optional call skips its arguments when no
      // handler is passed, which would silently skip the sign-in itself.
      const authedUser = linkable ? await linkGoogle() : await loginGoogle();
      onSuccess?.(authedUser);
    } catch (err: unknown) {
      const reason = signInFallbackFor(err);
      if (reason) {
        setFallback(reason);
      } else {
        setError(getErrorMessage(err));
      }
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
      {fallback && (
        <SignInFallbackAlert
          fallback={fallback}
          existsMessageKey="googleAccountExistsUseSignIn"
          onSignIn={handleGoogleLogin}
          disabled={loading}
        />
      )}
      <Divider sx={{ mb: 2 }}>
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
          }}
        >
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
        ) : linkable ? (
          t('linkWithGoogle', 'Link with Google')
        ) : (
          t('signInWithGoogle', 'Sign in with Google')
        )}
      </Button>
    </Box>
  );
}
