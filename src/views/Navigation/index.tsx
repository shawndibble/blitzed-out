import { Suspense, useState, useRef } from 'react';
import CalendarMonth from '@mui/icons-material/CalendarMonth';
import { AppBar, Badge, Box, IconButton, Portal, Toolbar } from '@mui/material';
import useSchedule from '@/context/hooks/useSchedule';
import useBreakpoint from '@/hooks/useBreakpoint';
import Logo from '@/images/blitzed-out-optimized.png';
import { useTranslation } from 'react-i18next';
import CastButton from '@/components/CastButton';
import './styles.css';
import { isPublicRoom } from '@/helpers/strings';
import { Player } from '@/types/player';
import lazyWithRetry from '@/utils/lazyWithRetry';
import MenuDrawer from './MenuDrawer';

const Schedule = lazyWithRetry(() => import('@/views/Schedule'));
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
  const [userPresenceAnchor, setUserPresenceAnchor] = useState<HTMLElement | null>(null);
  const [seen, setSeen] = useState<boolean>(false);
  const { schedule } = useSchedule();
  const isMobile = useBreakpoint();
  const playersOnlineRef = useRef<HTMLButtonElement>(null);

  const handleScheduleClick = (): void => {
    setOpenSchedule(true);
    setSeen(true);
  };

  const handleUserPresenceClick = (): void => {
    setUserPresenceAnchor(playersOnlineRef.current);
    setOpenUserPresence(!openUserPresence);
  };

  const handleUserPresenceClose = (): void => {
    setOpenUserPresence(false);
    setUserPresenceAnchor(null);
  };

  // Deleting the last game from inside the dialog empties the live snapshot, so
  // stay mounted while it is open or focus has nowhere to return to on close.
  const showScheduleButton = schedule.length > 0 || openSchedule;

  return (
    <AppBar position="fixed" sx={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <Toolbar disableGutters variant="dense" component="nav" className="nav">
        <div className="site-name">
          <Box
            component="img"
            sx={{ height: 32 }}
            alt={t('siteTagline')}
            src={Logo}
            decoding="async"
            loading="eager"
            fetchPriority="high"
          />
          <h1 className="site-title">Blitzed Out</h1>
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
            {showScheduleButton && (
              <IconButton onClick={handleScheduleClick} aria-label="schedule game" sx={{ ml: 2 }}>
                <Badge color="primary" badgeContent={!seen ? schedule.length : null}>
                  <CalendarMonth />
                </Badge>
              </IconButton>
            )}
            {openSchedule && (
              <Portal>
                <Suspense fallback={null}>
                  <Schedule
                    open={openSchedule}
                    close={() => setOpenSchedule(false)}
                    isMobile={isMobile}
                  />
                </Suspense>
              </Portal>
            )}
            {playerList.length > 0 && (
              <UserPresenceOverlay
                isOpen={openUserPresence}
                onClose={handleUserPresenceClose}
                playerList={playerList}
                anchorEl={userPresenceAnchor}
              />
            )}
          </div>
        </div>

        <div className="menu-drawer">
          <CastButton />
          <MenuDrawer />
        </div>
      </Toolbar>
    </AppBar>
  );
}
