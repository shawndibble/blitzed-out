import AppRegistrationIcon from '@mui/icons-material/AppRegistration';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LanguageIcon from '@mui/icons-material/Language';
import LinkIcon from '@mui/icons-material/Link';
import LogoutIcon from '@mui/icons-material/Logout';
import TvIcon from '@mui/icons-material/Tv';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
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
import { useMemo, useState, ReactNode, useCallback } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import DialogWrapper from '@/components/DialogWrapper';
import AuthDialog from '@/components/auth/AuthDialog';
import { useSettings, useSettingsStore } from '@/stores/settingsStore';
import { languages } from '@/services/i18nHelpers';
import LanguageChangeModal from '@/components/LanguageChangeModal';
import useSubmitGameSettings from '@/hooks/useSubmitGameSettings';
import useUnifiedActionList from '@/hooks/useUnifiedActionList';
import AppSettingsDialog from '@/components/AppSettingsDialog';
import GameSettingsDialog from '@/components/GameSettingsDialog';
import GameGuide from '@/views/GameGuide';
import ManageGameBoards from '@/views/ManageGameBoards';
import Schedule from '@/views/Schedule';
import CustomTileDialog from '@/components/CustomTilesDialog';

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
  languageChange: boolean;
  [key: string]: boolean;
}

