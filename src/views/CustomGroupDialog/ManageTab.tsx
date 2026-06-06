import { Fragment } from 'react';
import {
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { ManageTabProps } from './types';

export default function ManageTab({
  existingGroups,
  loadingGroups,
  tileCounts,
  onEditGroup,
  onDeleteGroup,
}: ManageTabProps) {
  const { t } = useTranslation();

  if (loadingGroups) {
    return <Typography>{t('Loading groups...')}</Typography>;
  }

  if (existingGroups.length === 0) {
    return (
      <Typography
        sx={{
          color: 'text.secondary',
          textAlign: 'center',
          py: 4,
        }}
      >
        {t('customGroups.noCustomGroupsFound')}
      </Typography>
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
    </Box>
  );
}
