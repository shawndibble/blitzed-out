import { useState } from 'react';
import SettingsIcon from '@mui/icons-material/Settings';
import { Dialog, DialogTitle, IconButton, Tooltip } from '@mui/material';
import GameSettings from '../GameSettings';
import './styles.css';

export default function Navigation({ room }) {
    const [open, setOpen] = useState(false);

    const openSettings = () => setOpen(true);

    const closeSettings = () => setOpen(false);

    return (
        <>
            <div class="nav">
                <h1>Blitz Out</h1>
                <h2>{room === 'public' ? 'Public Room' : `Room code: ${room}`}</h2>
                <div>
                    <Tooltip title="Game Settings">
                        <IconButton onClick={ openSettings }><SettingsIcon /></IconButton>
                    </Tooltip>
                </div>
            </div>
            <Dialog open={open} onClose={closeSettings}>
                <DialogTitle>Customize Game Settings</DialogTitle>
                <GameSettings />
            </Dialog>
        </>
    );
}