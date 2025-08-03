import { Box, Card, CardContent, Typography } from '@mui/material';
import {
  MeetingRoom as MeetingRoomIcon,
  People as PeopleIcon,
  Tune as TuneIcon,
  Wallpaper as WallpaperIcon,
} from '@mui/icons-material';
import BackgroundSelect from '@/components/BackgroundSelect';
import { useTranslation } from 'react-i18next';
import GameSpeed from './GameSpeed';
import PlayerListOption from './PlayerListOption';
import RoomSwitch from '@/components/GameForm/RoomSwitch';
import LocalPlayerSettings from '../LocalPlayerSettings';
import { isPublicRoom } from '@/helpers/strings';
import { Settings } from '@/types/Settings';
import { JSX } from 'react';

interface RoomSettingsProps {
  formData: Settings;
  setFormData: (data: Settings) => void;
}

export default function RoomSettings({ formData, setFormData }: RoomSettingsProps): JSX.Element {
  const { t } = useTranslation();

  const backgrounds: Record<string, string> = {
    useAppBackground: t('useAppBackground'),
    color: t('color'),
    gray: t('gray'),
    'metronome.gif': t('hypnoDick'),
    'pink-spiral.gif': t('pinkSpiral'),
    custom: t('customURL'),
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Room Type Section */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <MeetingRoomIcon sx={{ color: 'primary.main' }} />
            <Typography variant="h6" component="h3">
              {t('roomType')}
            </Typography>
          </Box>
          <RoomSwitch formData={formData} setFormData={setFormData} />
        </CardContent>
      </Card>

      {!isPublicRoom(formData.room) && (
        <>
          {/* Local Players Section */}
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <PeopleIcon sx={{ color: 'primary.main' }} />
                <Typography variant="h6" component="h3">
                  {t('localPlayerSettings.title')}
                </Typography>
              </Box>
              <LocalPlayerSettings
                roomId={formData.room}
                isPrivateRoom={!isPublicRoom(formData.room)}
              />
            </CardContent>
          </Card>

          {/* Game Configuration Section */}
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <TuneIcon sx={{ color: 'primary.main' }} />
                <Typography variant="h6" component="h3">
                  {t('gameConfiguration')}
                </Typography>
              </Box>

              {/* Game Speed Subsection */}
              <Box sx={{ mb: 3 }}>
                <GameSpeed formData={formData} setFormData={setFormData} />
              </Box>

              {/* Player List Options Subsection */}
              <Box sx={{ p: 2, borderRadius: 1, bgcolor: 'action.hover' }}>
                <PlayerListOption formData={formData} setFormData={setFormData} />
              </Box>
            </CardContent>
          </Card>

          {/* Visual Settings Section */}
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <WallpaperIcon sx={{ color: 'primary.main' }} />
                <Typography variant="h6" component="h3">
                  {t('visualSettings')}
                </Typography>
              </Box>
              <BackgroundSelect
                formData={formData}
                setFormData={setFormData}
                backgrounds={backgrounds}
                isRoom={true}
              />
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
}
