
import MenuIcon from '@mui/icons-material/Menu';
import SettingsIcon from '@mui/icons-material/Settings';
import CloseIcon from '@mui/icons-material/Close';
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { useState } from 'react';
import GameSettings from '../../GameSettings';

export default function MenuDrawer() {
  const [menuOpen, setMenu] = useState(false);
  const toggleDrawer = (isOpen) => setMenu(isOpen);

  const [openDialog, setDialog] = useState(false);
  const toggleSettings = (isOpen) => setDialog(isOpen);

  const menuItems = [
    {title: 'Settings', icon: <SettingsIcon />, onClick: () => toggleSettings(true)}
  ];

  const settingsDialog = (
    <Dialog open={openDialog} onClose={() => toggleSettings(false)}>
      <DialogTitle>
        Game Settings
          <IconButton
            aria-label="close"
            onClick={() => toggleSettings(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
      </DialogTitle>
      <DialogContent>
        <GameSettings submitText="Update Game" closeDialog={() => toggleSettings(false)} />
      </DialogContent>
    </Dialog>
  );

  const menuList = menuItems.map(({title, icon, onClick}) => (
    <ListItem key={title} disablePadding onClick={onClick}>
      <ListItemButton>
        <ListItemIcon>                        
            {icon}
        </ListItemIcon>
        <ListItemText primary={title} />
      </ListItemButton>
    </ListItem>
  ));

  return (
    <>
      <IconButton onClick={() => toggleDrawer(true)} aria-label="open menu">
        <MenuIcon />
      </IconButton>
      <Drawer
        anchor="right"
        open={menuOpen}
        onClose={() => toggleDrawer(false)}
      >
        <Box role="presentation" onClick={() => toggleDrawer(false)} sx={{ width: 250 }}>
          <List>
            {menuList}
          </List>
        </Box>
      </Drawer>
      {settingsDialog}
    </>
  );
}