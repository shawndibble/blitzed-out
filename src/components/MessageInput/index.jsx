import React from 'react';
import { Link } from 'react-router-dom';
import { IconButton, InputAdornment, TextField } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import useAuth from 'hooks/useAuth';
import { sendMessage } from 'services/firebase';
import './styles.css';
import { Trans, useTranslation } from 'react-i18next';

export default function MessageInput({ room, isTransparent }) {
  const { user } = useAuth();
  const [value, setValue] = React.useState('');
  const { t } = useTranslation();

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
    <form onSubmit={handleSubmit} className={`message-input-container ${isTransparent && 'transparent'}`}>
      <TextField
        multiline
        placeholder={t('messageInput')}
        fullWidth
        value={value}
        onChange={handleChange}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
          }
        }}
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
            <Trans i18nKey="markdown" />
          </Link>
        )}
      />

    </form>
  );
}
