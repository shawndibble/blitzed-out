import {
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import RefreshIcon from '@mui/icons-material/Refresh';
import { customAlphabet } from 'nanoid';
import { ChangeEvent, FocusEvent, JSX, KeyboardEvent, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import LocalPlayerSettings from '../LocalPlayerSettings';
import PlayerListOption from '../RoomSettings/PlayerListOption';
import RoomBackgroundInput from '@/components/RoomBackgroundInput';
import { isPublicRoom } from '@/helpers/strings';
import { Settings } from '@/types/Settings';

const generateRoomCode = customAlphabet('123456789ABCDEFGHJKLMNPQRSTUVWXYZ', 5);

interface RoomSectionProps {
  formData: Settings;
  setFormData: (data: Settings) => void;
}

/**
 * Room settings, rendered per play style. Room type is only a real choice in
 * Solo; With Others always plays in a private room (the code card is the
 * control), and Shared Device's room is an implementation detail with no UI.
 */
export default function RoomSection({ formData, setFormData }: RoomSectionProps): JSX.Element {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const isPublic = isPublicRoom(formData.room);
  const gameMode = formData.gameMode;

  const setRoom = (room: string): void => {
    setFormData({ ...formData, room: room.toUpperCase(), boardUpdated: true });
  };

  const togglePublicPrivate = (event: ChangeEvent<HTMLInputElement>): void => {
    setRoom(event.target.checked ? generateRoomCode() : 'PUBLIC');
  };

  const commitRoomFromInput = (value: string): void => {
    if (value.trim()) setRoom(value.trim());
  };

  const copyRoomCode = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(formData.room);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (permissions/insecure context); the code stays visible to copy manually.
    }
  };

  const roomCodeField = (
    <TextField
      size="small"
      label={t('privateRoom')}
      defaultValue={isPublic ? '' : formData.room}
      key={formData.room}
      onBlur={(event: FocusEvent<HTMLInputElement>) => commitRoomFromInput(event.target.value)}
      onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          commitRoomFromInput((event.target as HTMLInputElement).value);
        }
      }}
      onChange={(event: ChangeEvent<HTMLInputElement>) => {
        event.target.value = event.target.value.toUpperCase();
      }}
      slotProps={{ htmlInput: { style: { textTransform: 'uppercase' }, maxLength: 12 } }}
    />
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {gameMode === 'solo' && (
        <Card variant="outlined">
          <CardContent>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
              <Typography sx={{ fontWeight: 600 }}>{t('roomType')}</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', flex: 1, minWidth: 180 }}>
                {t('roomTypeSoloHint')}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Typography
                  variant="body2"
                  sx={{ color: isPublic ? 'text.primary' : 'text.secondary' }}
                >
                  <Trans i18nKey="public" />
                </Typography>
                <Switch
                  checked={!isPublic}
                  onChange={togglePublicPrivate}
                  slotProps={{ input: { 'aria-label': t('roomType') } }}
                />
                <Typography
                  variant="body2"
                  sx={{ color: isPublic ? 'text.secondary' : 'text.primary' }}
                >
                  <Trans i18nKey="private" />
                </Typography>
              </Stack>
            </Stack>
            {!isPublic && <Box sx={{ mt: 2 }}>{roomCodeField}</Box>}
          </CardContent>
        </Card>
      )}

      {gameMode === 'online' && (
        <Card variant="outlined">
          <CardContent>
            <Typography sx={{ fontWeight: 600, mb: 0.5 }}>{t('privateRoom')}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
              {t('alwaysPrivateRoomHint')}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
              {roomCodeField}
              <Tooltip title={copied ? t('roomCodeCopied') : t('copyRoomCode')}>
                <IconButton onClick={copyRoomCode} aria-label={t('copyRoomCode')}>
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Button
                size="small"
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={() => setRoom(generateRoomCode())}
              >
                {t('newRoomCode')}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}

      {gameMode === 'local' && (
        <>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('sharedDeviceRoomHint')}
          </Typography>
          <Card variant="outlined">
            <CardContent>
              <Typography sx={{ fontWeight: 600, mb: 1 }}>
                {t('localPlayerSettings.title')}
              </Typography>
              <LocalPlayerSettings roomId={formData.room} isPrivateRoom={!isPublic} />
            </CardContent>
          </Card>
        </>
      )}

      {gameMode === 'online' && (
        <Card variant="outlined">
          <CardContent>
            <PlayerListOption formData={formData} setFormData={setFormData} />
          </CardContent>
        </Card>
      )}

      {gameMode !== 'local' && isPublic ? (
        <Box sx={{ opacity: 0.5 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
            {t('roomBackgroundLocked')}
          </Typography>
        </Box>
      ) : (
        <Card variant="outlined">
          <CardContent>
            <Typography sx={{ fontWeight: 600, mb: 1 }}>{t('visualSettings')}</Typography>
            <RoomBackgroundInput formData={formData} setFormData={setFormData} />
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
