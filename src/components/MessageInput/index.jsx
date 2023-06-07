import React from 'react';
import { IconButton, InputAdornment, TextField } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import useAuth from '../../hooks/useAuth';
import { sendMessage } from '../../services/firebase';
import './styles.css';

export default function MessageInput({ roomId }) {
  const { user } = useAuth();
  const [value, setValue] = React.useState('');

  const handleChange = (event) => {
    setValue(event.target.value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage(roomId, user, value, 'chat');
    setValue('');
  };

  return (
    <form onSubmit={handleSubmit} className="message-input-container">
      <TextField
        placeholder="Enter a message"
        fullWidth
        value={value}
        onChange={handleChange}
        required
        minLength={1}
        InputProps={{
          endAdornment:
  <InputAdornment position="end">
    <IconButton type="submit" color="primary" disabled={value < 1}>
      <SendIcon />
    </IconButton>
  </InputAdornment>,
        }}
      />

    </form>
  );
}
