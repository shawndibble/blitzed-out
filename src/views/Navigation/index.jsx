import { forwardRef } from 'react';
import {
  AppBar, Box, Toolbar, Tooltip, Typography,
} from '@mui/material';
import { Trans, useTranslation } from 'react-i18next';
import Logo from 'images/blitzed-out.webp';
import './styles.css';
import PlayersOnline from './PlayersOnline';
import MenuDrawer from './MenuDrawer';

export default function Navigation({ room, playerList = [] }) {
  const { t } = useTranslation();

  const playersOnlineTooltip = (
    <>
      <Typography variant="h6"><Trans i18nKey="online" /></Typography>
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
            <h2>{room === 'public' || room === undefined ? t('public') : t('roomTitle', { room })}</h2>
            <Tooltip title={playersOnlineTooltip}>
              <WrapPlayersOnline playerList={playerList} />
            </Tooltip>
          </div>
        </div>

        <div className="menu-drawer">
          <MenuDrawer />
        </div>
      </Toolbar>
    </AppBar>
  );
}

const WrapPlayersOnline = forwardRef((props, ref) => <PlayersOnline {...props} innerRef={ref} />);
