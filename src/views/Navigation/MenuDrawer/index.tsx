import {
  AppRegistration,
  CalendarMonth,
  Language,
  Link as LinkIcon,
  Logout,
  Tv,
  ViewModule,
} from '@mui/icons-material';
import InfoIcon from '@mui/icons-material/Info';
import MenuIcon from '@mui/icons-material/Menu';
import SettingsIcon from '@mui/icons-material/Settings';
import TuneIcon from '@mui/icons-material/Tune';
import {
  Box,
  Drawer,
  FormControl,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
  SelectChangeEvent,
  SvgIcon,
} from '@mui/material';
import { useAuth } from '@/hooks/useAuth';
import useBreakpoint from '@/hooks/useBreakpoint';
import { lazy, Suspense, useMemo, useState, ReactNode, useCallback } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import DialogWrapper from '@/components/DialogWrapper';
import AuthDialog from '@/components/auth/AuthDialog';
import { useSettings, useSettingsStore } from '@/stores/settingsStore';
import { languages } from '@/services/i18nHelpers';

// Lazy load dialogs
const AppSettingsDialog = lazy(() => import('@/components/AppSettingsDialog'));
const GameSettingsDialog = lazy(() => import('@/components/GameSettingsDialog'));
const GameGuide = lazy(() => import('@/views/GameGuide'));
const ManageGameBoards = lazy(() => import('@/views/ManageGameBoards'));
const Schedule = lazy(() => import('@/views/Schedule'));
const CustomTileDialog = lazy(() => import('@/components/CustomTilesDialog'));

interface MenuItemType {
  key: string;
  title: ReactNode;
  icon: ReactNode;
  onClick: () => void;
}

interface DialogState {
  settings: boolean;
  gameBoard: boolean;
  about: boolean;
  schedule: boolean;
  customTiles: boolean;
  linkAccount: boolean;
  appSettings: boolean;
  [key: string]: boolean;
}

