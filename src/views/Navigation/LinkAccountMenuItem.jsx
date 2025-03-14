import React from 'react';
import { ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { AccountCircle } from '@mui/icons-material';
import { Trans } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';

export default function LinkAccountMenuItem({ onClick, onClose }) {
  const { isAnonymous } = useAuth();
  
  if (!isAnonymous) return null;
  
  return (
    <ListItemButton
      onClick={() => {
        onClick();
        onClose();
      }}
    >
      <ListItemIcon>
        <AccountCircle />
      </ListItemIcon>
      <ListItemText primary={<Trans i18nKey="linkAccount">Link Account</Trans>} />
    </ListItemButton>
  );
}
