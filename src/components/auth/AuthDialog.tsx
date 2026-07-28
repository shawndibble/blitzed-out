import { useState } from 'react';
import Login from './Login';
import CreateAccount from './CreateAccount';
import SocialLoginButtons from './SocialLoginButtons';
import { useAuth } from '@/hooks/useAuth';
import DialogWrapper from '../DialogWrapper';
import ResetPasswordForm from './ResetPasswordForm';
import { useTranslation } from 'react-i18next';
import type { User } from '@/types';

export type AuthView = 'login' | 'register' | 'reset';

interface AuthDialogProps {
  open: boolean;
  close: () => void;
  initialView?: AuthView;
  /**
   * The account the session ended up on. Callers holding per-uid state compare
   * it with the uid they started from — which is the honest signal, unlike a
   * self-reported "linked"/"signed in" label that recovery paths get wrong.
   */
  onSuccess?: (user: User) => void;
}

export default function AuthDialog({
  open,
  close,
  initialView,
  onSuccess,
}: AuthDialogProps): JSX.Element {
  const { isAnonymous } = useAuth();
  // A guest opening this dialog wants to keep their content, which is the
  // register/link path — the sign-in form would move them to another account.
  const [currentView, setCurrentView] = useState<AuthView>(
    initialView ?? (isAnonymous ? 'register' : 'login')
  );
  const [prefillEmail, setPrefillEmail] = useState<string>('');
  const { t } = useTranslation();

  const handleSuccess = (user: User) => {
    onSuccess?.(user);
    close();
  };

  const showLogin = (email?: string) => {
    // Always overwrite: keeping a previously-offered address would prefill the
    // login form with an unrelated email.
    setPrefillEmail(email ?? '');
    setCurrentView('login');
  };

  const getTitle = () => {
    switch (currentView) {
      case 'login':
        return isAnonymous ? t('linkAccount') : t('signIn');
      case 'register':
        // For a guest this form links their existing account rather than
        // creating a separate one — same wording as the sign-in view.
        return isAnonymous ? t('linkAccount') : t('createAccount');
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
        <>
          <CreateAccount
            onSwitchToLogin={showLogin}
            onSuccess={handleSuccess}
            isAnonymous={isAnonymous}
          />
          {/* The Google *linking* path lives here too: a guest sent straight to
              this view would otherwise have to detour through the sign-in form,
              which warns that signing in abandons their guest content. */}
          <SocialLoginButtons onSuccess={handleSuccess} isLinking={isAnonymous} />
        </>
      )}
    </DialogWrapper>
  );
}
