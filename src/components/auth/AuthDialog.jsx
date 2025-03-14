import React, { useState } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  IconButton, 
  Typography,
  Box
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import ResetPasswordForm from './ResetPasswordForm';
import SocialLoginButtons from './SocialLoginButtons';
import { useAuth } from '@/hooks/useAuth';

export default function AuthDialog({ open, onClose, initialView = 'login' }) {
  const [currentView, setCurrentView] = useState(initialView);
  const { user } = useAuth();
  
  const handleSuccess = () => {
    onClose();
  };
  
  const handleToggleForm = (formType) => {
    setCurrentView(formType);
  };
  
  const getTitle = () => {
    switch (currentView) {
      case 'login':
        return 'Sign In';
      case 'register':
        return 'Create Account';
      case 'reset':
        return 'Reset Password';
      case 'link':
        return 'Link Account';
      default:
        return 'Authentication';
    }
  };
  
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Typography variant="h6">{getTitle()}</Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ p: 1 }}>
          {currentView === 'login' && (
            <>
              <LoginForm 
                onToggleForm={handleToggleForm} 
                onSuccess={handleSuccess} 
              />
              <SocialLoginButtons onSuccess={handleSuccess} />
            </>
          )}
          
          {currentView === 'register' && (
            <RegisterForm 
              onToggleForm={handleToggleForm} 
              onSuccess={handleSuccess} 
            />
          )}
          
          {currentView === 'reset' && (
            <ResetPasswordForm 
              onToggleForm={handleToggleForm} 
            />
          )}
          
          {currentView === 'link' && (
            <RegisterForm 
              onToggleForm={handleToggleForm} 
              onSuccess={handleSuccess}
              isAnonymous={true}
            />
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
