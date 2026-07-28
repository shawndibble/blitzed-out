import { useState } from 'react';
import { Box, Button, Divider, Typography, Alert, CircularProgress } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import { Trans } from 'react-i18next';
import { t } from 'i18next';
import { getErrorMessage, isAccountExistsError } from '@/types/errors';
import useAuth from '@/hooks/useAuth';
import type { AuthOutcome } from './AuthDialog';

interface SocialLoginButtonsProps {
  onSuccess?: (outcome: AuthOutcome) => void;
  isLinking?: boolean;
}

export default function SocialLoginButtons({
  onSuccess,
  isLinking = false,
}: SocialLoginButtonsProps): JSX.Element {
  const { loginGoogle, linkGoogle } = useAuth();
  const [error, setError] = useState<string>('');
  const [alreadyLinked, setAlreadyLinked] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // Once the Google account turns out to own its own user, linking is off the
  // table and the only route forward is a plain sign-in into that account.
  const linkable = isLinking && !alreadyLinked;

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      if (linkable) {
        await linkGoogle();
        onSuccess?.('linked');
      } else {
        await loginGoogle();
        onSuccess?.('signedIn');
      }
    } catch (err: unknown) {
      if (isAccountExistsError(err)) {
        setAlreadyLinked(true);
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
      {alreadyLinked && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {t('accountExistsUseSignIn')}
        </Alert>
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