export default function MenuDrawer(): JSX.Element {
  const { id: room } = useParams<{ id: string }>();
  const { user, wipeAllData, isAnonymous } = useAuth();
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
    languageChange: false,
  });

  const toggleDialog = useCallback(
    (type: string, isOpen: boolean): void => setOpen((prev) => ({ ...prev, [type]: isOpen })),
    []
  );

  const handleWipeData = useCallback(async (): Promise<void> => {
    await wipeAllData();
    toggleDrawer(false);
  }, [wipeAllData, toggleDrawer]);

  const openInNewTab = (url: string): Window | null => window.open(url, '_blank', 'noreferrer');

  const discordIcon = useMemo(
    () => (
      <SvgIcon>
        <path d="M18.942 5.556a16.299 16.299 0 0 0-4.126-1.297c-.178.321-.385.754-.529 1.097a15.175 15.175 0 0 0-4.573 0 11.583 11.583 0 0 0-.535-1.097 16.274 16.274 0 0 0-4.129 1.3c-2.611 3.946-3.319 7.794-2.965 11.587a16.494 16.494 0 0 0 5.061 2.593 12.65 12.65 0 0 0 1.084-1.785 10.689 10.689 0 0 1-1.707-.831c.143-.106.283-.217.418-.331 3.291 1.539 6.866 1.539 10.118 0 .137.114.277.225.418.331-.541.326-1.114.606-1.71.832a12.52 12.52 0 0 0 1.084 1.785 16.46 16.46 0 0 0 5.064-2.595c.415-4.396-.709-8.209-2.973-11.589zM8.678 14.813c-.988 0-1.798-.922-1.798-2.045s.793-2.047 1.798-2.047 1.815.922 1.798 2.047c.001 1.123-.793 2.045-1.798 2.045zm6.644 0c-.988 0-1.798-.922-1.798-2.045s.793-2.047 1.798-2.047 1.815.922 1.798 2.047c0 1.123-.793 2.045-1.798 2.045z" />
      </SvgIcon>
    ),
    []
  );

  const { setLocale, updateSettings } = useSettingsStore();
  const [languageLoading, setLanguageLoading] = useState(false);
  const [pendingLanguageChange, setPendingLanguageChange] = useState<{
    from: string;
    to: string;
  } | null>(null);
  const submitSettings = useSubmitGameSettings();
  const { actionsList } = useUnifiedActionList(gameSettings?.gameMode);

  const handleLanguageChange = useCallback(
    async (event: SelectChangeEvent<string>): Promise<void> => {
      const newLanguage = event.target.value;
      const currentLanguage = i18n.resolvedLanguage || 'en';

      // If same language, do nothing
      if (currentLanguage === newLanguage) return;

      setLanguageLoading(true);

      try {
        // Language change will automatically trigger migration via MigrationContext
        await i18n.changeLanguage(newLanguage);
        setLocale(newLanguage);

        // Wait for i18n to fully propagate using the languageChanged event
        await new Promise((resolve) => {
          const onLanguageChanged = () => {
            i18n.off('languageChanged', onLanguageChanged);
            resolve(undefined);
          };
          i18n.on('languageChanged', onLanguageChanged);
          // Fallback timeout in case event doesn't fire
          setTimeout(() => {
            i18n.off('languageChanged', onLanguageChanged);
            resolve(undefined);
          }, 500);
        });

        // Set pending change and show modal in new language
        setPendingLanguageChange({ from: currentLanguage, to: newLanguage });
        toggleDialog('languageChange', true);
      } catch (error) {
        console.error('Error changing language:', error);
        // Still attempt to change language even if migration fails
        await i18n.changeLanguage(newLanguage);
        setLocale(newLanguage);

        // Wait for i18n to fully propagate using the languageChanged event
        await new Promise((resolve) => {
          const onLanguageChanged = () => {
            i18n.off('languageChanged', onLanguageChanged);
            resolve(undefined);
          };
          i18n.on('languageChanged', onLanguageChanged);
          // Fallback timeout in case event doesn't fire
          setTimeout(() => {
            i18n.off('languageChanged', onLanguageChanged);
            resolve(undefined);
          }, 500);
        });

        setPendingLanguageChange({ from: currentLanguage, to: newLanguage });
        toggleDialog('languageChange', true);
      } finally {
        setLanguageLoading(false);
      }
    },
    [i18n, setLocale, toggleDialog]
  );

  const handleBoardRebuildDecision = useCallback(
    async (shouldRebuildBoard: boolean): Promise<void> => {
      // Language has already been changed, handle board rebuild properly
      if (shouldRebuildBoard && actionsList) {
        try {
          // Use the complete settings submission flow to rebuild board and generate message
          await submitSettings({ ...gameSettings, boardUpdated: true }, actionsList);
        } catch (error) {
          console.error('Error rebuilding board:', error);
          // Fallback to simple board update
          updateSettings({ boardUpdated: true });
        }
      }
      setPendingLanguageChange(null);
    },
    [submitSettings, gameSettings, actionsList, updateSettings]
  );

  const handleRebuildBoard = useCallback(async (): Promise<void> => {
    await handleBoardRebuildDecision(true);
  }, [handleBoardRebuildDecision]);

  const handleKeepBoard = useCallback(async (): Promise<void> => {
    await handleBoardRebuildDecision(false);
  }, [handleBoardRebuildDecision]);

  const handleLanguageModalClose = useCallback((): void => {
    setPendingLanguageChange(null);
    toggleDialog('languageChange', false);
  }, [toggleDialog]);

  const languageMenuItems = useMemo(
    () =>
      Object.entries(languages).map(([key, obj]) => (
        <MenuItem value={key} key={key}>
          {obj.label}
        </MenuItem>
      )),
    []
  );

  const menuItems = useMemo<MenuItemType[]>(() => {
    const items: MenuItemType[] = [
      {
        key: 'gameBoard',
        title: <Trans i18nKey="gameBoards" />,
        icon: <AppRegistrationIcon />,
        onClick: () => toggleDialog('gameBoard', true),
      },
      {
        key: 'customTiles',
        title: <Trans i18nKey="customTilesLabel" />,
        icon: <ViewModuleIcon />,
        onClick: () => toggleDialog('customTiles', true),
      },
      {
        key: 'cast',
        title: <Trans i18nKey="tvMode" />,
        icon: <TvIcon />,
        onClick: () => openInNewTab(`/${room?.toUpperCase()}/cast`),
      },
      {
        key: 'schedule',
        title: <Trans i18nKey="schedule" />,
        icon: <CalendarMonthIcon />,
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
        title: <Trans i18nKey={gameSettings.advancedSettings ? 'settings' : 'setupWizard.title'} />,
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
        key: 'resetApp',
        title: <Trans i18nKey="resetApp" />,
        icon: <LogoutIcon />,
        onClick: () => handleWipeData(),
      });
    }
    return items;
  }, [
    user,
    room,
    isAnonymous,
    gameSettings.advancedSettings,
    discordIcon,
    handleWipeData,
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
    <Component
      open={open[dialogKey]}
      close={() => toggleDialog(dialogKey.toString(), false)}
      isMobile={isMobile}
      {...(props as any)}
    />
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
                <LanguageIcon sx={{ mr: 0.5, fontSize: '1rem' }} />
                <Trans i18nKey="language" />
              </InputLabel>
              <Select
                labelId="drawer-language-label"
                id="drawer-language-select"
                value={i18n.resolvedLanguage || 'en'}
                disabled={languageLoading}
                label={
                  <>
                    <LanguageIcon sx={{ fontSize: '1rem' }} />
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
        <DialogWrapper open={open.about} close={() => toggleDialog('about', false)}>
          <GameGuide />
        </DialogWrapper>
      )}
      {open.gameBoard && renderDialog(ManageGameBoards, 'gameBoard')}
      {open.schedule && renderDialog(Schedule, 'schedule')}
      {open.customTiles && renderDialog(CustomTileDialog, 'customTiles')}
      {open.linkAccount && renderDialog(AuthDialog, 'linkAccount')}
      {pendingLanguageChange && (
        <LanguageChangeModal
          open={open.languageChange}
          onClose={handleLanguageModalClose}
          onRebuildBoard={handleRebuildBoard}
          onKeepBoard={handleKeepBoard}
          fromLanguage={pendingLanguageChange.from}
          toLanguage={pendingLanguageChange.to}
        />
      )}
    </>
  );
}
