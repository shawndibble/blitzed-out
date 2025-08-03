import { Avatar, Badge, Box } from '@mui/material';
import { Person as PersonIcon, Star as StarIcon } from '@mui/icons-material';
import type { LocalPlayer } from '@/types';
import type { PlayerRole } from '@/types/Settings';

interface PlayerAvatarProps {
  /** Player data to display */
  player: LocalPlayer;
  /** Avatar size */
  size?: 'small' | 'medium' | 'large';
  /** Whether this player is currently active */
  isActive?: boolean;
  /** Whether to show role indicator badge */
  showRoleBadge?: boolean;
  /** Whether to show online status */
  showOnlineStatus?: boolean;
  /** Custom onClick handler */
  onClick?: () => void;
}

/**
 * PlayerAvatar component displays customizable player avatars
 * Supports different sizes, badges, and interactive states
 */
export default function PlayerAvatar({
  player,
  size = 'medium',
  isActive = false,
  showRoleBadge = false,
  showOnlineStatus = true,
  onClick,
}: PlayerAvatarProps): JSX.Element {
  // Helper function to get player initials
  const getPlayerInitials = (name: string): string => {
    return (
      name
        .split(' ')
        .map((word) => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'P'
    );
  };

  // Helper function to get role color
  const getRoleColor = (role: PlayerRole): string => {
    switch (role) {
      case 'dom':
        return '#1976d2'; // primary.main
      case 'sub':
        return '#9c27b0'; // secondary.main
      case 'vers':
        return '#666666'; // grey
      default:
        return '#666666';
    }
  };

  // Size configurations
  const sizeConfig = {
    small: { avatar: 32, badge: 12, fontSize: '0.875rem' },
    medium: { avatar: 48, badge: 16, fontSize: '1.2rem' },
    large: { avatar: 64, badge: 20, fontSize: '1.5rem' },
  };

  const config = sizeConfig[size];

  // Base avatar component
  const avatarComponent = (
    <Avatar
      sx={{
        bgcolor: isActive ? 'primary.main' : 'grey.500',
        width: config.avatar,
        height: config.avatar,
        fontSize: config.fontSize,
        fontWeight: 'bold',
        border: isActive ? '2px solid' : '1px solid',
        borderColor: isActive ? 'primary.dark' : 'divider',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease-in-out',
        '&:hover': onClick
          ? {
              transform: 'scale(1.05)',
              borderColor: 'primary.main',
            }
          : {},
      }}
      onClick={onClick}
    >
      {getPlayerInitials(player.name)}
    </Avatar>
  );

  // Wrap with badges if needed
  let wrappedAvatar = avatarComponent;

  // Add online status badge
  if (showOnlineStatus) {
    wrappedAvatar = (
      <Badge
        overlap="circular"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        badgeContent={
          <Box
            sx={{
              width: config.badge,
              height: config.badge,
              borderRadius: '50%',
              bgcolor: player.deviceId === 'current_device' ? 'success.main' : 'warning.main',
              border: '2px solid',
              borderColor: 'background.paper',
            }}
          />
        }
      >
        {wrappedAvatar}
      </Badge>
    );
  }

  // Add role badge
  if (showRoleBadge) {
    wrappedAvatar = (
      <Badge
        overlap="circular"
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        badgeContent={
          <Box
            sx={{
              width: config.badge,
              height: config.badge,
              borderRadius: '50%',
              bgcolor: getRoleColor(player.role),
              border: '2px solid',
              borderColor: 'background.paper',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {player.role === 'dom' && (
              <StarIcon sx={{ fontSize: config.badge * 0.6, color: 'white' }} />
            )}
            {player.role === 'sub' && (
              <PersonIcon sx={{ fontSize: config.badge * 0.6, color: 'white' }} />
            )}
            {player.role === 'vers' && (
              <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: 'white' }} />
            )}
          </Box>
        }
      >
        {wrappedAvatar}
      </Badge>
    );
  }

  // Add active player indicator
  if (isActive && !showRoleBadge) {
    wrappedAvatar = (
      <Badge
        overlap="circular"
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        badgeContent={
          <Box
            sx={{
              width: config.badge,
              height: config.badge,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              border: '2px solid',
              borderColor: 'background.paper',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'pulse 2s infinite',
              '@keyframes pulse': {
                '0%': { opacity: 1 },
                '50%': { opacity: 0.7 },
                '100%': { opacity: 1 },
              },
            }}
          >
            <StarIcon sx={{ fontSize: config.badge * 0.6, color: 'white' }} />
          </Box>
        }
      >
        {wrappedAvatar}
      </Badge>
    );
  }

  return wrappedAvatar;
}
