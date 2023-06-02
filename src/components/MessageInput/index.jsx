import React from 'react';
import useAuth from '../../hooks/useAuth';
import { sendMessage } from '../../services/firebase';
import './styles.css';
import { IconButton, InputAdornment, TextField } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

export default function MessageInput({ roomId }) {
    const { user } = useAuth();
    const [value, setValue] = React.useState('');

    const handleChange = (event) => {
        setValue(event.target.value);
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        sendMessage(roomId, user, value);
        setValue('');
    };

    return (
        <form onSubmit={handleSubmit} className="message-input-container">
            <TextField
                placeholder="Enter a message"
                fullWidth
                value={value}
                onChange={handleChange}
                multiline
                required
                minLength={1}
                InputProps={{
                    endAdornment: <InputAdornment position="end">
                        <IconButton type="submit" color="primary" disabled={value < 1}>
                            <SendIcon />
                        </IconButton>
                    </InputAdornment>
                }}
            />
            
        </form>
    );
}