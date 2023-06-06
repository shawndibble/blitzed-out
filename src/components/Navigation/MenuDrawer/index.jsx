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
  Tab,
  Tabs,
  Typography
} from '@mui/material';
import { useState } from 'react';
import GameSettings from '../../GameSettings';
import { a11yProps } from '../../../helpers/strings';
import TabPanel from '../../TabPanel';
import { Link } from 'react-router-dom';
import Venmo from '../../../images/venmo.png';
import CashApp from '../../../images/cashapp.png';

export default function MenuDrawer() {
  const [menuOpen, setMenu] = useState(false);
  const toggleDrawer = (isOpen) => setMenu(isOpen);

  const [tabVal, setTab] = useState(0);
  const changeTab = (_, newVal) => setTab(newVal);

  const [open, setOpen] = useState({
    settings: false,
    donate: false
  });
  const toggleDialog = (type, isOpen) => setOpen({ ...open, [type]: isOpen });

  const menuItems = [
    { title: 'Settings', icon: <SettingsIcon />, onClick: () => toggleDialog('settings', true) },
    { title: 'Donate', icon: <PaidIcon />, onClick: () => toggleDialog('donate', true) }
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
  )

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
          <Link to="https://venmo.com/code?user_id=3818104727537125276" >
            <Typography variant='h4'>@blitzedout</Typography>
          </Link>
        </Box>
        <Box component="img" sx={{ maxWidth: 550 }} alt="Venmo QR code" src={Venmo} />
      </TabPanel>
      <TabPanel value={tabVal} index={1}>
        <Box sx={{ textAlign: 'center' }}>
          <Link to="https://cash.app/$krishmero" >
            <Typography variant='h4'>$KrishMero</Typography>
          </Link>
        </Box>
        <Box
          component="img"
          sx={{ padding: 4, background: 'white', maxWidth: 500, borderRadius: 5, margin: 3 }}
          alt="Venmo QR code"
          src={CashApp}
        />
      </TabPanel>
    </Dialog>
  )

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
      {donateDialog}
    </>
  );
}