export default function MenuDrawer(): JSX.Element {
  const { id: room } = useParams<{ id: string }>();
  const { user, logout, isAnonymous } = useAuth();
  const isMobile = useBreakpoint();
  const { i18n } = useTranslation();
  const [menuOpen, setMenu] = useState<boolean>(false);
  const toggleDrawer = useCallback((isOpen: boolean): void => setMenu(isOpen), []);
  const gameSettings = useSettings()[0];

  const [open, setOpen] = useState<DialogState>({
    settings: false,
    gameBoard: false,
    about: false,
    schedule: false,
    customTiles: false,
    linkAccount: false,
    appSettings: false,
  });

  const toggleDialog = useCallback(
    (type: string, isOpen: boolean): void => setOpen((prev) => ({ ...prev, [type]: isOpen })),
    []
  );

  const handleLogout = useCallback(async (): Promise<void> => {
    await logout();
    toggleDrawer(false);
  }, [logout, toggleDrawer]);

  const openInNewTab = (url: string): Window | null => window.open(url, '_blank', 'noreferrer');

  const discordIcon = useMemo(
    () => (
      <SvgIcon>
        <path d="M18.942 5.556a16.299 16.299 0 0 0-4.126-1.297c-.178.321-.385.754-.529 1.097a15.175 15.175 0 0 0-4.573 0 11.583 11.583 0 0 0-.535-1.097 16.274 16.274 0 0 0-4.129 1.3c-2.611 3.946-3.319 7.794-2.965 11.587a16.494 16.494 0 0 0 5.061 2.593 12.65 12.65 0 0 0 1.084-1.785 10.689 10.689 0 0 1-1.707-.831c.143-.106.283-.217.418-.331 3.291 1.539 6.866 1.539 10.118 0 .137.114.277.225.418.331-.541.326-1.114.606-1.71.832a12.52 12.52 0 0 0 1.084 1.785 16.46 16.46 0 0 0 5.064-2.595c.415-4.396-.709-8.209-2.973-11.589zM8.678 14.813c-.988 0-1.798-.922-1.798-2.045s.793-2.047 1.798-2.047 1.815.922 1.798 2.047c.001 1.123-.793 2.045-1.798 2.045zm6.644 0c-.988 0-1.798-.922-1.798-2.045s.793-2.047 1.798-2.047 1.815.922 1.798 2.047c0 1.123-.793 2.045-1.798 2.045z" />
      </SvgIcon>
    ),
    []
  );

  const { setLocale } = useSettingsStore();

  const handleLanguageChange = useCallback(
    (event: SelectChangeEvent<string>): void => {
      const newLanguage = event.target.value;
      i18n.changeLanguage(newLanguage);
      setLocale(newLanguage);
    },
    [i18n, setLocale]
  );

  const languageMenuItems = useMemo(
    () =>
      Object.entries(languages).map(([key, obj]) => (
        <MenuItem value={key} key={key}>
          {obj.label}
        </MenuItem>
      )),
    [languages]
  );

  const menuItems = useMemo<MenuItemType[]>(() => {
    const items: MenuItemType[] = [
      {
        key: 'gameBoard',
        title: <Trans i18nKey="gameBoards" />,
        icon: <AppRegistration />,
        onClick: () => toggleDialog('gameBoard', true),
      },
      {
        key: 'customTiles',
        title: <Trans i18nKey="customTilesLabel" />,
        icon: <ViewModule />,
        onClick: () => toggleDialog('customTiles', true),
      },
      {
        key: 'cast',
        title: <Trans i18nKey="tvMode" />,
        icon: <Tv />,
        onClick: () => openInNewTab(`/${room?.toUpperCase()}/cast`),
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
        key: 'appSettings',
        title: <Trans i18nKey="appSettings" />,
        icon: <TuneIcon />,
        onClick: () => toggleDialog('appSettings', true),
      });
      items.unshift({
        key: 'settings',
        title: <Trans i18nKey={gameSettings.advancedSettings ? 'settings' : 'setupWizard'} />,
        icon: <SettingsIcon />,
        onClick: () => toggleDialog('settings', true),
      });
      if (isAnonymous) {
        items.push({
          key: 'linkAccount',
          title: <Trans i18nKey="linkAccount" />,
          icon: <LinkIcon />,
          onClick: () => toggleDialog('linkAccount', true),
        });
      }
      items.push({
        key: 'logout',
        title: <Trans i18nKey="logout" />,
        icon: <Logout />,
        onClick: () => handleLogout(),
      });
    }
    return items;
  }, [
    user,
    room,
    isAnonymous,
    gameSettings.advancedSettings,
    discordIcon,
    handleLogout,
    toggleDialog,
  ]);

  const menuList = menuItems.map(({ key, title, icon, onClick }) => (
    <ListItem key={key} disablePadding onClick={onClick}>
      <ListItemButton>
        <ListItemIcon>{icon}</ListItemIcon>
        <ListItemText primary={title} />
      </ListItemButton>
    </ListItem>
  ));

  const renderDialog = <T,>(
    Component: React.ComponentType<T & { open: boolean; close: () => void; isMobile: boolean }>,
    dialogKey: keyof DialogState,
    props: Partial<T> = {} as any
  ): JSX.Element => (
    <Suspense fallback={null}>
      <Component
        open={open[dialogKey]}
        close={() => toggleDialog(dialogKey.toString(), false)}
        isMobile={isMobile}
        {...(props as any)}
      />
    </Suspense>
  );

  return (
    <>
      <IconButton onClick={() => toggleDrawer(true)} aria-label="open menu">
        <MenuIcon />
      </IconButton>
      <Drawer anchor="right" open={menuOpen} onClose={() => toggleDrawer(false)}>
        <Box
          role="presentation"
          onClick={() => toggleDrawer(false)}
          sx={{
            width: 250,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
          }}
        >
          <List sx={{ flexGrow: 1 }}>{menuList}</List>
          <Box
            sx={{
              borderTop: '1px solid rgba(0, 0, 0, 0.12)',
              p: 2,
            }}
          >
            <FormControl fullWidth size="small" sx={{ maxWidth: 200 }}>
              <InputLabel
                id="drawer-language-label"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  '& .MuiInputLabel-root': {
                    fontSize: '0.875rem',
                  },
                }}
              >
                <Language sx={{ mr: 0.5, fontSize: '1rem' }} />
                <Trans i18nKey="language" />
              </InputLabel>
              <Select
                labelId="drawer-language-label"
                id="drawer-language-select"
                value={i18n.resolvedLanguage || 'en'}
                label={
                  <>
                    <Language sx={{ fontSize: '1rem' }} />
                    <Trans i18nKey="language" />
                  </>
                }
                onChange={handleLanguageChange}
                size="small"
                MenuProps={{
                  anchorOrigin: {
                    vertical: 'top',
                    horizontal: 'left',
                  },
                  transformOrigin: {
                    vertical: 'bottom',
                    horizontal: 'left',
                  },
                }}
              >
                {languageMenuItems}
              </Select>
            </FormControl>
          </Box>
        </Box>
      </Drawer>
      {open.settings && renderDialog(GameSettingsDialog, 'settings')}
      {open.appSettings && renderDialog(AppSettingsDialog, 'appSettings')}
      {open.about && (
        <Suspense fallback={null}>
          <DialogWrapper open={open.about} close={() => toggleDialog('about', false)}>
            <GameGuide />
          </DialogWrapper>
        </Suspense>
      )}
      {open.gameBoard && renderDialog(ManageGameBoards, 'gameBoard')}
      {open.schedule && renderDialog(Schedule, 'schedule')}
      {open.customTiles && renderDialog(CustomTileDialog, 'customTiles')}
      {open.linkAccount && renderDialog(AuthDialog, 'linkAccount')}
    </>
  );
}
