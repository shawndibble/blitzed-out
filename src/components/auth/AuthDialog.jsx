import React, { useState } from 'react';
import Login from './Login';
import CreateAccount from './CreateAccount';
import SocialLoginButtons from './SocialLoginButtons';
import { useAuth } from '@/hooks/useAuth';
import DialogWrapper from '../DialogWrapper';
import ResetPasswordForm from './ResetPasswordForm';
import { useTranslation } from 'react-i18next';

export default function AuthDialog({ open, close, initialView = 'login' }) {
  const [currentView, setCurrentView] = useState(initialView);
  const { isAnonymous } = useAuth();
  const { t } = useTranslation();

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
    <DialogWrapper title={getTitle(isAnonymous)} open={open} close={close}>
      {currentView === 'login' && (
        <>
          <Login
            onSwitchToRegister={() => setCurrentView('register')}
            onSwitchToForgotPassword={() => setCurrentView('reset')}
            onSuccess={close}
            isLinking={isAnonymous}
          />
          <SocialLoginButtons onSuccess={close} isLinking={isAnonymous} />
        </>
      )}

      {currentView === 'reset' && <ResetPasswordForm onToggleForm={setCurrentView} />}

      {currentView === 'register' && (
        <CreateAccount
          onSwitchToLogin={() => setCurrentView('login')}
          onSuccess={close}
          isAnonymous={isAnonymous}
        />
      )}
    </DialogWrapper>
  );
}
