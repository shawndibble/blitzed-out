import CloseIcon from '@mui/icons-material/Close';
import MenuIcon from '@mui/icons-material/Menu';
import PaidIcon from '@mui/icons-material/Paid';
import SettingsIcon from '@mui/icons-material/Settings';
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
  ListItemText,
  SvgIcon,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import GameSettings from '../../GameSettings';
import { a11yProps } from '../../../helpers/strings';
import TabPanel from '../../TabPanel';
import Venmo from '../../../images/venmo.png';
import CashApp from '../../../images/cashapp.png';

export default function MenuDrawer() {
  const [menuOpen, setMenu] = useState(false);
  const toggleDrawer = (isOpen) => setMenu(isOpen);

  const [tabVal, setTab] = useState(0);
  const changeTab = (_, newVal) => setTab(newVal);

  const [open, setOpen] = useState({
    settings: false,
    donate: false,
  });
  const toggleDialog = (type, isOpen) => setOpen({ ...open, [type]: isOpen });

  const openInNewTab = (url) => window.open(url, '_blank', 'noreferrer');

  const discordIcon = (
    <SvgIcon>
      <path d="M18.942 5.556a16.299 16.299 0 0 0-4.126-1.297c-.178.321-.385.754-.529 1.097a15.175 15.175 0 0 0-4.573 0 11.583 11.583 0 0 0-.535-1.097 16.274 16.274 0 0 0-4.129 1.3c-2.611 3.946-3.319 7.794-2.965 11.587a16.494 16.494 0 0 0 5.061 2.593 12.65 12.65 0 0 0 1.084-1.785 10.689 10.689 0 0 1-1.707-.831c.143-.106.283-.217.418-.331 3.291 1.539 6.866 1.539 10.118 0 .137.114.277.225.418.331-.541.326-1.114.606-1.71.832a12.52 12.52 0 0 0 1.084 1.785 16.46 16.46 0 0 0 5.064-2.595c.415-4.396-.709-8.209-2.973-11.589zM8.678 14.813c-.988 0-1.798-.922-1.798-2.045s.793-2.047 1.798-2.047 1.815.922 1.798 2.047c.001 1.123-.793 2.045-1.798 2.045zm6.644 0c-.988 0-1.798-.922-1.798-2.045s.793-2.047 1.798-2.047 1.815.922 1.798 2.047c0 1.123-.793 2.045-1.798 2.045z" />
    </SvgIcon>
  );

  const menuItems = [
    { title: 'Settings', icon: <SettingsIcon />, onClick: () => toggleDialog('settings', true) },
    { title: 'Discord', icon: discordIcon, onClick: () => openInNewTab('https://discord.gg/mSPBE2hFef') },
    { title: 'Donate', icon: <PaidIcon />, onClick: () => toggleDialog('donate', true) },
  ];

  const closeIcon = (openType) => (
    <IconButton
      aria-label="close"
      onClick={() => toggleDialog(openType, false)}
      sx={{
        position: 'absolute',
        right: 8,
        top: 8,
        color: (theme) => theme.palette.grey[500],
      }}
    >
      <CloseIcon />
    </IconButton>
  );

  const settingsDialog = (
    <Dialog open={open.settings} onClose={() => toggleDialog('settings', false)}>
      <DialogTitle>
        Game Settings
        {closeIcon('settings')}
      </DialogTitle>
      <DialogContent>
        <GameSettings submitText="Update Game" closeDialog={() => toggleDialog('settings', false)} />
      </DialogContent>
    </Dialog>
  );

  const donateDialog = (
    <Dialog open={open.donate} onClose={() => toggleDialog('donate', false)}>
      <DialogTitle>
        Donate to help support the site
        {closeIcon('donate')}
      </DialogTitle>
      <Tabs value={tabVal} onChange={changeTab} aria-label="donate options">
        <Tab label="Venmo" {...a11yProps(0)} />
        <Tab label="Cashapp" {...a11yProps(1)} />
      </Tabs>
      <TabPanel value={tabVal} index={0}>
        <Box sx={{ textAlign: 'center' }}>
          <Link to="https://venmo.com/code?user_id=3818104727537125276">
            <Typography variant="h4">@blitzedout</Typography>
          </Link>
        </Box>
        <Box component="img" sx={{ maxWidth: 550 }} alt="Venmo QR code" src={Venmo} />
      </TabPanel>
      <TabPanel value={tabVal} index={1}>
        <Box sx={{ textAlign: 'center' }}>
          <Link to="https://cash.app/$krishmero">
            <Typography variant="h4">$KrishMero</Typography>
          </Link>
        </Box>
        <Box
          component="img"
          sx={{
            padding: 4, background: 'white', maxWidth: 500, borderRadius: 5, margin: 3,
          }}
          alt="Venmo QR code"
          src={CashApp}
        />
      </TabPanel>
    </Dialog>
  );

  const menuList = menuItems.map(({ title, icon, onClick }) => (
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
      {donateDialog}
    </>
  );
}
