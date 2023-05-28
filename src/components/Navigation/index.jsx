import { useState } from 'react';
import SettingsIcon from '@mui/icons-material/Settings';
import { Dialog, DialogContent, DialogTitle, IconButton, Tooltip } from '@mui/material';
import GameSettings from '../GameSettings';
import './styles.css';
import useAuth from '../../hooks/useAuth';

export default function Navigation({ room }) {
    const { user } = useAuth();

    const [open, setOpen] = useState(false);

    const openSettings = () => setOpen(true);

    const closeSettings = () => setOpen(false);

    return (
        <>
            <div className="nav">
                <h1>Blitz Out</h1>
                <h2>{room === 'public' || room === undefined ? 'Public Room' : `Room code: ${room}`}</h2>
                <div>
                {!!user && (
                    <Tooltip title="Game Settings">
                        <IconButton onClick={ openSettings }><SettingsIcon /></IconButton>
                    </Tooltip>
                )}
                </div>
            </div>
            <Dialog open={open} onClose={closeSettings}>
                <DialogTitle>Customize Game Settings</DialogTitle>
                <DialogContent><GameSettings submitText="Update Game" closeDialog={closeSettings} /></DialogContent>
            </Dialog>
        </>
    );
}