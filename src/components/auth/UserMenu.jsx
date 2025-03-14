import React, { useState } from 'react';
import { 
  Button, 
  Menu, 
  MenuItem, 
  ListItemIcon, 
  ListItemText,
  Divider,
  Typography,
  Avatar,
  Box,
  IconButton,
  Tooltip,
  Badge
} from '@mui/material';
import { 
  Login as LoginIcon,
  Logout as LogoutIcon,
  AccountCircle,
  Link as LinkIcon,
  CloudUpload as CloudUploadIcon,
  CloudDone as CloudDoneIcon,
  CloudOff as CloudOffIcon,
  Sync as SyncIcon
} from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import AuthDialog from './AuthDialog';

export default function UserMenu() {
  const [anchorEl, setAnchorEl] = useState(null);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [authDialogView, setAuthDialogView] = useState('login');
  
  const { 
    user, 
    logout, 
    syncData, 
    syncStatus, 
    isAnonymous 
  } = useAuth();
  
  const open = Boolean(anchorEl);
  
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handleLogout = async () => {
    handleClose();
    await logout();
  };
  
  const handleSync = async () => {
    handleClose();
    await syncData();
  };
  
  const openAuthDialog = (view) => {
    setAuthDialogView(view);
    setAuthDialogOpen(true);
    handleClose();
  };
  
  const closeAuthDialog = () => {
    setAuthDialogOpen(false);
  };
  
  // Get first letter of display name for avatar
  const getAvatarLetter = () => {
    if (!user || !user.displayName) return '?';
    return user.displayName.charAt(0).toUpperCase();
  };
  
  // Get sync status icon
  const getSyncIcon = () => {
    if (!user || isAnonymous) return <CloudOffIcon />;
    if (syncStatus.syncing) return <SyncIcon className="rotating" />;
    if (syncStatus.lastSync) return <CloudDoneIcon />;
    return <CloudUploadIcon />;
  };
  
  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {user && (
          <Tooltip title={syncStatus.syncing ? "Syncing..." : "Account sync status"}>
            <IconButton
              size="small"
              sx={{ mr: 1 }}
              onClick={handleSync}
              disabled={!user || isAnonymous || syncStatus.syncing}
            >
              {getSyncIcon()}
            </IconButton>
          </Tooltip>
        )}
        
        <Tooltip title={user ? "Account menu" : "Login options"}>
          <IconButton
            onClick={handleClick}
            size="small"
            aria-controls={open ? 'account-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={open ? 'true' : undefined}
          >
            {user ? (
              <Avatar sx={{ width: 32, height: 32, bgcolor: isAnonymous ? 'grey.500' : 'primary.main' }}>
                {getAvatarLetter()}
              </Avatar>
            ) : (
              <AccountCircle />
            )}
          </IconButton>
        </Tooltip>
      </Box>
      
      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={open}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {user && (
          <>
            <MenuItem disabled>
              <Typography variant="body2" color="textSecondary">
                {user.displayName || 'Anonymous User'}
              </Typography>
            </MenuItem>
            
            {isAnonymous && (
              <MenuItem onClick={() => openAuthDialog('link')}>
                <ListItemIcon>
                  <LinkIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Link Account</ListItemText>
              </MenuItem>
            )}
            
            {!isAnonymous && (
              <MenuItem onClick={handleSync} disabled={syncStatus.syncing}>
                <ListItemIcon>
                  {syncStatus.syncing ? <SyncIcon className="rotating" fontSize="small" /> : <CloudUploadIcon fontSize="small" />}
                </ListItemIcon>
                <ListItemText>Sync Data</ListItemText>
              </MenuItem>
            )}
            
            <Divider />
            
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Logout</ListItemText>
            </MenuItem>
          </>
        )}
        
        {!user && (
          <>
            <MenuItem onClick={() => openAuthDialog('login')}>
              <ListItemIcon>
                <LoginIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Sign In</ListItemText>
            </MenuItem>
            
            <MenuItem onClick={() => openAuthDialog('register')}>
              <ListItemIcon>
                <AccountCircle fontSize="small" />
              </ListItemIcon>
              <ListItemText>Create Account</ListItemText>
            </MenuItem>
          </>
        )}
      </Menu>
      
      <AuthDialog 
        open={authDialogOpen} 
        onClose={closeAuthDialog} 
        initialView={authDialogView} 
      />
      
      <style jsx global>{`
        .rotating {
          animation: rotate 2s linear infinite;
        }
        
        @keyframes rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </>
  );
}
