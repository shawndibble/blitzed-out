import { useState, FormEvent, ChangeEvent, KeyboardEvent } from 'react';
import { IconButton, InputAdornment, TextField } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import useAuth from '@/context/hooks/useAuth';
import { sendMessage } from '@/services/firebase';
import './styles.css';
import { Trans, useTranslation } from 'react-i18next';
import { Camera, CameraResultType, Photo as CameraPhoto } from '@capacitor/camera';
import ToastAlert from '@/components/ToastAlert';
import { Photo } from '@mui/icons-material';
import { logger } from '@/utils/logger';

interface MessageInputProps {
  room: string;
  isTransparent?: boolean;
}

const calculateFileSizeInMB = (base64String: string): number => {
  const stringLength = base64String.length - 'data:image/png;base64,'.length;

  const sizeInBytes = 4 * Math.ceil(stringLength / 3) * 0.5624896334383812;
  return sizeInBytes / 1000000;
};

export default function MessageInput({ room, isTransparent }: MessageInputProps): JSX.Element {
  const { user } = useAuth();
  const [value, setValue] = useState<string>('');
  const [alert, setAlert] = useState<string>('');
  const { t } = useTranslation();

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value);
  };

  const handleSubmit = (event: FormEvent) => {
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
    let image: CameraPhoto | '' = '';
    try {
      image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Base64,
      });
    } catch (error) {
      logger.warn('Failed to take photo:', false, error);
      return '';
    }

    // prevent any files larger than 5MB
    if (image.base64String && calculateFileSizeInMB(image.base64String) > 5) {
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
        className={`message-input-container ${isTransparent ? 'transparent' : ''}`}
      >
        <TextField
          multiline
          placeholder={t('messageInput')}
          fullWidth
          value={value}
          onChange={handleChange}
          onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e as unknown as FormEvent);
            }
          }}
          required
          inputProps={{ minLength: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <IconButton type="button" color="primary" onClick={attachFile}>
                  <Photo />
                </IconButton>
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton type="submit" color="primary" disabled={value.length < 1}>
                  <SendIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
          helperText={<Trans i18nKey="markdown" />}
        />
      </form>
      <ToastAlert open={!!alert} close={() => setAlert('')}>
        {alert}
      </ToastAlert>
    </>
  );
}
