import { useState } from 'react';
import { Box, Button, Divider, Typography, Alert, CircularProgress } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import { Trans } from 'react-i18next';
import { t } from 'i18next';
import {
  getErrorMessage,
  isAccountExistsError,
  isAlreadyLinkedToThisUser,
  isLinkedNeedsSignInError,
} from '@/types/errors';
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
  // 'exists': the Google account owns its own user, so linking is off the table.
  // 'linked': the link landed but the session did not — signing in finishes it.
  // Either way a plain sign-in is the only route forward.
  const [signInOnly, setSignInOnly] = useState<'exists' | 'linked' | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const linkable = isLinking && signInOnly === null;

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
        setSignInOnly('exists');
      } else if (isLinkedNeedsSignInError(err) || isAlreadyLinkedToThisUser(err)) {
        // Already linked to *this* user: the uid is unchanged, only the session
        // is unfinished, so the same sign-in resolves it.
        setSignInOnly('linked');
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
      {signInOnly && (
        <Alert
          severity="warning"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={handleGoogleLogin} disabled={loading}>
              {t('signInInstead')}
            </Button>
          }
        >
          {signInOnly === 'linked'
            ? t('accountLinkedFinishSignIn')
            : t('googleAccountExistsUseSignIn')}
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
