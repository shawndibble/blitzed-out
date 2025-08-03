import React, { useState, useEffect, useMemo } from 'react';
import { Avatar, Box, Tooltip } from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import type { LocalPlayer } from '@/types';
import type { PlayerRole } from '@/types/Settings';

// Dynamic avatar animations
const glow = keyframes`
  0%, 100% {
    box-shadow: 0 0 5px currentColor;
  }
  50% {
    box-shadow: 0 0 20px currentColor, 0 0 30px currentColor;
  }
`;

const heartbeat = keyframes`
  0%, 100% {
    transform: scale(1);
  }
  14% {
    transform: scale(1.1);
  }
  28% {
    transform: scale(1);
  }
  42% {
    transform: scale(1.1);
  }
  70% {
    transform: scale(1);
  }
`;

const wobble = keyframes`
  0%, 100% {
    transform: rotate(0deg);
  }
  15% {
    transform: rotate(-5deg);
  }
  30% {
    transform: rotate(5deg);
  }
  45% {
    transform: rotate(-3deg);
  }
  60% {
    transform: rotate(3deg);
  }
  75% {
    transform: rotate(-1deg);
  }
`;

// Styled avatar with personality
const PersonalityAvatarStyled = styled(Avatar)<{
  role: PlayerRole;
  isActive: boolean;
  personality: string;
  respectReducedMotion: boolean;
}>(({ theme, role, isActive, personality, respectReducedMotion }) => {
  // Role-based colors
  const getRoleColors = () => {
    switch (role) {
      case 'dom':
        return {
          primary: theme.palette.error.main,
          secondary: theme.palette.error.dark,
          accent: theme.palette.error.light,
        };
      case 'sub':
        return {
          primary: theme.palette.info.main,
          secondary: theme.palette.info.dark,
          accent: theme.palette.info.light,
        };
      case 'vers':
        return {
          primary: theme.palette.warning.main,
          secondary: theme.palette.warning.dark,
          accent: theme.palette.warning.light,
        };
      default:
        return {
          primary: theme.palette.primary.main,
          secondary: theme.palette.primary.dark,
          accent: theme.palette.primary.light,
        };
    }
  };

  // Personality-based animations
  const getPersonalityAnimation = () => {
    if (respectReducedMotion) return 'none';

    switch (personality) {
      case 'excited':
        return `${heartbeat} 1.5s ease-in-out infinite`;
      case 'playful':
        return `${wobble} 2s ease-in-out infinite`;
      case 'focused':
        return isActive ? `${glow} 2s ease-in-out infinite` : 'none';
      default:
        return 'none';
    }
  };

  const colors = getRoleColors();

  return {
    backgroundColor: colors.primary,
    color: theme.palette.getContrastText(colors.primary),
    border: `3px solid ${isActive ? colors.accent : colors.secondary}`,
    transition: 'all 0.3s ease-in-out',
    animation: getPersonalityAnimation(),
    position: 'relative',

    '&::before':
      !respectReducedMotion && isActive
        ? {
            content: '""',
            position: 'absolute',
            top: '-3px',
            left: '-3px',
            right: '-3px',
            bottom: '-3px',
            background: `linear-gradient(45deg, ${colors.primary}, ${colors.accent})`,
            borderRadius: '50%',
            zIndex: -1,
            animation: `${glow} 2s ease-in-out infinite`,
          }
        : {},

    '&:hover': {
      transform: respectReducedMotion ? 'none' : 'scale(1.05)',
      boxShadow: `0 4px 12px ${colors.primary}40`,
    },
  };
});

// Personality detector based on player behavior patterns
const getPlayerPersonality = (player: LocalPlayer): string => {
  // Simple personality detection based on name and role
  const name = player.name.toLowerCase();

  if (name.includes('fire') || name.includes('energy') || player.role === 'dom') {
    return 'excited';
  } else if (name.includes('fun') || name.includes('play') || name.includes('joy')) {
    return 'playful';
  } else if (player.role === 'sub' || name.includes('focus') || name.includes('zen')) {
    return 'focused';
  }

  return 'neutral';
};

// Personality-based emojis and decorations
const getPersonalityDecoration = (personality: string) => {
  switch (personality) {
    case 'excited':
      return '🔥';
    case 'playful':
      return '😄';
    case 'focused':
      return '🎯';
    default:
      return '';
  }
};

export interface PersonalityAvatarProps {
  /** Player data */
  player: LocalPlayer;
  /** Whether this player is currently active */
  isActive?: boolean;
  /** Avatar size */
  size?: number;
  /** Whether to show personality decorations */
  showPersonality?: boolean;
  /** Whether to respect reduced motion preference */
  respectReducedMotion?: boolean;
  /** Custom tooltip content */
  tooltip?: string;
  /** Click handler */
  onClick?: () => void;
}

/**
 * PersonalityAvatar displays a player avatar with dynamic personality traits.
 * Includes role-based styling, personality animations, and accessibility features.
 */
export const PersonalityAvatar: React.FC<PersonalityAvatarProps> = ({
  player,
  isActive = false,
  size = 56,
  showPersonality = true,
  respectReducedMotion: propRespectReducedMotion,
  tooltip,
  onClick,
}) => {
  const [personality, setPersonality] = useState<string>('neutral');

  // Check for reduced motion preference
  const respectReducedMotion =
    propRespectReducedMotion ?? window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Generate player initials
  const initials = useMemo(() => {
    return (
      player.name
        .split(' ')
        .map((word) => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'P'
    );
  }, [player.name]);

  // Detect personality on player change
  useEffect(() => {
    if (showPersonality) {
      setPersonality(getPlayerPersonality(player));
    }
  }, [player, showPersonality]);

  // Generate tooltip content
  const tooltipContent = tooltip || `${player.name} - ${player.role}`;
  const decoration = showPersonality ? getPersonalityDecoration(personality) : '';

  return (
    <Tooltip title={`${decoration} ${tooltipContent}`.trim()} arrow>
      <Box position="relative" display="inline-block">
        <PersonalityAvatarStyled
          role={player.role}
          isActive={isActive}
          personality={personality}
          respectReducedMotion={respectReducedMotion}
          sx={{
            width: size,
            height: size,
            fontSize: `${size * 0.4}px`,
            cursor: onClick ? 'pointer' : 'default',
          }}
          onClick={onClick}
        >
          {initials}
        </PersonalityAvatarStyled>

        {/* Personality decoration overlay */}
        {showPersonality && decoration && !respectReducedMotion && (
          <Box
            sx={{
              position: 'absolute',
              top: -8,
              right: -8,
              width: 20,
              height: 20,
              borderRadius: '50%',
              backgroundColor: 'background.paper',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              boxShadow: 1,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            {decoration}
          </Box>
        )}

        {/* Active indicator */}
        {isActive && (
          <Box
            sx={{
              position: 'absolute',
              bottom: -4,
              right: -4,
              width: 16,
              height: 16,
              borderRadius: '50%',
              backgroundColor: 'success.main',
              border: '2px solid',
              borderColor: 'background.paper',
              animation: respectReducedMotion ? 'none' : `${glow} 2s ease-in-out infinite`,
            }}
          />
        )}
      </Box>
    </Tooltip>
  );
};

export default PersonalityAvatar;
