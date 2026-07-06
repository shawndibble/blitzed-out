import {
  Box,
  Button,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { customAlphabet } from 'nanoid';
import { ChangeEvent, FocusEvent, JSX, KeyboardEvent, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { SettingGroup, SettingRow } from '../components/SettingRow';
import LocalPlayersRows from './LocalPlayersRows';
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
      slotProps={{
        htmlInput: {
          style: { textTransform: 'uppercase', fontFamily: 'monospace', letterSpacing: '0.1em' },
          maxLength: 12,
          'aria-label': t('privateRoom'),
        },
      }}
      sx={{ width: 120 }}
    />
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {gameMode === 'solo' && (
        <SettingGroup>
          <SettingRow label={t('roomType')} description={t('roomTypeSoloHint')}>
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
          </SettingRow>
          {!isPublic && <SettingRow label={t('privateRoom')}>{roomCodeField}</SettingRow>}
        </SettingGroup>
      )}

      {gameMode === 'online' && (
        <SettingGroup>
          <SettingRow label={t('privateRoom')} description={t('alwaysPrivateRoomHint')}>
            {roomCodeField}
            <Tooltip describeChild title={copied ? t('roomCodeCopied') : t('copyRoomCode')}>
              <Button size="small" variant="outlined" onClick={copyRoomCode}>
                {t('copy')}
              </Button>
            </Tooltip>
            <Button
              size="small"
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => setRoom(generateRoomCode())}
            >
              {t('newRoomCode')}
            </Button>
          </SettingRow>
        </SettingGroup>
      )}

      {gameMode === 'local' && (
        <>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('sharedDeviceRoomHint')}
          </Typography>
          <LocalPlayersRows roomId={formData.room} />
        </>
      )}

      {gameMode === 'online' && (
        <SettingGroup>
          <SettingRow label={t('playerListUpdates')} description={t('playerListUpdatesCaption')}>
            <ToggleButtonGroup
              size="small"
              exclusive
              value={formData.roomRealtime === false ? 'delayed' : 'realtime'}
              onChange={(_, value: string | null) => {
                if (!value) return;
                setFormData({
                  ...formData,
                  roomRealtime: value === 'realtime',
                  roomUpdated: true,
                });
              }}
              aria-label={t('playerListUpdates')}
            >
              <ToggleButton value="realtime">{t('realtime')}</ToggleButton>
              <ToggleButton value="delayed">{t('delayed')}</ToggleButton>
            </ToggleButtonGroup>
          </SettingRow>
        </SettingGroup>
      )}
    </Box>
  );
}
