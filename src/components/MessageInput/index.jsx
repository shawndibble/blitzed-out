import { useState } from 'react';
import { IconButton, InputAdornment, TextField } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import useAuth from 'hooks/useAuth';
import { sendMessage } from 'services/firebase';
import './styles.css';
import { Trans, useTranslation } from 'react-i18next';
import { Camera, CameraResultType } from '@capacitor/camera';
import ToastAlert from 'components/ToastAlert';
import { Photo } from '@mui/icons-material';

const calculateFileSizeInMB = (base64String) => {
  const stringLength = base64String.length - 'data:image/png;base64,'.length;

  const sizeInBytes = 4 * Math.ceil(stringLength / 3) * 0.5624896334383812;
  return sizeInBytes / 1000000;
};

export default function MessageInput({ room, isTransparent }) {
  const { user } = useAuth();
  const [value, setValue] = useState('');
  const [alert, setAlert] = useState('');
  const { t } = useTranslation();

  const handleChange = (event) => {
    setValue(event.target.value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage({
      room,
      user,
      text: value,
      type: 'chat',
    });
    setValue('');
  };

  const attachFile = async () => {
    let image = '';
    try {
      image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Base64,
      });
    } catch (error) {
      return '';
    }

    // prevent any files larger than 5MB
    if (calculateFileSizeInMB(image.base64String) > 5) {
      return setAlert(
        'File too large! Max size is 5MB. If you need to send a larger file, please use a link from another site.'
      );
    }

    return sendMessage({
      room,
      user,
      type: 'media',
      image,
    });
  };

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className={`message-input-container ${isTransparent && 'transparent'}`}
      >
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
            startAdornment: (
              <InputAdornment position='start'>
                <IconButton type='button' color='primary' onClick={attachFile}>
                  <Photo />
                </IconButton>
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position='end'>
                <IconButton type='submit' color='primary' disabled={value < 1}>
                  <SendIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
          helperText={<Trans i18nKey='markdown' />}
        />
      </form>
      <ToastAlert
        open={!!alert}
        setOpen={setAlert}
        close={() => setAlert(null)}
      >
        {alert}
      </ToastAlert>
    </>
  );
}
