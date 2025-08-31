import { useState, useRef } from 'react';
import { CalendarMonth } from '@mui/icons-material';
import { AppBar, Badge, Box, IconButton, Portal, Toolbar } from '@mui/material';
import useSchedule from '@/context/hooks/useSchedule';
import useBreakpoint from '@/hooks/useBreakpoint';
import Logo from '@/images/blitzed-out-optimized.png';
import { useTranslation } from 'react-i18next';
import CastButton from '@/components/CastButton';
import ThemeToggle from '@/components/ThemeToggle';
import './styles.css';
import { isPublicRoom } from '@/helpers/strings';
import { Player } from '@/types/player';
import Schedule from '@/views/Schedule';
import MenuDrawer from './MenuDrawer';
import UserPresenceOverlay from './UserPresenceOverlay';
import PlayersOnline from './PlayersOnline';

interface PlayerWithLocation extends Player {
  location?: number;
}

interface NavigationProps {
  room?: string;
  playerList?: PlayerWithLocation[];
}

export default function Navigation({ room, playerList = [] }: NavigationProps): JSX.Element {
  const { t } = useTranslation();
  const [openSchedule, setOpenSchedule] = useState<boolean>(false);
  const [openUserPresence, setOpenUserPresence] = useState<boolean>(false);
  const [seen, setSeen] = useState<boolean>(false);
  const { schedule } = useSchedule();
  const isMobile = useBreakpoint();
  const playersOnlineRef = useRef<HTMLButtonElement>(null);

  const handleScheduleClick = (): void => {
    setOpenSchedule(true);
    setSeen(true);
  };

  const handleUserPresenceClick = (): void => {
    setOpenUserPresence(!openUserPresence);
  };

  const handleUserPresenceClose = (): void => {
    setOpenUserPresence(false);
  };

  return (
    <AppBar position="fixed">
      <Toolbar disableGutters variant="dense" component="nav" className="nav">
        <div className="site-name">
          <Box component="img" sx={{ height: 32 }} alt="Blitzed Out Logo" src={Logo} />
          <h1 className="gradient-text">Blitzed Out</h1>
        </div>
        <div>
          <div className="nav-room-name">
            <h2>{isPublicRoom(room) || room === undefined ? t('public') : room}</h2>
            <PlayersOnline
              playerList={playerList}
              onClick={handleUserPresenceClick}
              ref={playersOnlineRef}
              aria-label={t('online')}
              aria-expanded={openUserPresence}
              aria-haspopup="dialog"
            />
            <IconButton onClick={handleScheduleClick} aria-label="schedule game" sx={{ ml: 2 }}>
              <Badge color="primary" badgeContent={!seen ? schedule.length : null}>
                <CalendarMonth />
              </Badge>
            </IconButton>
            {openSchedule && (
              <Portal>
                <Schedule
                  open={openSchedule}
                  close={() => setOpenSchedule(false)}
                  isMobile={isMobile}
                />
              </Portal>
            )}
            {playerList.length > 0 && (
              <UserPresenceOverlay
                isOpen={openUserPresence}
                onClose={handleUserPresenceClose}
                playerList={playerList}
                anchorEl={playersOnlineRef.current}
              />
            )}
          </div>
        </div>

        <div className="menu-drawer">
          <ThemeToggle size="medium" aria-label="Toggle between light and dark theme" />
          <CastButton />
          <MenuDrawer />
        </div>
      </Toolbar>
    </AppBar>
  );
}
