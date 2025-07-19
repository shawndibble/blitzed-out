import { lazy, Suspense, forwardRef, useState } from 'react';
import { CalendarMonth } from '@mui/icons-material';
import {
  AppBar,
  Badge,
  Box,
  IconButton,
  Portal,
  Toolbar,
  Tooltip,
  Typography,
  CircularProgress,
} from '@mui/material';
import useSchedule from '@/context/hooks/useSchedule';
import useBreakpoint from '@/hooks/useBreakpoint';
import Logo from '@/images/blitzed-out.png';
import { Trans, useTranslation } from 'react-i18next';
import CastButton from '@/components/CastButton';
import './styles.css';
import { isPublicRoom } from '@/helpers/strings';

// Lazy load heavy components
const Schedule = lazy(() => import('@/views/Schedule'));
const MenuDrawer = lazy(() => import('./MenuDrawer'));
const PlayersOnline = lazy(() => import('./PlayersOnline'));

function ComponentLoader() {
  return <CircularProgress size={16} />;
}

interface Player {
  uid: string;
  displayName: string;
  location?: number;
  isSelf?: boolean;
}

interface NavigationProps {
  room?: string;
  playerList?: Player[];
}

export default function Navigation({ room, playerList = [] }: NavigationProps): JSX.Element {
  const { t } = useTranslation();
  const [openSchedule, setOpenSchedule] = useState<boolean>(false);
  const [seen, setSeen] = useState<boolean>(false);
  const { schedule } = useSchedule();
  const isMobile = useBreakpoint();

  const handleScheduleClick = (): void => {
    setOpenSchedule(true);
    setSeen(true);
  };

  const playersOnlineTooltip = (
    <>
      <Typography variant="h6">
        <Trans i18nKey="online" />
      </Typography>
      <ul>
        {playerList.map((player) => (
          <li key={player.uid}>
            <Typography variant="body1">{player.displayName}</Typography>
          </li>
        ))}
      </ul>
    </>
  );

  return (
    <AppBar position="fixed">
      <Toolbar disableGutters variant="dense" component="nav" className="nav">
        <div className="site-name">
          <Box component="img" sx={{ height: 32 }} alt="Blitzed Out Logo" src={Logo} />
          <h1>Blitzed Out</h1>
        </div>
        <div>
          <div className="nav-room-name">
            <h2>{isPublicRoom(room) || room === undefined ? t('public') : room}</h2>
            <Tooltip title={playersOnlineTooltip}>
              <Suspense fallback={<ComponentLoader />}>
                <WrapPlayersOnline playerList={playerList} />
              </Suspense>
            </Tooltip>
            <IconButton onClick={handleScheduleClick} aria-label="schedule game" sx={{ ml: 2 }}>
              <Badge color="primary" badgeContent={!seen ? schedule.length : null}>
                <CalendarMonth />
              </Badge>
            </IconButton>
            {openSchedule && (
              <Portal>
                <Suspense fallback={<ComponentLoader />}>
                  <Schedule
                    open={openSchedule}
                    close={() => setOpenSchedule(false)}
                    isMobile={isMobile}
                  />
                </Suspense>
              </Portal>
            )}
          </div>
        </div>

        <div className="menu-drawer">
          <CastButton />
          <Suspense fallback={<ComponentLoader />}>
            <MenuDrawer />
          </Suspense>
        </div>
      </Toolbar>
    </AppBar>
  );
}

interface WrapPlayersOnlineProps {
  playerList: Player[];
  [key: string]: any;
}

const WrapPlayersOnline = forwardRef<HTMLDivElement, WrapPlayersOnlineProps>(
  ({ playerList, ...rest }, ref) => (
    <PlayersOnline playerList={playerList} {...rest} innerRef={ref} />
  )
);

WrapPlayersOnline.displayName = 'WrapPlayersOnline';
