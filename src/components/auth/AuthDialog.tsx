import { useState } from 'react';
import Login from './Login';
import CreateAccount from './CreateAccount';
import SocialLoginButtons from './SocialLoginButtons';
import { useAuth } from '@/hooks/useAuth';
import DialogWrapper from '../DialogWrapper';
import ResetPasswordForm from './ResetPasswordForm';
import { useTranslation } from 'react-i18next';

export type AuthView = 'login' | 'register' | 'reset';

/**
 * How the session ended up authenticated: `linked` kept the anonymous uid,
 * `signedIn` moved to a different account. Callers that hold per-uid state
 * (the pack creator's loaded pack) need to tell these apart.
 */
export type AuthOutcome = 'linked' | 'signedIn';

interface AuthDialogProps {
  open: boolean;
  close: () => void;
  initialView?: AuthView;
  onSuccess?: (outcome: AuthOutcome) => void;
}

export default function AuthDialog({
  open,
  close,
  initialView = 'login',
  onSuccess,
}: AuthDialogProps): JSX.Element {
  const [currentView, setCurrentView] = useState<AuthView>(initialView);
  const [prefillEmail, setPrefillEmail] = useState<string>('');
  const { isAnonymous } = useAuth();
  const { t } = useTranslation();

  const handleSuccess = (outcome: AuthOutcome) => {
    onSuccess?.(outcome);
    close();
  };

  const showLogin = (email?: string) => {
    if (email) setPrefillEmail(email);
    setCurrentView('login');
  };

  const getTitle = () => {
    switch (currentView) {
      case 'login':
        return isAnonymous ? t('linkAccount') : t('signIn');
      case 'register':
        return t('createAccount');
      case 'reset':
        return t('resetPassword');
      default:
        return t('Authentication');
    }
  };

  return (
    <DialogWrapper title={getTitle()} open={open} close={close}>
      {currentView === 'login' && (
        <>
          <Login
            onSwitchToRegister={() => setCurrentView('register')}
            onSwitchToForgotPassword={() => setCurrentView('reset')}
            onSuccess={handleSuccess}
            isLinking={isAnonymous}
            initialEmail={prefillEmail}
          />
          <SocialLoginButtons onSuccess={handleSuccess} isLinking={isAnonymous} />
        </>
      )}

      {currentView === 'reset' && <ResetPasswordForm onToggleForm={setCurrentView} />}

      {currentView === 'register' && (
        <CreateAccount
          onSwitchToLogin={showLogin}
          onSuccess={handleSuccess}
          isAnonymous={isAnonymous}
        />
      )}
    </DialogWrapper>
  );
}
