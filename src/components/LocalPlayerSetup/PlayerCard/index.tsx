import { useState } from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  IconButton,
  Chip,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Person as PersonIcon,
  Male as MaleIcon,
  Female as FemaleIcon,
  Transgender as TransgenderIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import type { LocalPlayer } from '@/types';
import type { PlayerRole } from '@/types/Settings';
import type { PlayerGender } from '@/types/localPlayers';

interface PlayerCardProps {
  /** The player data to display */
  player: LocalPlayer;
  /** Index of the player (0-based) */
  index: number;
  /** Whether this player is currently active */
  isActive: boolean;
  /** Whether editing is enabled */
  canEdit?: boolean;
  /** Whether deletion is enabled */
  canDelete?: boolean;
  /** Callback when player edit is requested */
  onEdit?: (player: LocalPlayer) => void;
  /** Callback when player deletion is requested */
  onDelete?: (playerId: string) => void;
  /** Callback when player role is changed */
  onRoleChange?: (playerId: string, role: PlayerRole) => void;
}

const CardContentPadding = styled(CardContent)(`
  &:last-child {
    padding-bottom: 8px;
  }
`);

/**
 * PlayerCard component displays individual player information with edit/delete actions
 * Used in LocalPlayerSetup for managing players in single-device multiplayer mode
 */
export default function PlayerCard({
  player,
  index,
  isActive,
  canEdit = true,
  canDelete = true,
  onEdit,
  onDelete,
  onRoleChange,
}: PlayerCardProps): JSX.Element {
  const { t } = useTranslation();
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [roleMenuAnchor, setRoleMenuAnchor] = useState<HTMLElement | null>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleRoleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setRoleMenuAnchor(event.currentTarget);
  };

  const handleRoleMenuClose = () => {
    setRoleMenuAnchor(null);
  };

  const handleEdit = () => {
    handleMenuClose();
    onEdit?.(player);
  };

  const handleDelete = () => {
    handleMenuClose();
    onDelete?.(player.id);
  };

  const handleRoleChange = (newRole: PlayerRole) => {
    handleRoleMenuClose();
    onRoleChange?.(player.id, newRole);
  };

  const getGenderIcon = (gender?: PlayerGender): JSX.Element => {
    switch (gender) {
      case 'male':
        return <MaleIcon fontSize="small" />;
      case 'female':
        return <FemaleIcon fontSize="small" />;
      case 'non-binary':
        return <TransgenderIcon fontSize="small" />;
      case 'prefer-not-say':
        return <PersonIcon fontSize="small" />;
      default:
        return <PersonIcon fontSize="small" />;
    }
  };

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

  return (
    <Card
      sx={{
        border: isActive ? '2px solid' : '1px solid',
        borderColor: isActive ? 'primary.main' : 'divider',
        bgcolor: isActive ? 'action.selected' : 'background.paper',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          borderColor: 'primary.main',
          elevation: 2,
        },
      }}
    >
      <CardContentPadding>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          {/* Player Avatar with Gender Icon */}
          <Avatar
            sx={{
              bgcolor: isActive ? 'primary.main' : 'grey.500',
              marginTop: 0.5,
              width: 32,
              height: 32,
            }}
          >
            {getGenderIcon(player.gender)}
          </Avatar>

          {/* Player Info */}
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            {/* Name and Current Player Badge */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography
                variant="h6"
                component="h3"
                sx={{
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? 'primary.main' : 'text.primary',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flexGrow: 1,
                }}
              >
                {player.name || t('localPlayers.defaultPlayerName', { number: index + 1 })}
              </Typography>
              <Chip
                label={t(`roles.${player.role}`)}
                size="small"
                variant="outlined"
                color={getRoleColor(player.role)}
                onClick={canEdit ? handleRoleMenuOpen : undefined}
                sx={{
                  cursor: canEdit ? 'pointer' : 'default',
                  '&:hover': canEdit
                    ? {
                        bgcolor: 'action.hover',
                      }
                    : {},
                }}
              />

              {isActive && (
                <Chip
                  label={t('localPlayers.currentPlayer')}
                  size="small"
                  color="primary"
                  icon={<PersonIcon />}
                />
              )}
            </Box>
          </Box>

          {/* Actions Menu */}
          {(canEdit || canDelete) && (
            <IconButton
              size="small"
              onClick={handleMenuOpen}
              aria-label={t('localPlayers.playerActions', { name: player.name })}
            >
              <MoreVertIcon />
            </IconButton>
          )}
        </Box>
      </CardContentPadding>

      {/* Actions Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {canEdit && (
          <MenuItem onClick={handleEdit}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{t('localPlayers.editPlayer')}</ListItemText>
          </MenuItem>
        )}
        {canDelete && (
          <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" sx={{ color: 'error.main' }} />
            </ListItemIcon>
            <ListItemText>{t('localPlayers.deletePlayer')}</ListItemText>
          </MenuItem>
        )}
      </Menu>

      {/* Role Selection Menu */}
      <Menu
        anchorEl={roleMenuAnchor}
        open={Boolean(roleMenuAnchor)}
        onClose={handleRoleMenuClose}
        transformOrigin={{ horizontal: 'left', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
      >
        {(['dom', 'sub', 'vers'] as const).map((role) => (
          <MenuItem
            key={role}
            onClick={() => handleRoleChange(role)}
            selected={player.role === role}
          >
            <Chip
              label={t(`roles.${role}`)}
              size="small"
              variant={player.role === role ? 'filled' : 'outlined'}
              color={getRoleColor(role)}
            />
          </MenuItem>
        ))}
      </Menu>
    </Card>
  );
}
