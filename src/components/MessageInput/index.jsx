import React from 'react';
import { Link } from 'react-router-dom';
import { IconButton, InputAdornment, TextField } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import useAuth from 'hooks/useAuth';
import { sendMessage } from 'services/firebase';
import './styles.css';

export default function MessageInput({ room }) {
  const { user } = useAuth();
  const [value, setValue] = React.useState('');

  const handleChange = (event) => {
    setValue(event.target.value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage({
      room, user, text: value, type: 'chat',
    });
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
        helperText={(
          <Link
            to="https://www.markdownguide.org/cheat-sheet/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Markdown cheatsheet (white page)
          </Link>
        )}
      />

    </form>
  );
}
