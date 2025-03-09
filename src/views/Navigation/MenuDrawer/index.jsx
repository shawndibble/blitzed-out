import { AppRegistration, CalendarMonth, Logout, Tv, ViewModule } from '@mui/icons-material';
import InfoIcon from '@mui/icons-material/Info';
import MenuIcon from '@mui/icons-material/Menu';
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
} from '@mui/material';
import CloseIcon from '@/components/CloseIcon';
import GameSettingsDialog from '@/components/GameSettingsDialog';
import useAuth from '@/context/hooks/useAuth';
import useBreakpoint from '@/hooks/useBreakpoint';
import { useMemo, useState } from 'react';
import { Trans } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { logout } from '@/services/firebase';
import GameGuide from '@/views/GameGuide';
import ManageGameBoards from '@/views/ManageGameBoards';
import Schedule from '@/views/Schedule';
import CustomTileDialog from '@/views/CustomTileDialog';

export default function MenuDrawer() {
  const { id: room } = useParams();
  const { user } = useAuth();
  const isMobile = useBreakpoint();
  const [menuOpen, setMenu] = useState(false);
  const toggleDrawer = (isOpen) => setMenu(isOpen);

  const [open, setOpen] = useState({
    settings: false,
    gameBoard: false,
    about: false,
    schedule: false,
    customTiles: false,
  });

  const toggleDialog = (type, isOpen) => setOpen({ ...open, [type]: isOpen });

  const openInNewTab = (url) => window.open(url, '_blank', 'noreferrer');

  const discordIcon = (
    <SvgIcon>
      <path d="M18.942 5.556a16.299 16.299 0 0 0-4.126-1.297c-.178.321-.385.754-.529 1.097a15.175 15.175 0 0 0-4.573 0 11.583 11.583 0 0 0-.535-1.097 16.274 16.274 0 0 0-4.129 1.3c-2.611 3.946-3.319 7.794-2.965 11.587a16.494 16.494 0 0 0 5.061 2.593 12.65 12.65 0 0 0 1.084-1.785 10.689 10.689 0 0 1-1.707-.831c.143-.106.283-.217.418-.331 3.291 1.539 6.866 1.539 10.118 0 .137.114.277.225.418.331-.541.326-1.114.606-1.71.832a12.52 12.52 0 0 0 1.084 1.785 16.46 16.46 0 0 0 5.064-2.595c.415-4.396-.709-8.209-2.973-11.589zM8.678 14.813c-.988 0-1.798-.922-1.798-2.045s.793-2.047 1.798-2.047 1.815.922 1.798 2.047c.001 1.123-.793 2.045-1.798 2.045zm6.644 0c-.988 0-1.798-.922-1.798-2.045s.793-2.047 1.798-2.047 1.815.922 1.798 2.047c0 1.123-.793 2.045-1.798 2.045z" />
    </SvgIcon>
  );

  const menuItems = useMemo(() => {
    const items = [
      {
        key: 'gameBoard',
        title: <Trans i18nKey="gameBoards" />,
        icon: <AppRegistration />,
        onClick: () => toggleDialog('gameBoard', true),
      },
      {
        key: 'customTiles',
        title: <Trans i18nKey="customTiles" />,
        icon: <ViewModule />,
        onClick: () => toggleDialog('customTiles', true),
      },
      {
        key: 'cast',
        title: <Trans i18nKey="cast" />,
        icon: <Tv />,
        onClick: () => openInNewTab(`/${room.toUpperCase()}/cast`),
      },
      {
        key: 'schedule',
        title: <Trans i18nKey="schedule" />,
        icon: <CalendarMonth />,
        onClick: () => toggleDialog('schedule', true),
      },
      {
        key: 'discord',
        title: 'Discord',
        icon: discordIcon,
        onClick: () => openInNewTab('https://discord.gg/mSPBE2hFef'),
      },
      {
        key: 'about',
        title: <Trans i18nKey="about" />,
        icon: <InfoIcon />,
        onClick: () => toggleDialog('about', true),
      },
    ];

    if (user) {
      items.unshift({
        key: 'settings',
        title: <Trans i18nKey="settings" />,
        icon: <SettingsIcon />,
        onClick: () => toggleDialog('settings', true),
      });
      items.push({
        key: 'logout',
        title: <Trans i18nKey="logout" />,
        icon: <Logout />,
        onClick: () => logout(),
      });
    }
    return items;
  }, [user, room]);

  const aboutDialog = (
    <Dialog fullScreen={isMobile} open={open.about} onClose={() => toggleDialog('about', false)}>
      <DialogTitle>
        <CloseIcon close={() => toggleDialog('about', false)} />
      </DialogTitle>
      <DialogContent>
        <GameGuide />
      </DialogContent>
    </Dialog>
  );

  const menuList = menuItems.map(({ key, title, icon, onClick }) => (
    <ListItem key={key} disablePadding onClick={onClick}>
      <ListItemButton>
        <ListItemIcon>{icon}</ListItemIcon>
        <ListItemText primary={title} />
      </ListItemButton>
    </ListItem>
  ));

  return (
    <>
      <IconButton onClick={() => toggleDrawer(true)} aria-label="open menu">
        <MenuIcon />
      </IconButton>
      <Drawer anchor="right" open={menuOpen} onClose={() => toggleDrawer(false)}>
        <Box role="presentation" onClick={() => toggleDrawer(false)} sx={{ width: 250 }}>
          <List>{menuList}</List>
        </Box>
      </Drawer>
      {!!open.settings && (
        <GameSettingsDialog open={open.settings} close={() => toggleDialog('settings', false)} />
      )}
      {aboutDialog}
      {!!open.gameBoard && (
        <ManageGameBoards
          open={open.gameBoard}
          close={() => toggleDialog('gameBoard', false)}
          isMobile={isMobile}
        />
      )}
      {!!open.schedule && (
        <Schedule
          open={open.schedule}
          close={() => toggleDialog('schedule', false)}
          isMobile={isMobile}
        />
      )}
      {!!open.customTiles && (
        <CustomTileDialog
          open={open.customTiles}
          close={() => toggleDialog('customTiles', false)}
          isMobile={isMobile}
        />
      )}
    </>
  );
}
