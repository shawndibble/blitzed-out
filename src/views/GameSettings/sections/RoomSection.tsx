import { generateRoomCode } from '@/helpers/roomCode';
import {
  Box,
  Button,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { FocusEvent, JSX, KeyboardEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SettingGroup, SettingRow } from '../components/SettingRow';
import LocalPlayersRows from './LocalPlayersRows';
import { isPublicRoom } from '@/helpers/strings';
import { Settings } from '@/types/Settings';

interface RoomSectionProps {
  formData: Settings;
  setFormData: (data: Settings) => void;
}

/**
 * Room settings, rendered per play style — consequences only.
 *
 * Room *type* is no longer decided here: "Who else is playing?" in the setup
 * section decides it, and this section used to carry a second Public/Private
 * switch for the same choice. What remains is what follows from that answer —
 * the code to share, the roster, and how the player list refreshes.
 */
export default function RoomSection({ formData, setFormData }: RoomSectionProps): JSX.Element {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const isPublic = isPublicRoom(formData.room);
  const gameMode = formData.gameMode;

  const setRoom = (room: string): void => {
    setFormData({ ...formData, room: room.toUpperCase(), boardUpdated: true });
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
      {/* Same card whether the private room is yours alone or shared with
          friends — only the caption differs, because only the reason differs. */}
      {!isPublic && gameMode !== 'local' && (
        <SettingGroup>
          <SettingRow
            label={t('privateRoom')}
            description={t(gameMode === 'online' ? 'alwaysPrivateRoomHint' : 'privateRoomSoloHint')}
          >
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

      {/* PUBLIC forces real-time presence regardless of this setting
          (`usePresence`: removeOnDisconnect = roomRealtime || isPublicRoom), so
          the toggle would do nothing there. online+PUBLIC is invalid but
          reachable via a join link before the invariant repair runs. */}
      {gameMode === 'online' && !isPublic && (
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
