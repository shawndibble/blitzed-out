import { forwardRef, useEffect, useState } from 'react';
import {
  AppBar,
  Badge,
  Box,
  IconButton,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import { Trans, useTranslation } from 'react-i18next';
import Logo from 'images/blitzed-out.png';
import './styles.css';
import { CalendarMonth } from '@mui/icons-material';
import { getSchedule } from 'services/firebase';
import PlayersOnline from './PlayersOnline';
import MenuDrawer from './MenuDrawer';

export default function Navigation({ room, playerList = [] }) {
  const { t } = useTranslation();
  const [events, setEvents] = useState(null);
  const [openSchedule, setOpenSchedule] = useState(false);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    getSchedule(setEvents);
  }, []);

  const handleScheduleClick = () => {
    setOpenSchedule(true);
    setSeen(true);
  };

  const playersOnlineTooltip = (
    <>
      <Typography variant='h6'>
        <Trans i18nKey='online' />
      </Typography>
      <ul>
        {playerList.map((player) => (
          <li key={player.uid}>
            <Typography variant='body1'>{player.displayName}</Typography>
          </li>
        ))}
      </ul>
    </>
  );

  return (
    <AppBar position='fixed'>
      <Toolbar disableGutters variant='dense' component='nav' className='nav'>
        <div className='site-name'>
          <Box
            component='img'
            sx={{ height: 32 }}
            alt='Blitzed Out Logo'
            src={Logo}
          />
          <h1>Blitzed Out</h1>
        </div>
        <div>
          <div className='nav-room-name'>
            <h2>
              {room === 'public' || room === undefined
                ? t('public')
                : t('roomTitle', { room })}
            </h2>
            <Tooltip title={playersOnlineTooltip}>
              <WrapPlayersOnline playerList={playerList} />
            </Tooltip>
            {!!events && (
              <IconButton
                onClick={handleScheduleClick}
                aria-label='schedule game'
                sx={{ ml: 2 }}
              >
                <Badge
                  color='primary'
                  badgeContent={!seen ? events.length : null}
                >
                  <CalendarMonth />
                </Badge>
              </IconButton>
            )}
          </div>
        </div>

        <div className='menu-drawer'>
          <MenuDrawer
            openSchedule={openSchedule}
            setCloseSchedule={setOpenSchedule}
          />
        </div>
      </Toolbar>
    </AppBar>
  );
}

const WrapPlayersOnline = forwardRef((props, ref) => (
  <PlayersOnline {...props} innerRef={ref} />
));
