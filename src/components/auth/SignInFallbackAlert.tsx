import { Alert, Button } from '@mui/material';
import { useTranslation } from 'react-i18next';
import {
  isAccountExistsError,
  isAlreadyLinkedToThisUser,
  isLinkedNeedsSignInError,
} from '@/types/errors';

/** Why a plain sign-in is the only way forward after a failed upgrade. */
export type SignInFallback = 'exists' | 'linked';

/**
 * Classify an upgrade failure. `exists` — the identity belongs to another
 * account, so signing in changes uid. `linked` — it is already this uid's and
 * only the session is unfinished. `null` — an ordinary error to show as-is.
 */
export function signInFallbackFor(error: unknown): SignInFallback | null {
  if (isAccountExistsError(error)) return 'exists';
  if (isLinkedNeedsSignInError(error) || isAlreadyLinkedToThisUser(error)) return 'linked';
  return null;
}

interface SignInFallbackAlertProps {
  fallback: SignInFallback;
  /** Copy for `exists`, which differs per provider; `linked` reads the same everywhere. */
  existsMessageKey: string;
  onSignIn: () => void;
  disabled?: boolean;
}

export default function SignInFallbackAlert({
  fallback,
  existsMessageKey,
  onSignIn,
  disabled = false,
}: SignInFallbackAlertProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <Alert
      severity="warning"
      sx={{ mb: 2 }}
      action={
        <Button color="inherit" size="small" onClick={onSignIn} disabled={disabled}>
          {t('signInInstead')}
        </Button>
      }
    >
      {t(fallback === 'linked' ? 'accountLinkedFinishSignIn' : existsMessageKey)}
    </Alert>
  );
}
