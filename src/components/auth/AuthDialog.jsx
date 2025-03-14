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
  const { user } = useAuth();
  
  const handleSuccess = () => {
    onClose();
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
              <Login 
                onSwitchToRegister={() => setCurrentView('register')} 
                onSuccess={handleSuccess} 
              />
              <SocialLoginButtons onSuccess={handleSuccess} />
            </>
          )}
          
          {currentView === 'register' && (
            <CreateAccount 
              onSwitchToLogin={() => setCurrentView('login')} 
              onSuccess={handleSuccess} 
            />
          )}
          
          {currentView === 'link' && (
            <CreateAccount 
              onSwitchToLogin={() => setCurrentView('login')} 
              onSuccess={handleSuccess}
              isAnonymous={true}
            />
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
