import { Avatar } from '@mui/material';
import {
  Male as MaleIcon,
  Female as FemaleIcon,
  Transgender as TransgenderIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import type { PlayerGender } from '@/types/localPlayers';

interface PlayerGenderAvatarProps {
  /** The player's anatomy */
  gender?: PlayerGender;
  /** Whether this player is currently active */
  isActive?: boolean;
  /** Avatar size in pixels (default: 32) */
  size?: number;
}

/**
 * PlayerGenderAvatar displays an anatomy-specific icon in an Avatar
 * Used for showing player anatomy in local multiplayer mode
 */
export default function PlayerGenderAvatar({
  gender,
  isActive = false,
  size = 32,
}: PlayerGenderAvatarProps): JSX.Element {
  const getGenderIcon = (gender?: PlayerGender): JSX.Element => {
    switch (gender) {
      case 'male':
        return <MaleIcon fontSize="small" />;
      case 'female':
        return <FemaleIcon fontSize="small" />;
      case 'non-binary':
        return <TransgenderIcon fontSize="small" />;
      default:
        return <PersonIcon fontSize="small" />;
    }
  };

  return (
    <Avatar
      sx={{
        bgcolor: isActive ? 'primary.main' : 'grey.500',
        width: size,
        height: size,
      }}
    >
      {getGenderIcon(gender)}
    </Avatar>
  );
}
