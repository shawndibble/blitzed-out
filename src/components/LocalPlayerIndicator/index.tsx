import { Box, Typography, Chip, Avatar, Card, CardContent, Fade } from '@mui/material';
import { Person as PersonIcon, PlayArrow as PlayArrowIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import type { LocalPlayer } from '@/types';
import type { PlayerRole } from '@/types/Settings';

interface LocalPlayerIndicatorProps {
  /** Current active local player */
  currentPlayer: LocalPlayer | null;
  /** Whether to show in compact mode */
  compact?: boolean;
  /** Whether to show turn transition animation */
  showTransition?: boolean;
  /** Callback when player turn is manually advanced */
  onAdvanceTurn?: () => void;
}

/**
 * LocalPlayerIndicator displays the current local player during gameplay
 * Shows player avatar, name, role, and turn status with optional transitions
 */
export default function LocalPlayerIndicator({
  currentPlayer,
  compact = false,
  showTransition = true,
  onAdvanceTurn,
}: LocalPlayerIndicatorProps): JSX.Element {
  const { t } = useTranslation();

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
  const getRoleColor = (role: PlayerRole): 'primary' | 'secondary' | 'default' => {
    switch (role) {
      case 'dom':
        return 'primary';
      case 'sub':
        return 'secondary';
      case 'vers':
        return 'default';
      default:
        return 'default';
    }
  };

  // If no current player, show waiting state
  if (!currentPlayer) {
    return (
      <Card
        sx={{
          border: '2px dashed',
          borderColor: 'divider',
          bgcolor: 'action.hover',
          opacity: 0.7,
        }}
      >
        <CardContent sx={{ textAlign: 'center', py: compact ? 1 : 2 }}>
          <Typography variant="body2" color="text.secondary">
            {t('localPlayers.noActivePlayer')}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const content = (
    <Card
      sx={{
        border: '2px solid',
        borderColor: 'primary.main',
        bgcolor: 'primary.50',
        transition: 'all 0.3s ease-in-out',
        '&:hover': onAdvanceTurn
          ? {
              borderColor: 'primary.dark',
              cursor: 'pointer',
              transform: 'translateY(-2px)',
              boxShadow: 2,
            }
          : {},
      }}
      onClick={onAdvanceTurn}
    >
      <CardContent sx={{ pb: compact ? 1 : 2 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: compact ? 1 : 2,
          }}
        >
          {/* Player Avatar */}
          <Avatar
            sx={{
              bgcolor: 'primary.main',
              width: compact ? 40 : 56,
              height: compact ? 40 : 56,
              fontSize: compact ? '1rem' : '1.5rem',
              fontWeight: 'bold',
              border: '2px solid',
              borderColor: 'primary.dark',
            }}
          >
            {getPlayerInitials(currentPlayer.name)}
          </Avatar>

          {/* Player Info */}
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            {/* Name and Current Player Badge */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: compact ? 0.5 : 1 }}>
              <Typography
                variant={compact ? 'subtitle2' : 'h6'}
                component="h3"
                sx={{
                  fontWeight: 600,
                  color: 'primary.main',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flexGrow: 1,
                }}
              >
                {currentPlayer.name}
              </Typography>

              <Chip
                label={t('localPlayers.currentTurn')}
                size="small"
                color="primary"
                icon={<PersonIcon />}
                sx={{
                  animation: 'pulse 2s infinite',
                  '@keyframes pulse': {
                    '0%': { opacity: 1 },
                    '50%': { opacity: 0.7 },
                    '100%': { opacity: 1 },
                  },
                }}
              />
            </Box>

            {/* Role and Turn Info */}
            {!compact && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {t('localPlayers.turnOrder', { order: currentPlayer.order + 1 })}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    •
                  </Typography>
                  <Chip
                    label={t(`roles.${currentPlayer.role}`)}
                    size="small"
                    variant="outlined"
                    color={getRoleColor(currentPlayer.role)}
                  />
                </Box>
              </Box>
            )}

            {/* Device Info */}
            <Typography variant="caption" color="text.secondary">
              {currentPlayer.deviceId === 'current_device'
                ? t('localPlayers.onThisDevice')
                : t('localPlayers.remoteDevice')}
            </Typography>

            {/* Advance Turn Hint */}
            {onAdvanceTurn && !compact && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                <PlayArrowIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                <Typography variant="caption" color="primary.main">
                  {t('localPlayers.clickToAdvance')}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  // Wrap with transition if enabled
  if (showTransition) {
    return (
      <Fade in={Boolean(currentPlayer)} timeout={300}>
        <Box>{content}</Box>
      </Fade>
    );
  }

  return content;
}
