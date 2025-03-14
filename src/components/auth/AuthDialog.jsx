import React, { useState } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  IconButton, 
  Typography,
  Box,
  Divider
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Trans } from 'react-i18next';
import Login from './Login';
import CreateAccount from './CreateAccount';
import SocialLoginButtons from './SocialLoginButtons';
import { useAuth } from '@/hooks/useAuth';

export default function AuthDialog({ open, onClose, initialView = 'login' }) {
  const [currentView, setCurrentView] = useState(initialView);
  const { user, isAnonymous } = useAuth();
  
  const handleSuccess = () => {
    onClose();
  };
  
  const getTitle = () => {
    switch (currentView) {
      case 'login':
        return isAnonymous ? 'Link Account' : 'Sign In';
      case 'register':
        return isAnonymous ? 'Create Permanent Account' : 'Create Account';
      case 'reset':
        return 'Reset Password';
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
              <Login 
                onSwitchToRegister={() => setCurrentView('register')} 
                onSuccess={handleSuccess}
                isLinking={isAnonymous}
              />
              <SocialLoginButtons 
                onSuccess={handleSuccess} 
                isLinking={isAnonymous}
              />
            </>
          )}
          
          {currentView === 'register' && (
            <CreateAccount 
              onSwitchToLogin={() => setCurrentView('login')} 
              onSuccess={handleSuccess}
              isAnonymous={isAnonymous}
            />
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
