import React, { useState } from 'react';
import SettingsIcon from '@mui/icons-material/Settings';
import CloseIcon from '@mui/icons-material/Close';
import Logo from "../../images/blitzed-out.webp";
import { AppBar, Box, Dialog, DialogContent, DialogTitle, IconButton, Toolbar, Tooltip, Typography } from '@mui/material';
import GameSettings from '../GameSettings';
import './styles.css';
import useAuth from '../../hooks/useAuth';
import { forwardRef } from 'react';
import PlayersOnline from './PlayersOnline';

export default function Navigation({ room, playerList = [] }) {
    const { user } = useAuth();
    const [open, setOpen] = useState(false);

    const openSettings = () => setOpen(true);
    const closeSettings = () => setOpen(false);

    const playersOnlineTooltip = (
        <>
            <Typography variant="h6">Players Online</Typography>
            <ul>
                {playerList.map(player => (
                    <li key={player.uid}>
                        <Typography variant="body1">{player.displayName}</Typography>
                    </li>
                ))}
            </ul>
        </>
    )

    return (
        <>
            <AppBar position="fixed">
                <Toolbar disableGutters variant="dense" component="nav" className="nav">
                    <div className='site-name'>
                        <Box component="img" sx={{ height: 32 }} alt="Blitzed Out Logo" src={Logo} />
                        <h1>Blitzed Out</h1>
                    </div>
                    <div className="nav-room-name">
                        <h2>{room === 'public' || room === undefined ? 'Public Room' : `Room: ${room}`}</h2>
                        <Tooltip title={playersOnlineTooltip}>
                            <WrappedPlayersOnline playerList={playerList} />
                        </Tooltip>
                    </div>
                    <div>
                    {!!user && (
                        <Tooltip title="Game Settings">
                            <IconButton onClick={ openSettings }><SettingsIcon /></IconButton>
                        </Tooltip>
                    )}
                    </div>
                </Toolbar>
            </AppBar>
            <Dialog open={open} onClose={closeSettings}>
                <DialogTitle>
                    Game Settings
                    {!!closeSettings && (
                        <IconButton
                        aria-label="close"
                        onClick={closeSettings}
                        sx={{
                            position: 'absolute',
                            right: 8,
                            top: 8,
                            color: (theme) => theme.palette.grey[500],
                        }}
                        >
                            <CloseIcon />
                        </IconButton>
                    )}
                </DialogTitle>
                <DialogContent><GameSettings submitText="Update Game" closeDialog={closeSettings} /></DialogContent>
            </Dialog>
        </>
    );
}

const WrappedPlayersOnline = forwardRef((props, ref) => <PlayersOnline {...props} innerRef={ref} />);
