import { Fragment } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Chip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import { useTranslation } from 'react-i18next';
import { ManageTabProps } from './types';

export default function ManageTab({
  existingGroups,
  defaultGroups,
  loadingGroups,
  tileCounts,
  onEditGroup,
  onDeleteGroup,
  onExtendGroup,
}: ManageTabProps) {
  const { t } = useTranslation();

  if (loadingGroups) {
    return <Typography>{t('Loading groups...')}</Typography>;
  }

  const defaultGroupsSection = defaultGroups.length > 0 && (
    <Box sx={{ mt: existingGroups.length > 0 ? 3 : 0 }}>
      <Typography variant="subtitle1" sx={{ mb: 0.5 }}>
        {t('customGroups.defaultGroupsHeading')}
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
        {t('customGroups.defaultGroupsDescription')}
      </Typography>
      <List dense>
        {defaultGroups.map((group, index) => {
          const addedCount = group.intensities.filter((i) => !i.isDefault).length;
          return (
            <Fragment key={group.id}>
              <ListItem>
                <ListItemText
                  primary={
                    <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {group.label}
                      <Chip label={group.gameMode} size="small" variant="outlined" />
                      {addedCount > 0 && (
                        <Chip
                          label={t('customGroups.addedLevelsCount', { count: addedCount })}
                          size="small"
                          color="secondary"
                        />
                      )}
                    </Box>
                  }
                  secondary={group.intensities.map((i) => i.label).join(', ')}
                />
                <ListItemSecondaryAction>
                  <Button
                    size="small"
                    startIcon={<PlaylistAddIcon />}
                    onClick={() => onExtendGroup(group)}
                  >
                    {t('customGroups.extend')}
                  </Button>
                </ListItemSecondaryAction>
              </ListItem>
              {index < defaultGroups.length - 1 && <Divider />}
            </Fragment>
          );
        })}
      </List>
    </Box>
  );

  if (existingGroups.length === 0) {
    return (
      <Box>
        <Typography
          sx={{
            color: 'text.secondary',
            textAlign: 'center',
            py: 4,
          }}
        >
          {t('customGroups.noCustomGroupsFound')}
        </Typography>
        {defaultGroupsSection}
      </Box>
    );
  }

  return (
    <Box>
      <List>
        {existingGroups.map((group, index) => (
          <Fragment key={group.id}>
            <ListItem>
              <ListItemText
                primary={group.label}
                secondary={
                  <Box component="span" sx={{ display: 'block' }}>
                    <Typography
                      variant="body2"
                      component="span"
                      sx={{
                        color: 'text.secondary',
                        display: 'block',
                      }}
                    >
                      {t('customGroups.intensityLevelsCount', {
                        count: group.intensities.length,
                      })}
                      : {group.intensities.map((i) => i.label).join(', ')}
                    </Typography>
                    <Typography
                      variant="body2"
                      component="span"
                      sx={{
                        color: 'text.secondary',
                        display: 'block',
                        mt: 0.5,
                      }}
                    >
                      {t('customGroups.customTilesCount', {
                        count: tileCounts[group.id] || 0,
                      })}
                    </Typography>
                  </Box>
                }
              />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  aria-label="edit"
                  onClick={() => onEditGroup(group)}
                  sx={{ mr: 1 }}
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  edge="end"
                  aria-label="delete"
                  onClick={() => onDeleteGroup(group.id)}
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
            {index < existingGroups.length - 1 && <Divider />}
          </Fragment>
        ))}
      </List>
      {defaultGroupsSection}
    </Box>
  );
}
